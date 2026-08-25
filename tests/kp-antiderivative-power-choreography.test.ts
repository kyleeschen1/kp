import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpAntiderivativePowerChoreography,
  createKpAntiderivativePowerChoreography,
  sampleKpAntiderivativePowerChoreography
} from "../src/animation/antiderivative-power-choreography.ts";
import { createGeneratedProblemAnimationAssets } from
  "../src/animation/catalog.ts";
import {
  createKpAntiderivativePowerRuleSemanticRoles
} from "../src/semantic/antiderivative-power-rule-semantics.ts";

function fixture() {
  const animation = createGeneratedProblemAnimationAssets().find(({ id }) =>
    id === "animation.generated.calculus.integral.power-rule-quadratic"
  );
  assert.ok(animation);
  return { animation, plan: createKpAntiderivativePowerChoreography(animation) };
}

test("integration first transition compiles its governed scope and lineage", () => {
  const { plan } = fixture();
  assert.equal(plan.operatorApplication.kind,
    "antiderivative-operator-application");
  assert.equal(plan.operatorApplication.withdrawal, "opacity-only");
  assert.deepEqual(plan.operatorApplication.operatorSelectorIds.map((id) =>
    id.split(".").at(-1)), [
    "operator",
    "differential-symbol",
    "integration-variable"
  ]);
  assert.deepEqual(plan.operatorApplication.argumentSelectorIds.map((id) =>
    id.split(".").at(-1)), ["base", "exponent"]);
  assert.deepEqual(plan.exponentBranch.targetSelectorIds.map((id) =>
    id.split(".").at(-1)), [
    "numerator-exponent",
    "denominator-exponent"
  ]);
  assert.deepEqual(plan.introducedSelectorIds.map((id) =>
    id.split(".").at(-1)), [
    "numerator-increment",
    "denominator-increment",
    "connector",
    "constant"
  ]);
  assert.doesNotMatch(JSON.stringify(plan),
    /outline|box|translate|geometry|path-variant/u);
});

test("operator salience and withdrawal finish before the rewrite begins", () => {
  const { plan } = fixture();
  const notice = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.1
  });
  assert.ok(notice.focus.operatorApplication > 0);
  assert.ok(notice.focus.integrandScope > 0);
  assert.equal(notice.operator.opacity, 1);
  assert.equal(notice.rewriteProgress, 0);

  const handoff = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.32
  });
  assert.equal(handoff.operator.opacity, 0);
  assert.equal(handoff.rewriteProgress, 0);
  assert.equal(handoff.focus.integrandScope, 1);

  const rewrite = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.5
  });
  assert.equal(rewrite.operator.opacity, 0);
  assert.ok(rewrite.rewriteProgress > 0);
});

test("integration first transition is direct-seek reverse and interruption safe", () => {
  const { plan } = fixture();
  const at = (progress: number) => sampleKpAntiderivativePowerChoreography({
    plan,
    progress
  });
  assert.deepEqual(at(0.48), at(0.48));
  const beforeInterruption = at(0.48);
  at(0.2);
  assert.deepEqual(at(0.48), beforeInterruption);

  const forward = at(0.27);
  const rewind = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.73,
    direction: "rewind"
  });
  assert.deepEqual(
    { ...rewind, direction: "forward", progress: 0.27 },
    forward
  );
});

test("integration first transition rejects incomplete correspondence", () => {
  const { animation } = fixture();
  const source = animation.bundle.objects[0]!.id;
  const expanded = animation.bundle.objects[1]!.id;
  const target = animation.bundle.objects[2]!.id;
  const roles = createKpAntiderivativePowerRuleSemanticRoles({
    sourceObjectId: source,
    expandedObjectId: expanded,
    targetObjectId: target,
    integrationVariable: "x",
    base: "x",
    exponent: 2
  });
  const correspondenceMap = animation.transformations[0]!.correspondenceMap!;
  assert.throws(() => compileKpAntiderivativePowerChoreography({
    id: "motion.invalid",
    semanticRoles: roles,
    correspondenceMap: {
      ...correspondenceMap,
      records: correspondenceMap.records.filter(({ id }) =>
        id !== "source-exponent-branches")
    }
  }), /requires operator removal, base persistence, exponent fan-out/u);
});
