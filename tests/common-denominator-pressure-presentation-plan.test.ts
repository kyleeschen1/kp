import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY,
  KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY,
  isKpFractionEquivalencePresentationPlan
} from "../src/animation/fraction-equivalence-presentation-plan.ts";
import {
  compileKpCommonDenominatorPressureEquivalencePlan,
  isKpCommonDenominatorPressurePresentationPlan,
  isKpCommonDenominatorPressureEquivalencePlan,
  kpCanonicalCommonDenominatorPressurePresentationPlan,
  kpCanonicalCommonDenominatorPressureEquivalencePlan
} from "../src/animation/common-denominator-pressure-presentation-plan.ts";
import {
  kpCanonicalCommonDenominatorAlignment
} from "../src/semantic/fraction-common-denominator.ts";

test("pressure plan scopes the approved equivalence motif to the first term", () => {
  const plan = kpCanonicalCommonDenominatorPressureEquivalencePlan;

  assert.equal(isKpCommonDenominatorPressureEquivalencePlan(plan), true);
  assert.equal(
    plan.semanticContractId,
    kpCanonicalCommonDenominatorAlignment.id
  );
  assert.equal(plan.focus.position, "first-term");
  assert.equal(
    plan.focus.sourceTermEntityId,
    kpCanonicalCommonDenominatorAlignment.source.terms[0].termEntityId
  );
  assert.equal(isKpFractionEquivalencePresentationPlan(
    plan.focus.presentation
  ), true);
  assert.equal(plan.focus.presentation.mode, "explain-unit-factor");
  assert.equal(
    plan.focus.presentation.recipeId,
    KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY
  );
  assert.equal(
    plan.focus.presentation.motif.id,
    KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY
  );
  assert.deepEqual(plan.approvedOperationOrder, [
    "kp.algebra.align-common-denominator"
  ]);
  assert.deepEqual(plan.newMotifIds, []);
});

test("plus and untouched second fraction persist outside the local focus", () => {
  const plan = kpCanonicalCommonDenominatorPressureEquivalencePlan;
  const alignment = kpCanonicalCommonDenominatorAlignment;

  assert.deepEqual(plan.contextTransfers.map(({ role }) => role), [
    "addition-operator",
    "untouched-term",
    "untouched-fraction",
    "untouched-division",
    "untouched-numerator",
    "untouched-denominator"
  ]);
  assert.deepEqual(plan.contextTransfers[0], {
    role: "addition-operator",
    relation: "identity",
    sourceEntityId: alignment.source.operatorEntityId,
    targetEntityId: alignment.target.operatorEntityId
  });
  assert.deepEqual(plan.contextTransfers[1], {
    role: "untouched-term",
    relation: "identity",
    sourceEntityId: alignment.source.terms[1].termEntityId,
    targetEntityId: alignment.target.terms[1].termEntityId
  });
  assert.equal(new Set(plan.contextTransfers.flatMap((transfer) => [
    transfer.sourceEntityId,
    transfer.targetEntityId
  ])).size, plan.contextTransfers.length * 2);
});

test("pressure equivalence plan contains no timing, geometry, or evaluation", () => {
  const serialized = JSON.stringify(
    kpCanonicalCommonDenominatorPressureEquivalencePlan
  );

  assert.doesNotMatch(serialized, /duration|delay|easing|geometry|coordinate/u);
  assert.doesNotMatch(serialized, /simplify-constant-product/u);
  assert.doesNotMatch(serialized, /combine-like-denominator/u);
  assert.throws(() => compileKpCommonDenominatorPressureEquivalencePlan(
    { ...kpCanonicalCommonDenominatorAlignment }
  ), /verified common-denominator authority/u);
});

test("numeric product evaluation is one explicit successor cohort", () => {
  const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;
  const alignment = kpCanonicalCommonDenominatorAlignment;

  assert.equal(isKpCommonDenominatorPressurePresentationPlan(plan), true);
  assert.deepEqual(plan.approvedOperationOrder, [
    "kp.algebra.align-common-denominator",
    "kp.algebra.simplify-constant-product"
  ]);
  assert.equal(plan.evaluation.synchronization, "together");
  assert.equal(plan.evaluation.bindings.length, 2);
  assert.deepEqual(plan.evaluation.bindings.map((binding) =>
    binding.authority.operationId
  ), [
    "kp.algebra.simplify-constant-product",
    "kp.algebra.simplify-constant-product"
  ]);
  assert.deepEqual(plan.evaluation.bindings.map((binding) =>
    binding.targetAnnotations[0]?.selectorIds[0]
  ), [
    alignment.target.terms[0].numerator.entityId,
    alignment.target.terms[0].denominator.entityId
  ]);
  plan.evaluation.bindings.forEach((binding) => {
    assert.equal(binding.continuityProgram.program.kind,
      "operation-evaluation");
    assert.equal(binding.continuityProgram.topology,
      "bounded-semantic-contact-co-presence");
    assert.equal(binding.paintContinuityPlan.nonZeroPaint, "opaque");
  });
});

test("ordered native endpoints make hidden evaluation impossible", () => {
  const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;

  assert.deepEqual(plan.endpoints.map(({ kind, latex }) => [kind, latex]), [
    ["problem", "\\frac{1}{3}+\\frac{1}{6}"],
    ["equivalence-source",
      "\\frac{2}{2}\\cdot\\frac{1}{3}+\\frac{1}{6}"],
    ["product", "\\frac{2\\cdot1}{2\\cdot3}+\\frac{1}{6}"],
    ["evaluated", "\\frac{2}{6}+\\frac{1}{6}"]
  ]);
  assert.deepEqual(plan.stepOrder, [
    "stage-unit-factor",
    "join-equivalent-fraction",
    "evaluate-products"
  ]);
  assert.equal(plan.endpoints[2]?.stateId,
    plan.evaluation.fromStateId);
  assert.equal(plan.endpoints[3]?.stateId,
    plan.evaluation.toStateId);
  assert.doesNotMatch(JSON.stringify(plan), /combine-like-denominator/u);
});
