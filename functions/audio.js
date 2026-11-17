/**
 * Pages Function: POST /audio — KV-first TTS.
 * Misses go through Cloudflare AI Gateway Unified Billing (`xai/grok-tts`),
 * billed to Iceberg Media CF credits — not the depleted direct xAI prepaid balance.
 *
 * CACHE_VERSION must remain v5-mp3 to hit existing rosari-audio-cache clips.
 */

const CACHE_VERSION = 'v5-mp3';
const AIG_GATEWAY_ID = 'rosari';
const MAX_TEXT_LEN = 8000;

const ALLOWED_ORIGINS = new Set([
  'https://rosari.org',
  'https://www.rosari.org',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

function corsHeaders(origin) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://rosari.org';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Translated-Text, X-TTS-Provider, X-Voice, X-Language',
    Vary: 'Origin',
  };
}

function jsonError(status, error, origin) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function isAllowedRequest(request) {
  const origin = request.headers.get('Origin');
  if (origin) return ALLOWED_ORIGINS.has(origin);
  const referer = request.headers.get('Referer');
  if (!referer) return false;
  try {
    return ALLOWED_ORIGINS.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

function pickVoice(voiceDescription) {
  const desc = (voiceDescription || '').toLowerCase();
  if (desc.includes('woman') || desc.includes('female') || desc.includes('feminine')) return 'ara';
  if (
    desc.includes(' man') || desc.includes('male') || desc.includes('masculine') ||
    desc.includes('priest') || desc.includes('father') || desc.includes('friar') ||
    desc.includes('monk') || desc.includes('elderly') || desc.includes('aged') ||
    desc.includes('farmer') || desc.includes('grandfather') || desc.includes('old ')
  ) return 'rex';
  return 'rex';
}

async function buildCacheKey(text, language, voiceDescription) {
  const raw = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    (language || 'english').trim().toLowerCase(),
    (voiceDescription || '').trim().toLowerCase(),
  ].join('::');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return `audio::${Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function translateText(text, targetLanguage, ai) {
  const resp = await ai.run(
    'xai/grok-3-mini',
    {
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
    },
    { gateway: { id: AIG_GATEWAY_ID } },
  );

  // AI.run chat shapes vary: string | { response } | { choices }
  if (typeof resp === 'string') return resp.trim() || text;
  if (resp?.response && typeof resp.response === 'string') return resp.response.trim() || text;
  const choice = resp?.choices?.[0]?.message?.content;
  if (typeof choice === 'string') return choice.trim() || text;
  if (resp?.result?.response) return String(resp.result.response).trim() || text;
  return text;
}

/** Unified Billing TTS via Workers AI binding → temporary MP3 URL → bytes */
async function gatewayTTS(text, languageCode, voiceDescription, ai) {
  const voice = pickVoice(voiceDescription);
  const lang = (languageCode || 'en').replace('_', '-').split('-')[0] || 'en';

  const resp = await ai.run(
    'xai/grok-tts',
    {
      text,
      language: lang,
      voice_id: voice,
      output_format: { codec: 'mp3', sample_rate: 24000, bit_rate: 128000 },
    },
    { gateway: { id: AIG_GATEWAY_ID } },
  );

  if (resp?.state && resp.state !== 'Completed') {
    throw new Error(`TTS state ${resp.state}`);
  }

  const audio = resp?.result?.audio ?? resp?.audio;
  if (!audio) throw new Error('TTS returned no audio');

  if (typeof audio === 'string' && audio.startsWith('http')) {
    const r = await fetch(audio);
    if (!r.ok) throw new Error(`Audio fetch HTTP ${r.status}`);
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 100) throw new Error('Empty audio download');
    return buf;
  }

  if (typeof audio === 'string') {
    const b64 = audio.replace(/^data:audio\/\w+;base64,/, '');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out.buffer;
  }

  throw new Error('Unexpected TTS audio payload');
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin');
  try {
    return await handlePost(context);
  } catch (err) {
    console.error('[tts] unhandled:', err?.message || err);
    return jsonError(503, 'TTS unavailable', origin);
  }
}

async function handlePost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  if (!isAllowedRequest(request)) {
    return jsonError(403, 'Forbidden origin', origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonError(400, 'Invalid JSON', origin); }

  const {
    text,
    language = 'English',
    language_code = 'en',
    voice_description = 'elderly male, gravelly, slow and reverent',
  } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > MAX_TEXT_LEN) {
    return jsonError(400, `Invalid text (1–${MAX_TEXT_LEN} chars required)`, origin);
  }

  const cacheKey = await buildCacheKey(text, language, voice_description);
  const kv = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cached, metadata } = await kv.getWithMetadata(cacheKey, { type: 'arrayBuffer' });
      if (cached && cached.byteLength > 100) {
        const extra = {};
        if (metadata?.translatedText) extra['X-Translated-Text'] = metadata.translatedText;
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-TTS-Provider': 'cache',
            ...corsHeaders(origin),
            ...extra,
          },
        });
      }
    } catch (e) {
      console.warn('[tts] KV read error:', e.message);
    }
  }

  if (!env.AI) {
    return jsonError(503, 'AI binding not configured', origin);
  }

  const isEnglish = /^en/i.test(language_code);
  const isLatin = language_code === 'la';
  let ttsText = text;
  if (!isEnglish && !isLatin) {
    try {
      ttsText = await translateText(text, language, env.AI);
    } catch (e) {
      console.warn('[tts] translation failed:', e.message);
      return jsonError(503, 'Translation failed', origin);
    }
  }

  let mp3Buffer;
  try {
    mp3Buffer = await gatewayTTS(ttsText, language_code, voice_description, env.AI);
  } catch (err) {
    console.error('[tts] gateway error:', err.message);
    return jsonError(503, 'TTS provider error (cache miss)', origin);
  }

  const encodedTranslation = encodeURIComponent(ttsText).substring(0, 3000);
  if (kv) {
    kv.put(cacheKey, mp3Buffer, {
      metadata: {
        language,
        voice: pickVoice(voice_description),
        translatedText: encodedTranslation,
        cachedAt: new Date().toISOString(),
        via: 'aig-unified',
      },
    }).catch((e) => console.warn('[tts] KV write error:', e.message));
  }

  return new Response(mp3Buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-TTS-Provider': 'cf-aig-unified',
      'X-Voice': pickVoice(voice_description),
      'X-Language': language,
      'X-Translated-Text': encodedTranslation,
      ...corsHeaders(origin),
    },
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(context.request.headers.get('Origin')), 'Access-Control-Max-Age': '86400' },
  });
}
