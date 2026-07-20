import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import { compileKpXPlusThreeLesson } from "./src/reader/compiler/public-api.ts";

const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const solveXRoutePath = resolve(projectRoot, "reader/solve-x/index.html");
const solveXMarkdown = readFileSync(
  resolve(projectRoot, "content/lessons/solve-x.md"),
  "utf8"
);

export default defineConfig({
  plugins: [{
    name: "kp-semantic-reader-route",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        if (context.filename !== solveXRoutePath) return html;
        return compileKpXPlusThreeLesson(solveXMarkdown).html;
      }
    }
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        "reader-solve-x": solveXRoutePath
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
