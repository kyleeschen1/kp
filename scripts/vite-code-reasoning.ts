import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { codeReasoningArticlePath, compileCodeReasoningPublication } from "../src/tutorial/code-reasoning/publication.ts";

export function kpViteCodeReasoning(projectRoot: string): Plugin {
  return { name: "kp-code-reasoning-publication", transformIndexHtml: { order: "pre", handler(html, context) {
    if (context.filename !== resolve(projectRoot, "experiments/code-reasoning/index.html")) return html;
    return html.replace("<!-- kp:code-reasoning -->", compileCodeReasoningPublication(
      readFileSync(resolve(projectRoot, codeReasoningArticlePath), "utf8")
    ).html);
  } } };
}
