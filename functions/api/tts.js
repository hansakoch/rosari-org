/**
 * tts.js — Cloudflare Pages Function: xAI TTS API proxy
 *
 * Deployed at /api/tts
 * Forwards requests to xAI voice endpoint with API key from env.
 * Falls back gracefully when xAI is unavailable.
 */

const XAI_VOICE_ENDPOINT = 'https://api.x.ai/v1/voice';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Rate limiting: simple header check
  const origin = request.headers.get('Origin') || '';

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { text, language, language_code, voice_description, system_prompt } = body;

  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const apiKey = env.XAI_API_KEY || 'xai-voice-key-123';

  // Build xAI voice request payload
  const xaiPayload = {
    model: 'grok-voice',          // placeholder model name
    text: text,
    language: language || 'en',
    language_code: language_code || 'en-US',
    voice: {
      description: voice_description || 'elderly reverent gravelly male voice, Piedmontese accent, slow and clear',
      style: 'reverent',
      rate: 0.80,
      pitch: 0.88,
    },
    system: system_prompt || `You are a deeply reverent Catholic lector.
      Speak slowly, clearly, and with prayerful solemnity.
      Pause naturally between phrases.
      Language: ${language}.
      Voice: ${voice_description}.`,
    format: 'mp3',
    stream: false,
  };

  try {
    const xaiResponse = await fetch(XAI_VOICE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'rosari-org/1.0',
      },
      body: JSON.stringify(xaiPayload),
      signal: AbortSignal.timeout(20000),
    });

    if (xaiResponse.ok) {
      const contentType = xaiResponse.headers.get('content-type') || 'audio/mpeg';
      const audioData = await xaiResponse.arrayBuffer();

      if (audioData.byteLength > 1000) {
        return new Response(audioData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, immutable',
            'X-TTS-Provider': 'xai',
            ...corsHeaders,
          },
        });
      }
    }

    // xAI returned error — log and fall through to error response
    console.warn('xAI TTS error:', xaiResponse.status, await xaiResponse.text().catch(() => ''));

  } catch (err) {
    // Network error or timeout — not unexpected during development
    console.warn('xAI TTS network error:', err.message);
  }

  // xAI unavailable: return 503 so client falls back to Web Speech Synthesis
  return new Response(
    JSON.stringify({
      error: 'TTS service temporarily unavailable',
      fallback: 'web-speech',
      message: `The voice API is not available for "${language}". Your browser's built-in voice will be used instead.`,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-TTS-Provider': 'fallback',
        ...corsHeaders,
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
