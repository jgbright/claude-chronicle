import { defineConfig } from 'astro/config';

const base = process.env.DEPLOY_BASE ?? '/';

export default defineConfig({
  site: 'https://www.claudechronicle.com',
  base,
  output: 'static',
  vite: {
    define: {
      'import.meta.env.GITHUB_SHA': JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
  },
});
