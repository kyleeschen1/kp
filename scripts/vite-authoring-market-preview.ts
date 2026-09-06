import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { kpAuthoringMarketPreviewEndpoint, kpAuthoringMarketPreviewEvent,
  type KpAuthoringMarketBuildRevision } from "../src/experiments/authoring-market/authoring-market-preview-protocol.ts";
import type { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";

export const kpAuthoringMarketLocalInputs = Object.freeze([
  "src/experiments/authoring-market/authoring-market-model-source.ts",
  "src/experiments/authoring-market/authoring-market-article-source.ts"
]);
const buildEntry = "/src/experiments/authoring-market/authoring-market-preview-build.ts";

/** Read-only, serve-only adapter for two trusted local author files. */
export function kpViteAuthoringMarketPreview(): Plugin {
  let server: ViteDevServer;
  let active = false;
  let sequence = 0;
  let current: KpAuthoringMarketBuildRevision | undefined;
  let queue: Promise<void> = Promise.resolve();
  const publish = (value: KpAuthoringMarketBuildRevision) => {
    if (value.sequence !== sequence) return;
    current = value;
    server.ws.send({ type: "custom", event: kpAuthoringMarketPreviewEvent, data: value });
  };
  const fingerprint = async () => createHash("sha256").update(JSON.stringify(await Promise.all(
    kpAuthoringMarketLocalInputs.map(path => readFile(resolve(server.config.root, path), "utf8"))
  ))).digest("hex");
  const rebuild = () => {
    const ticket = ++sequence;
    // Serial server-module evaluation avoids racing invalidation against another
    // import. Publication still checks freshness after every asynchronous step.
    queue = queue.then(async () => {
      if (ticket !== sequence) return;
      let sourceRevision = `unreadable.${ticket}`;
      try {
        sourceRevision = await fingerprint();
        const base = { schemaVersion: "kp.authoring-market-build.v1" as const,
          sequence: ticket, sourceRevision, sourcePaths: kpAuthoringMarketLocalInputs };
        publish({ ...base, status: "building" });
        for (const path of kpAuthoringMarketLocalInputs) {
          for (const module of server.moduleGraph.getModulesByFile(resolve(server.config.root, path)) ?? []) {
            server.moduleGraph.invalidateModule(module);
          }
        }
        const module = await server.ssrLoadModule(buildEntry) as { buildKpAuthoringMarketPreview: typeof buildKpAuthoringMarketPreview };
        const preview = module.buildKpAuthoringMarketPreview();
        // File events can lag a filesystem write; never publish a mixed revision.
        if (sourceRevision !== await fingerprint()) { if (ticket === sequence) void rebuild(); return; }
        publish({ ...base, status: "valid", preview: JSON.parse(JSON.stringify(preview)) });
      } catch (error) {
        publish({ schemaVersion: "kp.authoring-market-build.v1", sequence: ticket, sourceRevision,
          sourcePaths: kpAuthoringMarketLocalInputs, status: "invalid", diagnostic: {
            code: "kp.authoring.market-build-gap", message: error instanceof Error ? error.message : String(error),
            ...(typeof error === "object" && error !== null && "id" in error && typeof error.id === "string" ? { file: error.id } : {})
          } });
      }
    });
    return queue;
  };
  return {
    name: "kp-authoring-market-local-preview", apply: "serve",
    configureServer(value) {
      server = value;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== kpAuthoringMarketPreviewEndpoint) return next();
        if (request.method !== "GET") { response.writeHead(405).end(); return; }
        if (!active) { active = true; void rebuild(); }
        void (async () => {
          // Concurrent initial readers share one build; if a newer save arrives,
          // wait for that queued build rather than returning an empty response.
          for (;;) { const pending = queue; await pending; if (pending === queue) break; }
          response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
          response.end(JSON.stringify(current));
        })();
      });
    },
    closeBundle() { active = false; ++sequence; current = undefined; },
    async handleHotUpdate(context) {
      if (!kpAuthoringMarketLocalInputs.some(path => resolve(context.server.config.root, path) === context.file)) return;
      if (active) await rebuild();
      // This page applies revision data transactionally; source HMR must not
      // dispose its retained valid preview, nor execute author source in-browser.
      return [];
    }
  };
}
