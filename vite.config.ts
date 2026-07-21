import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  compileKpXPlusThreeLesson,
  compileKpXPlusThreeTeacherZeroLesson
} from "./src/reader/compiler/public-api.ts";

const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const solveXRoutePath = resolve(projectRoot, "reader/solve-x/index.html");
const solveXTeacherZeroRoutePath = resolve(
  projectRoot,
  "reader/solve-x/teacher-zero/index.html"
);
const solveXMarkdown = readFileSync(
  resolve(projectRoot, "content/lessons/solve-x.md"),
  "utf8"
);
const solveXTeacherZeroMarkdown = readFileSync(
  resolve(projectRoot, "content/lessons/solve-x-teacher-zero.md"),
  "utf8"
);
const reviewBuildIdentity = readReviewBuildIdentity();

export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(reviewBuildIdentity)
  },
  plugins: [{
    name: "kp-semantic-reader-route",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        if (context.filename === solveXRoutePath) {
          return compileKpXPlusThreeLesson(solveXMarkdown).html;
        }
        if (context.filename === solveXTeacherZeroRoutePath) {
          return compileKpXPlusThreeTeacherZeroLesson(
            solveXTeacherZeroMarkdown
          ).html;
        }
        return html;
      }
    }
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        "reader-solve-x": solveXRoutePath,
        "reader-solve-x-teacher-zero": solveXTeacherZeroRoutePath
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 8000,
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
