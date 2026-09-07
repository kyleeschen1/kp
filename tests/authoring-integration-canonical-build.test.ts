import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { compileKpCanonicalTaxSource, compileKpCanonicalTaxStaticReading, compileKpCanonicalLogInstruction,
  compileKpCanonicalTypeScriptInstruction, compileKpCanonicalSurfaceProse } from "../scripts/compile-canonical-tax-source.ts";
import { prepareKpAuthoredMarketSource } from "../src/tutorial/authoring-market/authoring-market-prepare.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";

test("canonical build is deterministic data and restores through the shared source preparer", () => {
  const artifact = compileKpCanonicalTaxSource();
  assert.deepEqual(compileKpCanonicalTaxSource(), artifact);
  assert.deepEqual(JSON.parse(readFileSync(new URL("../src/tutorial/kinetic-figure-supply-tax/canonical-tax-source.generated.json", import.meta.url), "utf8")), artifact);
  assert.equal(artifact.data.specimen.id, "specimen.market.reference");
  const prepared = prepareKpAuthoredMarketSource(JSON.parse(JSON.stringify(artifact.data)), JSON.parse(JSON.stringify(artifact.article)));
  assert.equal(prepared.boundArticle.modelRevisionId, prepared.authored.source.authority.revisionId);
  assert.equal(prepared.facts.text("after.revenue"), "12");
  const preview = prepareKpAuthoringMarketPreview(artifact.data);
  assert.deepEqual(preview.companion.scrollScore, prepared.companion.scrollScore);
  assert.deepEqual(preview.companion.phraseHtml, prepared.companion.phraseHtml);
});

test("ordinary build checks freshness without a Vite SSR or preview-service boundary", () => {
  const source = readFileSync(new URL("../scripts/compile-canonical-tax-source.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ssrLoadModule|fetch\(|configureServer|ViteDevServer/);
  const prepare = readFileSync(new URL("../src/tutorial/authoring-market/authoring-market-prepare.ts", import.meta.url), "utf8");
  assert.doesNotMatch(prepare, /fetch\(|import\.meta\.hot|RevisionReceiver|(?<![\w.])document\./);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts["build:bundle"], /check:canonical-tax-source/);
});

test("static reading is generated from the same bound prose and exact facts without asset substitutes", () => {
  const artifact = compileKpCanonicalTaxSource();
  const html = compileKpCanonicalTaxStaticReading(artifact);
  assert.equal(readFileSync(new URL("../src/tutorial/kinetic-figure-supply-tax/canonical-tax-static.generated.html", import.meta.url), "utf8"), html);
  assert.match(html, new RegExp(artifact.sourceRevision));
  assert.equal((html.match(/data-kp-canonical-tax-static-phrase/g) ?? []).length, 8);
  assert.match(html, /<dt>after.revenue<\/dt><dd>12<\/dd>/);
  assert.doesNotMatch(html, /<script|<img|<iframe|<input|<button/);
});

test("all sibling prose and score artifacts remain exact outputs of their existing source owners", () => {
  for (const [path, expected] of [
    ["kinetic-figure-log-exponent-focus-card/log-exponent-instruction.generated.json", compileKpCanonicalLogInstruction()],
    ["kinetic-figure-typescript-focus-card/typescript-instruction.generated.json", compileKpCanonicalTypeScriptInstruction()],
    ["kinetic-figure-surface-contour/surface-contour-prose.generated.json", compileKpCanonicalSurfaceProse()]
  ] as const) {
    assert.deepEqual(JSON.parse(readFileSync(new URL(`../src/tutorial/${path}`, import.meta.url), "utf8")), expected);
  }
});

test("restored instruction rejects foreign Article identity and missing compiled prose", () => {
  const { data, article } = compileKpCanonicalTaxSource();
  assert.throws(() => prepareKpAuthoredMarketSource(data, { ...article, document: { ...article.document, sourceId: "foreign" } }), /explicit source/);
  assert.throws(() => prepareKpAuthoredMarketSource(data, { ...article, phraseHtml: {} }), /Missing compiled phrase HTML/);
});

for (const entry of ["authoring-market/authoring-market-prepare.ts", "kinetic-figure-supply-tax/canonical-tax-source.ts", "kinetic-figure-supply-tax/kinetic-figure-supply-tax-page.ts"]) {
test(`${entry} browser bundle excludes trusted author templates and preview transport`, async () => {
  const result = await build({ configFile: false, logLevel: "silent", build: {
    write: false, minify: false,
    lib: { entry: fileURLToPath(new URL(`../src/tutorial/${entry}`, import.meta.url)), formats: ["es"] }
  } });
  const modules = (Array.isArray(result) ? result : [result]).flatMap(output =>
    "output" in output ? output.output.flatMap(item => item.type === "chunk" ? Object.keys(item.modules) : []) : []);
  assert.ok(modules.some(path => path.endsWith("authoring-market-prepare.ts")));
  assert.ok(modules.some(path => path.endsWith("authoring-market-source.ts")));
  assert.deepEqual(modules.filter(path => /authoring-market-(?:article-source|model-source|preview-build|preview-protocol|page)\.ts|vite-authoring-market|compile-canonical-tax-source|canonical-tax-instruction\.ts/.test(path)), []);
  assert.deepEqual(modules.filter(path => /\/src\/experiments\/|kp-article-document\.ts|kp-article-static-html\.ts|kp-article-validation\.ts/.test(path)), []);
});
}
