/**
 * xAI TTS proxy — KV-cached MP3 generation for rosari.org
 *
 * Security:
 *  - Same-origin only (Origin/Referer allowlist)
 *  - Text length capped
 *  - API key never leaves the Worker
 *  - Soft per-IP rate limit via Cache API
 */

export interface TtsEnv {
  /** Plain Worker secret or Secrets Store binding (`await .get()`). */
  XAI_API_KEY: string | { get(): Promise<string> };
  AUDIO_CACHE?: KVNamespace;
  AUDIO_RATE_LIMIT?: RateLimit;
}

async function resolveSecret(value: TtsEnv['XAI_API_KEY']): Promise<string> {
  if (typeof value === 'string') return value;
  if (value && typeof value.get === 'function') return value.get();
  return '';
}

/** Must stay v5 — 224 live KV clips were hashed with this version. */
const CACHE_VERSION = 'v5-mp3';
const XAI_TTS_URL = 'https://api.x.ai/v1/tts';
const SAMPLE_RATE = 24_000;
const BIT_RATE = 128_000;
const MAX_TEXT_LEN = 8_000;

const ALLOWED_ORIGINS = new Set([
  'https://rosari.org',
  'https://www.rosari.org',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://rosari.org';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Translated-Text, X-TTS-Provider, X-Voice, X-Language',
    Vary: 'Origin',
  };
}

function jsonError(status: number, error: string, origin: string | null): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function isAllowedRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (origin) return ALLOWED_ORIGINS.has(origin);

  // Same-origin navigations / non-CORS fetches may omit Origin; require Referer.
  const referer = request.headers.get('Referer');
  if (!referer) return false;
  try {
    const refOrigin = new URL(referer).origin;
    return ALLOWED_ORIGINS.has(refOrigin);
  } catch {
    return false;
  }
}

function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function rateLimited(request: Request, env: TtsEnv): Promise<boolean> {
  if (!env.AUDIO_RATE_LIMIT) return false;
  const { success } = await env.AUDIO_RATE_LIMIT.limit({ key: clientIp(request) });
  return !success;
}

function pickVoice(voiceDescription: string | undefined): string {
  const desc = (voiceDescription || '').toLowerCase();
  if (desc.includes('woman') || desc.includes('female') || desc.includes('feminine')) return 'ara';
  if (
    desc.includes(' man') ||
    desc.includes('male') ||
    desc.includes('masculine') ||
    desc.includes('priest') ||
    desc.includes('father') ||
    desc.includes('friar') ||
    desc.includes('monk') ||
    desc.includes('elderly') ||
    desc.includes('aged') ||
    desc.includes('farmer') ||
    desc.includes('grandfather') ||
    desc.includes('old ')
  ) {
    return 'rex';
  }
  return 'rex';
}

