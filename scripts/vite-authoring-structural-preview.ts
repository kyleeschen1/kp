import type { Plugin } from "vite";
import type { buildKpAuthoredDistributionPreview } from "../src/experiments/authoring-structural/distribution-preview-build.ts";

/** One read-only local exemplar endpoint, absent from production builds. */
export function kpViteAuthoringStructuralPreview(): Plugin {
  return { name: "kp-authoring-structural-preview", apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0];
        const card = path === "/experiments/authoring-distribution-focus-card/";
        const cardData = path === "/api/dev/authoring-structural/distribution-focus-card";
        if (!card && !cardData && path !== "/api/dev/authoring-structural/distribution") return next();
        if (request.method !== "GET") { response.writeHead(405).end(); return; }
        void (async () => {
          try {
            if (card) {
              const html = await server.transformIndexHtml(request.url!, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authoring-backed fraction distribution · Kinetic Press</title></head><body><main id="distribution-card"><h1>Fraction distribution</h1><p>Preparing the authoring-backed Focus Card…</p></main><script type="module" src="/src/experiments/authoring-distribution-focus-card/entry.ts"></script></body></html>`);
              response.writeHead(200, { "content-type": "text/html", "cache-control": "no-store" }).end(html);
              return;
            }
            const module = await server.ssrLoadModule("/src/experiments/authoring-structural/distribution-preview-build.ts") as {
              buildKpAuthoredDistributionPreview: typeof buildKpAuthoredDistributionPreview;
              buildKpAuthoredDistributionFocusCardPreview: () => unknown };
            const data = cardData ? module.buildKpAuthoredDistributionFocusCardPreview() : module.buildKpAuthoredDistributionPreview();
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
