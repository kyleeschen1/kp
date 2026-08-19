import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpFractionEquivalencePresentationPlan,
  isKpFractionEquivalencePresentationPlan,
  kpCanonicalCompactFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan
} from "../src/animation/fraction-equivalence-presentation-plan.ts";
import {
  kpCanonicalFractionEquivalence,
  verifyKpFractionEquivalence
} from
  "../src/semantic/fraction-equivalence.ts";

test("explanatory fraction equivalence introduces a paired unit factor", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.equal(isKpFractionEquivalencePresentationPlan(plan), true);
  assert.equal(plan.mode, "explain-unit-factor");
  assert.deepEqual(plan.motif, {
    id: "motif.equation.fraction-equivalence-unit-factor-join.v1",
    primitiveAuthorityIds: [
      "kp.core.persist",
      "kp.core.introduce",
      "recipe.equation.fraction-material.v1"
    ],
    rendererPrimitive: "none"
  });
  assert.equal(plan.structureContinuity.kind,
    "native-fraction-structure");
  assert.deepEqual(plan.structureContinuity.divisionTransfer, {
    kind: "fraction-bar-fusion",
    correspondenceId: "correspondence.fraction-equivalence.division",
    relation: "many-to-one",
    sourceDivisionEntityIds: [
      "presentation.fraction-equivalence.unit-factor.division",
      "fraction-equivalence.source.division"
    ],
    targetDivisionEntityIds: [
      "fraction-equivalence.target.division"
    ]
  });
  assert.equal(plan.structureContinuity.settlement, "native-target");
});

test("source operands persist while a paired unit factor reaches both branches", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.deepEqual(plan.operandTransfers.map((transfer) => ({
    role: transfer.role,
    relation: transfer.relation,
    source: transfer.sourceEntityId,
    target: transfer.targetEntityId
  })), [{
    role: "numerator-source",
    relation: "identity",
    source: "fraction-equivalence.source.numerator",
    target: "fraction-equivalence.target.numerator-source"
  }, {
    role: "denominator-source",
    relation: "identity",
    source: "fraction-equivalence.source.denominator",
    target: "fraction-equivalence.target.denominator-source"
  }]);
  assert.deepEqual(plan.factorTransfer, {
    kind: "paired-unit-factor-transfer",
    correspondenceId: "correspondence.fraction-equivalence.factor",
    relation: "paired-occurrences",
    sourceSemanticEntityId: "fraction-equivalence.factor.parameter",
    sourceOccurrenceEntityIds: [
      "presentation.fraction-equivalence.unit-factor.numerator",
      "presentation.fraction-equivalence.unit-factor.denominator"
    ],
    targetEntityIds: [
      "fraction-equivalence.target.numerator-factor",
      "fraction-equivalence.target.denominator-factor"
    ],
    targetRoles: ["numerator-factor", "denominator-factor"],
    synchronization: "together"
  });
});

test("explanatory plan orders unit-factor composition before product joining", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.deepEqual(plan.phaseOrder, [
    "hold-source-structure",
    "introduce-unit-factor",
    "join-unit-factor-with-fraction",
    "join-target-products",
    "settle-native-target"
  ]);
  assert.equal(plan.targetProducts.cohesion,
    "join-after-material-arrival");
  assert.deepEqual(plan.targetProducts.notation, {
    factorOrder: "factor-then-source",
    numerator: "implicit-juxtaposition",
    denominator: "implicit-juxtaposition",
    evaluation: "preserve-unevaluated-product"
  });
  assert.deepEqual(plan.joinCohort, {
    id: "cohort.fraction-equivalence.material-join",
    memberRoles: [
      "factor-transfer",
      "operand-transfer",
      "division-transfer"
    ],
    arrival: "simultaneous"
  });
  assert.equal(new Set(plan.sourceSelectorIds).size,
    plan.sourceSelectorIds.length);
  assert.equal(new Set(plan.targetSelectorIds).size,
    plan.targetSelectorIds.length);
  assert.equal(Object.isFrozen(plan), true);
});

