import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { compileChangeSource } from "../src/tutorial/change-propagation/model.ts";
import { renderChangePublication } from "../src/tutorial/change-propagation/view.ts";
import { encodeKpHtmlText } from "../src/rendering/html-output-encoding.ts";

export function kpViteChangePropagation(projectRoot: string): Plugin {
  return { name: "kp-change-propagation", transformIndexHtml: { order: "pre", handler(html, context) {
    if (context.filename !== resolve(projectRoot, "experiments/change-propagation/index.html")) return html;
    const bytes = readFileSync(resolve(projectRoot, "examples/calculus/change-propagation.json"), "utf8");
    const result = compileChangeSource(bytes);
    if (result.status !== "checked") throw new Error(`change-propagation.${result.path}: ${result.message}`);
    return html.replace("<!-- kp:change-propagation -->", renderChangePublication(result.model, bytes))
      .replace("<title>Change propagation</title>", `<title>${encodeKpHtmlText(result.model.source.title)} · Kinetic Press</title>`);
  } } };
}
