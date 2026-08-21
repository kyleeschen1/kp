import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedInversePowerOperation,
  KP_INVERSE_POWER_OPERATION_AUTHORITY,
  KpInversePowerSemanticError,
  verifyKpInversePowerOperation,
  type KpEvenNegativeInversePowerDraft,
  type KpEvenPositiveInversePowerDraft,
  type KpEvenZeroInversePowerDraft,
  type KpInversePowerOperationDraft,
  type KpOddInversePowerDraft
} from "../src/semantic/inverse-power-operation.ts";
import {
  normalizeKpRadicalEndpoint,
  type KpNormalizedPowerRootEndpoint,
  type KpNormalizedRadicalRootEndpoint
} from "../src/semantic/radical-endpoint-normalizer.ts";

test("even positive inversion requires two explicit verified branches", () => {
  const operation = verifyKpInversePowerOperation(evenPositiveDraft());
  assert.equal(operation.operationAuthority,
    KP_INVERSE_POWER_OPERATION_AUTHORITY);
  assert.equal(operation.solutionSet.multiplicity, 2);
  assert.deepEqual(operation.solutionSet.branches.map(({ sign }) => sign), [
    "positive",
    "negative"
  ]);
  assert.deepEqual(operation.correspondence.map(({ relation }) => relation), [
    "identity",
    "identity",
    "identity",
    "role-transfer",
    "derivation",
    "branching"
  ]);
  assert.deepEqual(operation.correspondence.at(-1)?.targetEntityIds, [
    "target.branch.positive",
    "target.branch.negative"
  ]);
  assert.equal(isKpVerifiedInversePowerOperation(operation), true);
  assert.equal(Object.isFrozen(operation), true);
});

test("odd inversion has one branch for negative real radicands", () => {
  const operation = verifyKpInversePowerOperation(oddNegativeDraft());
  assert.equal(operation.exponentEvidence.parity, "odd");
  assert.equal(operation.domainEvidence.radicandSign, "negative");
  assert.equal(operation.solutionSet.multiplicity, 1);
  assert.equal(operation.solutionSet.branches[0].sign, "unique-real");
});

test("even zero and negative radicands have distinct typed solution sets", () => {
  const zero = verifyKpInversePowerOperation(evenZeroDraft());
  const negative = verifyKpInversePowerOperation(evenNegativeDraft());
  assert.deepEqual([
    zero.solutionSet.kind,
    zero.solutionSet.multiplicity,
    zero.solutionSet.branches[0]?.sign
  ], ["enumerated-real-roots", 1, "zero"]);
  assert.deepEqual([
    negative.solutionSet.kind,
    negative.solutionSet.multiplicity,
    negative.solutionSet.branches.length,
    negative.solutionSet.candidateAudit.rejectedCandidates[0]?.reason
  ], ["no-real-roots", 0, 0, "outside-declared-real-domain"]);
});

