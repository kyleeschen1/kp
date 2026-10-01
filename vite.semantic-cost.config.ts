import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { kpViteProductionBuild, kpViteProjectRoot } from './scripts/kp-vite-config-helpers.ts';
import { semanticCostInventory } from './scripts/semantic-cost-inventory.ts';
const root = kpViteProjectRoot(import.meta.url);
export default defineConfig({ base: '/cost/', plugins: [semanticCostInventory()], build: kpViteProductionBuild({
  outDir: 'dist/semantic-cost', entries: { cost: resolve(root, 'experiments/semantic-cost/index.html') },
}) });
