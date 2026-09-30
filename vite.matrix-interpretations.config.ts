import { resolve } from "node:path";
import { defineConfig } from "vite";
import { kpViteProductionBuild, kpViteProjectRoot } from "./scripts/kp-vite-config-helpers.ts";
const root = kpViteProjectRoot(import.meta.url);
export default defineConfig({ build: kpViteProductionBuild({ outDir: "dist/matrix-interpretations", entries: {
  matrixInterpretations: resolve(root, "experiments/matrix-column-combinations/index.html")
} }) });
