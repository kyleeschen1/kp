import type { Plugin } from "vite";
import type { buildKpAuthoredDistributionPreview } from "../src/experiments/authoring-structural/distribution-preview-build.ts";

/** One read-only local exemplar endpoint, absent from production builds. */
export function kpViteAuthoringStructuralPreview(): Plugin {
  return { name: "kp-authoring-structural-preview", apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/api/dev/authoring-structural/distribution") return next();
        if (request.method !== "GET") { response.writeHead(405).end(); return; }
        void (async () => {
          try {
            const module = await server.ssrLoadModule("/src/experiments/authoring-structural/distribution-preview-build.ts") as {
              buildKpAuthoredDistributionPreview: typeof buildKpAuthoredDistributionPreview };
            const data = module.buildKpAuthoredDistributionPreview();
            response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
            response.end(JSON.stringify(data));
          } catch (error) {
            response.writeHead(422, { "content-type": "application/json", "cache-control": "no-store" });
            response.end(JSON.stringify({ status: "repair-gap", code: "kp.authoring.structural-preview-build-gap",
              message: error instanceof Error ? error.message : String(error) }));
          }
        })();
      });
    }
  };
}
