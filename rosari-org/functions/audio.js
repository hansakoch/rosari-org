/**
 * tts.js — Cloudflare Pages Function: xAI TTS proxy
 *
 * xAI TTS WebSocket API
 *   wss://api.x.ai/v1/tts?language=<BCP47>&voice=<name>&codec=mp3&sample_rate=24000&bit_rate=128000
 *
 * Flow:
 *   Client → server:  {"type":"text.delta","delta":"..."} then {"type":"text.done"}
 *   Server → client:  {"type":"audio.delta","delta":"<base64 MP3 bytes>"} …then {"type":"audio.done"}
 *
 * Available voices: ara (female warm) | rex (male reverent) | sal (neutral) | eve (female) | leo (male)
 *
 * KV binding:  AUDIO_CACHE (optional — cache MP3 bytes)
 * Env var:     XAI_API_KEY (required)
 */

const CACHE_VERSION = 'v5-mp3'; // bumped: invalidates pre-translation cached audio
const XAI_TTS_URL   = 'https://api.x.ai/v1/tts';   // Worker upgrades to wss://
const SAMPLE_RATE   = 24000;
const BIT_RATE      = 128000;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Pick xAI voice ─────────────────────────────────────────────────────────

function pickVoice(voiceDescription) {
  const desc = (voiceDescription || '').toLowerCase();
  if (desc.includes('woman') || desc.includes('female') || desc.includes('feminine')) return 'ara';
  // Broad set of male/elderly/religious descriptors
  if (
    desc.includes(' man') || desc.includes('male') || desc.includes('masculine') ||
    desc.includes('priest') || desc.includes('father') || desc.includes('friar')  ||
    desc.includes('monk')   || desc.includes('elderly') || desc.includes('aged')  ||
    desc.includes('farmer') || desc.includes('grandfather') || desc.includes('old ')
  ) return 'rex';
  return 'rex'; // default to male voice for rosary
}

// ── Translate prayer text via xAI chat ─────────────────────────────────────

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

// ── SHA-256 cache key ──────────────────────────────────────────────────────

async function buildCacheKey(text, language, voiceDescription) {
  const raw = [
    CACHE_VERSION,
    text.trim().toLowerCase(),
    (language || 'english').trim().toLowerCase(),
    (voiceDescription || '').trim().toLowerCase(),
  ].join('::');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `audio::${hex}`;
}

// ── xAI TTS via WebSocket ─────────────────────────────────────────────────

async function xaiTTS(text, languageCode, voiceDescription, apiKey) {
  const voice = pickVoice(voiceDescription);
  // xAI uses BCP-47 base codes: 'en', 'pt', 'zh' etc. or full codes like 'pt-BR'
  const lang = (languageCode || 'en').replace('_', '-');

  const url = new URL(XAI_TTS_URL);
  url.searchParams.set('language',    lang);
  url.searchParams.set('voice',       voice);
  url.searchParams.set('codec',       'mp3');
  url.searchParams.set('sample_rate', String(SAMPLE_RATE));
  url.searchParams.set('bit_rate',    String(BIT_RATE));

  // Cloudflare Workers outbound WebSocket upgrade via fetch()
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
      resolve(out.buffer);
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
        if (!done) { done = true; finish(null); }
      } else if (msg.type === 'error') {
        finish(new Error(msg.message || JSON.stringify(msg)));
      }
    });

    ws.addEventListener('error',  (e)  => finish(new Error(`WebSocket error: ${String(e)}`)));
    ws.addEventListener('close',  (e)  => { if (!done) finish(new Error(`WebSocket closed early: ${e.code} ${e.reason}`)); });

    // Send text
    ws.send(JSON.stringify({ type: 'text.delta', delta: text }));
    ws.send(JSON.stringify({ type: 'text.done'               }));
  });
}

// ── POST handler ──────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const {
    text,
    language          = 'English',
    language_code     = 'en',
    voice_description = 'elderly male, gravelly, slow and reverent',
  } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 8000) {
    return new Response(JSON.stringify({ error: 'Invalid text (1–8000 chars required)' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const apiKey = env.XAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'XAI_API_KEY not configured on server' }), {
      status: 503, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // ── KV cache check ──────────────────────────────────────────────────────

  const cacheKey = await buildCacheKey(text, language, voice_description);
  const kv = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cached } = await kv.getWithMetadata(cacheKey, { type: 'arrayBuffer' });
      if (cached && cached.byteLength > 100) {
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type':   'audio/mpeg',
            'Cache-Control':  'public, max-age=31536000, immutable',
            'X-TTS-Provider': 'cache',
            ...CORS,
          },
        });
      }
    } catch (e) {
      console.warn('[tts] KV read error:', e.message);
    }
  }

  // ── Translate if not English or Latin ───────────────────────────────────

  const isEnglish = /^en/i.test(language_code);
  const isLatin   = language_code === 'la';
  let ttsText = text;
  if (!isEnglish && !isLatin) {
    try {
      ttsText = await translateText(text, language, apiKey);
    } catch (e) {
      console.warn('[tts] translation failed, falling back to source text:', e.message);
    }
  }

  // ── Call xAI TTS ────────────────────────────────────────────────────────

  let mp3Buffer;
  try {
    mp3Buffer = await xaiTTS(ttsText, language_code, voice_description, apiKey);
  } catch (err) {
    console.error('[tts] xAI error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  // ── Cache + respond ─────────────────────────────────────────────────────

  if (kv) {
    kv.put(cacheKey, mp3Buffer, {
      metadata: { language, voice: pickVoice(voice_description), cachedAt: new Date().toISOString() },
    }).catch(e => console.warn('[tts] KV write error:', e.message));
  }

  return new Response(mp3Buffer, {
    status: 200,
    headers: {
      'Content-Type':   'audio/mpeg',
      'Cache-Control':  'public, max-age=31536000, immutable',
      'X-TTS-Provider': 'xai-tts',
      'X-Voice':        pickVoice(voice_description),
      'X-Language':     language,
      ...CORS,
    },
  });
}

// ── OPTIONS ────────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS, 'Access-Control-Max-Age': '86400' },
  });
}
