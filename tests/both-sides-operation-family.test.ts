import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedBothSidesOperation,
  verifyKpBothSidesOperation,
  type KpAddBothSidesOperationDraft,
  type KpBothSidesOperationDraft,
  type KpDivideBothSidesOperationDraft,
  type KpMultiplyBothSidesOperationDraft,
  type KpSubtractBothSidesOperationDraft
} from "../src/semantic/both-sides-operation-family.ts";

const base = {
  schemaVersion: "kp.both-sides-operation.v1" as const,
  id: "operation.test",
  relation: {
    kind: "equality" as const,
    semanticId: "semantic.relation.equal",
    sourceEntityId: "source.equals",
    targetEntityId: "target.equals"
  },
  branches: {
    lhs: {
      side: "lhs" as const,
      sourceExpressionEntityIds: ["source.lhs"] as const,
      targetExpressionEntityIds: ["target.lhs"] as const,
      appliedEntityIds: ["target.lhs.operation"] as const
    },
    rhs: {
      side: "rhs" as const,
      sourceExpressionEntityIds: ["source.rhs"] as const,
      targetExpressionEntityIds: ["target.rhs"] as const,
      appliedEntityIds: ["target.rhs.operation"] as const
    }
  }
};

test("the family verifies all five data-only operation variants", () => {
  const drafts: readonly KpBothSidesOperationDraft[] = [
    unconditional("add", "law.equation.add-both-sides"),
    unconditional("subtract", "law.equation.subtract-both-sides"),
    nonzero("multiply", "law.equation.multiply-both-sides"),
    nonzero("divide", "law.equation.divide-both-sides"),
    {
      ...base,
      id: "operation.apply-log",
      operation: {
        kind: "apply-injective-function",
        functionSemanticId: "semantic.function.ln",
        lhsArgumentSemanticId: "semantic.argument.lhs",
        rhsArgumentSemanticId: "semantic.argument.rhs"
      },
      lawAuthority: {
        id: "law.equation.apply-injective-function",
        authorityRefId: "authority.log.injective",
        level: "strict"
      },
      domainEvidence: {
        kind: "injective-function-domain",
        functionSemanticId: "semantic.function.ln",
        lhsDomainEvidenceId: "evidence.lhs.positive",
        rhsDomainEvidenceId: "evidence.rhs.positive",
        injectivityEvidenceId: "evidence.ln.injective-positive"
      }
    }
  ];
  for (const draft of drafts) {
    const verified = verifyKpBothSidesOperation(draft);
    assert.equal(isKpVerifiedBothSidesOperation(verified), true);
    assert.equal(Object.isFrozen(verified), true);
  }
});

test("unsafe division and multiplication fail without matching nonzero evidence", () => {
  const draft = nonzero("divide", "law.equation.divide-both-sides");
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...draft,
      domainEvidence: {
        ...draft.domainEvidence,
        operandSemanticId: "semantic.value.other"
      }
    }),
    /must name the applied operand/
  );
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...nonzero("multiply", "law.equation.multiply-both-sides"),
      domainEvidence: {
        kind: "declared-relation-domain",
        evidenceIds: ["evidence.real"]
      }
    } as unknown as KpBothSidesOperationDraft),
    /requires nonzero-operand domain evidence/
  );
});

test("function application requires matching function and injectivity evidence", () => {
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...base,
      id: "operation.bad-log",
      operation: {
        kind: "apply-injective-function",
        functionSemanticId: "semantic.function.ln",
        lhsArgumentSemanticId: "semantic.argument.lhs",
        rhsArgumentSemanticId: "semantic.argument.rhs"
      },
      lawAuthority: {
        id: "law.equation.apply-injective-function",
        authorityRefId: "authority.log.injective",
        level: "strict"
      },
      domainEvidence: {
        kind: "injective-function-domain",
        functionSemanticId: "semantic.function.exp",
        lhsDomainEvidenceId: "evidence.lhs.positive",
        rhsDomainEvidenceId: "evidence.rhs.positive",
        injectivityEvidenceId: "evidence.ln.injective-positive"
      }
    }),
    /must name the applied function/
  );
});

test("callbacks and presentation policy cannot enter semantic authority", () => {
  const draft = unconditional("add", "law.equation.add-both-sides");
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...draft,
      execute: () => undefined
    } as unknown as KpBothSidesOperationDraft),
    /cannot contain a function/
  );
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...draft,
      durationMs: 500
    } as unknown as KpBothSidesOperationDraft),
    /Unexpected both-sides field operation.durationMs/
  );
});

test("branch roles must be total, distinct, and correctly sided", () => {
  const draft = unconditional("subtract", "law.equation.subtract-both-sides");
  assert.throws(
    () => verifyKpBothSidesOperation({
      ...draft,
      branches: {
        ...draft.branches,
        rhs: {
          ...draft.branches.rhs,
          appliedEntityIds: draft.branches.lhs.appliedEntityIds
        }
      }
    }),
    /distinct applied-entity occurrences/
  );
});

function unconditional(
  kind: "add",
  lawId: "law.equation.add-both-sides"
): KpAddBothSidesOperationDraft;
function unconditional(
  kind: "subtract",
  lawId: "law.equation.subtract-both-sides"
): KpSubtractBothSidesOperationDraft;
function unconditional(
  kind: "add" | "subtract",
  lawId: "law.equation.add-both-sides" |
    "law.equation.subtract-both-sides"
): KpAddBothSidesOperationDraft | KpSubtractBothSidesOperationDraft {
  return {
    ...base,
    id: `operation.${kind}`,
    operation: { kind, operandSemanticId: "semantic.value.three" },
    lawAuthority: {
      id: lawId,
      authorityRefId: `authority.${lawId}`,
      level: "strict"
    },
    domainEvidence: {
      kind: "declared-relation-domain",
      evidenceIds: ["evidence.real-equality"]
    }
  } as KpAddBothSidesOperationDraft | KpSubtractBothSidesOperationDraft;
}

function nonzero(
  kind: "multiply",
  lawId: "law.equation.multiply-both-sides"
): KpMultiplyBothSidesOperationDraft;
function nonzero(
  kind: "divide",
  lawId: "law.equation.divide-both-sides"
): KpDivideBothSidesOperationDraft;
function nonzero(
  kind: "multiply" | "divide",
  lawId: "law.equation.multiply-both-sides" |
    "law.equation.divide-both-sides"
): KpMultiplyBothSidesOperationDraft | KpDivideBothSidesOperationDraft {
  return {
    ...base,
    id: `operation.${kind}`,
    operation: { kind, operandSemanticId: "semantic.value.two" },
    lawAuthority: {
      id: lawId,
      authorityRefId: `authority.${lawId}`,
      level: "strict"
    },
    domainEvidence: {
      kind: "nonzero-operand",
      operandSemanticId: "semantic.value.two",
      evidenceId: "evidence.two.nonzero"
    }
  } as KpMultiplyBothSidesOperationDraft | KpDivideBothSidesOperationDraft;
}
