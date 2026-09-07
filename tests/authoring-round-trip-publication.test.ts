import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { compileKpAuthoringMarketPublication as compile } from "../scripts/compile-authoring-market-publication.ts";
import { prepareKpAuthoredMarketSource } from "../src/tutorial/authoring-market/authoring-market-prepare.ts";

function source() {
  return createKpAuthoringMarketSourceBranch({ schemaVersion: "kp.authoring-market-build.v1",
    sourceRevision: "source.selected", sequence: 2, sourcePaths: ["model.ts", "article.ts"],
    status: "valid", preview: buildKpAuthoringMarketPreview("reference") }, "selected");
}

test("selected publication binds one source text, model and compiled Article revision", () => {
  const branch = source();
  const sourceText = JSON.stringify(branch);
  const artifact = compile({ sourceText, sourcePath: "/private-author-path/selected.market.json" });
  assert.equal(artifact.schemaVersion, "kp.compiled-publication-artifact.v1");
  assert.equal(artifact.source.path, "selected.market.json");
  assert.equal(artifact.source.sha256, `sha256:${createHash("sha256").update(sourceText).digest("hex")}`);
  assert.equal(artifact.payload.parentSourceRevision, "source.selected");
  const { tax } = artifact.payload;
  assert.equal(tax.schemaVersion, "kp.canonical-tax-source.v2");
  assert.equal(tax.data.article.text, branch.data.article.text);
  const restored = prepareKpAuthoredMarketSource(tax.data, tax.article);
  assert.equal(restored.facts.modelRevisionId, branch.data.article.modelRevisionId);
  assert.equal(restored.facts.text("after.revenue"), "12");
  assert.equal(tax.article.document.sourceId, branch.data.article.sourceId);
  assert.ok(artifact.math.fragmentCount > 0);
  assert.ok(artifact.math.sourceLatex.length > 0);
  assert.deepEqual(compile({ sourceText, sourcePath: artifact.source.path }), artifact);
});

test("publication rejects a selected source whose Article belongs to another model", () => {
  const branch = source();
  const mismatched = { ...branch, data: { ...branch.data,
    parameters: buildKpAuthoringMarketPreview("variation").parameters } };
  assert.throws(() => compile({ sourceText: JSON.stringify(mismatched), sourcePath: "selected.market.json" }), /revision/);
  assert.throws(() => compile({ sourceText: "{}", sourcePath: "selected.market.json" }), /identity/);
});