test("source exponent target root index and parity must agree", () => {
  const mismatched = {
    ...evenPositiveDraft(),
    target: {
      ...evenPositiveDraft().target,
      endpoint: radicalEndpoint("\\sqrt[4]{9}")
    }
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(mismatched, "inverse-power.index-mismatch");

  const wrongParity = {
    ...evenPositiveDraft(),
    exponentEvidence: {
      ...evenPositiveDraft().exponentEvidence,
      parity: "odd"
    }
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(wrongParity, "inverse-power.ambiguous-parity");
});

test("symbolic parity cannot silently choose a root branch", () => {
  const symbolic = {
    ...evenPositiveDraft(),
    source: {
      ...evenPositiveDraft().source,
      endpoint: powerEndpoint("x^n")
    }
  } as KpInversePowerOperationDraft;
  assertSemanticError(symbolic, "inverse-power.index-mismatch");
});

test("runtime validation rejects omitted branches and incomplete audits", () => {
  const branchMissing = {
    ...evenPositiveDraft(),
    solutionSet: {
      ...evenPositiveDraft().solutionSet,
      multiplicity: 1,
      branches: [evenPositiveDraft().solutionSet.branches[0]],
      candidateAudit: {
        ...evenPositiveDraft().solutionSet.candidateAudit,
        acceptedBranchIds: ["branch.positive"]
      }
    }
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(branchMissing, "inverse-power.branch-cardinality");

  const noRejectionEvidence = {
    ...evenNegativeDraft(),
    solutionSet: {
      ...evenNegativeDraft().solutionSet,
      candidateAudit: {
        ...evenNegativeDraft().solutionSet.candidateAudit,
        rejectedCandidates: []
      }
    }
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(noRejectionEvidence, "inverse-power.candidate-audit");
});

test("semantic authority excludes callbacks timing and geometry", () => {
  const withCallback = {
    ...evenPositiveDraft(),
    sample: () => undefined
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(withCallback, "inverse-power.unexpected-field");

  const withTiming = {
    ...evenPositiveDraft(),
    timing: { durationMs: 800 }
  } as unknown as KpInversePowerOperationDraft;
  assertSemanticError(withTiming, "inverse-power.unexpected-field");
});

function evenPositiveDraft(): KpEvenPositiveInversePowerDraft {
  return {
    ...draftBase("x^2", "\\sqrt{9}", "semantic.value.nine"),
    exponentEvidence: exponentEvidence(2, "even"),
    domainEvidence: domainEvidence("positive"),
    solutionSet: {
      kind: "enumerated-real-roots",
      multiplicity: 2,
      branches: [
        branch("positive"),
        branch("negative")
      ],
      candidateAudit: candidateAudit([
        "branch.positive",
        "branch.negative"
      ])
    }
  };
}

function evenZeroDraft(): KpEvenZeroInversePowerDraft {
  return {
    ...draftBase("x^2", "\\sqrt{0}", "semantic.value.zero"),
    exponentEvidence: exponentEvidence(2, "even"),
    domainEvidence: domainEvidence("zero"),
    solutionSet: {
      kind: "enumerated-real-roots",
      multiplicity: 1,
      branches: [branch("zero")],
      candidateAudit: candidateAudit(["branch.zero"])
    }
  };
}

function evenNegativeDraft(): KpEvenNegativeInversePowerDraft {
  return {
    ...draftBase("x^2", "\\sqrt{-1}", "semantic.value.negative-one"),
    exponentEvidence: exponentEvidence(2, "even"),
    domainEvidence: domainEvidence("negative"),
    solutionSet: {
      kind: "no-real-roots",
      multiplicity: 0,
      branches: [],
      candidateAudit: {
        ...candidateAudit([]),
        rejectedCandidates: [{
          id: "candidate.non-real-root",
          candidateSemanticId: "semantic.candidate.non-real-root",
          reason: "outside-declared-real-domain",
          rejectionEvidenceId: "evidence.candidate.non-real-root"
        }]
      }
    }
  };
}

function oddNegativeDraft(): KpOddInversePowerDraft {
  return {
    ...draftBase("x^3", "\\sqrt[3]{-8}", "semantic.value.negative-eight"),
    exponentEvidence: exponentEvidence(3, "odd"),
    domainEvidence: domainEvidence("negative"),
    solutionSet: {
      kind: "enumerated-real-roots",
      multiplicity: 1,
      branches: [branch("unique-real")],
      candidateAudit: candidateAudit(["branch.unique-real"])
    }
  };
}

function draftBase(
  sourceLatex: string,
  targetLatex: string,
  rightSemanticId: string
) {
  return {
    schemaVersion: "kp.inverse-power-operation.v1" as const,
    id: `operation.inverse-power.${sourceLatex}.${targetLatex}`,
    operationAuthority: KP_INVERSE_POWER_OPERATION_AUTHORITY,
    lawAuthority: {
      id: "law.equation.inverse-positive-integer-power-over-reals" as const,
      authorityRefId: "definition.inverse-power.real-positive-integer",
      level: "strict" as const
    },
    relation: {
      semanticId: "semantic.relation.equality",
      sourceEntityId: "source.relation",
      targetEntityId: "target.relation"
    },
    source: {
      stateId: "state.inverse-power.source",
      poweredExpressionEntityId: "source.power",
      base: occurrence("source.base", "semantic.variable.x"),
      exponentEntityId: "source.exponent",
      right: occurrence("source.right", rightSemanticId),
      endpoint: powerEndpoint(sourceLatex)
    },
    target: {
      stateId: "state.inverse-power.target",
      subject: occurrence("target.subject", "semantic.variable.x"),
      rootExpressionEntityId: "target.root-expression",
      radicalOperatorEntityId: "target.radical-operator",
      rootIndexEntityId: "target.root-index",
      radicand: occurrence("target.radicand", rightSemanticId),
      endpoint: radicalEndpoint(targetLatex)
    }
  };
}

function occurrence(entityId: string, semanticId: string) {
  return { entityId, semanticId };
}

function exponentEvidence<Parity extends "even" | "odd">(
  exponent: number,
  parity: Parity
) {
  return {
    kind: "positive-integer-exponent" as const,
    exponent,
    parity,
    positiveIntegerEvidenceId: `evidence.exponent.${exponent}.positive-integer`,
    parityEvidenceId: `evidence.exponent.${exponent}.${parity}`
  };
}

function domainEvidence<Sign extends "positive" | "zero" | "negative">(
  radicandSign: Sign
) {
  return {
    scalarDomain: "real" as const,
    sourceBaseDomainEvidenceId: "evidence.source-base.real",
    rightValueDomainEvidenceId: "evidence.right-value.real",
    radicandSign,
    radicandSignEvidenceId: `evidence.radicand.${radicandSign}`
  };
}

function branch<Sign extends "positive" | "negative" | "zero" | "unique-real">(
  sign: Sign
) {
  return {
    id: `branch.${sign}`,
    sign,
    solutionSemanticId: `semantic.solution.${sign}`,
    candidateEntityId: `target.branch.${sign}`,
    substitutionEvidenceId: `evidence.substitution.${sign}`
  };
}

function candidateAudit<Ids extends readonly string[]>(acceptedBranchIds: Ids) {
  return {
    kind: "complete-candidate-audit" as const,
    acceptedBranchIds,
    rejectedCandidates: [],
    completenessEvidenceId: "evidence.candidate-audit.complete"
  };
}

function powerEndpoint(latex: string): KpNormalizedPowerRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  assert.equal(result.status, "normalized", latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "power") {
    throw new Error(`Expected ${latex} to normalize as a power.`);
  }
  return result.endpoint;
}

function radicalEndpoint(latex: string): KpNormalizedRadicalRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  assert.equal(result.status, "normalized", latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "radical") {
    throw new Error(`Expected ${latex} to normalize as a radical.`);
  }
  return result.endpoint;
}

function assertSemanticError(
  draft: KpInversePowerOperationDraft,
  code: KpInversePowerSemanticError["code"]
): void {
  assert.throws(() => verifyKpInversePowerOperation(draft),
    (error: unknown) =>
      error instanceof KpInversePowerSemanticError && error.code === code);
}
