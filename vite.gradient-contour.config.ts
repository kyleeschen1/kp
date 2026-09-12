import { resolve } from "node:path";
import { defineConfig } from "vite";
import { kpProductionDevelopmentErasurePlugin } from "./scripts/vite-production-development-erasure.ts";
import { kpViteProductionBuild, kpViteProjectRoot, readKpReviewBuildIdentity } from "./scripts/kp-vite-config-helpers.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
// The opt-in host is absent from the public production entry list. Compile its
// real entry independently; this config does not start or replace a server.
export default defineConfig({
  define: { __KP_DEV_REVIEW_BUILD__: JSON.stringify(readKpReviewBuildIdentity(projectRoot)) },
  plugins: [kpProductionDevelopmentErasurePlugin({ projectRoot })],
  build: kpViteProductionBuild({ outDir: "dist/gradient-contour", entries: {
    gradientContour: resolve(projectRoot, "experiments/kinetic-figure/gradient-contour/index.html")
  } })
});
