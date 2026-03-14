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

// ── Ambient Gregorian Chant via Web Audio ─────────────────

export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;

  start(volume = 0.06): void {
    if (this.isPlaying) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 4);
      this.gainNode.connect(this.ctx.destination);

      // Choir pad: root + fifth + octave + minor third (sacred chord quality)
      const baseFreq = 110; // A2
      const harmonics = [
        { freq: baseFreq,        gain: 0.5  },
        { freq: baseFreq * 1.5,  gain: 0.3  }, // perfect fifth
        { freq: baseFreq * 2,    gain: 0.25 }, // octave
        { freq: baseFreq * 2.4,  gain: 0.15 }, // minor third approximation
        { freq: baseFreq * 3,    gain: 0.1  }, // fifth+octave
      ];

      for (const h of harmonics) {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // LFO for breath-like vibrato
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.12 + Math.random() * 0.08;
        lfoGain.gain.value = h.freq * 0.003;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.type = 'sine';
        osc.frequency.value = h.freq + (Math.random() - 0.5) * 0.5;
        oscGain.gain.value = h.gain;
        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start();
        this.oscillators.push(osc);
      }
      this.isPlaying = true;
    } catch (e) {
      console.warn('Ambient audio init failed:', e);
    }
  }

  fadeOut(duration = 3): void {
    if (!this.gainNode || !this.ctx) return;
    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    setTimeout(() => this.stop(), duration * 1000);
  }

  stop(): void {
    this.oscillators.forEach(osc => { try { osc.stop(); } catch {} });
    this.oscillators = [];
    this.isPlaying = false;
    try { this.ctx?.close(); } catch {}
    this.ctx = null;
    this.gainNode = null;
  }

  setVolume(v: number): void {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.5);
    }
  }
}

// ── Main Audio Manager ─────────────────────────────────────

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isPaused = false;
  private currentSource: AudioBufferSourceNode | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /** Call synchronously inside a user gesture to unlock AudioContext on iOS. */
  unlock(): void {
    this.getCtx();
  }

  // ── xAI TTS via Cloudflare Pages Function proxy ──────────

  async fetchXAIAudio(req: TTSRequest): Promise<ArrayBuffer> {
    const voicePrompt = `Speak as ${req.voiceDescription}, slow, clear, reverent. Language: ${req.language}.`;
    // Use AbortController for timeout — AbortSignal.timeout not in older Safari
    const abortCtrl = new AbortController();
    const abortTimer = setTimeout(() => abortCtrl.abort(), 20000);
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
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    this.currentSource = source;

    if (timings && timings.length > 0) {
      timings.forEach((timing, idx) => {
        setTimeout(() => onWord(idx), timing.start * 1000);
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

// Singleton ambient audio
export const ambientAudio = new AmbientAudio();
// Singleton audio manager
export const audioManager = new AudioManager();
