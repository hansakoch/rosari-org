# Rosari — A Modern Rosary Web App

Progressive Web App for praying the rosary with liturgical structure, karaoke text, and xAI text-to-speech (proxied securely through Cloudflare).

## Tech stack

- **Astro 7** — static site
- **Cloudflare Workers + Assets** — edge hosting (`cf` CLI, `cloudflare.config.ts`)
- **Cloudflare KV** — TTS audio cache
- **xAI Voice API** — TTS (server-side only; key never reaches the browser)
- **TypeScript** — checked with [`tsrs`](https://blog.cloudflare.com/typescript-rust-port/) (Rust port of `tsc`)

## Setup

```bash
npm install
cp .dev.vars.template .dev.vars
# put your XAI_API_KEY in .dev.vars
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Astro local UI (`:4321`) — UI only; TTS needs `cf:dev` |
| `npm run build` | Static build → `dist/` |
| `npm run typecheck` | `tsrs --noEmit` |
| `npm run cf:dev` | Build + `cf dev` (Worker + assets + `/audio`) |
| `npm run deploy` | Build + `cf deploy` |

## Cloudflare

Config lives in:

- `cloudflare.config.ts` — Worker name, bindings, routes, `runWorkerFirst` for `/audio`
- `wrangler.config.ts` — `assetsDirectory: ./dist`
- `worker/` — TTS proxy (`POST /audio`)

Create KV + secret once, then set the namespace id:

```bash
npx cf kv namespace create ROSARI_AUDIO_CACHE
# copy the id into ROSARI_KV_ID (or cloudflare.config.ts)
export ROSARI_KV_ID=<namespace-id>
npx cf secret put XAI_API_KEY
```

## Security notes

- TTS is same-origin only (Origin/Referer allowlist)
- Soft per-IP rate limit on `/audio`
- API errors to clients are generic (no upstream leak)
- Karaoke HTML escapes translated text
- CSP: `connect-src 'self'` (browser never talks to xAI)

## License

MIT — see [LICENSE](LICENSE).
