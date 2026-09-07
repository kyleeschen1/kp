import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { compileKpAuthoringMarketPublication as compile, serializeKpAuthoringMarketPublication as serialize } from "../scripts/compile-authoring-market-publication.ts";
import { prepareKpAuthoredMarketSource } from "../src/tutorial/authoring-market/authoring-market-prepare.ts";
import { createKpEquationSeriesLogarithmBaseExample } from "../src/authoring/equation-series-logarithm-base-example.ts";
import { createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";

test("independent numeric and market variants reproduce exact source without changing their predecessor", () => {
  const equationRequest = createKpEquationSeriesLogarithmBaseDraft();
  const firstBranch = { ...source(), equationRequest };
  const firstInput = { sourceText: JSON.stringify(firstBranch), sourcePath: "first.market.json" };
  const first = compile(firstInput);
  const secondBranch = { ...createKpAuthoringMarketSourceBranch({ schemaVersion: "kp.authoring-market-build.v1",
    sourceRevision: first.source.sha256, sequence: 3, sourcePaths: ["model.ts", "article.ts"],
    status: "valid", preview: buildKpAuthoringMarketPreview("variation") }, "second"), equationRequest: structuredClone(equationRequest) };
  secondBranch.equationRequest.states[0]!.latex = "\\log_{10} 100";
  secondBranch.equationRequest.states[1]!.latex = "\\frac{\\ln 100}{\\ln 10}";
  const secondInput = { sourceText: JSON.stringify(secondBranch), sourcePath: "second.market.json" };
  const second = compile(secondInput);
  assert.notEqual(first.source.sha256, second.source.sha256);
  assert.notEqual(first.payloadSha256, second.payloadSha256);
  assert.equal(second.payload.parentSourceRevision, first.source.sha256);
  assert.ok(second.math.sourceLatex.includes(secondBranch.equationRequest.states[0]!.latex));
  assert.ok(second.math.sourceLatex.includes(secondBranch.equationRequest.states[1]!.latex));
  assert.deepEqual(compile(firstInput), first);
  assert.deepEqual(compile(secondInput), second);
  assert.equal(prepareKpAuthoredMarketSource(first.payload.tax.data, first.payload.tax.article).facts.text("after.revenue"), "12");
  assert.equal(prepareKpAuthoredMarketSource(second.payload.tax.data, second.payload.tax.article).facts.text("after.revenue"), "10");
  assert.throws(() => serialize(second, firstInput), /source identity/);
  secondBranch.equationRequest.states[1]!.latex = firstBranch.equationRequest.states[1]!.latex;
  assert.throws(() => compile({ ...secondInput, sourceText: JSON.stringify(secondBranch) }), /Repair the selected equation/);
});

test("only explicitly included and governed equations enter the selected reading edition", () => {
  const market = source();
  const equationRequest = createKpEquationSeriesLogarithmBaseExample().value;
  const branch = { ...market, equationRequest: { ...equationRequest, states: equationRequest.states.map(state => ({ ...state, narration: "Preserve the value." })) } };
  const plain = compile({ sourceText: JSON.stringify(market), sourcePath: "selected.market.json" });
  const combined = compile({ sourceText: JSON.stringify(branch), sourcePath: "selected.market.json" });
  assert.doesNotMatch(plain.payload.reading.html, /data-kp-authoring-equation-static/);
  assert.match(combined.payload.reading.html, /data-kp-authoring-equation-static/);
  assert.match(combined.payload.reading.html, /Preserve the value/);
  assert.equal(combined.math.fragmentCount, plain.math.fragmentCount + 2);
  assert.deepEqual(combined.payload.tax, plain.payload.tax);
  branch.equationRequest.states[1]!.latex = "x+1";
  assert.throws(() => compile({ sourceText: JSON.stringify(branch), sourcePath: "selected.market.json" }), error => {
    assert.equal((error as { code: string }).code, "kp.authoring.equation-source-gap"); return true;
  });
});

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

test("real publication serialization checks payload bytes and selected source rather than digest shape", () => {
  const input = { sourceText: JSON.stringify(source()), sourcePath: "selected.market.json" };
  const artifact = compile(input);
  assert.deepEqual(JSON.parse(serialize(artifact, input)), artifact);
  const tampered = JSON.parse(JSON.stringify(artifact));
  tampered.payload.tax.data.article.text += "\nTampered editorial content\n";
  assert.throws(() => serialize(tampered, input), /payload digest/);
  tampered.payloadSha256 = `sha256:${createHash("sha256").update(JSON.stringify(tampered.payload)).digest("hex")}`;
  assert.throws(() => serialize(tampered, input), /does not reproduce/);
  assert.throws(() => serialize(artifact, { ...input, sourceText: `${input.sourceText}\n` }), /source identity/);
  assert.throws(() => serialize(artifact, { ...input, sourcePath: "different.market.json" }), /source identity/);
  assert.throws(() => serialize({ ...artifact, compiler: { ...artifact.compiler, version: "forged" } }, input), /compiler identity/);
});
