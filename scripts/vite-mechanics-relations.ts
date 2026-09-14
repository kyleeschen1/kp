import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { compileMomentumEnergyPublication, momentumEnergySourcePath } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";
import { renderMomentumEnergyReader } from "../src/tutorial/mechanics-relations/momentum-energy-reader-publication.ts";

/** Compile on request so editing the canonical Markdown is visible on reload.
 * Authoring, KaTeX and governed construction never enter the browser graph. */
export function kpViteMechanicsRelations(projectRoot: string): Plugin {
  const compile = () => compileMomentumEnergyPublication(readFileSync(resolve(projectRoot, momentumEnergySourcePath), "utf8"),
    JSON.parse(readFileSync(resolve(projectRoot, "examples/physics/momentum-energy.article.lock.json"), "utf8")));
  const directory = "experiments/mechanics-relations/";
  return { name: "kp-mechanics-relations-publication",
    transformIndexHtml: { order: "pre", handler(html, context) {
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
