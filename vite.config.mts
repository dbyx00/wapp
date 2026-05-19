import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/web/lib'),
      'src/web': resolve(__dirname, 'src/web'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/icons': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
