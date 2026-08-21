import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  KpRootRewritePlanError,
  kpRootRewritePlanDeclarations,
  type KpRootRewriteOccurrence,
  type KpRootRewritePlanDraft
} from "../src/semantic/root-rewrite-plan.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "../src/semantic/root-rewrite-vocabulary.ts";

test("compound normalization derives carrier policy from the declaration", () => {
  const result = compileKpRootRewritePlan(compoundDraft());
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(isKpVerifiedRootRewritePlan(result.plan), true);
  assert.equal(result.plan.execution, "atomic");
  assert.deepEqual(result.plan.dispositions.map(({ kind }) => kind),
    ["persist", "consume", "introduce"]);
  assert.deepEqual(result.plan.dispositions[0], {
    kind: "persist",
    sourceEntityIds: ["source.carrier"],
    targetEntityIds: ["target.carrier"],
    evidenceIds: ["evidence.perfect-square"]
  });
  assert.equal(Object.isFrozen(result.plan), true);
  assert.doesNotMatch(JSON.stringify(result.plan),
    /geometry|keyframe|opacity|renderer|duration/u);
});

test("carrier persistence fails closed on semantic or subtree mismatch", () => {
  for (const targetCarrier of [
    occurrence("target.carrier", "semantic.other", "subtree.x-plus-one",
      "compound"),
    occurrence("target.carrier", "semantic.x-plus-one", "subtree.other",
      "compound")
  ]) {
    const draft = compoundDraft();
    assert.throws(() => compileKpRootRewritePlan({
      ...draft,
      roleBindings: { ...draft.roleBindings,
        "target-carrier": targetCarrier }
    }), (error) => error instanceof KpRootRewritePlanError &&
      error.code === "root-rewrite.carrier-identity-mismatch");
  }
});

test("blocked radical distribution returns a typed gap and no plan", () => {
  const result = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.blocked-sum",
    operationClass: "blocked-rewrite",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: "state.blocked.source",
    roleBindings: {
      "source-expression": occurrence("source.expression",
        "semantic.sqrt-sum", "subtree.sqrt-sum", "compound")
    },
    evidence: { "no-valid-root-law": "evidence.no-root-distribution" },
    priorOperationIds: []
  });
  assert.deepEqual(result, {
    status: "typed-gap",
    diagnostic: {
      code: "root-rewrite.no-valid-law",
      operationClass: "blocked-rewrite",
      message: "No verified root law licenses the requested rewrite.",
      repair:
        "Retain the radical or provide an ordered prior operation with exact evidence."
    }
  });
});

test("assumption-qualified cancellation cannot omit domain evidence", () => {
  const roles = normalizationRoles(false);
  const incomplete = {
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.assumed-cancellation",
    operationClass: "assumption-qualified-cancellation",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: "state.assumption.source",
    targetStateId: "state.assumption.target",
    roleBindings: roles,
    evidence: {
      "even-positive-integer-power": "evidence.even-power"
    },
    priorOperationIds: []
  } as unknown as KpRootRewritePlanDraft<
    "assumption-qualified-cancellation">;
  assert.throws(() => compileKpRootRewritePlan(incomplete),
    (error) => error instanceof KpRootRewritePlanError &&
      error.code === "root-rewrite.evidence-mismatch");
});

test("composed derivation remains sequence-only and requires factoring", () => {
  const draft: KpRootRewritePlanDraft<"composed-derivation"> = {
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.factored-square",
    operationClass: "composed-derivation",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: "state.polynomial",
    targetStateId: "state.absolute-value",
    roleBindings: {
      "source-expression": occurrence("source.polynomial",
        "semantic.polynomial", "subtree.polynomial", "compound"),
      "target-carrier": occurrence("target.carrier", "semantic.x-plus-one",
        "subtree.x-plus-one", "compound"),
      "target-absolute-value-enclosure": occurrence("target.abs",
        "semantic.abs", "subtree.abs", "enclosure")
    },
    evidence: {
      "prior-factoring-state": "evidence.factored-state",
      "even-positive-integer-power": "evidence.even-power"
    },
    priorOperationIds: ["operation.equation.factor-perfect-square"]
  };
  const result = compileKpRootRewritePlan(draft);
  assert.equal(result.status, "verified");
  if (result.status === "verified") {
    assert.equal(result.plan.execution, "sequence-only");
    assert.deepEqual(result.plan.dispositions, []);
  }
  assert.throws(() => compileKpRootRewritePlan({
    ...draft,
    priorOperationIds: []
  }), (error) => error instanceof KpRootRewritePlanError &&
    error.code === "root-rewrite.prior-operation-mismatch");
});

test("declarations cover every root class without an extension switch", () => {
  assert.deepEqual(Object.keys(kpRootRewritePlanDeclarations), [
    "closed-evaluation",
    "inverse-normalization",
    "compound-carrier-normalization",
    "assumption-qualified-cancellation",
    "exponent-index-composition",
    "mixed-evaluation",
    "partial-extraction",
    "nested-root-composition",
    "blocked-rewrite",
    "composed-derivation"
  ]);
});

function compoundDraft(): KpRootRewritePlanDraft<
  "compound-carrier-normalization"> {
  return {
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.compound-carrier",
    operationClass: "compound-carrier-normalization",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: "state.compound.source",
    targetStateId: "state.compound.target",
    roleBindings: normalizationRoles(true),
    evidence: {
      "even-positive-integer-power": "evidence.perfect-square"
    },
    priorOperationIds: []
  };
}

function normalizationRoles(withAbsoluteValue: true): Readonly<{
  "source-radical": KpRootRewriteOccurrence;
  "source-exponent": KpRootRewriteOccurrence;
  "source-carrier": KpRootRewriteOccurrence;
  "target-carrier": KpRootRewriteOccurrence;
  "target-absolute-value-enclosure": KpRootRewriteOccurrence;
}>;
function normalizationRoles(withAbsoluteValue: false): Readonly<{
  "source-radical": KpRootRewriteOccurrence;
  "source-exponent": KpRootRewriteOccurrence;
  "source-carrier": KpRootRewriteOccurrence;
  "target-carrier": KpRootRewriteOccurrence;
}>;
function normalizationRoles(withAbsoluteValue: boolean) {
  const roles = {
    "source-radical": occurrence("source.radical", "semantic.radical",
      "subtree.source-radical", "operator"),
    "source-exponent": occurrence("source.exponent", "semantic.exponent.two",
      "subtree.exponent.two", "atomic"),
    "source-carrier": occurrence("source.carrier", "semantic.x-plus-one",
      "subtree.x-plus-one", "compound"),
    "target-carrier": occurrence("target.carrier", "semantic.x-plus-one",
      "subtree.x-plus-one", "compound")
  };
  return withAbsoluteValue
    ? { ...roles, "target-absolute-value-enclosure": occurrence("target.abs",
      "semantic.absolute-value", "subtree.target-abs", "enclosure") }
    : roles;
}

function occurrence(
  entityId: string,
  semanticId: string,
  subtreeId: string,
  subtreeKind: KpRootRewriteOccurrence["subtreeKind"]
): KpRootRewriteOccurrence {
  return { entityId, semanticId, subtreeId, subtreeKind };
}

