import { resolve } from "node:path";

import { defineConfig } from "vite";

import {
  kpProductionDevelopmentErasurePlugin
} from "./scripts/vite-production-development-erasure.ts";
import {
  kpViteDevelopmentServer,
  kpViteProductionBuild,
  kpViteProjectRoot,
  kpViteScopedRootRedirectPlugin
} from "./scripts/kp-vite-config-helpers.ts";

import { renderKpEigenvectorPublicLesson } from
  "./src/public-web/eigenvector-attentional-surface-publication.ts";

const projectRoot = kpViteProjectRoot(import.meta.url);
const routeFilename = resolve(projectRoot, "learn/math/eigenvectors/index.html");

/** Keep the attentional exemplar independent from the catalogue runtime. */
export default defineConfig({
  plugins: [
    kpProductionDevelopmentErasurePlugin({ projectRoot }),
    kpViteScopedRootRedirectPlugin({
      name: "kp-public-eigenvectors-scoped-root",
      pathname: "/learn/math/eigenvectors/"
    }),
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
  build: kpViteProductionBuild({
    outDir: "dist/public-eigenvectors",
    entries: { publicEigenvectors: routeFilename }
  }),
  server: kpViteDevelopmentServer({ port: 4195 })
});
