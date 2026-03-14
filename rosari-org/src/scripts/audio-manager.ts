// ============================================================
// audio-manager.ts — xAI TTS + Web Audio API playback engine
// ============================================================

import { saveAudioCache, loadAudioCache, buildCacheKey, type WordTiming } from './storage-manager.ts';

export interface TTSRequest {
  text: string;
  language: string;
  languageCode: string;
  voiceDescription: string;
  prayerKey: string;
}

type WordCallback = (wordIndex: number) => void;
type CompleteCallback = () => void;

// ── Main Audio Manager ─────────────────────────────────────

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isPaused = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private wordTimers: ReturnType<typeof setTimeout>[] = [];

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /** Call synchronously inside a user gesture to unlock AudioContext on iOS.
   *  iOS suspends the context unless real audio output happens during the gesture.
   *  Playing a silent 1-frame buffer is the only reliable way to unlock it. */
  unlock(): void {
    const ctx = this.getCtx();
    try {
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src    = ctx.createBufferSource();
      src.buffer   = silent;
      src.connect(ctx.destination);
      src.start(0);
    } catch {}
    ctx.resume().catch(() => {});
  }

  // ── xAI TTS via Cloudflare Pages Function proxy ──────────

  async fetchXAIAudio(req: TTSRequest): Promise<ArrayBuffer> {
    const voicePrompt = `Speak as ${req.voiceDescription}, slow, clear, reverent. Language: ${req.language}.`;
    // Use AbortController for timeout — AbortSignal.timeout not in older Safari
    const abortCtrl = new AbortController();
    const abortTimer = setTimeout(() => abortCtrl.abort(), 45000); // 45s — covers translation + TTS on slow mobile
    let response: Response;
    try {
      response = await fetch('/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: req.text,
          language: req.language,
          language_code: req.languageCode,
          voice_description: req.voiceDescription,
          system_prompt: voicePrompt,
        }),
        signal: abortCtrl.signal,
      });
    } finally {
      clearTimeout(abortTimer);
    }

    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      try { const j = await response.json() as any; reason = j.reason || j.error || reason; } catch {}
      throw new Error(`xAI TTS failed: ${reason}`);
    }

    return response.arrayBuffer();
  }

  // ── Generate and decode audio for a prayer step ──────────

  async generateAudio(req: TTSRequest): Promise<{ buffer: AudioBuffer; wordTimings?: WordTiming[] }> {
    const cacheKey = buildCacheKey(req.prayerKey, req.language, req.voiceDescription);

    // Try local cache first
    const cached = await loadAudioCache(cacheKey);
    if (cached?.audioData) {
      try {
        const ctx = this.getCtx();
        const buffer = await new Promise<AudioBuffer>((res, rej) =>
          ctx.decodeAudioData(cached.audioData!.slice(0), res, rej)
        );
        return { buffer, wordTimings: cached.wordTimings };
      } catch {
        // Cache entry corrupt — fall through to API
      }
    }

    // Fetch from xAI (throws on failure)
    const xaiData = await this.fetchXAIAudio(req);

    const ctx = this.getCtx();
    const buffer = await new Promise<AudioBuffer>((res, rej) =>
      ctx.decodeAudioData(xaiData.slice(0), res, rej)
    );

    // Persist to cache (non-blocking)
    saveAudioCache({
      key: cacheKey,
      audioData: xaiData,
      text: req.text,
      duration: buffer.duration,
      timestamp: Date.now(),
    }).catch(() => {});

    return { buffer };
  }

  // ── Play audio buffer ─────────────────────────────────────

  async playBuffer(buffer: AudioBuffer, onWord: WordCallback, timings?: WordTiming[]): Promise<void> {
    const ctx = this.getCtx();

    // iOS suspends the context between the user gesture and async playback.
    // Must resume before scheduling any audio or it plays silently.
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    this.currentSource = source;

    // Clear any leftover word timers from a previous prayer
    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];

    if (timings && timings.length > 0) {
      timings.forEach((timing, idx) => {
        this.wordTimers.push(setTimeout(() => onWord(idx), timing.start * 1000));
      });
    }

    return new Promise((resolve) => {
      source.onended = () => {
        this.currentSource = null;
        resolve();
      };
      source.start(0);
    });
  }

  pause(): void {
    this.isPaused = true;
    this.audioCtx?.suspend();
  }

  resume(): void {
    this.isPaused = false;
    this.audioCtx?.resume();
  }

  stop(): void {
    this.isPaused = false;
    // Cancel pending word-timing callbacks so they don't ghost-update karaoke
    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];
    try { this.currentSource?.stop(); } catch {}
    this.currentSource = null;
    this.audioCtx?.suspend();
  }

  // ── Play a prayer step — xAI only, no fallback ───────────

  async playStep(
    _text: string,
    req: TTSRequest,
    onWord: WordCallback,
    onComplete: CompleteCallback
  ): Promise<void> {
    const { buffer, wordTimings } = await this.generateAudio(req);

    // xAI TTS doesn't return word timings; generate evenly-spaced fallback
    // so karaoke highlighting advances as the audio plays.
    let timings = wordTimings;
    if (!timings || timings.length === 0) {
      const words = req.text.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const dur = buffer.duration;
        timings = words.map((w, i) => ({
          word:  w,
          start: (i / words.length) * dur,
          end:   ((i + 1) / words.length) * dur,
        }));
      }
    }

    await this.playBuffer(buffer, onWord, timings);
    onComplete();
  }
}

// Singleton audio manager
export const audioManager = new AudioManager();
