/**
 * tts.js — Cloudflare Pages Function: xAI TTS proxy with KV audio cache
 *
 * Flow:
 *   1. Hash (text + language + voice) → cache key
 *   2. Check AUDIO_CACHE KV → hit: serve cached audio (zero xAI credits)
 *   3. Miss: call xAI Audio API (tries /v1/audio/speech then /v1/voice)
 *   4. Success: store in KV indefinitely → return to client
 *   5. xAI failure: return 503 → client falls back to browser Web Speech
 *
 * KV binding:  AUDIO_CACHE  (namespace: rosari-audio-cache)
 * Env var:     XAI_API_KEY
 */

const CACHE_VERSION = 'v2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── SHA-256 cache key ──────────────────────────────────────────────────────────

async function buildCacheKey(text, language, voiceDescription) {
  const normalized = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    (language || 'english').trim().toLowerCase(),
    (voiceDescription || '').trim().toLowerCase(),
  ].join('::');

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `audio::${hashHex}`;
}

// ── xAI API call — tries two endpoint formats ──────────────────────────────────

async function callXaiTTS(text, language, languageCode, voiceDescription, apiKey) {
  // xAI follows OpenAI-compatible API. As of early 2026 their TTS uses /v1/audio/speech.
  // Fallback: /v1/voice (older format).

  const endpoints = [
    {
      url: 'https://api.x.ai/v1/audio/speech',
      body: {
        model: 'grok-tts-preview',
        input: text,
        voice: 'neutral',           // xAI voice name; override via voiceDescription system prompt
        response_format: 'mp3',
        speed: 0.78,
        // xAI-specific extensions
        voice_description: voiceDescription,
        language,
        language_code: languageCode,
        instructions: [
          `You are a deeply reverent Catholic lector praying the Holy Rosary.`,
          `Speak in ${language} (${languageCode}).`,
          `Voice character: ${voiceDescription}.`,
          `Pray slowly, clearly, and with prayerful solemnity.`,
          `Pause naturally at commas and periods. Never rush sacred prayer.`,
        ].join(' '),
      },
    },
    {
      url: 'https://api.x.ai/v1/voice',
      body: {
        model: 'grok-voice-preview',
        text,
        language,
        language_code: languageCode,
        voice: {
          description: voiceDescription,
          style: 'reverent',
          rate: 0.78,
          pitch: 0.88,
        },
        system: [
          `You are a deeply reverent Catholic lector praying the Holy Rosary.`,
          `Speak in ${language} (${languageCode}).`,
          `Voice character: ${voiceDescription}.`,
          `Pray slowly, clearly, and with prayerful solemnity.`,
        ].join(' '),
        output_format: 'mp3',
        sample_rate: 24000,
        stream: false,
      },
    },
  ];

  for (const { url, body } of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'rosari-org/2.0 (Cloudflare Pages)',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(28000),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'audio/mpeg';
        const data = await res.arrayBuffer();
        if (data.byteLength > 1000) {
          return { data, contentType };
        }
        console.warn(`[rosari/tts] ${url} returned tiny response: ${data.byteLength} bytes`);
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[rosari/tts] ${url} → HTTP ${res.status}:`, errText.slice(0, 180));
        // 404 means endpoint doesn't exist — try next. Other errors, also try next.
      }
    } catch (err) {
      console.warn(`[rosari/tts] ${url} error:`, err.message);
    }
  }

  return null; // all endpoints failed
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

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

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 8000) {
    return new Response(JSON.stringify({ error: 'Invalid or missing text (max 8000 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // ── 1. KV cache lookup ─────────────────────────────────────────────────────

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
            'X-Cache-Key': cacheKey.slice(0, 20) + '…',
            'X-Language': metadata?.language || language,
            ...CORS,
          },
        });
      }
    } catch (kvErr) {
      console.warn('[rosari/tts] KV read error:', kvErr.message);
    }
  }

  // ── 2. Call xAI ───────────────────────────────────────────────────────────

  const apiKey = env.XAI_API_KEY;

  if (!apiKey) {
    return fallbackResponse(language, text, 'No API key configured');
  }

  const result = await callXaiTTS(text, language, language_code, voice_description, apiKey);

  // ── 3. Cache and return ────────────────────────────────────────────────────

  if (result) {
    const { data: audioData, contentType } = result;

    // Store indefinitely — same prayer+voice+language never changes
    if (kv) {
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

  // ── 4. All TTS failed — instruct client to use browser voice ─────────────

  return fallbackResponse(language, text, 'xAI TTS unavailable');
}

function fallbackResponse(language, text, reason = '') {
  return new Response(
    JSON.stringify({
      error: 'TTS service unavailable',
      fallback: 'web-speech',
      language,
      reason,
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

// ── OPTIONS (CORS preflight) ──────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS, 'Access-Control-Max-Age': '86400' },
  });
}
