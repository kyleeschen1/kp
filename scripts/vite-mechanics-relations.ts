import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { loadAuthoredRail } from "./rail-authoring-selection.ts";
import { encodeKpHtmlText } from "../src/rendering/html-output-encoding.ts";
import { compileMomentumEnergyPublication, momentumEnergySourcePath } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";
import { renderMomentumEnergyReader } from "../src/tutorial/mechanics-relations/momentum-energy-reader-publication.ts";
import { compileScalarCancellationPublication, scalarCancellationArticlePath, scalarCancellationSourcePath } from "../src/tutorial/mechanics-relations/scalar-cancellation-publication.ts";

/** Compile on request so editing the canonical Markdown is visible on reload.
 * Authoring, KaTeX and governed construction never enter the browser graph. */
export function kpViteMechanicsRelations(projectRoot: string): Plugin {
  let development = false;
  const compile = () => compileMomentumEnergyPublication(readFileSync(resolve(projectRoot, momentumEnergySourcePath), "utf8"),
    JSON.parse(readFileSync(resolve(projectRoot, "examples/physics/momentum-energy.article.lock.json"), "utf8")),
    JSON.parse(readFileSync(resolve(projectRoot, "examples/physics/momentum-energy.concepts.lock.json"), "utf8")));
  const directory = "experiments/mechanics-relations/";
  return { name: "kp-mechanics-relations-publication",
    configResolved(config) { development = config.command === "serve"; },
    transformIndexHtml: { order: "pre", handler(html, context) {
      if (context.filename === resolve(projectRoot, "experiments/authored-rails/index.html")) {
        // Production builds always use the versioned reference. A local preview
        // selection must never silently change an unrelated production build.
        const publication = loadAuthoredRail(projectRoot, development);
        if (publication.status !== "checked") throw new Error(`rail.${publication.repair.code}: ${publication.repair.message}`);
        const provenance = `<details><summary>About this authored explanation</summary><p>Source: <code>${encodeKpHtmlText(publication.sourceId)}</code></p><p>Revision: <code>${publication.sourceRevision}</code></p><p>The included derivations use checked mechanics models. The surrounding explanation is author-supplied prose, not a machine-checked proof. This is a local authoring preview.</p></details>`;
        return html.replace("<title>Authored explanation · Kinetic Press</title>", `<title>${encodeKpHtmlText(publication.title)} · Kinetic Press</title>`)
          .replace("<!-- kp:authored-rails -->", publication.html + provenance);
      }
      if (context.filename === resolve(projectRoot, directory, "force-without-work/index.html")) {
        const sourcePath = "examples/physics/force-without-work.article.md";
        // A separate Article keeps its own provenance while reusing the exact
        // checked derivations, reader projection and native runtime.
        const publication = compileMomentumEnergyPublication(readFileSync(resolve(projectRoot, sourcePath), "utf8"), undefined,
          JSON.parse(readFileSync(resolve(projectRoot, "examples/physics/momentum-energy.concepts.lock.json"), "utf8")), sourcePath);
        return html.replace("<!-- kp:momentum-energy -->", renderMomentumEnergyReader(publication).html);
      }
      if (context.filename === resolve(projectRoot, "experiments/scalar-cancellation/index.html")) {
        const publication = compileScalarCancellationPublication(readFileSync(resolve(projectRoot, scalarCancellationArticlePath), "utf8"),
          JSON.parse(readFileSync(resolve(projectRoot, scalarCancellationSourcePath), "utf8")));
        return html.replace("<!-- kp:scalar-cancellation -->", publication.html);
      }
      const interactive = context.filename === resolve(projectRoot, directory, "index.html");
      if (!interactive && context.filename !== resolve(projectRoot, directory, "static.html")) return html;
      const publication = compile();
      return html.replace("<!-- kp:momentum-energy -->", interactive ? renderMomentumEnergyReader(publication).html : publication.staticHtml.articleHtml);
    } },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0];
        if (!path?.startsWith(`/${directory}kp-static/`)) return next();
        try {
          const asset = compile().assets.get(`./${path.slice(directory.length + 1)}`);
          if (!asset) { response.statusCode = 404; response.end("Unknown physics checkpoint"); return; }
          response.setHeader("Content-Type", "image/svg+xml"); response.end(asset);
        } catch (error) { next(error); }
      });
    },
    generateBundle() {
      for (const [path, source] of compile().assets) this.emitFile({ type: "asset", fileName: directory + path.slice(2), source });
    }
  };
}