test("compact plan introduces synchronized branch factors without fan-out", () => {
  const plan = kpCanonicalCompactFractionEquivalencePresentationPlan;
  assert.equal(isKpFractionEquivalencePresentationPlan(plan), true);
  assert.equal(plan.mode, "compact-paired-operation");
  assert.deepEqual(plan.motif, {
    id: "motif.equation.fraction-equivalence-paired-application.v1",
    primitiveAuthorityIds: [
      "kp.core.persist",
      "kp.core.introduce",
      "recipe.equation.fraction-material.v1"
    ],
    rendererPrimitive: "none"
  });
  assert.deepEqual(plan.factorTransfer, {
    kind: "paired-operation-transfer",
    correspondenceId: "correspondence.fraction-equivalence.factor",
    relation: "paired-occurrences",
    sourceSemanticEntityId: "fraction-equivalence.factor.parameter",
    sourceOccurrenceEntityIds: [
      "presentation.fraction-equivalence.paired-operation.numerator",
      "presentation.fraction-equivalence.paired-operation.denominator"
    ],
    targetEntityIds: [
      "fraction-equivalence.target.numerator-factor",
      "fraction-equivalence.target.denominator-factor"
    ],
    targetRoles: ["numerator-factor", "denominator-factor"],
    synchronization: "together"
  });
  assert.deepEqual(plan.phaseOrder, [
    "hold-source-structure",
    "introduce-paired-branch-factors",
    "join-target-products",
    "settle-native-target"
  ]);
  assert.deepEqual(plan.structureContinuity.divisionTransfer, {
    kind: "fraction-bar-persistence",
    correspondenceId: "correspondence.fraction-equivalence.division",
    relation: "one-to-one",
    sourceDivisionEntityIds: [
      "fraction-equivalence.source.division"
    ],
    targetDivisionEntityIds: [
      "fraction-equivalence.target.division"
    ]
  });
});

test("numeric target products preserve explicit multiplication", () => {
  const semantic = verifyKpFractionEquivalence({
    schemaVersion: "kp.fraction-equivalence.v1",
    id: "transformation.fraction-equivalence.numeric-times-two",
    operationAuthority: "operation.equation.fraction-equivalence.v1",
    lawAuthority: {
      id: "law.fraction.scale-by-nonzero-unity",
      authorityRefId: "definition.fraction.equivalent-nonzero-scaling",
      level: "strict"
    },
    source: {
      stateId: "state.numeric-fraction.source",
      fractionEntityId: "fraction.numeric-fraction.source",
      divisionEntityId: "division.numeric-fraction.source",
      numerator: {
        kind: "number", entityId: "numerator.numeric-fraction.source",
        semanticId: "semantic.number.three", value: 3
      },
      denominator: {
        kind: "number", entityId: "denominator.numeric-fraction.source",
        semanticId: "semantic.number.five", value: 5
      }
    },
    factor: {
      kind: "number", entityId: "factor.numeric-fraction.two",
      semanticId: "semantic.number.two", value: 2
    },
    target: {
      stateId: "state.numeric-fraction.target",
      fractionEntityId: "fraction.numeric-fraction.target",
      divisionEntityId: "division.numeric-fraction.target",
      numeratorProductEntityId: "product.numeric-fraction.numerator",
      denominatorProductEntityId: "product.numeric-fraction.denominator",
      numeratorSourceOccurrenceEntityId: "occurrence.numeric-fraction.numerator",
      numeratorFactorOccurrenceEntityId:
        "occurrence.numeric-fraction.factor.top",
      denominatorSourceOccurrenceEntityId:
        "occurrence.numeric-fraction.denominator",
      denominatorFactorOccurrenceEntityId:
        "occurrence.numeric-fraction.factor.bottom"
    },
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId:
        "evidence.numeric-fraction.five-nonzero",
      scaleFactorNonzeroEvidenceId:
        "evidence.numeric-fraction.two-nonzero"
    }
  });
  const plan = compileKpFractionEquivalencePresentationPlan(semantic);
  assert.deepEqual(plan.targetProducts.notation, {
    factorOrder: "factor-then-source",
    numerator: "explicit-multiplication",
    denominator: "explicit-multiplication",
    evaluation: "preserve-unevaluated-product"
  });
});

test("copied semantic data cannot acquire presentation authority", () => {
  assert.throws(() => compileKpFractionEquivalencePresentationPlan({
    ...kpCanonicalFractionEquivalence
  }), /verifier-minted semantic truth/u);
});

test("presentation plan contains no clock geometry paint or host policy", async () => {
  const source = await readFile(new URL(
    "../src/animation/fraction-equivalence-presentation-plan.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:requestAnimationFrame|durationMs:|coordinates:|geometry:|color:|opacity:|\.svelte|HTMLElement|SVGElement)/u);
});
