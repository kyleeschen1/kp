import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import type { KpArticleImportLock } from
  "./src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionPublicLesson,
  renderKpFractionCompositionPublicLesson
} from "./src/public-web/fraction-composition-publication.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
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
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(readReviewBuildIdentity())
  },
  plugins: [
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
    {
      name: "kp-public-fraction-composition-live-review-build",
      configureServer(server) {
        server.middlewares.use("/__kp/dev-review/build", (_request, response) => {
          response.setHeader("content-type", "application/json");
          response.setHeader("cache-control", "no-store");
          response.end(JSON.stringify(readReviewBuildIdentity()));
        });
      }
    }
  ],
  build: {
    outDir: "dist/public-fraction-composition",
    emptyOutDir: true,
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { publicFractionComposition: routeFilename }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4193,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] },
    proxy: {
      "/api": { changeOrigin: true, target: apiTarget }
    }
  }
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

function readReviewBuildIdentity(): {
  commit: string;
  fingerprint: string;
  dirty: boolean;
} {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
    const dirty = execFileSync(
      "git",
      ["status", "--porcelain", "--untracked-files=no"],
      { cwd: projectRoot, encoding: "utf8" }
    ).trim().length > 0;
    return {
      commit,
      fingerprint: dirty ? `${commit}-dirty` : commit,
      dirty
    };
  } catch {
    return { commit: "unknown", fingerprint: "dev-unknown", dirty: true };
  }
}
