import assert from "node:assert/strict";
import test from "node:test";
import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";
import { createKpAuthoredDistributionProjection, requireKpAuthoredDistributionNativeAnimation } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { createKpFlashcardSpec, validateKpFlashcardSpec } from "../src/semantic/asset-flashcard.ts";

test("R2 baseline: the reason is an adjacent verified prefix, not unrelated animations", () => {
  const macro = createKpLawfulFractionSolveMacro();
  assert.deepEqual(macro.steps.slice(0, 4).map(step => step.id), [
    "fraction-solve.step.distribute", "fraction-solve.step.normalize",
    "fraction-solve.step.constant-product", "fraction-solve.step.constant-quotient"
  ]);
  for (const [index, step] of macro.steps.slice(0, 4).entries()) {
    assert.equal(step.sourceStateId, macro.states[index]!.id);
    assert.equal(step.targetStateId, macro.states[index + 1]!.id);
    assert.ok(step.authorityIds.length > 0);
    assert.deepEqual(macro.verification.adjacency[index]!.authorityIds, step.authorityIds);
  }
  assert.throws(() => createKpLawfulFractionSolveMacro({ finalValue: 8 }));
});

test("R2 baseline: authored distribution retains native trace and exact aggregate pins", () => {
  const { projection } = createKpAuthoredDistributionProjection();
  const animation = requireKpAuthoredDistributionNativeAnimation(projection);
  assert.equal(animation, projection.animationCandidate);
  assert.notEqual(projection.before.versionId, projection.after.versionId);
  const macro = createKpLawfulFractionSolveMacro();
  for (const step of macro.steps.slice(0, 4)) {
    const transform = animation.transformations.find(item => item.id === step.id);
    assert.ok(transform, step.id);
    assert.ok(transform.sourceObjectIds.includes(step.sourceStateId));
    assert.ok(transform.targetObjectIds.includes(step.targetStateId));
  }
});

test("R2 baseline: prediction and reconstruction use existing flashcard kinds", () => {
  const { projection } = createKpAuthoredDistributionProjection();
  const animation = projection.animationCandidate;
  const operation = animation.transformations[0]!;
  for (const kind of ["predict-next", "cloze"] as const) {
    const card = createKpFlashcardSpec({ id: `r2.baseline.${kind}`, kind,
      title: "Distribution", assetId: animation.bundle.id, prompt: "Recover the next step.",
      objectIds: operation.sourceObjectIds, transformationIds: [operation.id],
      answer: { kind: "transformation", value: operation.id } });
    assert.deepEqual(validateKpFlashcardSpec(card, { bundle: animation.bundle, transformations: animation.transformations }), []);
    assert.ok(validateKpFlashcardSpec({ ...card, transformationIds: ["unverified"] },
      { bundle: animation.bundle, transformations: animation.transformations }).length > 0);
  }
});
