import { saveAudioCache, loadAudioCache, buildCacheKey } from './storage-manager.ts';

export interface TTSRequest {
  text: string;
  language: string;
  languageCode: string;
  voiceDescription: string;
  prayerKey: string;
}

// A single prepared audio clip — decoded and ready to play.
interface PreparedAudio {
  buffer: AudioBuffer;
}

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private stopCtrl: AbortController | null = null;

  // Dedup in-flight generations so prefetch(x) + playStep(x) share one network call.
  // Keyed on text-content cache key; same text reuses the same promise.
  private inflight = new Map<string, Promise<PreparedAudio>>();

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  unlock(): void {
    const ctx = this.getCtx();
    try {
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = silent;
      src.connect(ctx.destination);
      src.start(0);
    } catch {}
    ctx.resume().catch(() => {});
  }

  private async fetchXAIAudio(req: TTSRequest, signal: AbortSignal): Promise<ArrayBuffer> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    signal.addEventListener('abort', () => ctrl.abort(), { once: true });
    try {
      const response = await fetch('/audio', {
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.arrayBuffer();
    } finally {
      clearTimeout(timer);
    }
  }

  private decodeWithFallback(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Decode timeout')), 30_000);
      ctx.decodeAudioData(
        data,
        (decoded) => { clearTimeout(timer); resolve(decoded); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  }

  private async doGenerate(req: TTSRequest, cacheKey: string): Promise<PreparedAudio> {
    // IndexedDB cache (client-side; survives reloads)
    const cached = await loadAudioCache(cacheKey);
    if (cached?.audioData) {
      try {
        const ctx = this.getCtx();
        const buffer = await this.decodeWithFallback(ctx, cached.audioData.slice(0));
        return { buffer };
      } catch {}
    }
    // Server round-trip: KV cache on the edge → translation → xAI TTS
    const ctrl = new AbortController();
    const raw = await this.fetchXAIAudio(req, ctrl.signal);
    const ctx = this.getCtx();
    const buffer = await this.decodeWithFallback(ctx, raw.slice(0));
    // Persist for next session; errors don't block playback.
    saveAudioCache({
      key: cacheKey, audioData: raw, text: req.text, duration: buffer.duration, timestamp: Date.now(),
    }).catch(() => {});
    return { buffer };
  }

  // Fire-and-forget. Safe to call multiple times for the same text —
  // the in-flight map dedupes. Returns the promise in case the caller wants to await it.
  prefetch(req: TTSRequest): Promise<PreparedAudio> {
    const cacheKey = buildCacheKey(req.text, req.language, req.voiceDescription);
    const existing = this.inflight.get(cacheKey);
    if (existing) return existing;
    const promise = this.doGenerate(req, cacheKey).catch(err => {
      // Drop failed promises so the next call retries.
      this.inflight.delete(cacheKey);
      throw err;
    });
    this.inflight.set(cacheKey, promise);
    return promise;
  }

  // Back-compat: the offline-download flow and the playback path both call this.
  generateAudio(req: TTSRequest, _signal?: AbortSignal): Promise<PreparedAudio> {
    return this.prefetch(req);
  }

  async playStep(
    text: string,
    req: TTSRequest,
    onTranslatedText: (t: string) => void,
    _onWord: (i: number) => void,
    _onComplete: () => void,
  ): Promise<void> {
    this.stopCtrl?.abort();
    const ctrl = new AbortController();
    this.stopCtrl = ctrl;

    // Either uses an in-flight prefetch or starts a fresh generation.
    const { buffer } = await this.prefetch(req);
    if (ctrl.signal.aborted) return;
    onTranslatedText(text);

    const ctx = this.getCtx();
    await ctx.resume().catch(() => {});
    if (ctrl.signal.aborted) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    this.currentSource = source;

    return new Promise<void>((resolve) => {
      const finish = () => { this.currentSource = null; resolve(); };
      ctrl.signal.addEventListener('abort', () => {
        try { source.stop(); } catch {}
        finish();
      }, { once: true });
      source.onended = finish;
      source.start(0);
    });
  }

  stop(): void {
    this.stopCtrl?.abort();
    this.stopCtrl = null;
    try { this.currentSource?.stop(); } catch {}
    this.currentSource = null;
  }

  // Drop cached in-flight promises — call this when the language/voice changes.
  clearPrefetch(): void {
    this.inflight.clear();
  }
}

export const audioManager = new AudioManager();
