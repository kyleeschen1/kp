import { resolve } from "node:path";
import { defineConfig } from "vite";
import { kpViteProductionBuild, kpViteProjectRoot, readKpReviewBuildIdentity } from "./scripts/kp-vite-config-helpers.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
// The real host is served by a dev middleware. This measures its client entry,
// not a deployable page or the server-side preparation closure.
export default defineConfig({
  define: { __KP_DEV_REVIEW_BUILD__: JSON.stringify(readKpReviewBuildIdentity(projectRoot)) },
  build: kpViteProductionBuild({ outDir: "dist/symbolic-inspection", entries: {
    symbolicInspection: resolve(projectRoot, "src/experiments/authoring-distribution-focus-card/entry.ts")
  } })
});
