import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

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
  plugins: [{
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
  }],
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
