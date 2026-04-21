/**
 * audio.js — Cloudflare Pages Function: xAI TTS proxy
 *
 * xAI TTS WebSocket API (April 2026)
 *   wss://api.x.ai/v1/tts?language=<BCP47>&voice=<name>&codec=<c>&sample_rate=<n>&bit_rate=<n>
 *
 * Supported languages (20): auto, en, ar-EG, ar-SA, ar-AE, bn, zh, fr, de, hi, id, it,
 *   ja, ko, pt-BR, pt-PT, ru, es-MX, es-ES, tr, vi.
 *
 * Ecclesiastical Latin uses Italian phonetic rules, so we route `la` → `it`.
 *
 * Voices (xAI, 2026):
 *   ara — warm, friendly         eve — energetic, upbeat (default)
 *   leo — authoritative, strong  rex — confident, clear
 *   sal — smooth, balanced
 *
 * Flow:
 *   Client → server:  {"type":"text.delta","delta":"..."} then {"type":"text.done"}
 *   Server → client:  {"type":"audio.delta","delta":"<base64>"} … {"type":"audio.done","trace_id":"…"}
 *
 * KV binding:  AUDIO_CACHE (optional — cache MP3 bytes)
 * Env var:     XAI_API_KEY (required)
 */

const CACHE_VERSION = 'v6-mp3';
const XAI_TTS_URL   = 'https://api.x.ai/v1/tts';
const SAMPLE_RATE   = 24000;
const BIT_RATE      = 128000;
const MAX_DELTA_CHARS = 15000;

const XAI_SUPPORTED = new Set([
  'auto', 'en', 'ar-EG', 'ar-SA', 'ar-AE', 'bn', 'zh', 'fr', 'de', 'hi',
  'id', 'it', 'ja', 'ko', 'pt-BR', 'pt-PT', 'ru', 'es-MX', 'es-ES', 'tr', 'vi',
]);

// BCP-47 → xAI language code. Ecclesiastical Latin maps to `it`
// because Italian phonetics are the liturgical pronunciation.
const LANG_NORMALIZE = {
  'la': 'it', 'la-va': 'it', 'la-la': 'it', 'latin': 'it',
  'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ie': 'en', 'en-ca': 'en',
  'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr',
  'de': 'de', 'de-de': 'de', 'de-at': 'de', 'de-ch': 'de',
  'it': 'it', 'it-it': 'it',
  'pt': 'pt-PT', 'pt-pt': 'pt-PT', 'pt-br': 'pt-BR',
  'es': 'es-ES', 'es-es': 'es-ES', 'es-mx': 'es-MX', 'es-la': 'es-MX', 'es-419': 'es-MX',
  'ja': 'ja', 'ja-jp': 'ja',
  'ko': 'ko', 'ko-kr': 'ko',
  'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'cmn': 'zh',
  'hi': 'hi', 'hi-in': 'hi',
  'id': 'id', 'id-id': 'id', 'ms': 'id', 'ms-my': 'id',
  'ru': 'ru', 'ru-ru': 'ru',
  'tr': 'tr', 'tr-tr': 'tr',
  'vi': 'vi', 'vi-vn': 'vi',
  'bn': 'bn', 'bn-in': 'bn', 'bn-bd': 'bn',
  'ar': 'ar-EG', 'ar-eg': 'ar-EG', 'ar-sa': 'ar-SA', 'ar-ae': 'ar-AE',
};

function normalizeLanguage(code) {
  if (!code) return 'auto';
  const lower = String(code).trim().toLowerCase().replace('_', '-');
  if (LANG_NORMALIZE[lower]) return LANG_NORMALIZE[lower];
  const primary = lower.split('-')[0];
  if (LANG_NORMALIZE[primary]) return LANG_NORMALIZE[primary];
  for (const s of XAI_SUPPORTED) if (s.toLowerCase() === lower) return s;
  return 'auto';
}

const CORS = {
  'Access-Control-Allow-Origin':   '*',
  'Access-Control-Allow-Methods':  'POST, OPTIONS',
  'Access-Control-Allow-Headers':  'Content-Type',
  'Access-Control-Expose-Headers': 'X-Translated-Text, X-TTS-Provider, X-Voice, X-Language, X-Trace-Id',
};

// Voice characters (xAI docs, 2026):
//   ara — warm, friendly        (conversational; feminine tone)
//   eve — energetic, upbeat     (default)
//   leo — authoritative, strong (instructional; best fit for reverent liturgy)
//   rex — confident, clear      (corporate)
//   sal — smooth, balanced      (neutral narrator)
function pickVoice(voiceDescription) {
  const d = (voiceDescription || '').toLowerCase();

  if (/\b(woman|female|feminine|lady|sister|nun|madre|mother|abuela|grandmother|girl|femme)\b/.test(d)) return 'ara';
  if (/\b(priest|father|friar|monk|pope|bishop|aged|elder|elderly|old|ancient|reverent|solemn|grandfather|abbot|rabbi|preacher)\b/.test(d)) return 'leo';
  if (/\b(man|male|masculine|gentleman|businessman)\b/.test(d)) return 'rex';
  if (/\b(warm|gentle|soft|kind|friendly|tender|motherly)\b/.test(d)) return 'ara';
  if (/\b(smooth|neutral|narrator|calm|balanced)\b/.test(d)) return 'sal';
  if (/\b(cheerful|upbeat|bright|energetic|young)\b/.test(d)) return 'eve';

  return 'leo';
}

