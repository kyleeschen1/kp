import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { compileKpCanonicalTaxSource } from "../scripts/compile-canonical-tax-source.ts";
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

test("shared preparation browser bundle excludes trusted author templates and preview transport", async () => {
  const result = await build({ configFile: false, logLevel: "silent", build: {
    write: false, minify: false,
    lib: { entry: fileURLToPath(new URL("../src/experiments/authoring-market/authoring-market-prepare.ts", import.meta.url)), formats: ["es"] }
  } });
  const modules = (Array.isArray(result) ? result : [result]).flatMap(output =>
    "output" in output ? output.output.flatMap(item => item.type === "chunk" ? Object.keys(item.modules) : []) : []);
  assert.ok(modules.some(path => path.endsWith("authoring-market-prepare.ts")));
  assert.ok(modules.some(path => path.endsWith("authoring-market-source.ts")));
  assert.deepEqual(modules.filter(path => /authoring-market-(?:article-source|model-source|preview-build|preview-protocol|page)\.ts|vite-authoring-market|compile-canonical-tax-source/.test(path)), []);
});
