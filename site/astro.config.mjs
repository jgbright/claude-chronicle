import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jgbright.github.io',
  base: '/claude-chronicle/',
  output: 'static',
  vite: {
    define: {
      'import.meta.env.GITHUB_SHA': JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
  },
});
