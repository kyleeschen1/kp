import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: './', publicDir: false,
  server: { host: '127.0.0.1', port: 8012, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
  build: { outDir: 'dist', emptyOutDir: true }
});
