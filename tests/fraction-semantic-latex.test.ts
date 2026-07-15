import assert from "node:assert/strict";
import test from "node:test";

import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import { createKpFractionSelectorAnnotatedLatex } from "../src/editor/fraction-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/rendering/semantic-equation-transition-compiler.ts";

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
