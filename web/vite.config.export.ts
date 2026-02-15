import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-export',
    rollupOptions: {
      input: 'export.html',
      plugins: [
        codecovRollupPlugin({
          enableBundleAnalysis: process.env.CI === 'true',
          bundleName: 'claude-chronicle-export',
          uploadToken: process.env.CODECOV_TOKEN,
          gitService: 'github',
        }),
      ],
    },
  },
});
