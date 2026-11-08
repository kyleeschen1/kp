import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { kpViteProductionBuild, kpViteProjectRoot } from '../../scripts/kp-vite-config-helpers.ts';
export default defineConfig({ build: kpViteProductionBuild({ outDir: 'dist/discourse-scrolltelling', entries: {
  discourse: resolve(kpViteProjectRoot(new URL("../../", import.meta.url).href), 'experiments/discourse-scrolltelling/index.html'),
} }) });
