import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRootExtractionPressureNativeEndpoints,
  kpRootExtractionPressureNativeEndpointCorpus
} from "../src/rendering/root-extraction-pressure-native-endpoints.ts";
import {
  kpRootExtractionPressureCorpus
} from "../src/semantic/root-extraction-pressure-corpus.ts";

test("mixed evaluation keeps numerical and symbolic obligations distinct", () => {
  const mixed = kpRootExtractionPressureCorpus.find(({ operationClass }) =>
    operationClass === "mixed-evaluation");
  assert.ok(mixed);
  assert.deepEqual(mixed.plan.priorOperationIds,
    ["operation.root.extract-perfect-power-factor"]);
  assert.deepEqual(mixed.plan.dispositions.map(({ kind }) => kind),
    ["persist", "fuse", "consume", "introduce"]);
  assert.deepEqual(Object.keys(mixed.plan.evidence).sort(), [
    "closed-value",
    "even-positive-integer-power",
    "exact-root",
    "real-valued-carrier"
  ]);
  assert.equal(mixed.identityPairs.length, 1);
  assert.equal(mixed.identityPairs[0]?.semanticId, "semantic.variable.x");
});

test("partial extraction retains residual radical and both leaf identities", () => {
  const partial = kpRootExtractionPressureCorpus.find(({ operationClass }) =>
    operationClass === "partial-extraction");
  assert.ok(partial);
  assert.deepEqual(partial.plan.dispositions.map(({ kind }) => kind),
    ["persist", "persist", "consume", "retain-enclosure", "introduce"]);
  const retained = partial.plan.dispositions.find(({ kind }) =>
    kind === "retain-enclosure");
  assert.deepEqual(retained?.sourceEntityIds,
    ["partial.source.radical"]);
  assert.deepEqual(retained?.targetEntityIds,
    ["partial.target.radical"]);
  assert.deepEqual(partial.identityPairs.map(({ semanticId }) => semanticId),
    ["semantic.variable.x", "semantic.variable.y", "semantic.operator.sqrt"]);
});

test("recursive endpoints preserve exact mixed and residual-root topology", () => {
  assert.deepEqual(kpRootExtractionPressureNativeEndpointCorpus.map(
    ({ source, target }) => [source.annotated.rawLatex,
      target.annotated.rawLatex]), [
    ["\\sqrt{4x^{2}}", "2\\left\\lvert x\\right\\rvert"],
    ["\\sqrt{x^{2}y}",
      "\\left\\lvert x\\right\\rvert\\sqrt{y}"]
  ]);
  const partial = kpRootExtractionPressureNativeEndpointCorpus[1]!;
  assert.equal(partial.source.nodes.filter(({ role }) =>
    role === "radical").length, 1);
  assert.equal(partial.target.nodes.filter(({ role }) =>
    role === "radical").length, 1);
  assert.equal(partial.target.nodes.find(({ role }) => role === "residual")
    ?.parentEntityId, "partial.target.radical");
});

test("endpoint pressure requires nominal verified corpus authority", () => {
  const counterfeit = {
    ...kpRootExtractionPressureCorpus[0],
    id: "pressure.root.counterfeit"
  };
  assert.throws(() => createKpRootExtractionPressureNativeEndpoints(
    counterfeit as never
  ), /verified pressure data/u);
});
