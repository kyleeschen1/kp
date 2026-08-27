import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpAntiderivativePowerChoreography,
  createKpAntiderivativePowerChoreography,
  sampleKpAntiderivativePowerChoreography,
  sampleKpAntiderivativeRuleTemplateApplication
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
  assert.equal(
    plan.ruleTemplateApplication.lawRefId,
    "law.calculus.integral.power-rule"
  );
  assert.equal(
    plan.ruleTemplateApplication.patternLatex,
    String.raw`\int u^n\,du`
  );
  assert.equal(
    plan.ruleTemplateApplication.replacementTemplateLatex,
    String.raw`\frac{u^{n+1}}{n+1}+C`
  );
  assert.equal(
    plan.ruleTemplateApplication.bindingLatex,
    String.raw`u\mapsto x,\qquad n\mapsto 2`
  );
  assert.equal(
    plan.ruleTemplateApplication.instantiatedResultLatex,
    String.raw`\frac{x^{2+1}}{2+1}+C`
  );
  assert.deepEqual(plan.ruleTemplateApplication.instructionalProjection, {
    patternLatex: String.raw`\int u^n\,du`,
    replacementTemplateLatex: String.raw`\frac{u^{n+1}}{n+1}+C`,
    bindingLatex: String.raw`u\mapsto x,\qquad n\mapsto 2`,
    metavariables: ["u", "n"]
  });
  assert.deepEqual(
    plan.ruleTemplateApplication.metavariableBindings.map((binding) => ({
      metavariable: binding.metavariable,
      value: binding.value,
      selectors: binding.sourceSelectorIds.map((id) => id.split(".").at(-1))
    })),
    [
      {
        metavariable: "u",
        value: "x",
        selectors: ["base", "integration-variable"]
      },
      { metavariable: "n", value: "2", selectors: ["exponent"] }
    ]
  );
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

test("operator context remains through projection and withdraws before the template", () => {
  const { plan } = fixture();
  const notice = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.1
  });
  assert.ok(notice.focus.operatorApplication > 0);
  assert.ok(notice.focus.integrandScope > 0);
  assert.equal(notice.operator.opacity, 1);
  assert.equal(notice.rewriteProgress, 0);

  const matching = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.52
  });
  assert.equal(matching.operator.opacity, 1);
  assert.ok(matching.rewriteProgress > 0);
  assert.equal(matching.ruleTemplateApplication.matchProgress, 1);

  const template = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.7
  });
  assert.equal(template.operator.opacity, 0);
  assert.ok(template.ruleTemplateApplication.templateRevealProgress > 0);
});

