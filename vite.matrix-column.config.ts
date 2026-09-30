import { resolve } from "node:path";
import { defineConfig } from "vite";
import { kpViteProductionBuild, kpViteProjectRoot } from "./scripts/kp-vite-config-helpers.ts";
const root = kpViteProjectRoot(import.meta.url);
export default defineConfig({ build: kpViteProductionBuild({ outDir: "dist/matrix-column", entries: {
  matrixColumn: resolve(root, "experiments/matrix-column-product/index.html")
} }) });
