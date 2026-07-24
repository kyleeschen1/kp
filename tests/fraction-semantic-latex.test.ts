import assert from "node:assert/strict";
import test from "node:test";

import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import { createKpFractionSelectorAnnotatedLatex } from "../src/editor/fraction-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";
import { createKpWitnessedAnnihilationBinding } from "../src/animation/witnessed-annihilation.ts";

test("fraction transformations cover split, fan-in, and cancellation lifecycles", () => {
  const animation = createFractionSimplificationAnimationAsset();
  for (const transformation of animation.transformations) {
    const result = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: animation.bundle
    });
    assert.equal(result.status, "semantic", transformation.id);
    assert.deepEqual(result.diagnostics, [], transformation.id);
  }
  assert.ok(animation.transformations[0]?.correspondenceMap?.records.some(
    (record) => record.relation === "fan-out"
  ));
  assert.ok(animation.transformations[1]?.correspondenceMap?.records.some(
    (record) => record.relation === "fan-in"
  ));
  assert.ok(animation.transformations[2]?.correspondenceMap?.records.some(
    (record) => record.relation === "cancelation"
  ));
});

test("fraction states annotate semantic terms while reserving bars for structural binding", () => {
  const animation = createFractionSimplificationAnimationAsset();
  for (const object of animation.bundle.objects) {
    const annotated = createKpFractionSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    });
    assert.ok(annotated, object.id);
    const semanticIds = object.selectors
      .filter((selector) => selector.kind !== "artifact")
      .map((selector) => selector.id);
    assert.deepEqual(
      annotated.annotations.map((annotation) => annotation.selectorId),
      semanticIds
    );
    assert.match(annotated.rawLatex, /\\frac/);
  }
});

test("unit fraction cancellation compiles the multiplicative identity witness", () => {
  const animation = createFractionSimplificationAnimationAsset();
  const transformation = animation.transformations[2]!;
  const binding = createKpWitnessedAnnihilationBinding({
    operationId: "kp.algebra.simplify-unit-fraction-factor",
    transformation,
    bundle: animation.bundle,
    cancellationRecordId: "unit-factor-cancels"
  });
  assert.equal(binding.witness.descriptorId, "witness.multiplicative-identity.one");
  assert.equal(binding.witness.semanticValue.latex, "1");
  assert.equal(binding.sources.length, 4);
  assert.deepEqual(binding.survivorRecordIds, [
    "base-numerator-persists",
    "base-denominator-persists",
    "base-fraction-line-persists"
  ]);
});
