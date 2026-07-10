import assert from "node:assert/strict";
import test from "node:test";

import {
  createSemanticDerivationRecord,
  explainSemanticDeriveCapability,
  listSemanticDeriveCapabilitiesForType
} from "../src/semantic/derive-protocols.ts";

test("semantic derive descriptors distinguish exact and sampled representations", () => {
  const expressionGraph = explainSemanticDeriveCapability("expression.graph2d");
  const sampledGraphLatex = explainSemanticDeriveCapability(
    "graph2d.sampled-latex"
  );

  assert.equal(expressionGraph.sourceType, "expression");
  assert.equal(expressionGraph.targetType, "graph-2d");
  assert.equal(expressionGraph.relation, "same-function");
  assert.equal(expressionGraph.derivationStatus, "exact");
  assert.ok(expressionGraph.assumptions.includes("one-variable expression"));

  assert.equal(sampledGraphLatex.sourceType, "graph-2d");
  assert.equal(sampledGraphLatex.targetType, "latex-form");
  assert.equal(sampledGraphLatex.relation, "sampled-approximation");
  assert.equal(sampledGraphLatex.derivationStatus, "sampled");
  assert.ok(
    sampledGraphLatex.summary.includes("must not claim exact symbolic LaTeX")
  );
});

test("semantic derive descriptors can be listed by source type", () => {
  const expressionDerivations = listSemanticDeriveCapabilitiesForType("expression");
  const graphDerivations = listSemanticDeriveCapabilitiesForType("graph-2d");

  assert.deepEqual(
    expressionDerivations.map((descriptor) => descriptor.id),
    ["expression.latex", "expression.graph2d", "expression.graph3d"]
  );
  assert.deepEqual(
    graphDerivations.map((descriptor) => descriptor.id),
    ["graph2d.exact-latex", "graph2d.sampled-latex"]
  );
});

test("createSemanticDerivationRecord preserves provenance and assumptions", () => {
  const descriptor = explainSemanticDeriveCapability("matrix.linear-map");
  const record = createSemanticDerivationRecord({
    id: "derive.A.linear-map",
    descriptor,
    sourceObjectId: "matrix.A",
    targetObjectId: "linear-map.A",
    sourceRevisionId: "rev-1",
    sourceSelectors: ["entry[0,0]", "entry[1,1]"],
    targetSelectors: ["basis.standard", "map"],
    assumptions: ["standard basis"]
  });

  assert.equal(record.kind, "derive");
  assert.equal(record.relation, "same-linear-map");
  assert.equal(record.status, "exact");
  assert.equal(record.provenance.capabilityId, "matrix.linear-map");
  assert.equal(record.provenance.implementationId, "kp.semantic-derive.v0");
  assert.deepEqual(record.provenance.assumptions, ["standard basis"]);
  assert.deepEqual(record.provenance.sourceSelectors, [
    "entry[0,0]",
    "entry[1,1]"
  ]);
});
