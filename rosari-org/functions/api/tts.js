/**
 * tts.js — Cloudflare Pages Function: xAI TTS proxy with KV audio cache
 *
 * Flow:
 *   1. Hash (text + language + voice) → cache key
 *   2. Check AUDIO_CACHE KV → hit: serve cached audio (zero xAI credits)
 *   3. Miss: call xAI Voice API
 *   4. Success: store audio in KV (indefinitely) → return to client
 *   5. xAI failure: return 503 → client falls back to Web Speech Synthesis
 *
 * KV binding:  AUDIO_CACHE  (namespace: rosari-audio-cache)
 * Env var:     XAI_API_KEY
 */

const XAI_VOICE_ENDPOINT = 'https://api.x.ai/v1/voice';
const CACHE_VERSION = 'v1'; // bump to invalidate all cached audio

// ── SHA-256 cache key ─────────────────────────────────────────────────────────

async function buildCacheKey(text, language, voiceDescription) {
  const normalized = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    (language || 'english').trim().toLowerCase(),
    (voiceDescription || '').trim().toLowerCase(),
  ].join('::');

  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `audio::${hashHex}`;
}

// ── CORS headers ──────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── POST handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const {
    text,
    language = 'English',
    language_code = 'en-US',
    voice_description = 'elderly rural Piedmontese farmer, gravelly northern Italian drawl, slow, reverent',
  } = body;

  if (!text || typeof text !== 'string' || text.length > 8000) {
    return new Response(JSON.stringify({ error: 'Invalid or missing text (max 8000 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // ── 1. Cache lookup ─────────────────────────────────────────────────────────

  const cacheKey = await buildCacheKey(text, language, voice_description);
  const kv = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cachedAudio, metadata } = await kv.getWithMetadata(cacheKey, { type: 'arrayBuffer' });

      if (cachedAudio && cachedAudio.byteLength > 1000) {
        return new Response(cachedAudio, {
          status: 200,
          headers: {
            'Content-Type': metadata?.contentType || 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-TTS-Provider': 'cache',
            'X-Cache-Key': cacheKey.slice(0, 16) + '...',
            'X-Language': metadata?.language || language,
            ...CORS,
          },
        });
      }
    } catch (kvErr) {
      // KV read failure is non-fatal — fall through to xAI
      console.warn('[rosari/tts] KV read error:', kvErr.message);
    }
  }

  // ── 2. Call xAI Voice API ───────────────────────────────────────────────────

  const apiKey = env.XAI_API_KEY;

  if (!apiKey || apiKey === 'xai-voice-key-123') {
    return fallbackResponse(language, text);
  }

  const xaiPayload = {
    model: 'grok-voice-preview',
    text,
    language,
    language_code,
    voice: {
      description: voice_description,
      style: 'reverent',
      rate: 0.80,    // slow and clear
      pitch: 0.88,   // slightly deeper/more solemn
    },
    system: [
      `You are a deeply reverent Catholic lector praying the Holy Rosary.`,
      `Speak in ${language} (${language_code}).`,
      `Voice character: ${voice_description}.`,
      `Pray slowly, clearly, and with prayerful solemnity.`,
      `Pause naturally between phrases. Never rush sacred prayer.`,
    ].join(' '),
    output_format: 'mp3',
    sample_rate: 24000,
    stream: false,
  };

  let audioData = null;
  let contentType = 'audio/mpeg';

  try {
    const xaiRes = await fetch(XAI_VOICE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'rosari-org/1.0 (Cloudflare Pages)',
      },
      body: JSON.stringify(xaiPayload),
      signal: AbortSignal.timeout(25000),
    });

    if (xaiRes.ok) {
      contentType = xaiRes.headers.get('content-type') || 'audio/mpeg';
      const raw = await xaiRes.arrayBuffer();

      if (raw.byteLength > 1000) {
        audioData = raw;
      } else {
        console.warn('[rosari/tts] xAI returned tiny response:', raw.byteLength, 'bytes');
      }
    } else {
      const errText = await xaiRes.text().catch(() => '');
      console.warn('[rosari/tts] xAI HTTP', xaiRes.status, errText.slice(0, 200));
    }
  } catch (err) {
    console.warn('[rosari/tts] xAI fetch error:', err.message);
  }

  // ── 3. Cache successful audio in KV ────────────────────────────────────────

  if (audioData) {
    if (kv) {
      // Store indefinitely — same prayer+voice+language never changes
      kv.put(cacheKey, audioData, {
        metadata: {
          contentType,
          language,
          languageCode: language_code,
          voice: voice_description.slice(0, 120),
          textLength: text.length,
          cachedAt: new Date().toISOString(),
        },
      }).catch(err => console.warn('[rosari/tts] KV write error:', err.message));
    }

    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-TTS-Provider': 'xai',
        'X-Language': language,
        ...CORS,
      },
    });
  }

  // ── 4. xAI unavailable — tell client to use browser TTS ────────────────────

  return fallbackResponse(language, text);
}

function fallbackResponse(language, text) {
  return new Response(
    JSON.stringify({
      error: 'TTS service unavailable',
      fallback: 'web-speech',
      language,
      message: language.toLowerCase().includes('klingon')
        ? "This language is experimental — pray slowly."
        : `Voice generation for ${language} is temporarily unavailable. Your browser's built-in voice will be used instead.`,
      text_length: text?.length || 0,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-TTS-Provider': 'fallback',
        ...CORS,
      },
    }
  );
}

// ── OPTIONS (preflight) ───────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
