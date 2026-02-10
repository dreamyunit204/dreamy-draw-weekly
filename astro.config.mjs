import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dreamyunit204.github.io',
  base: '/dreamy-draw-weekly/',
  output: 'static',
  markdown: {
    // Security hardening: ensure raw HTML in markdown is not rendered.
    remarkRehype: {
      allowDangerousHtml: false,
    },
  },
  build: {
    format: 'directory',
  },
});
