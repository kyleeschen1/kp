import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  diagnoseKpAnimationDesign
} from "../src/animation/animation-design-diagnostics.ts";

const catalog = createKpAnimationAssets();

test("derivative power rule has total lineage but still needs choreography", () => {
  const animation = catalog.find(
    (candidate) =>
      candidate.id ===
      "animation.generated.calculus.derivative.power-rule-x-cubed"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "lifecycle-generic");
  assert.equal(diagnosis.motifKind, "artifact-replace");
  assert.deepEqual(
    diagnosis.issues.map((issue) => issue.code),
    [
      "design.motif.generic-replacement",
      "design.staging.operation-unspecified"
    ]
  );
});

test("radical rewrite identifies target-fragment granularity loss", () => {
  const animation = catalog.find(
    (candidate) =>
      candidate.id === "animation.generated.radical.square-root-as-power"
  )!;
  const diagnosis = diagnoseKpAnimationDesign({ animation })!;

  assert.equal(diagnosis.visualStrategy, "operation-specific");
  assert.ok(diagnosis.issues.some(
    (issue) =>
      issue.code === "design.representation.granularity-loss"
  ));
  assert.ok(diagnosis.issues.some(
    (issue) => issue.code === "design.motif.generic-replacement"
  ));
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
});
