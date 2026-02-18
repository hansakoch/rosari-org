import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: false,
    },
  },
});
