import assert from "node:assert/strict";
import test from "node:test";

import {
  kpVectorDotProjectionExemplarContract
} from "../src/animation/vector-dot-projection-exemplar-contract.ts";
import {
  compileKpVectorDotProjectionSemanticModel
} from "../src/animation/vector-dot-projection-semantic-model.ts";

const canonicalInput = {
  id: "model.dot-projection.test",
  sourceVectorId: "vector.a",
  targetVectorId: "vector.b",
  projectionVectorId: "vector.projection",
  residualVectorId: "vector.residual",
  sourceVector: kpVectorDotProjectionExemplarContract.sourceVector,
  targetVector: kpVectorDotProjectionExemplarContract.targetVector
} as const;

test("semantic model owns exact values and indexed geometry lineage", () => {
  const result = compileKpVectorDotProjectionSemanticModel(canonicalInput);
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;

  assert.deepEqual({
    dotProduct: result.model.dotProduct,
    sourceNormSquared: result.model.sourceNormSquared,
    targetNormSquared: result.model.targetNormSquared,
    scale: result.model.projectionScale,
    projection: result.model.projectionVector,
    residual: result.model.residualVector,
    residualTargetDotProduct: result.model.residualTargetDotProduct
  }, {
    dotProduct: 6,
    sourceNormSquared: 20,
    targetNormSquared: 2,
    scale: { numerator: 6, denominator: 2, value: 3 },
    projection: [3, 3],
    residual: [1, -1],
    residualTargetDotProduct: 0
  });
  assert.deepEqual(
    result.model.componentLineage.map((lineage) => ({
      index: lineage.index,
      axis: lineage.axis,
      selectors: [lineage.sourceSelectorId, lineage.targetSelectorId],
      product: lineage.product,
      cumulative: lineage.cumulativeDotProduct,
      geometry: [
        lineage.sourceGeometryId,
        lineage.targetGeometryId,
        lineage.projectionGeometryId
      ]
    })),
    [
      {
        index: 0,
        axis: "x",
        selectors: ["vector.a.x", "vector.b.x"],
        product: 4,
        cumulative: 4,
        geometry: [
          "geometry.vector.a.component.x",
          "geometry.vector.b.component.x",
          "geometry.vector.projection.component.x"
        ]
      },
      {
        index: 1,
        axis: "y",
        selectors: ["vector.a.y", "vector.b.y"],
        product: 2,
        cumulative: 6,
        geometry: [
          "geometry.vector.a.component.y",
          "geometry.vector.b.component.y",
          "geometry.vector.projection.component.y"
        ]
      }
    ]
  );
});

test("semantic compilation is deterministic and immutable", () => {
  const first = compileKpVectorDotProjectionSemanticModel(canonicalInput);
  const second = compileKpVectorDotProjectionSemanticModel(canonicalInput);
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  if (first.status === "compiled") {
    assert.equal(Object.isFrozen(first.model), true);
    assert.equal(Object.isFrozen(first.model.componentLineage), true);
  }
});

test("zero target fails closed with one typed diagnostic", () => {
  assert.deepEqual(compileKpVectorDotProjectionSemanticModel({
    ...canonicalInput,
    targetVector: [0, 0]
  }), {
    status: "rejected",
    diagnostics: [{
      code: "projection.target.zero",
      path: "targetVector",
      message: "Vector projection requires a non-zero target vector."
    }]
  });
});

test("zero source preserves projection truth and marks its angle undefined", () => {
  const result = compileKpVectorDotProjectionSemanticModel({
    ...canonicalInput,
    sourceVector: [0, 0]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(result.model.angleRadians, null);
  assert.deepEqual(result.model.projectionVector, [0, 0]);
  assert.deepEqual(result.model.residualVector, [0, 0]);
  assert.match(result.model.accessibleDescription, /angle is undefined/);
});

test("non-finite and non-integer components are rejected in contract order", () => {
  const result = compileKpVectorDotProjectionSemanticModel({
    ...canonicalInput,
    sourceVector: [Number.NaN, 1.5]
  });
  assert.equal(result.status, "rejected");
  if (result.status !== "rejected") return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => [code, path]), [
    ["vector.component.non-finite", "sourceVector[0]"],
    ["vector.component.non-integer", "sourceVector[1]"]
  ]);
});
