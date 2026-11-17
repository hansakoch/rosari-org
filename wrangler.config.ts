/**
 * Wrangler build settings for cf (assets live here, not in cloudflare.config.ts).
 * @see https://developers.cloudflare.com/cf/wrangler/reference/
 */
export default {
  assetsDirectory: './dist',
  types: { generate: false },
};
