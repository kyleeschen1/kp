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
  assert.equal(
    plan.operatorApplication.argumentSemanticEntityId.endsWith(
      ".initial.integrand-scope"
    ),
    true
  );
  assert.deepEqual(plan.exponentBranch.targetSelectorIds.map((id) =>
    id.split(".").at(-1)), [
    "numerator-exponent",
    "denominator-exponent"
  ]);
  assert.deepEqual(plan.introducedSelectorIds.map((id) =>
    id.split(".").at(-1)), [
    "numerator-successor-operator",
    "numerator-increment",
    "denominator-successor-operator",
    "denominator-increment",
    "connector",
    "constant"
  ]);
  assert.equal(
    plan.fractionStructure.targetSemanticEntityId.endsWith(
      ".expanded.exact-quotient"
    ),
    true
  );
  assert.equal(
    plan.ruleTemplateApplication.kind,
    "antiderivative-rule-template-instantiation"
  );
  assert.deepEqual(plan.ruleTemplateApplication.ruleReference, {
    semanticId: `${plan.id}.prospective-rule-reference`,
    lawRefId: "law.calculus.integral.power-rule",
    parameterSymbol: "n",
    latex:
      "\\int x^{n}\\,dx \\longmapsto \\frac{x^{n+1}}{n+1}+C\\quad(n\\ne -1)",
    sourceBindingSelectorId:
      plan.ruleTemplateApplication.bindingRelations[1].sourceSelectorId
  });
  assert.deepEqual(
    plan.ruleTemplateApplication.fixedSyntaxGroups.map((group) => ({
      role: group.role,
      selectors: group.selectorIds.map((id) => id.split(".").at(-1))
    })),
    [
      {
        role: "numerator-successor",
        selectors: ["numerator-successor-operator", "numerator-increment"]
      },
      {
        role: "denominator-successor",
        selectors: ["denominator-successor-operator", "denominator-increment"]
      }
    ]
  );
  assert.deepEqual(
    plan.ruleTemplateApplication.closureSelectorIds.map((id) =>
      id.split(".").at(-1)
    ),
    ["connector", "constant"]
  );
  assert.deepEqual(
    plan.ruleTemplateApplication.bindingRelations.map(({ relation }) =>
      relation
    ),
    ["persist", "fan-out"]
  );
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

test("rule-template projection previews complete grammar before binding", () => {
  const { plan } = fixture();
  const before = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.33
  });
  assert.equal(before.ruleTemplateApplication.traceRole, "absent");
  assert.equal(before.ruleTemplateApplication.ruleReferencePresence, 0);
  assert.equal(before.ruleTemplateApplication.previewPresence, 0);
  assert.equal(before.ruleTemplateApplication.scaffoldPresence, 0);
  assert.equal(before.ruleTemplateApplication.bindingProgress, 0);

  const preview = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.48
  });
  assert.equal(preview.ruleTemplateApplication.traceRole, "prospective");
  assert.equal(preview.ruleTemplateApplication.ruleReferencePresence, 1);
  assert.equal(preview.ruleTemplateApplication.previewPresence, 1);
  assert.ok(preview.ruleTemplateApplication.scaffoldPresence > 0);
  assert.equal(preview.ruleTemplateApplication.bindingProgress, 0);
  assert.ok(preview.ruleTemplateApplication.syntaxPresence > 0);
  assert.ok(preview.ruleTemplateApplication.closurePresence > 0);
  assert.equal(
    preview.ruleTemplateApplication.syntaxResolutionProgress,
    0
  );

  const binding = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.68
  });
  assert.equal(binding.ruleTemplateApplication.traceRole, "prospective");
  assert.equal(binding.ruleTemplateApplication.ruleReferencePresence, 1);
  assert.ok(binding.ruleTemplateApplication.bindingProgress >
    binding.ruleTemplateApplication.syntaxResolutionProgress);
  assert.ok(binding.ruleTemplateApplication.syntaxPresence > 0);
  assert.ok(binding.ruleTemplateApplication.closurePresence > 0);
  assert.equal(binding.ruleTemplateApplication.syntaxResolutionProgress, 0);

  const resolved = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.9
  });
  assert.equal(resolved.ruleTemplateApplication.traceRole, "live");
  assert.equal(resolved.ruleTemplateApplication.ruleReferencePresence, 0);
  assert.equal(resolved.ruleTemplateApplication.scaffoldPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.bindingProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.syntaxPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.syntaxResolutionProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.closurePresence, 1);
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
    lawRefId: "law.calculus.integral.power-rule",
    correspondenceMap: {
      ...correspondenceMap,
      records: correspondenceMap.records.filter(({ id }) =>
        id !== "source-exponent-branches")
    }
  }), /requires operator removal, base persistence, exponent fan-out/u);
});
