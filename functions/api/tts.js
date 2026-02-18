/**
 * tts.js — Cloudflare Pages Function: xAI Voice Agent API proxy
 *
 * xAI's voice API uses the Realtime WebSocket protocol (NOT a REST endpoint):
 *   wss://api.x.ai/v1/realtime?model=grok-2-audio
 *
 * Flow:
 *   1. Check AUDIO_CACHE KV → hit: return cached WAV (zero xAI credits)
 *   2. Open WebSocket to xAI Realtime API
 *   3. Configure session (voice, format, instructions)
 *   4. Send text → receive PCM16 audio delta chunks
 *   5. Wrap PCM16 in WAV container → return to browser
 *   6. Store in KV cache for next time
 *
 * Available voices:
 *   Ara  — female, warm
 *   Rex  — male, authoritative and strong        ← rosary default
 *   Sal  — neutral, smooth
 *   Eve  — female, energetic
 *   Leo  — male, authoritative, strong
 *
 * KV binding:  AUDIO_CACHE
 * Env var:     XAI_API_KEY
 */

const CACHE_VERSION = 'v3-ws';
const XAI_REALTIME  = 'https://api.x.ai/v1/realtime'; // Worker upgrades to wss://
const XAI_MODEL     = 'grok-2-audio';
const SAMPLE_RATE   = 24000;
const NUM_CHANNELS  = 1;
const BITS          = 16;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Pick xAI voice based on language / tone ────────────────────────────────

