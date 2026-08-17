import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const routeFilename = resolve(projectRoot, "studio/index.html");
const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";

/** Internal Studio compiles independently from public lessons and legacy routes. */
export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(readReviewBuildIdentity())
  },
  plugins: [
    svelte(),
    {
      name: "kp-internal-studio-scoped-root",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === undefined ||
              new URL(request.url, "http://127.0.0.1").pathname !== "/") {
            next();
            return;
          }
          response.statusCode = 307;
          response.setHeader("location", "/studio/");
          response.end();
        });
      }
    },
    {
      name: "kp-internal-studio-live-review-build",
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
    outDir: "dist/internal-studio",
    emptyOutDir: true,
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { internalStudio: routeFilename }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4191,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] },
    proxy: {
      "/api": { changeOrigin: true, target: apiTarget }
    }
  }
});

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
