import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationEvaluationAnimationPack
} from "../src/animation/catalog-packs/operation-evaluation.ts";
import {
  compileKpDirectArithmeticEvaluationMigrationV2,
  compileKpEquationEvaluationMigrationV2,
  KpEquationEvaluationMigrationV2Error
} from "../src/domain-ir/equation-evaluation-migration-v2.ts";
import {
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  createKpGeneratedAddZeroCarrierSource,
  kpGeneratedAddZeroCarrierSelectorIds
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";
import {
  kpEquationGovernanceV2MigrationDeclarations
} from "../src/domain-ir/equation-governance-v2-migrations.ts";

const directIds = new Set([
  "animation.operation-evaluation.one-plus-two",
  "animation.operation-evaluation.five-plus-two",
  "animation.operation-evaluation.three-sixths",
  "animation.operation-evaluation.two-times-three"
]);

test("every direct arithmetic caller reaches one authoritative v2 evaluation plan", () => {
  const animations = createKpOperationEvaluationAnimationPack().filter(
    ({ id }) => directIds.has(id)
  );
  assert.equal(animations.length, directIds.size);
  for (const animation of animations) {
    const migration = compileKpDirectArithmeticEvaluationMigrationV2(animation);
    assert.equal(migration.assetId, animation.id);
    assert.equal(migration.presentationPlan.transitions.length, 1);
    assert.equal(
      migration.presentationPlan.transitions[0]?.evaluationAuthority
        ?.resolutionSource,
      "mandatory-evaluation-registry"
    );
    assert.equal(
      migration.presentationPlan.transitions[0]?.semanticOperation.operationId,
      migration.operationId
    );
    assert.equal(
      migration.presentationPlan.transitions[0]?.evaluationFamilyCertificate
        ?.resolutionSource,
      "compiler-validated-evaluation-authority"
    );
    assert.equal(
      migration.presentationPlan.transitions[0]?.evaluationFamilyCertificate
        ?.familyProfile.family,
      "contributor-fusion"
    );
  }
});

test("the static v2 migration ledger exactly names the compiled evaluation subgroup", () => {
  const evaluationDeclarations = kpEquationGovernanceV2MigrationDeclarations
    .filter(({ compilerId }) =>
      compilerId === "kp.equation-evaluation-migration-compiler.v2");
  assert.deepEqual(
    evaluationDeclarations.map(({ assetId }) =>
      assetId).sort(),
    [
      ...directIds,
      "animation.operation-evaluation.two-times-one-carrier",
      "animation.generated.add-zero"
    ].sort()
  );
  assert.ok(evaluationDeclarations.every(
    ({ compilerSourcePath, typographyPolicyId }) =>
      compilerSourcePath ===
        "src/domain-ir/equation-evaluation-migration-v2.ts" &&
      typographyPolicyId === "typography.equation.stage.v2"
  ));
});

test("identity callers preserve their carrier while using registered evaluation authority", () => {
  const twoTimesOne = createKpOperationEvaluationAnimationPack().find(
    ({ id }) => id ===
      "animation.operation-evaluation.two-times-one-carrier"
  )!;
  const ids = kpTwoTimesOneCarrierSelectorIds;
  const multiplication = compileKpEquationEvaluationMigrationV2({
    animation: twoTimesOne,
    operationId: "kp.semantic-motion.absorb-multiplicative-identity",
    roleBindings: {
      "operand-before": [ids.sourceCarrier],
      operator: [ids.sourceOperator],
      identity: [ids.sourceIdentityWitness],
      "operand-after": [ids.targetCarrier]
    }
  });
  const generated = createKpGeneratedAddZeroCarrierSource();
  const addIds = kpGeneratedAddZeroCarrierSelectorIds;
  const addition = compileKpEquationEvaluationMigrationV2({
    animation: generated.animation,
    operationId: "kp.semantic-motion.absorb-additive-identity",
    roleBindings: {
      "operand-before": [addIds.sourceCarrier],
      operator: [addIds.sourceOperator],
      identity: [addIds.sourceIdentityWitness],
      "operand-after": [addIds.targetCarrier]
    }
  });
  assert.deepEqual(
    [multiplication, addition].map((migration) =>
      migration.presentationPlan.transitions[0]?.evaluationAuthority
        ?.evaluationKind),
    ["identity", "identity"]
  );
});

test("the migration compiler rejects wrong endpoint roles before rendering", () => {
  const animation = createKpOperationEvaluationAnimationPack().find(
    ({ id }) => id === "animation.operation-evaluation.one-plus-two"
  )!;
  const targetId = animation.bundle.objects[1]!.selectors[0]!.id;
  assert.throws(
    () => compileKpEquationEvaluationMigrationV2({
      animation,
      operationId: "kp.arithmetic.add",
      roleBindings: {
        "operands-before": [targetId],
        "result-after": [targetId]
      }
    }),
    KpEquationEvaluationMigrationV2Error
  );
});
