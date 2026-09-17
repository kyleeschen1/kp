import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { compileFractionChainPublication } from "../src/tutorial/fraction-chain/publication.ts";

export function kpViteFractionChain(projectRoot: string): Plugin {
  return { name: "kp-fraction-chain-publication", transformIndexHtml: { order: "pre", handler(html, context) {
    if (context.filename !== resolve(projectRoot, "experiments/fraction-chain/index.html")) return html;
    return html.replace("<!-- kp:fraction-chain -->", compileFractionChainPublication(
      readFileSync(resolve(projectRoot, "examples/algebra/fraction-chain.article.md"), "utf8"),
      JSON.parse(readFileSync(resolve(projectRoot, "examples/algebra/fraction-chain.json"), "utf8"))));
  } } };
}
