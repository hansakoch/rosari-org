/**
 * tts-status.js — Debug endpoint: tests xAI Realtime API connectivity
 * GET /api/tts-status
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.XAI_API_KEY;

  const status = {
    xai_key_configured: !!apiKey,
    xai_key_prefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
    timestamp: new Date().toISOString(),
    websocket_test: null,
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ ...status, error: 'XAI_API_KEY not set' }), {
      status: 503, headers: CORS,
    });
  }

  // Quick WebSocket handshake test (no audio — just verify auth works)
  try {
    const wsRes = await fetch('https://api.x.ai/v1/realtime?model=grok-2-audio', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Upgrade': 'websocket',
      },
    });

    const ws = wsRes.webSocket;
    if (!ws) {
      status.websocket_test = { ok: false, error: `HTTP ${wsRes.status} — upgrade failed` };
    } else {
      ws.accept();

      const result = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          try { ws.close(); } catch {}
          resolve({ ok: false, error: 'timeout waiting for session.created' });
        }, 8000);

        ws.addEventListener('message', (event) => {
          let msg;
          try { msg = JSON.parse(event.data); } catch { return; }
          if (msg.type === 'session.created') {
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve({ ok: true, session_id: msg.session?.id, voice_options: msg.session?.voice });
          }
          if (msg.type === 'error') {
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve({ ok: false, error: msg.error?.message || JSON.stringify(msg.error) });
          }
        });

        ws.addEventListener('error', (err) => {
          clearTimeout(timer);
          resolve({ ok: false, error: String(err) });
        });
      });

      status.websocket_test = result;
    }
  } catch (err) {
    status.websocket_test = { ok: false, error: err.message };
  }

  const allOk = status.xai_key_configured && status.websocket_test?.ok;

  return new Response(JSON.stringify(status, null, 2), {
    status: allOk ? 200 : 503,
    headers: CORS,
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
}
