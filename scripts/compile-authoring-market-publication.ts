import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";
import { readKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { compileKpAuthoredTaxSource } from "./compile-canonical-tax-source.ts";

/** A selected data source uses the existing publication envelope and tax payload. */
export function compileKpAuthoringMarketPublication(input: { readonly sourceText: string; readonly sourcePath: string }) {
  const branch = readKpAuthoringMarketSourceBranch(JSON.parse(input.sourceText));
  const tax = compileKpAuthoredTaxSource(branch.data);
  const payload = { parentSourceRevision: branch.parentSourceRevision, tax };
  const html = Object.values(tax.article.phraseHtml).join("\n");
  const mathSources = [...html.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)]
    .map(match => match[1]!.replaceAll("&lt;", "<").replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&"));
  const katexPackage = JSON.parse(readFileSync(new URL("../node_modules/katex/package.json", import.meta.url), "utf8"));
  return createKpCompiledPublicationArtifact({
    artifactId: `publication.authoring-market.${branch.name}`,
    source: { path: basename(input.sourcePath), sha256: digest(input.sourceText) },
    compiler: { id: "kp.authoring-market-publication", version: "1" },
    math: { engine: "katex", engineVersion: katexPackage.version, rendering: "build-time",
      output: "htmlAndMathml", trust: false, fragmentCount: mathSources.length,
      sourceLatex: [...new Set(mathSources)].sort() },
    payloadSha256: digest(JSON.stringify(payload)), payload
  });
}

function digest(text: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}
