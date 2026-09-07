import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { compileKpCanonicalTaxSource, compileKpCanonicalTaxStaticReading } from "../scripts/compile-canonical-tax-source.ts";
import { prepareKpAuthoredMarketSource } from "../src/experiments/authoring-market/authoring-market-prepare.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";

test("canonical build is deterministic data and restores through the shared source preparer", () => {
  const artifact = compileKpCanonicalTaxSource();
  assert.deepEqual(compileKpCanonicalTaxSource(), artifact);
  assert.deepEqual(JSON.parse(readFileSync(new URL("../src/experiments/kinetic-figure-supply-tax/canonical-tax-source.generated.json", import.meta.url), "utf8")), artifact);
  assert.equal(artifact.data.specimen.id, "specimen.market.reference");
  const prepared = prepareKpAuthoredMarketSource(JSON.parse(JSON.stringify(artifact.data)));
  assert.equal(prepared.boundArticle.modelRevisionId, prepared.authored.source.authority.revisionId);
  assert.equal(prepared.facts.text("after.revenue"), "12");
  assert.equal(prepareKpAuthoringMarketPreview, prepareKpAuthoredMarketSource);
});

test("ordinary build checks freshness without a Vite SSR or preview-service boundary", () => {
  const source = readFileSync(new URL("../scripts/compile-canonical-tax-source.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ssrLoadModule|fetch\(|configureServer|ViteDevServer/);
  const prepare = readFileSync(new URL("../src/experiments/authoring-market/authoring-market-prepare.ts", import.meta.url), "utf8");
  assert.doesNotMatch(prepare, /fetch\(|import\.meta\.hot|RevisionReceiver|document\./);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts["build:bundle"], /check:canonical-tax-source/);
});

test("static reading is generated from the same bound prose and exact facts without asset substitutes", () => {
  const artifact = compileKpCanonicalTaxSource();
  const html = compileKpCanonicalTaxStaticReading(artifact);
  assert.equal(readFileSync(new URL("../src/experiments/kinetic-figure-supply-tax/canonical-tax-static.generated.html", import.meta.url), "utf8"), html);
  assert.match(html, new RegExp(artifact.sourceRevision));
  assert.equal((html.match(/data-kp-canonical-tax-static-phrase/g) ?? []).length, 8);
  assert.match(html, /<dt>after.revenue<\/dt><dd>12<\/dd>/);
  assert.doesNotMatch(html, /<script|<img|<iframe|<input|<button/);
});

for (const entry of ["authoring-market/authoring-market-prepare.ts", "kinetic-figure-supply-tax/canonical-tax-source.ts"]) {
test(`${entry} browser bundle excludes trusted author templates and preview transport`, async () => {
  const result = await build({ configFile: false, logLevel: "silent", build: {
    write: false, minify: false,
    lib: { entry: fileURLToPath(new URL(`../src/experiments/${entry}`, import.meta.url)), formats: ["es"] }
  } });
  const modules = (Array.isArray(result) ? result : [result]).flatMap(output =>
    "output" in output ? output.output.flatMap(item => item.type === "chunk" ? Object.keys(item.modules) : []) : []);
  assert.ok(modules.some(path => path.endsWith("authoring-market-prepare.ts")));
  assert.ok(modules.some(path => path.endsWith("authoring-market-source.ts")));
  assert.deepEqual(modules.filter(path => /authoring-market-(?:article-source|model-source|preview-build|preview-protocol|page)\.ts|vite-authoring-market|compile-canonical-tax-source|canonical-tax-instruction\.ts/.test(path)), []);
});
}
