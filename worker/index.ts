import { handleAudioOptions, handleAudioPost, type TtsEnv } from './tts';

export interface Env extends TtsEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/audio' || url.pathname === '/audio/') {
      if (request.method === 'OPTIONS') return handleAudioOptions(request);
      if (request.method === 'POST') return handleAudioPost(request, env);
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST, OPTIONS' } });
    }

    // Static Astro assets (and SPA-style fallbacks handled by assets config)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
