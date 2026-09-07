import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { bindKpCanonicalTaxInstruction } from "../src/experiments/kinetic-figure-supply-tax/canonical-tax-instruction.ts";
import { prepareKpAuthoredMarketSource } from "../src/experiments/authoring-market/authoring-market-prepare.ts";
import { renderKpAuthoringMarketStaticFacts } from "../src/experiments/authoring-market/authoring-market-facts.ts";
import { compileKpArticleMarkdownFragmentHtml } from "../src/article/kp-article-static-html.ts";

const output = new URL("../src/experiments/kinetic-figure-supply-tax/canonical-tax-source.generated.json", import.meta.url);
const staticOutput = new URL("../src/experiments/kinetic-figure-supply-tax/canonical-tax-static.generated.html", import.meta.url);

/** Reading fallback only: reuse bound prose and facts, never invent static geometry. */
export function compileKpCanonicalTaxStaticReading(artifact = compileKpCanonicalTaxSource()): string {
  const prepared = prepareKpAuthoredMarketSource(artifact.data);
  const prose = prepared.companion.scrollScore.phrases.map(phrase =>
    `<section data-kp-canonical-tax-static-phrase>${compileKpArticleMarkdownFragmentHtml(phrase.label)}</section>`).join("\n");
  return `<article data-kp-canonical-tax-static data-kp-canonical-tax-source-revision="${artifact.sourceRevision}"><h1>Supply tax</h1>\n${prose}\n${renderKpAuthoringMarketStaticFacts(prepared.facts)}</article>\n`;
}

/** Trusted local author code runs in the build, never through a reader service. */
export function compileKpCanonicalTaxSource() {
  // Publishing the reference must not follow an author's temporary preview selection.
  const data = bindKpCanonicalTaxInstruction(buildKpAuthoringMarketPreview("reference"),
    readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.md", import.meta.url), "utf8"));
  return {
    schemaVersion: "kp.canonical-tax-source.v1" as const,
    sourceRevision: createHash("sha256").update(JSON.stringify(data)).digest("hex"),
    data
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const artifact = compileKpCanonicalTaxSource();
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  const staticReading = compileKpCanonicalTaxStaticReading(artifact);
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== serialized || readFileSync(staticOutput, "utf8") !== staticReading) {
      throw new Error("Canonical tax source is stale. Run npm run compile:canonical-tax-source and review its diff.");
    }
    console.log("Canonical tax source is current (data-only reference revision).");
  } else {
    writeFileSync(output, serialized);
    writeFileSync(staticOutput, staticReading);
    console.log("Compiled canonical tax source (data-only reference revision).");
  }
}