test("rule application separates match bind instantiate and rewrite", () => {
  const { plan } = fixture();
  const before = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.13
  });
  assert.equal(before.ruleTemplateApplication.traceRole, "absent");
  assert.equal(before.ruleTemplateApplication.receiverFocus, 0);
  assert.equal(before.ruleTemplateApplication.panelPresence, 0);
  assert.equal(before.ruleTemplateApplication.matchProgress, 0);
  assert.equal(before.ruleTemplateApplication.matchPresence, 0);
  assert.equal(
    before.ruleTemplateApplication.metavariableBindingsPresence,
    0
  );
  assert.equal(before.ruleTemplateApplication.rulePreviewPresence, 0);
  assert.equal(before.ruleTemplateApplication.patternProjectionPresence, 0);
  assert.equal(before.ruleTemplateApplication.patternProjectionProgress, 0);
  assert.equal(before.ruleTemplateApplication.instantiatedResultPresence, 0);
  assert.equal(before.ruleTemplateApplication.templateRevealProgress, 0);
  assert.equal(before.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(before.ruleTemplateApplication.vacancyPresence, 0);
  assert.equal(before.ruleTemplateApplication.scaffoldPresence, 0);
  assert.equal(before.ruleTemplateApplication.bindingProgress, 0);
  assert.equal(
    before.ruleTemplateApplication.explanationBeatId,
    "orient-source"
  );
  assert.deepEqual(before.ruleTemplateApplication.depthLens, {
    schemaPlanePresence: 0,
    correspondencePlanePresence: 0,
    prospectivePlaneDepth: 0,
    sourceFramePresence: 0,
    templateFramePresence: 0,
    templateApproachProgress: 0,
    registrationSeamProgress: 0,
    templateRetreatProgress: 0
  });
  assert.equal(
    before.ruleTemplateApplication.receiverSettlementProgress,
    0
  );

  const reference = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.22
  });
  assert.equal(reference.ruleTemplateApplication.traceRole, "prospective");
  assert.equal(reference.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.equal(reference.ruleTemplateApplication.patternProjectionPresence, 1);
  assert.equal(reference.ruleTemplateApplication.patternProjectionProgress, 0);
  assert.equal(reference.ruleTemplateApplication.matchProgress, 0);
  assert.equal(reference.ruleTemplateApplication.matchPresence, 0);
  assert.equal(reference.ruleTemplateApplication.bindingProgress, 0);
  assert.equal(reference.ruleTemplateApplication.sourcePresence, 1);
  assert.equal(reference.ruleTemplateApplication.targetPresence, 0);
  assert.equal(reference.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(reference.ruleTemplateApplication.depthLens.sourceFramePresence, 1);
  assert.equal(reference.ruleTemplateApplication.depthLens.templateFramePresence, 1);
  assert.equal(
    reference.ruleTemplateApplication.explanationBeatId,
    "recognize-rule"
  );
  assert.equal(
    reference.ruleTemplateApplication.depthLens.schemaPlanePresence,
    1
  );

  const returnedSubject = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.406
  });
  assert.equal(returnedSubject.ruleTemplateApplication.sourcePresence, 1);
  assert.equal(returnedSubject.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.ok(
    returnedSubject.ruleTemplateApplication.patternProjectionPresence > 0
  );
  assert.equal(
    returnedSubject.ruleTemplateApplication.explanationBeatId,
    "match-structure"
  );

  const match = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.52
  });
  assert.equal(match.ruleTemplateApplication.traceRole, "prospective");
  assert.equal(match.ruleTemplateApplication.receiverFocus, 1);
  assert.equal(match.ruleTemplateApplication.panelPresence, 1);
  assert.equal(match.ruleTemplateApplication.matchProgress, 1);
  assert.equal(match.ruleTemplateApplication.matchPresence, 1);
  assert.equal(
    match.ruleTemplateApplication.metavariableBindingsPresence,
    0
  );
  assert.equal(match.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.equal(match.ruleTemplateApplication.patternProjectionPresence, 1);
  assert.equal(match.ruleTemplateApplication.patternProjectionProgress, 1);
  assert.equal(
    match.ruleTemplateApplication.rulePreviewWithdrawalProgress,
    0
  );
  assert.equal(match.ruleTemplateApplication.instantiationProgress, 0);
  assert.equal(match.ruleTemplateApplication.templateRevealProgress, 0);
  assert.equal(match.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(match.ruleTemplateApplication.targetPresence, 0);
  assert.equal(match.ruleTemplateApplication.vacancyPresence, 0);
  assert.equal(match.ruleTemplateApplication.scaffoldPresence, 0);
  assert.equal(match.ruleTemplateApplication.bindingProgress, 0);
  assert.equal(
    match.ruleTemplateApplication.receiverSettlementProgress,
    0
  );
  assert.equal(match.ruleTemplateApplication.syntaxPresence, 0);
  assert.equal(match.ruleTemplateApplication.closurePresence, 0);
  assert.equal(match.ruleTemplateApplication.explanationBeatId,
    "match-structure");
  assert.equal(
    match.ruleTemplateApplication.depthLens.correspondencePlanePresence,
    1
  );
  assert.ok(
    match.ruleTemplateApplication.depthLens.registrationSeamProgress > 0
  );
  assert.equal(
    match.ruleTemplateApplication.syntaxResolutionProgress,
    0
  );

  const binding = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.67
  });
  assert.equal(binding.ruleTemplateApplication.traceRole, "prospective");
  assert.equal(binding.ruleTemplateApplication.receiverFocus, 1);
  assert.equal(binding.ruleTemplateApplication.panelPresence, 1);
  assert.equal(
    binding.ruleTemplateApplication.metavariableBindingsPresence,
    1
  );
  assert.equal(binding.ruleTemplateApplication.instantiatedResultPresence, 0);
  assert.equal(binding.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.ok(binding.ruleTemplateApplication.patternProjectionPresence > 0);
  assert.equal(binding.ruleTemplateApplication.patternProjectionProgress, 1);
  assert.equal(binding.ruleTemplateApplication.vacancyPresence, 0);
  assert.ok(binding.ruleTemplateApplication.bindingProgress >
    binding.ruleTemplateApplication.syntaxResolutionProgress);
  assert.equal(binding.ruleTemplateApplication.instantiationProgress, 0);
  assert.equal(binding.ruleTemplateApplication.templateRevealProgress, 0);
  assert.equal(binding.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(binding.ruleTemplateApplication.syntaxPresence, 0);
  assert.equal(binding.ruleTemplateApplication.closurePresence, 0);
  assert.equal(
    binding.ruleTemplateApplication.receiverSettlementProgress,
    0
  );
  assert.equal(binding.ruleTemplateApplication.syntaxResolutionProgress, 0);
  assert.equal(binding.ruleTemplateApplication.explanationBeatId,
    "bind-metavariables");

  const revealed = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.78
  });
  assert.equal(revealed.ruleTemplateApplication.traceRole, "prospective");
  assert.ok(revealed.ruleTemplateApplication.templateRevealProgress > 0);
  assert.ok(revealed.ruleTemplateApplication.templateSlotPresence > 0);
  assert.equal(revealed.ruleTemplateApplication.instantiationProgress, 0);
  assert.equal(revealed.ruleTemplateApplication.sourcePresence, 1);
  assert.ok(revealed.ruleTemplateApplication.targetPresence > 0);
  assert.equal(revealed.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.equal(revealed.ruleTemplateApplication.patternProjectionPresence, 0);
  assert.equal(revealed.ruleTemplateApplication.explanationBeatId,
    "instantiate-template");
  assert.ok(
    revealed.ruleTemplateApplication.depthLens.prospectivePlaneDepth > 0
  );

  const instantiated = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.9
  });
  assert.equal(
    instantiated.ruleTemplateApplication.metavariableBindingsPresence,
    0
  );
  assert.equal(
    instantiated.ruleTemplateApplication.instantiatedResultPresence,
    1
  );
  assert.equal(instantiated.ruleTemplateApplication.instantiationProgress, 1);
  assert.equal(instantiated.ruleTemplateApplication.templateRevealProgress, 1);
  assert.equal(instantiated.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(instantiated.ruleTemplateApplication.sourcePresence, 1);
  assert.equal(instantiated.ruleTemplateApplication.targetPresence, 1);
  assert.equal(instantiated.ruleTemplateApplication.rewriteCommitProgress, 0);
  assert.equal(instantiated.ruleTemplateApplication.rulePreviewPresence, 1);
  assert.equal(instantiated.ruleTemplateApplication.patternProjectionPresence, 0);
  assert.equal(instantiated.ruleTemplateApplication.explanationBeatId,
    "explain-closure");
  assert.equal(
    sampleKpAntiderivativeRuleTemplateApplication(0.85).explanationBeatId,
    "propagate-binding"
  );

  const rewriting = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.935
  });
  assert.equal(rewriting.ruleTemplateApplication.instantiatedResultPresence, 1);
  assert.ok(rewriting.ruleTemplateApplication.rewriteCommitProgress > 0);
  assert.ok(rewriting.ruleTemplateApplication.rewriteCommitProgress < 1);
  assert.ok(rewriting.ruleTemplateApplication.sourcePresence < 1);
  assert.equal(rewriting.ruleTemplateApplication.targetPresence, 1);
  assert.ok(rewriting.ruleTemplateApplication.rulePreviewPresence > 0);
  assert.ok(
    rewriting.ruleTemplateApplication.rulePreviewWithdrawalProgress > 0
  );
  assert.ok(
    rewriting.ruleTemplateApplication.rulePreviewWithdrawalProgress < 1
  );
  assert.equal(rewriting.ruleTemplateApplication.explanationBeatId,
    "commit-rewrite");

  const resolved = sampleKpAntiderivativePowerChoreography({
    plan,
    progress: 0.96
  });
  assert.equal(resolved.ruleTemplateApplication.traceRole, "live");
  assert.equal(resolved.ruleTemplateApplication.receiverFocus, 0);
  assert.equal(resolved.ruleTemplateApplication.panelPresence, 0);
  assert.equal(
    resolved.ruleTemplateApplication.metavariableBindingsPresence,
    0
  );
  assert.equal(resolved.ruleTemplateApplication.instantiatedResultPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.instantiationProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.templateRevealProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.templateSlotPresence, 0);
  assert.equal(resolved.ruleTemplateApplication.sourcePresence, 0);
  assert.equal(resolved.ruleTemplateApplication.targetPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.rewriteCommitProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.rulePreviewPresence, 0);
  assert.equal(resolved.ruleTemplateApplication.patternProjectionPresence, 0);
  assert.equal(resolved.ruleTemplateApplication.vacancyPresence, 0);
  assert.equal(resolved.ruleTemplateApplication.scaffoldPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.bindingProgress, 1);
  assert.equal(
    resolved.ruleTemplateApplication.receiverSettlementProgress,
    1
  );
  assert.equal(resolved.ruleTemplateApplication.syntaxPresence, 1);
  assert.equal(resolved.ruleTemplateApplication.syntaxResolutionProgress, 1);
  assert.equal(resolved.ruleTemplateApplication.closurePresence, 1);
  assert.equal(resolved.ruleTemplateApplication.explanationBeatId,
    "prepare-reduction");
  assert.equal(
    resolved.ruleTemplateApplication.depthLens.prospectivePlaneDepth,
    0
  );
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
