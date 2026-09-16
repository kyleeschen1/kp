import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { codeReasoningArticlePath, compileCodeReasoningPublication } from "../src/tutorial/code-reasoning/publication.ts";
import { centroidPaths, compileCentroidPublication } from "./centroid-publication.ts";

export function kpViteCodeReasoning(projectRoot: string): Plugin {
  const read = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");
  const publications = new Map([
    [resolve(projectRoot, "experiments/code-reasoning/index.html"), {
      marker: "<!-- kp:code-reasoning -->", compile: () => compileCodeReasoningPublication(read(codeReasoningArticlePath)).html
    }],
    [resolve(projectRoot, "experiments/centroid-reasoning/index.html"), {
      marker: "<!-- kp:centroid-reasoning -->", compile: () => compileCentroidPublication(read(centroidPaths.article), read(centroidPaths.before), read(centroidPaths.after)).html
    }]
  ]);
  return { name: "kp-code-reasoning-publication", transformIndexHtml: { order: "pre", handler(html, context) {
    const publication = publications.get(context.filename);
    return publication ? html.replace(publication.marker, publication.compile()) : html;
  } } };
}