function pickVoice(language, voiceDescription) {
  const lang = (language || '').toLowerCase();
  const desc = (voiceDescription || '').toLowerCase();
  if (desc.includes('woman') || desc.includes('female') || desc.includes('feminine')) return 'Ara';
  if (desc.includes('man') || desc.includes('male') || desc.includes('masculine')) return 'Rex';
  return 'Sal'; // neutral default — works for all languages
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

// ── Build WAV container from raw PCM16 ──────────────────────────────────────
// AudioContext.decodeAudioData() needs a container; WAV is simplest.

function pcm16ToWav(pcmBytes) {
  const dataLen = pcmBytes.byteLength;
  const header  = new ArrayBuffer(44);
  const v       = new DataView(header);
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };

  writeStr(0,  'RIFF');
  v.setUint32(4,  36 + dataLen, true);
  writeStr(8,  'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);                              // subchunk1 size
  v.setUint16(20, 1,  true);                              // PCM
  v.setUint16(22, NUM_CHANNELS, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * BITS / 8, true);
  v.setUint16(32, NUM_CHANNELS * BITS / 8, true);
  v.setUint16(34, BITS, true);
  writeStr(36, 'data');
  v.setUint32(40, dataLen, true);

  // Concatenate header + PCM
  const wav = new Uint8Array(44 + dataLen);
  wav.set(new Uint8Array(header), 0);
  wav.set(new Uint8Array(pcmBytes), 44);
  return wav.buffer;
}

// ── xAI Realtime WebSocket TTS ─────────────────────────────────────────────

async function xaiVoiceTTS(text, language, languageCode, voiceDescription, apiKey) {
  const voice = pickVoice(language, voiceDescription);

  const systemInstructions = [
    `You are a deeply reverent Catholic lector praying the Holy Rosary.`,
    `Speak in ${language} (${languageCode}).`,
    `Voice character: ${voiceDescription}.`,
    `Pray with great solemnity, very slowly and clearly.`,
    `Pause naturally at commas and fully at periods.`,
    `Never rush — this is sacred prayer, not narration.`,
  ].join(' ');

  // Upgrade HTTP → WebSocket
  const wsRes = await fetch(`${XAI_REALTIME}?model=${XAI_MODEL}`, {
    headers: {
      'Authorization':            `Bearer ${apiKey}`,
      'Upgrade':                  'websocket',
      'Connection':               'Upgrade',
      'Sec-WebSocket-Version':    '13',
      'Sec-WebSocket-Key':        btoa(crypto.getRandomValues(new Uint8Array(16)).join('')),
    },
  });

  const ws = wsRes.webSocket;
  if (!ws) {
    throw new Error(`WebSocket upgrade failed (HTTP ${wsRes.status})`);
  }
  ws.accept();

  return new Promise((resolve, reject) => {
    const pcmChunks = [];         // decoded base64 → raw PCM bytes per chunk
    let sessionReady = false;
    let responseDone = false;

    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('xAI TTS timeout (28s)'));
    }, 28000);

    const finish = (err) => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      if (err) { reject(err); return; }

      // Assemble all PCM chunks
      const totalLen = pcmChunks.reduce((s, c) => s + c.byteLength, 0);
      const combined = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of pcmChunks) {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      if (totalLen < 400) {
        reject(new Error('xAI returned empty audio'));
        return;
      }

      resolve(pcm16ToWav(combined.buffer));
    };

    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {

        case 'session.created':
          // Configure the session: voice, output format, instructions
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              voice,
              instructions: systemInstructions,
              output_audio_format: 'pcm16',
              // Disable input audio — we only need TTS
              input_audio_transcription: null,
              turn_detection: null,
            },
          }));
          sessionReady = true;

          // Create the text message
          ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text }],
            },
          }));

          // Request audio response
          ws.send(JSON.stringify({
            type: 'response.create',
            response: {
              modalities:           ['audio'],
              output_audio_format:  'pcm16',
              // Don't include text in response — audio only
            },
          }));
          break;

        case 'response.audio.delta':
          if (msg.delta) {
            // Decode base64 → ArrayBuffer
            const raw = atob(msg.delta);
            const bytes = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
            pcmChunks.push(bytes.buffer);
          }
          break;

        case 'response.audio.done':
        case 'response.done':
          if (!responseDone) {
            responseDone = true;
            finish(null);
          }
          break;

        case 'error':
          finish(new Error(msg.error?.message || JSON.stringify(msg.error) || 'xAI error'));
          break;

        default:
          // Ignore other message types (session.updated, rate_limits.updated, etc.)
          break;
      }
    });

    ws.addEventListener('error', (err) => {
      finish(new Error(String(err)));
    });

    ws.addEventListener('close', (event) => {
      if (!responseDone) {
        finish(new Error(`WebSocket closed early: ${event.code} ${event.reason}`));
      }
    });
  });
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const {
    text,
    language       = 'English',
    language_code  = 'en-US',
    voice_description = 'elderly male, gravelly voice, slow and reverent',
  } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 8000) {
    return new Response(JSON.stringify({ error: 'Invalid text (1–8000 chars required)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const apiKey = env.XAI_API_KEY;
  if (!apiKey) {
    return ttsUnavailable(language, text, 'XAI_API_KEY not configured');
  }

  // ── 1. KV cache check ─────────────────────────────────────────────────────

  const cacheKey = await buildCacheKey(text, language, voice_description);
  const kv = env.AUDIO_CACHE;

  if (kv) {
    try {
      const { value: cached, metadata } = await kv.getWithMetadata(cacheKey, { type: 'arrayBuffer' });
      if (cached && cached.byteLength > 500) {
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-TTS-Provider': 'cache',
            'X-Language': metadata?.language || language,
            ...CORS,
          },
        });
      }
    } catch (e) {
      console.warn('[tts] KV read:', e.message);
    }
  }

  // ── 2. Call xAI Voice Agent API ───────────────────────────────────────────

  let wavBuffer;
  try {
    wavBuffer = await xaiVoiceTTS(text, language, language_code, voice_description, apiKey);
  } catch (err) {
    console.error('[tts] xAI error:', err.message);
    return ttsUnavailable(language, text, err.message);
  }

  // ── 3. Cache + return ─────────────────────────────────────────────────────

  if (kv) {
    kv.put(cacheKey, wavBuffer, {
      metadata: {
        language,
        languageCode: language_code,
        voice: pickVoice(language, voice_description),
        textLength: text.length,
        cachedAt: new Date().toISOString(),
      },
    }).catch(e => console.warn('[tts] KV write:', e.message));
  }

  return new Response(wavBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-TTS-Provider': 'xai-realtime',
      'X-Voice': pickVoice(language, voice_description),
      'X-Language': language,
      ...CORS,
    },
  });
}

function ttsUnavailable(language, text, reason = '') {
  console.warn('[tts] unavailable:', reason);
  return new Response(
    JSON.stringify({ error: 'TTS unavailable', fallback: 'web-speech', language, reason, text_length: text?.length || 0 }),
    { status: 503, headers: { 'Content-Type': 'application/json', 'X-TTS-Provider': 'fallback', ...CORS } }
  );
}

// ── OPTIONS ────────────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
}
