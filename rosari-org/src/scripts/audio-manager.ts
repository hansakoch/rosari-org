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

type WordCallback      = (wordIndex: number) => void;
type CompleteCallback  = () => void;
type TextCallback      = (translatedText: string) => void;

// ── Main Audio Manager ─────────────────────────────────────

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private wordTimers: ReturnType<typeof setTimeout>[] = [];

  /** Each call to playStep creates a fresh controller here.
   *  stop() aborts it — cancels in-flight fetch AND stops playback. */
  private stopCtrl: AbortController | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  /** Call synchronously inside a user gesture to unlock AudioContext on iOS.
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

  async fetchXAIAudio(req: TTSRequest, signal: AbortSignal): Promise<{ data: ArrayBuffer; translatedText?: string }> {
    // Chain a 45-second timeout onto the caller's abort signal
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    signal.addEventListener('abort', () => ctrl.abort(), { once: true });

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
        }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      try { const j = await response.json() as any; reason = j.reason || j.error || reason; } catch {}
      throw new Error(`xAI TTS failed: ${reason}`);
    }

    // Server returns the translated text in this header (percent-encoded)
    const raw = response.headers.get('X-Translated-Text');
    const translatedText = raw ? decodeURIComponent(raw) : undefined;

    const data = await response.arrayBuffer();
    // Use conditional spread to satisfy exactOptionalPropertyTypes (undefined not assignable to string)
    return translatedText !== undefined ? { data, translatedText } : { data };
  }

  // ── Generate and decode audio for a prayer step ──────────

  async generateAudio(req: TTSRequest, signal: AbortSignal): Promise<{
    buffer: AudioBuffer;
    wordTimings?: WordTiming[];
    translatedText?: string;
  }> {
    const cacheKey = buildCacheKey(req.prayerKey, req.language, req.voiceDescription);

    // Try local cache first
    const cached = await loadAudioCache(cacheKey);
    if (cached?.audioData) {
      try {
        const ctx = this.getCtx();
        const buffer = await this.decodeWithFallback(ctx, cached.audioData!.slice(0));
        return {
          buffer,
          ...(cached.wordTimings    !== undefined ? { wordTimings:    cached.wordTimings    } : {}),
          ...(cached.translatedText !== undefined ? { translatedText: cached.translatedText } : {}),
        };
      } catch {
        // Cache entry corrupt — fall through to API
      }
    }

    // Fetch from xAI (throws on network error or abort)
    const { data: xaiData, translatedText } = await this.fetchXAIAudio(req, signal);

    const ctx = this.getCtx();
    const buffer = await this.decodeWithFallback(ctx, xaiData.slice(0));

    // Persist to local IndexedDB cache (non-blocking)
    saveAudioCache({
      key: cacheKey,
      audioData: xaiData,
      text: req.text,
      ...(translatedText !== undefined ? { translatedText } : {}),
      duration: buffer.duration,
      timestamp: Date.now(),
    }).catch(() => {});

    return translatedText !== undefined ? { buffer, translatedText } : { buffer };
  }

  // ── Decode audio — callback-based with 30s timeout ───────
  // The Promise-based decodeAudioData() API hangs silently on iOS/Brave.
  // The callback API is universally reliable across all mobile browsers.

  private decodeWithFallback(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('decodeAudioData timed out after 30s')), 30_000
      );
      ctx.decodeAudioData(
        data,
        (decoded) => { clearTimeout(timer); resolve(decoded); },
        (err)     => { clearTimeout(timer); reject(err ?? new Error('decodeAudioData failed')); }
      );
    });
  }

  // ── Play a decoded AudioBuffer ────────────────────────────

  private async playBuffer(
    buffer: AudioBuffer,
    signal: AbortSignal,
    onWord: WordCallback,
    timings?: WordTiming[]
  ): Promise<void> {
    if (signal.aborted) return;

    const ctx = this.getCtx();
    // Always attempt to resume — iOS/Android may auto-suspend when backgrounded.
    // Use a 3s race timeout: ctx.resume() can hang forever on Brave/iOS.
    try {
      await Promise.race([
        ctx.resume(),
        new Promise<void>((_, rej) => setTimeout(() => rej(new Error('resume timeout')), 3000)),
      ]);
    } catch { /* context may already be running — proceed regardless */ }
    if (signal.aborted) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    source.connect(gain);
    gain.connect(ctx.destination);

    this.currentSource = source;

    // Clear any leftover timers from the previous prayer
    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];

    if (timings && timings.length > 0) {
      timings.forEach((timing, idx) => {
        this.wordTimers.push(
          setTimeout(() => { if (!signal.aborted) onWord(idx); }, timing.start * 1000)
        );
      });
    }

    return new Promise((resolve) => {
      // Abort handler: cancel timers, stop source, resolve cleanly
      signal.addEventListener('abort', () => {
        this.wordTimers.forEach(t => clearTimeout(t));
        this.wordTimers = [];
        try { source.stop(); } catch {}
        this.currentSource = null;
        resolve();
      }, { once: true });

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      source.start(0);
    });
  }

  // ── Public controls ───────────────────────────────────────

  /** Stop all audio and cancel any in-flight network request. */
  stop(): void {
    // Abort in-flight fetch + stop playback via the shared signal
    this.stopCtrl?.abort();
    this.stopCtrl = null;
    // Safety-net: also clear timers and source directly
    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];
    try { this.currentSource?.stop(); } catch {}
    this.currentSource = null;
    // NOTE: Do NOT suspend the AudioContext here.
    // Calling suspend() requires the context to be re-resumed via a user gesture on iOS/Android.
    // Since playBuffer() is called asynchronously (after a fetch), it cannot reliably resume
    // a suspended context. Leaving the context running idle is safe and costs nothing.
  }

  // ── Play a prayer step — fetches, decodes, and plays ─────

  async playStep(
    _text: string,
    req: TTSRequest,
    onTranslatedText: TextCallback,
    onWord: WordCallback,
    _onComplete: CompleteCallback
  ): Promise<void> {
    // Cancel any previous playback/fetch immediately
    this.stopCtrl?.abort();
    const ctrl = new AbortController();
    this.stopCtrl = ctrl;

    const { buffer, wordTimings, translatedText } = await this.generateAudio(req, ctrl.signal);

    if (ctrl.signal.aborted) return; // stopped while loading

    // Notify caller of the actual text being spoken (may differ from English source)
    onTranslatedText(translatedText || req.text);

    // Build evenly-spaced word timings if xAI didn't return per-word timestamps
    let timings = wordTimings;
    if (!timings || timings.length === 0) {
      const words = (translatedText || req.text).trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const dur = buffer.duration;
        timings = words.map((w, i) => ({
          word:  w,
          start: (i / words.length) * dur,
          end:   ((i + 1) / words.length) * dur,
        }));
      }
    }

    await this.playBuffer(buffer, ctrl.signal, onWord, timings);
  }
}

// Singleton audio manager
export const audioManager = new AudioManager();
