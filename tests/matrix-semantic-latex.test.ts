import assert from "node:assert/strict";
import test from "node:test";

import { createGeneratedProblemAnimationAsset } from "../src/animation/generated-problem-import.ts";
import { createKpMatrixSelectorAnnotatedLatex } from "../src/editor/matrix-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";
import { createGeneratedLinearAlgebraProblemFixture } from "../src/semantic/generated-linear-algebra-problem-fixture.ts";

const fixtureIds = [
  "generated.linear-algebra.matrix-vector.two-by-two",
  "generated.linear-algebra.matrix-matrix.two-by-two"
] as const;

test("matrix products compile honest entry replacement semantics", () => {
  for (const fixtureId of fixtureIds) {
    const animation = createGeneratedProblemAnimationAsset(
      createGeneratedLinearAlgebraProblemFixture(fixtureId)
    );
    const result = compileKpSemanticEquationTransitionResult({
      transformation: animation.transformations[0]!,
      bundle: animation.bundle
    });
    assert.equal(result.status, "semantic", fixtureId);
    assert.deepEqual(
      result.ir?.relations.map((relation) => relation.lifecycle),
      ["exit", "enter"]
    );
  }
});

test("matrix states annotate entries and reserve brackets for structural binding", () => {
  for (const fixtureId of fixtureIds) {
    const fixture = createGeneratedLinearAlgebraProblemFixture(fixtureId);
    for (const object of fixture.bundle.objects) {
      const annotated = createKpMatrixSelectorAnnotatedLatex({
        objectId: object.id,
        selectors: object.selectors
      });
      assert.ok(annotated, object.id);
      const entryCount = object.selectors.filter((selector) => selector.kind !== "artifact").length;
      assert.equal(annotated.annotations.length, entryCount);
    }
  }
});
