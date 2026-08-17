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
  compileKpTypeScriptFreeShippingPublicLesson,
  renderKpTypeScriptFreeShippingPublicLesson
} from "./src/public-web/typescript-free-shipping-publication.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const routeFilename = resolve(
  projectRoot,
  "learn/code/free-shipping/index.html"
);

/**
 * The public TypeScript proof deliberately has its own build graph. Loading the
 * all-route config here would eagerly compile unrelated economics, algebra,
 * Scheme, Lisp, Svelte, and reader publications before Rollup sees this page.
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
      name: "kp-public-typescript-static-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === routeFilename
            ? html.replace(
                "<!-- kp:typescript-free-shipping-publication -->",
                compilePublication()
              )
            : html;
        }
      }
    },
    kpViteLiveReviewBuildPlugin({
      name: "kp-public-typescript-live-review-build",
      projectRoot
    })
  ],
  build: kpViteProductionBuild({
    outDir: "dist/public-typescript",
    entries: {
      publicTypeScriptFreeShipping: routeFilename
    }
  }),
  server: kpViteDevelopmentServer({
    port: 4192,
    apiTarget
  })
});

function compilePublication(): string {
  const text = readFileSync(resolve(
    projectRoot,
    "content/lessons/typescript-free-shipping.kp.md"
  ), "utf8");
  const lock = JSON.parse(readFileSync(resolve(
    projectRoot,
    "content/lessons/typescript-free-shipping.kp.lock.json"
  ), "utf8")) as KpArticleImportLock;
  return renderKpTypeScriptFreeShippingPublicLesson(
    compileKpTypeScriptFreeShippingPublicLesson({ text, lock })
  );
}
