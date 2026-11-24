import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { kpViteProductionBuild, kpViteProjectRoot } from '../../scripts/kp-vite-config-helpers.ts';
const root = kpViteProjectRoot(new URL('../../', import.meta.url).href);
export default defineConfig({ base: './', build: kpViteProductionBuild({ outDir: 'dist/notebook', entries: {
  notebook: resolve(root, 'experiments/notebook/index.html'),
  notebookReader: resolve(root, 'experiments/notebook/reader.html')
} }) });
