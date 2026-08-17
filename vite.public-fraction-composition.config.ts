import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  kpProductionDevelopmentErasurePlugin
} from "./scripts/vite-production-development-erasure.ts";
import {
  kpViteDevelopmentServer,
  kpViteLiveReviewBuildPlugin,
  kpViteProductionBuild,
  kpViteProjectRoot,
  readKpReviewBuildIdentity
} from "./scripts/kp-vite-config-helpers.ts";

import type { KpArticleImportLock } from
  "./src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionPublicLesson,
  renderKpFractionCompositionPublicLesson
} from "./src/public-web/fraction-composition-publication.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const routeFilename = resolve(
  projectRoot,
  "learn/math/fraction-composition/index.html"
);

/**
 * The symbolic product spike has a route-only build so its costs are not
 * hidden inside the catalogue, economics, Svelte, or unrelated reader graph.
 */
export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(
      readKpReviewBuildIdentity(projectRoot)
    )
  },
  plugins: [
    kpProductionDevelopmentErasurePlugin({ projectRoot }),
    {
      name: "kp-public-fraction-composition-static-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === routeFilename
            ? html.replace(
                "<!-- kp:fraction-composition-publication -->",
                compilePublication()
              )
            : html;
        }
      }
    },
    kpViteLiveReviewBuildPlugin({
      name: "kp-public-fraction-composition-live-review-build",
      projectRoot
    })
  ],
  build: kpViteProductionBuild({
    outDir: "dist/public-fraction-composition",
    entries: { publicFractionComposition: routeFilename }
  }),
  server: kpViteDevelopmentServer({
    port: 4193,
    apiTarget
  })
});

function compilePublication(): string {
  const text = readFileSync(resolve(
    projectRoot,
    "content/lessons/algebra-fraction-composition.kp.md"
  ), "utf8");
  const lock = JSON.parse(readFileSync(resolve(
    projectRoot,
    "content/lessons/algebra-fraction-composition.kp.lock.json"
  ), "utf8")) as KpArticleImportLock;
  return renderKpFractionCompositionPublicLesson(
    compileKpFractionCompositionPublicLesson({ text, lock })
  );
}
