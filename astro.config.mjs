import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dreamyunit204.github.io',
  base: '/dreamy-draw-weekly/',
  output: 'static',
  build: {
    format: 'directory',
  },
});
