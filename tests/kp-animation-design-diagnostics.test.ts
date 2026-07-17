import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  diagnoseKpAnimationDesign
} from "../src/animation/animation-design-diagnostics.ts";

const catalog = createKpAnimationAssets();

test("derivative power rule is promoted to operation-specific motion", () => {
  const animation = catalog.find(
    (candidate) =>
      candidate.id ===
      "animation.generated.calculus.derivative.power-rule-x-cubed"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.equal(diagnosis.motifKind, "derivative-power");
  assert.deepEqual(diagnosis.issues, []);
});

test("radical rewrite closes target-fragment granularity loss", () => {
  const animation = catalog.find(
    (candidate) =>
      candidate.id === "animation.generated.radical.square-root-as-power"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.equal(diagnosis.motifKind, "radical-corner-transfer");
  assert.ok(!diagnosis.issues.some(
    (issue) =>
      issue.code === "design.representation.granularity-loss"
  ));
  assert.deepEqual(diagnosis.issues, []);
});

test("linear solve operations retain operation-specific diagnoses", () => {
  const animation = catalog.find(
    (candidate) => candidate.id === "animation.linear-solve.solve-x"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({
    animation,
    transformationId:
      "transform.linear-solve.cancel-left-additive-inverse"
  })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.equal(diagnosis.motifKind, "cancelation");
  assert.deepEqual(diagnosis.issues, []);
});

test("dot product reports its specialized accumulation motif", () => {
  const animation = catalog.find(
    (candidate) =>
      candidate.id ===
      "animation.generated.linear-algebra.dot-product.three-vector"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.equal(diagnosis.motifKind, "dot-product-accumulate");
  assert.ok(!diagnosis.issues.some(
    (issue) => issue.code === "design.motif.generic-replacement"
  ));
  assert.deepEqual(diagnosis.issues, []);
});

test("additive identity reports operation-specific absorption", () => {
  const animation = catalog.find(
    (candidate) => candidate.id === "animation.generated.add-zero"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.equal(diagnosis.motifKind, "simplify-into");
  assert.deepEqual(diagnosis.issues, []);
});
