import { saveAudioCache, loadAudioCache, buildCacheKey } from './storage-manager.ts';

export interface TTSRequest {
  text: string;
  language: string;
  languageCode: string;
  voiceDescription: string;
  prayerKey: string;
}

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private wordTimers: ReturnType<typeof setTimeout>[] = [];
  private stopCtrl: AbortController | null = null;

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

  async fetchXAIAudio(req: TTSRequest, signal: AbortSignal) {
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
      clearTimeout(timer);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      return { data };
    } finally {
      clearTimeout(timer);
    }
  }

  async generateAudio(req: TTSRequest, signal: AbortSignal) {
    const cacheKey = buildCacheKey(req.prayerKey, req.language, req.voiceDescription);
    const cached = await loadAudioCache(cacheKey);
    if (cached?.audioData) {
      try {
        const ctx = this.getCtx();
        const buffer = await this.decodeWithFallback(ctx, cached.audioData.slice(0));
        return { buffer };
      } catch {}
    }

    const { data: xaiData } = await this.fetchXAIAudio(req, signal);
    const ctx = this.getCtx();
    const buffer = await this.decodeWithFallback(ctx, xaiData.slice(0));
    saveAudioCache({ key: cacheKey, audioData: xaiData, text: req.text, duration: buffer.duration, timestamp: Date.now() }).catch(() => {});
    return { buffer };
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

  async playStep(text: string, req: TTSRequest, onTranslatedText: (t: string) => void, onWord: (i: number) => void, onComplete: () => void): Promise<void> {
    this.stopCtrl?.abort();
    const ctrl = new AbortController();
    this.stopCtrl = ctrl;

    const { buffer } = await this.generateAudio(req, ctrl.signal);
    if (ctrl.signal.aborted) return;
    onTranslatedText(text);

    const ctx = this.getCtx();
    await ctx.resume().catch(() => {});
    if (ctrl.signal.aborted) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    this.currentSource = source;

    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];

    return new Promise((resolve) => {
      signal.addEventListener('abort', () => {
        this.wordTimers.forEach(t => clearTimeout(t));
        try { source.stop(); } catch {}
        resolve();
      }, { once: true });

      source.onended = () => resolve();
      source.start(0);
    });
  }

  stop(): void {
    this.stopCtrl?.abort();
    this.stopCtrl = null;
    this.wordTimers.forEach(t => clearTimeout(t));
    this.wordTimers = [];
    try { this.currentSource?.stop(); } catch {}
    this.currentSource = null;
  }
}

export const audioManager = new AudioManager();