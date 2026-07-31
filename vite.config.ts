import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  kpReaderRouteEntryName,
  kpReaderRouteHtmlPath
} from "./src/reader/compiler/reader-route-descriptor.ts";
import { kpReaderRouteManifest } from "./src/reader/compiler/reader-route-manifest.ts";
import {
  compactKpCompiledReaderHtml
} from "./src/reader/compiler/compiled-reader-html.ts";

const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const readerBuildRoutes = kpReaderRouteManifest.map((descriptor) => ({
  descriptor,
  filename: resolve(projectRoot, kpReaderRouteHtmlPath(descriptor.route)),
  markdown: readFileSync(resolve(projectRoot, descriptor.sourcePath), "utf8")
}));
const readerBuildRouteByFilename = new Map(
  readerBuildRoutes.map((route) => [route.filename, route] as const)
);
const reviewBuildIdentity = readReviewBuildIdentity();

export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(reviewBuildIdentity)
  },
  plugins: [
    {
      name: "kp-live-dev-review-build",
      configureServer(server) {
        server.middlewares.use(
          "/__kp/dev-review/build",
          (_request, response) => {
            // The config-time define becomes stale across commits while the
            // dev server stays open. Review evidence asks this read-only
            // endpoint for the current worktree identity at capture time.
            response.setHeader("content-type", "application/json");
            response.setHeader("cache-control", "no-store");
            response.end(JSON.stringify(readReviewBuildIdentity()));
          }
        );
      }
    },
    {
      name: "kp-semantic-reader-route",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          const route = readerBuildRouteByFilename.get(context.filename);
          return route === undefined
            ? html
            : route.descriptor.compile(route.markdown).html;
        }
      }
    },
    {
      name: "kp-reader-html-compaction",
      transformIndexHtml: {
        order: "post",
        handler(html, context) {
          return readerBuildRouteByFilename.has(context.filename)
            ? compactKpCompiledReaderHtml(html)
            : html;
        }
      }
    }
  ],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        glyphReconciliationExperiment: resolve(projectRoot, "glyph-reconciliation-experiment.html"),
        canonicalAnimationReview: resolve(projectRoot, "canonical-animation-review.html"),
        ...Object.fromEntries(readerBuildRoutes.map(({ descriptor, filename }) => [
          kpReaderRouteEntryName(descriptor.route),
          filename
        ]))
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 8000,
    watch: {
      // Browser checks write traces and screenshots here. Watching that
      // scratch tree used to broadcast unrelated full-page reloads into the
      // long-lived review webview and could strand its shared iframe host.
      ignored: ["**/tmp/codex/**"]
    },
    proxy: {
      "/api": {
        changeOrigin: true,
        target: apiTarget
      }
    },
    strictPort: true
  }
});

function readReviewBuildIdentity(): { commit: string; fingerprint: string; dirty: boolean } {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim().length > 0;
    return {
      commit,
      fingerprint: dirty ? `${commit}-dirty` : commit,
      dirty
    };
  } catch {
    return { commit: "unknown", fingerprint: "dev-unknown", dirty: true };
  }
}
