import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  kpProductionDevelopmentErasurePlugin
} from "./scripts/vite-production-development-erasure.ts";

import type { KpArticleImportLock } from
  "./src/article/kp-article-import-lock.ts";
import {
  compileKpNormalMatrixProofPublicLesson,
  renderKpNormalMatrixProofReviewIndex,
  renderKpNormalMatrixProofPublicLesson
} from "./src/public-web/normal-matrix-proof-publication.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const routeFilename = resolve(
  projectRoot,
  "learn/math/normal-matrices/index.html"
);
const reviewRouteFilename = resolve(
  projectRoot,
  "learn/math/normal-matrices/review/index.html"
);

/** Keep this proof experiment attributable outside the catalogue bundle. */
export default defineConfig({
  plugins: [
    kpProductionDevelopmentErasurePlugin({ projectRoot }),
    {
      name: "kp-public-normal-matrices-scoped-root",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === undefined ||
              new URL(request.url, "http://127.0.0.1").pathname !== "/") {
            next();
            return;
          }
          // This server intentionally excludes the catalogue's Svelte
          // compiler; keep its root inside the proof projection boundary.
          response.statusCode = 307;
          response.setHeader("location", "/learn/math/normal-matrices/");
          response.end();
        });
      }
    },
    {
      name: "kp-public-normal-matrices-static-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          if (context.filename === routeFilename) {
            return html.replace(
              "<!-- kp:normal-matrix-proof-publication -->",
              compilePublication()
            );
          }
          if (context.filename === reviewRouteFilename) {
            return html.replace(
              "<!-- kp:normal-matrix-proof-review -->",
              renderKpNormalMatrixProofReviewIndex()
            );
          }
          return html;
        }
      }
    }
  ],
  build: {
    outDir: "dist/public-normal-matrices",
    emptyOutDir: true,
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        publicNormalMatrices: routeFilename,
        publicNormalMatricesReview: reviewRouteFilename
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4194,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] }
  }
});

function compilePublication(): string {
  const text = readFileSync(resolve(
    projectRoot,
    "content/lessons/linear-algebra-normal-matrices.kp.md"
  ), "utf8");
  const lock = JSON.parse(readFileSync(resolve(
    projectRoot,
    "content/lessons/linear-algebra-normal-matrices.kp.lock.json"
  ), "utf8")) as KpArticleImportLock;
  return renderKpNormalMatrixProofPublicLesson(
    compileKpNormalMatrixProofPublicLesson({ text, lock })
  );
}
