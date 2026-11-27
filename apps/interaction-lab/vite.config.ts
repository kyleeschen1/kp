import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root, base: './', publicDir: false,
  server: { host: '127.0.0.1', port: 8011, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
  build: { outDir: 'dist', emptyOutDir: true }
});
