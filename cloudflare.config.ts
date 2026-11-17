import { bindings, defineConfig, triggers } from 'cf/config';
import * as entrypoint from './worker/index.ts' with { type: 'cf-worker' };

/** Existing Iceberg Media KV used by the Pages project. */
const ROSARI_AUDIO_CACHE_ID = '7fc5748ffe914227af723bf0c6895a28';
const SECRETS_STORE_ID = '00f7b300af064e3eaa770cb5f7ca45f3';

export default defineConfig({
  worker: {
    name: 'rosari-org',
    entrypoint,
    compatibilityDate: '2026-10-25',
    compatibilityFlags: ['nodejs_compat'],
    assets: {
      runWorkerFirst: ['/audio', '/audio/'],
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
    },
    observability: { enabled: true },
    env: {
      // Read live value from Iceberg Media Secrets Store (CLI cannot print secret values)
      XAI_API_KEY: bindings.secretsStoreSecret({
        storeId: SECRETS_STORE_ID,
        secretName: 'XAI_API_KEY',
      }),
      AUDIO_CACHE: bindings.kv({ id: ROSARI_AUDIO_CACHE_ID }),
      AUDIO_RATE_LIMIT: bindings.rateLimit({
        namespace: 'rosari_audio',
        simple: { limit: 30, period: 60 },
      }),
    },
    triggers: [
      triggers.fetch({ pattern: 'rosari.org/*' }),
      triggers.fetch({ pattern: 'www.rosari.org/*' }),
    ],
  },
});
