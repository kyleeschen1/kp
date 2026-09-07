import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { bindKpCanonicalTaxInstruction } from "../src/experiments/kinetic-figure-supply-tax/canonical-tax-instruction.ts";
import { prepareKpAuthoredMarketSource } from "../src/tutorial/authoring-market/authoring-market-prepare.ts";
import { renderKpAuthoringMarketStaticFacts } from "../src/tutorial/authoring-market/authoring-market-facts.ts";
import { compileKpArticleMarkdownFragmentHtml } from "../src/article/kp-article-static-html.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { compileKpLogExponentFocusCardArticle } from "../src/tutorial/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-article.ts";
import { createKpLogExponentFocusCardScore } from "../src/tutorial/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-model.ts";
import { compileKpTypeScriptFreeShippingPublicLesson } from "../src/public-web/typescript-free-shipping-publication.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from "../src/public-web/typescript-free-shipping-runtime.ts";
import { createKpTypeScriptFocusCardScore } from "../src/tutorial/kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card-model.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";

const output = new URL("../src/tutorial/kinetic-figure-supply-tax/canonical-tax-source.generated.json", import.meta.url);
const staticOutput = new URL("../src/tutorial/kinetic-figure-supply-tax/canonical-tax-static.generated.html", import.meta.url);
const logOutput = new URL("../src/tutorial/kinetic-figure-log-exponent-focus-card/log-exponent-instruction.generated.json", import.meta.url);
const codeOutput = new URL("../src/tutorial/kinetic-figure-typescript-focus-card/typescript-instruction.generated.json", import.meta.url);
const surfaceOutput = new URL("../src/tutorial/kinetic-figure-surface-contour/surface-contour-prose.generated.json", import.meta.url);

export function compileKpCanonicalSurfaceProse() {
  const score = createKpSurfaceContourScore(createKpSurfaceContourModel());
  return Object.fromEntries(score.beats.map(beat => [beat.id, compileKpArticleMarkdownFragmentHtml(beat.passage)]));
}

export function compileKpCanonicalTypeScriptInstruction() {
  const lesson = compileKpTypeScriptFreeShippingPublicLesson({
    text: readFileSync(new URL("../content/lessons/typescript-free-shipping.kp.md", import.meta.url), "utf8"),
    lock: JSON.parse(readFileSync(new URL("../content/lessons/typescript-free-shipping.kp.lock.json", import.meta.url), "utf8"))
  });
  const score = createKpTypeScriptFocusCardScore({ article: lesson.article.document,
    score: createKpTypeScriptFreeShippingRuntimeProjection().score });
  return { score, phraseHtml: Object.fromEntries(score.beats.map(beat =>
    [beat.id, compileKpArticleMarkdownFragmentHtml(beat.label)])) };
}

export function compileKpCanonicalLogInstruction() {
  const compiled = compileKpLogExponentFocusCardArticle({
    text: readFileSync(new URL("../content/lessons/algebra-log-exponent-focus-card.kp.md", import.meta.url), "utf8"),
    lock: JSON.parse(readFileSync(new URL("../content/lessons/algebra-log-exponent-focus-card.kp.lock.json", import.meta.url), "utf8"))
  });
  const score = createKpLogExponentFocusCardScore(compiled.document);
  return { score, phraseHtml: Object.fromEntries(score.beats.map(beat =>
    [beat.id, compileKpArticleMarkdownFragmentHtml(beat.label)])) };
}

/** Reading fallback only: reuse bound prose and facts, never invent static geometry. */
export function compileKpCanonicalTaxStaticReading(artifact = compileKpCanonicalTaxSource()): string {
  const prepared = prepareKpAuthoredMarketSource(artifact.data, artifact.article);
  const prose = prepared.companion.scrollScore.phrases.map(phrase =>
    `<section data-kp-canonical-tax-static-phrase>${compileKpArticleMarkdownFragmentHtml(phrase.label)}</section>`).join("\n");
  return `<article data-kp-canonical-tax-static data-kp-canonical-tax-source-revision="${artifact.sourceRevision}"><h1>Supply tax</h1>\n${prose}\n${renderKpAuthoringMarketStaticFacts(prepared.facts)}</article>\n`;
}

/** Trusted local author code runs in the build, never through a reader service. */
export function compileKpCanonicalTaxSource() {
  // Publishing the reference must not follow an author's temporary preview selection.
  const bound = bindKpCanonicalTaxInstruction(buildKpAuthoringMarketPreview("reference"),
    readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.md", import.meta.url), "utf8"));
  // A portable source identity is not a filesystem locator. Compiler provenance
  // remains with the canonical source/build rather than leaking into the reader.
  const sourceId = "article.economics.supply-tax.reference";
  const data = { ...bound, article: { ...bound.article, sourceId, authoredSourcePath: sourceId } };
  const prepared = prepareKpAuthoringMarketPreview(data);
  const article = { document: prepared.companion.compiled.document, phraseHtml: prepared.companion.phraseHtml };
  return {
    schemaVersion: "kp.canonical-tax-source.v2" as const,
    sourceRevision: createHash("sha256").update(JSON.stringify({ data, article })).digest("hex"),
    data, article
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const artifact = compileKpCanonicalTaxSource();
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  const staticReading = compileKpCanonicalTaxStaticReading(artifact);
  const logInstruction = `${JSON.stringify(compileKpCanonicalLogInstruction(), null, 2)}\n`;
  const codeInstruction = `${JSON.stringify(compileKpCanonicalTypeScriptInstruction(), null, 2)}\n`;
  const surfaceProse = `${JSON.stringify(compileKpCanonicalSurfaceProse(), null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== serialized || readFileSync(staticOutput, "utf8") !== staticReading || readFileSync(logOutput, "utf8") !== logInstruction || readFileSync(codeOutput, "utf8") !== codeInstruction || readFileSync(surfaceOutput, "utf8") !== surfaceProse) {
      throw new Error("Canonical tax source is stale. Run npm run compile:canonical-tax-source and review its diff.");
    }
    console.log("Canonical tax source is current (data-only reference revision).");
  } else {
    writeFileSync(output, serialized);
    writeFileSync(staticOutput, staticReading);
    writeFileSync(logOutput, logInstruction);
    writeFileSync(codeOutput, codeInstruction);
    writeFileSync(surfaceOutput, surfaceProse);
    console.log("Compiled canonical tax source (data-only reference revision).");
  }
}
