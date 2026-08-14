import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import { renderKpEigenvectorPublicLesson } from
  "./src/public-web/eigenvector-attentional-surface-publication.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const routeFilename = resolve(projectRoot, "learn/math/eigenvectors/index.html");

/** Keep the attentional exemplar independent from the catalogue runtime. */
export default defineConfig({
  plugins: [
    {
      name: "kp-public-eigenvectors-scoped-root",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === undefined ||
              new URL(request.url, "http://127.0.0.1").pathname !== "/") {
            next();
            return;
          }
          response.statusCode = 307;
          response.setHeader("location", "/learn/math/eigenvectors/");
          response.end();
        });
      }
    },
    {
      name: "kp-public-eigenvectors-static-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === routeFilename
            ? html.replace(
                "<!-- kp:eigenvector-attentional-surface-publication -->",
                renderKpEigenvectorPublicLesson()
              )
            : html;
        }
      }
    }
  ],
  build: {
    outDir: "dist/public-eigenvectors",
    emptyOutDir: true,
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { publicEigenvectors: routeFilename }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4195,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] }
  }
});