async function translateText(text, targetLanguage, apiKey) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
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
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

async function buildCacheKey(text, xaiLanguage, voice) {
  const raw = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    xaiLanguage,
    voice,
  ].join('::');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `audio::${hex}`;
}

async function xaiTTS(text, xaiLanguage, voice, apiKey) {
  const url = new URL(XAI_TTS_URL);
  url.searchParams.set('language',    xaiLanguage);
  url.searchParams.set('voice',       voice);
  url.searchParams.set('codec',       'mp3');
  url.searchParams.set('sample_rate', String(SAMPLE_RATE));
  url.searchParams.set('bit_rate',    String(BIT_RATE));

  const wsRes = await fetch(url.toString(), {
    headers: {
      'Authorization':         `Bearer ${apiKey}`,
      'Upgrade':               'websocket',
      'Connection':            'Upgrade',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key':     btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))),
    },
  });

  if (!wsRes.webSocket) {
    let detail = `HTTP ${wsRes.status}`;
    try { const t = await wsRes.text(); if (t) detail += `: ${t.slice(0, 200)}`; } catch {}
    throw new Error(`WebSocket upgrade failed — ${detail}`);
  }

  const ws = wsRes.webSocket;
  ws.accept();

  return new Promise((resolve, reject) => {
    const chunks = [];
    let traceId = null;
    let done = false;

    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('xAI TTS timeout (30s)'));
    }, 30000);

    const finish = (err) => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      if (err) { reject(err); return; }
      const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
      if (totalLen < 100) { reject(new Error('xAI returned empty audio')); return; }
      const out = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) { out.set(new Uint8Array(c), offset); offset += c.byteLength; }
      resolve({ buffer: out.buffer, traceId });
    };

    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === 'audio.delta' && msg.delta) {
        const raw = atob(msg.delta);
        const b   = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i);
        chunks.push(b.buffer);
      } else if (msg.type === 'audio.done') {
        traceId = msg.trace_id || null;
        if (!done) { done = true; finish(null); }
      } else if (msg.type === 'error') {
        finish(new Error(msg.message || JSON.stringify(msg)));
      }
    });

    ws.addEventListener('error',  (e)  => finish(new Error(`WebSocket error: ${String(e)}`)));
    ws.addEventListener('close',  (e)  => { if (!done) finish(new Error(`WebSocket closed early: ${e.code} ${e.reason}`)); });

    // Chunk the text if it exceeds the per-delta cap (15k chars).
    for (let i = 0; i < text.length; i += MAX_DELTA_CHARS) {
      ws.send(JSON.stringify({ type: 'text.delta', delta: text.slice(i, i + MAX_DELTA_CHARS) }));
    }
    ws.send(JSON.stringify({ type: 'text.done' }));
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }); }

  const { text, language = 'English', language_code = 'en', voice_description = 'aged Catholic priest, deep reverent voice' } = body;
  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 8000) {
    return new Response(JSON.stringify({ error: 'Invalid text (1–8000 chars required)' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });
  }

  const apiKey = env.XAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'XAI_API_KEY not configured on server' }), { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } });
  }

  const voice       = pickVoice(voice_description);
  const xaiLanguage = normalizeLanguage(language_code);
  const cacheKey    = await buildCacheKey(text, xaiLanguage, voice);
  const kv          = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cached, metadata } = await kv.getWithMetadata(cacheKey, { type: 'arrayBuffer' });
      if (cached && cached.byteLength > 100) {
        const extraHeaders = {};
        if (metadata?.translatedText) extraHeaders['X-Translated-Text'] = metadata.translatedText;
        return new Response(cached, { status: 200, headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-TTS-Provider': 'cache',
          'X-Voice': voice,
          'X-Language': xaiLanguage,
          ...CORS, ...extraHeaders,
        } });
      }
    } catch (e) { console.warn('[tts] KV read error:', e.message); }
  }

  // Translate the source text for languages that are spoken but not source-provided.
  // Latin prayers are already written in Latin; English is already English; everything
  // else we translate from the source English prayer to the target language.
  const isEnglish = /^en/i.test(language_code);
  const isLatin   = /^la/i.test(language_code);
  let ttsText = text;
  if (!isEnglish && !isLatin) {
    try { ttsText = await translateText(text, language, apiKey); }
    catch (e) { console.warn('[tts] translation failed, falling back to source text:', e.message); }
  }

  let mp3Buffer, traceId;
  try {
    const out = await xaiTTS(ttsText, xaiLanguage, voice, apiKey);
    mp3Buffer = out.buffer;
    traceId   = out.traceId;
  } catch (err) {
    console.error('[tts] xAI error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } });
  }

  const encodedTranslation = encodeURIComponent(ttsText).substring(0, 3000);

  if (kv) {
    kv.put(cacheKey, mp3Buffer, {
      metadata: { language: xaiLanguage, voice, translatedText: encodedTranslation, cachedAt: new Date().toISOString() },
    }).catch(e => console.warn('[tts] KV write error:', e.message));
  }

  const headers = {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-TTS-Provider': 'xai-tts',
    'X-Voice': voice,
    'X-Language': xaiLanguage,
    'X-Translated-Text': encodedTranslation,
    ...CORS,
  };
  if (traceId) headers['X-Trace-Id'] = traceId;

  return new Response(mp3Buffer, { status: 200, headers });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
}
