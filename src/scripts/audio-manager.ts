// ============================================================
// audio-manager.ts — xAI TTS + Web Audio API playback engine
// NO browser speech synthesis — xAI voice only
// ============================================================

import { saveAudioCache, loadAudioCache, buildCacheKey, type WordTiming } from './storage-manager.ts';

export interface TTSRequest {
  text: string;
  language: string;
  languageCode: string;
  voiceDescription: string;
  prayerKey: string;
}

export interface TTSResult {
  audioBuffer?: AudioBuffer;
  wordTimings?: WordTiming[];
  usedFallback: boolean;
  duration: number;
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

      const baseFreq = 110; // A2
      const harmonics = [
        { freq: baseFreq,        gain: 0.5  },
        { freq: baseFreq * 1.5,  gain: 0.3  },
        { freq: baseFreq * 2,    gain: 0.25 },
        { freq: baseFreq * 2.4,  gain: 0.15 },
        { freq: baseFreq * 3,    gain: 0.1  },
      ];

      for (const h of harmonics) {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

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
  private isPlaying = false;
  private isPaused = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private wordTimer: ReturnType<typeof setInterval> | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // ── xAI TTS via Cloudflare Pages Function proxy ──────────

  async fetchXAIAudio(req: TTSRequest, attempt = 1): Promise<ArrayBuffer | null> {
    try {
      const voicePrompt = `Speak as ${req.voiceDescription}, slow, clear, reverent. Language: ${req.language}.`;
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: req.text,
          language: req.language,
          language_code: req.languageCode,
          voice_description: req.voiceDescription,
          system_prompt: voicePrompt,
        }),
        signal: AbortSignal.timeout(35000),
      });

      const ct = response.headers.get('Content-Type') || '';
      if (!response.ok || ct.includes('application/json')) {
        const reason = ct.includes('json') ? await response.text().catch(() => '') : `HTTP ${response.status}`;
        console.warn(`[xAI TTS] attempt ${attempt} failed:`, reason);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          return this.fetchXAIAudio(req, attempt + 1);
        }
        return null;
      }

      const buf = await response.arrayBuffer();
      if (buf.byteLength < 500) {
        console.warn(`[xAI TTS] attempt ${attempt}: audio too small (${buf.byteLength} bytes)`);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          return this.fetchXAIAudio(req, attempt + 1);
        }
        return null;
      }

      console.info(`[xAI TTS] success (${buf.byteLength} bytes, attempt ${attempt})`);
      return buf;
    } catch (err) {
      console.warn(`[xAI TTS] attempt ${attempt} error:`, err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        return this.fetchXAIAudio(req, attempt + 1);
      }
      return null;
    }
  }

  // ── Generate audio for a prayer step ─────────────────────

  async generateAudio(req: TTSRequest): Promise<TTSResult> {
    const cacheKey = buildCacheKey(req.prayerKey, req.language, req.voiceDescription);

    // Try cache first
    const cached = await loadAudioCache(cacheKey);
    if (cached?.audioData) {
      try {
        const ctx = this.getCtx();
        const buffer = await ctx.decodeAudioData(cached.audioData.slice(0));
        return { audioBuffer: buffer, wordTimings: cached.wordTimings, usedFallback: false, duration: buffer.duration };
      } catch (e) {
        console.warn('[TTS] cached audio decode failed, will re-fetch:', e);
      }
    }

    // Try xAI TTS API (with retries)
    const xaiData = await this.fetchXAIAudio(req);
    if (xaiData) {
      try {
        const ctx = this.getCtx();
        const buffer = await ctx.decodeAudioData(xaiData.slice(0));
        await saveAudioCache({
          key: cacheKey,
          audioData: xaiData,
          text: req.text,
          duration: buffer.duration,
          timestamp: Date.now(),
        });
        return { audioBuffer: buffer, usedFallback: false, duration: buffer.duration };
      } catch (e) {
        console.warn('[TTS] xAI audio decode failed (corrupt WAV?):', e);
      }
    }

    // No audio available — return silent word-paced fallback (NO browser speech)
    console.warn('[TTS] xAI unavailable — using silent text advance for:', req.prayerKey);
    const wordCount = req.text.split(/\s+/).length;
    const estimatedDuration = wordCount / 2.0;
    return { usedFallback: true, duration: estimatedDuration };
  }

  // ── Play audio buffer ─────────────────────────────────────

  async playBuffer(buffer: AudioBuffer, timings?: WordTiming[]): Promise<void> {
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
        const delay = timing.start * 1000;
        setTimeout(() => this.onWordCb?.(idx), delay);
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

  private onWordCb: WordCallback | null = null;

  // ── Play with word-paced text advance (no audio, silent) ──

  playSilentWordPaced(text: string, duration: number, onWord: WordCallback): Promise<void> {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return Promise.resolve();

    const interval = (duration * 1000) / words.length;
    let idx = 0;

    return new Promise((resolve) => {
      onWord(0);
      this.wordTimer = setInterval(() => {
        idx++;
        if (idx >= words.length) {
          if (this.wordTimer) clearInterval(this.wordTimer);
          this.wordTimer = null;
          resolve();
        } else {
          onWord(idx);
        }
      }, interval);
    });
  }

  pause(): void {
    this.isPaused = true;
    if (this.currentSource) {
      this.audioCtx?.suspend();
    }
  }

  resume(): void {
    this.isPaused = false;
    this.audioCtx?.resume();
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    try { this.currentSource?.stop(); } catch {}
    this.currentSource = null;
    if (this.wordTimer) { clearInterval(this.wordTimer); this.wordTimer = null; }
    this.audioCtx?.suspend();
  }

  // ── Convenience: play a prayer step ──────────────────────

  async playStep(
    text: string,
    req: TTSRequest,
    onWord: WordCallback,
    onComplete: CompleteCallback
  ): Promise<void> {
    const result = await this.generateAudio(req);

    if (result.usedFallback || !result.audioBuffer) {
      // Silent text advance — no audio, words still scroll
      await this.playSilentWordPaced(text, result.duration, onWord);
    } else {
      // Real xAI audio — estimate word timing from duration
      this.onWordCb = onWord;
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 0 && !result.wordTimings?.length) {
        const interval = (result.audioBuffer.duration * 1000) / words.length;
        for (let i = 0; i < words.length; i++) {
          setTimeout(() => onWord(i), interval * i);
        }
      }
      await this.playBuffer(result.audioBuffer, result.wordTimings);
    }
    onComplete();
  }
}

// Singleton ambient audio
export const ambientAudio = new AmbientAudio();
// Singleton audio manager
export const audioManager = new AudioManager();
