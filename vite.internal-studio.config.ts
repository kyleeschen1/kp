import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

import {
  kpProductionDevelopmentErasurePlugin
} from "./scripts/vite-production-development-erasure.ts";
import {
  kpViteDevelopmentServer,
  kpViteLiveReviewBuildPlugin,
  kpViteProductionBuild,
  kpViteProjectRoot,
  kpViteScopedRootRedirectPlugin,
  readKpReviewBuildIdentity
} from "./scripts/kp-vite-config-helpers.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
const routeFilename = resolve(projectRoot, "studio/index.html");
const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";

/** Internal Studio compiles independently from public lessons and legacy routes. */
export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(
      readKpReviewBuildIdentity(projectRoot)
    )
  },
  plugins: [
    kpProductionDevelopmentErasurePlugin({ projectRoot }),
    svelte(),
    kpViteScopedRootRedirectPlugin({
      name: "kp-internal-studio-scoped-root",
      pathname: "/studio/"
    }),
    kpViteLiveReviewBuildPlugin({
      name: "kp-internal-studio-live-review-build",
      projectRoot
    })
  ],
  build: kpViteProductionBuild({
    outDir: "dist/internal-studio",
    entries: { internalStudio: routeFilename }
  }),
  server: kpViteDevelopmentServer({
    port: 4191,
    apiTarget
  })
});