async function translateText(text: string, targetLanguage: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [
        {
          role: 'system',
          content:
            `You are a Catholic liturgical translator. Translate the following Catholic prayer text into ${targetLanguage}. ` +
            `Use traditional, formal, reverent language as found in Catholic prayer books. ` +
            `Respond with ONLY the translated text — no notes, no quotation marks, no explanation.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || text;
}

async function buildCacheKey(text: string, language: string, voiceDescription: string): Promise<string> {
  const raw = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    (language || 'english').trim().toLowerCase(),
    (voiceDescription || '').trim().toLowerCase(),
  ].join('::');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `audio::${hex}`;
}

async function xaiTTS(
  text: string,
  languageCode: string,
  voiceDescription: string,
  apiKey: string,
): Promise<ArrayBuffer> {
  const voice = pickVoice(voiceDescription);
  const lang = (languageCode || 'en').replace('_', '-');

  const url = new URL(XAI_TTS_URL);
  url.searchParams.set('language', lang);
  url.searchParams.set('voice', voice);
  url.searchParams.set('codec', 'mp3');
  url.searchParams.set('sample_rate', String(SAMPLE_RATE));
  url.searchParams.set('bit_rate', String(BIT_RATE));

  const wsRes = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Upgrade: 'websocket',
      Connection: 'Upgrade',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))),
    },
  });

  if (!wsRes.webSocket) {
    let detail = `HTTP ${wsRes.status}`;
    try {
      const t = await wsRes.text();
      if (t) detail += `: ${t.slice(0, 200)}`;
    } catch {
      /* ignore */
    }
    throw new Error(`WebSocket upgrade failed — ${detail}`);
  }

  const ws = wsRes.webSocket;
  ws.accept();

  return new Promise((resolve, reject) => {
    const chunks: ArrayBuffer[] = [];
    let done = false;

    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      reject(new Error('xAI TTS timeout (30s)'));
    }, 30_000);

    const finish = (err: Error | null) => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (err) {
        reject(err);
        return;
      }

      const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
      if (totalLen < 100) {
        reject(new Error('xAI returned empty audio'));
        return;
      }

      const out = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        out.set(new Uint8Array(c), offset);
        offset += c.byteLength;
      }
      resolve(out.buffer);
    };

    ws.addEventListener('message', (event) => {
      let msg: { type?: string; delta?: string; message?: string };
      try {
        msg = JSON.parse(typeof event.data === 'string' ? event.data : '');
      } catch {
        return;
      }

      if (msg.type === 'audio.delta' && msg.delta) {
        const raw = atob(msg.delta);
        const b = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i);
        chunks.push(b.buffer);
      } else if (msg.type === 'audio.done') {
        if (!done) {
          done = true;
          finish(null);
        }
      } else if (msg.type === 'error') {
        finish(new Error(msg.message || JSON.stringify(msg)));
      }
    });

    ws.addEventListener('error', (e) => finish(new Error(`WebSocket error: ${String(e)}`)));
    ws.addEventListener('close', (e) => {
      if (!done) finish(new Error(`WebSocket closed early: ${e.code} ${e.reason}`));
    });

    ws.send(JSON.stringify({ type: 'text.delta', delta: text }));
    ws.send(JSON.stringify({ type: 'text.done' }));
  });
}

export function handleAudioOptions(request: Request): Response {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(origin), 'Access-Control-Max-Age': '86400' },
  });
}

export async function handleAudioPost(request: Request, env: TtsEnv): Promise<Response> {
  const origin = request.headers.get('Origin');

  if (!isAllowedRequest(request)) {
    return jsonError(403, 'Forbidden origin', origin);
  }

  if (await rateLimited(request, env)) {
    return jsonError(429, 'Too many requests — please wait a moment', origin);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Invalid JSON', origin);
  }

  const text = body.text;
  const language = typeof body.language === 'string' ? body.language : 'English';
  const language_code = typeof body.language_code === 'string' ? body.language_code : 'en';
  const voice_description =
    typeof body.voice_description === 'string'
      ? body.voice_description
      : 'elderly male, gravelly, slow and reverent';

  if (typeof text !== 'string' || text.trim().length === 0 || text.length > MAX_TEXT_LEN) {
    return jsonError(400, `Invalid text (1–${MAX_TEXT_LEN} chars required)`, origin);
  }

  const apiKey = await resolveSecret(env.XAI_API_KEY);
  if (!apiKey) {
    return jsonError(503, 'XAI_API_KEY not configured on server', origin);
  }

  const cacheKey = await buildCacheKey(text, language, voice_description);
  const kv = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cached, metadata } = await kv.getWithMetadata<ArrayBuffer>(cacheKey, {
        type: 'arrayBuffer',
      });
      if (cached && cached.byteLength > 100) {
        const extraHeaders: Record<string, string> = {};
        const meta = metadata as { translatedText?: string } | null;
        if (meta?.translatedText) {
          extraHeaders['X-Translated-Text'] = meta.translatedText;
        }
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-TTS-Provider': 'cache',
            ...corsHeaders(origin),
            ...extraHeaders,
          },
        });
      }
    } catch (e) {
      console.warn('[tts] KV read error:', e instanceof Error ? e.message : e);
    }
  }

  const isEnglish = /^en/i.test(language_code);
  const isLatin = language_code === 'la';
  let ttsText = text;
  if (!isEnglish && !isLatin) {
    try {
      ttsText = await translateText(text, language, apiKey);
    } catch (e) {
      console.warn(
        '[tts] translation failed, falling back to source text:',
        e instanceof Error ? e.message : e,
      );
    }
  }

  let mp3Buffer: ArrayBuffer;
  try {
    mp3Buffer = await xaiTTS(ttsText, language_code, voice_description, apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[tts] xAI error:', message);
    // Do not leak upstream details to clients
    return jsonError(502, 'TTS provider error', origin);
  }

  const encodedTranslation = encodeURIComponent(ttsText).substring(0, 3000);

  if (kv) {
    kv.put(cacheKey, mp3Buffer, {
      metadata: {
        language,
        voice: pickVoice(voice_description),
        translatedText: encodedTranslation,
        cachedAt: new Date().toISOString(),
      },
    }).catch((e) => console.warn('[tts] KV write error:', e instanceof Error ? e.message : e));
  }

  return new Response(mp3Buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-TTS-Provider': 'xai-tts',
      'X-Voice': pickVoice(voice_description),
      'X-Language': language,
      'X-Translated-Text': encodedTranslation,
      ...corsHeaders(origin),
    },
  });
}
