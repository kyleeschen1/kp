import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  kpProductionDevelopmentErasurePlugin
} from "./scripts/vite-production-development-erasure.ts";

import type { KpArticleImportLock } from
  "./src/article/kp-article-import-lock.ts";
import {
  compileKpTypeScriptFreeShippingPublicLesson,
  renderKpTypeScriptFreeShippingPublicLesson
} from "./src/public-web/typescript-free-shipping-publication.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
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
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(readReviewBuildIdentity())
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
    {
      name: "kp-public-typescript-live-review-build",
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
    outDir: "dist/public-typescript",
    emptyOutDir: true,
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        publicTypeScriptFreeShipping: routeFilename
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4192,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] },
    proxy: {
      "/api": {
        changeOrigin: true,
        target: apiTarget
      }
    }
  }
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
