import {
  KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
  KpLogarithmChangeOfBaseSemanticError,
  verifyKpLogarithmChangeOfBase,
  type KpLogarithmChangeOfBaseAtom,
  type KpLogarithmChangeOfBaseDraft,
  type KpLogarithmChangeOfBaseSemanticErrorCode
} from "./logarithm-change-of-base.ts";

export const KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY =
  "corpus.equation.logarithm-base.v1" as const;

export interface KpLogarithmChangeOfBaseCorpusCase {
  readonly id: string;
  readonly draft: KpLogarithmChangeOfBaseDraft;
  readonly expectedStatus: "verified" | "rejected";
  readonly expectedErrorCode?:
    KpLogarithmChangeOfBaseSemanticErrorCode | undefined;
}

export const kpLogarithmChangeOfBaseCorpus = deepFreeze({
  schemaVersion: "kp.logarithm-change-of-base-corpus.v1" as const,
  id: KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY,
  liveModelEvidence: false as const,
  cases: [
    accepted("two-seven", numberAtom("base", 2), numberAtom("argument", 7)),
    accepted("ten-hundred", numberAtom("base", 10),
      numberAtom("argument", 100)),
    accepted("symbolic-b-x", symbolAtom("base", "b"),
      symbolAtom("argument", "x")),
    rejected("zero-base", numberAtom("base", 0), numberAtom("argument", 7),
      "change-of-base.invalid-base"),
    rejected("unit-base", numberAtom("base", 1), numberAtom("argument", 7),
      "change-of-base.invalid-base"),
    rejected("nonfinite-base", numberAtom("base", Number.NaN),
      numberAtom("argument", 7), "change-of-base.invalid-base"),
    rejected("negative-argument", numberAtom("base", 2),
      numberAtom("argument", -7), "change-of-base.invalid-argument"),
    Object.freeze({
      id: "fixture.change-of-base.missing-evidence",
      draft: draft("missing-evidence", numberAtom("base", 2),
        numberAtom("argument", 7), { sourceBaseNotOneEvidenceId: "" }),
      expectedStatus: "rejected" as const,
      expectedErrorCode: "change-of-base.missing-evidence" as const
    }),
    Object.freeze({
      id: "fixture.change-of-base.identity-mismatch",
      draft: draft("identity-mismatch", numberAtom("base", 2),
        numberAtom("argument", 7), {}, "semantic.fabricated.base"),
      expectedStatus: "rejected" as const,
      expectedErrorCode: "change-of-base.identity-mismatch" as const
    })
  ]
});

export function evaluateKpLogarithmChangeOfBaseCorpus() {
  const cases = kpLogarithmChangeOfBaseCorpus.cases.map((fixture) => {
    try {
      verifyKpLogarithmChangeOfBase(fixture.draft);
      const actualStatus = "verified" as const;
      return Object.freeze({
        fixtureId: fixture.id,
        actualStatus,
        passed: fixture.expectedStatus === actualStatus
      });
    } catch (error) {
      const actualStatus = "rejected" as const;
      const actualErrorCode = error instanceof
        KpLogarithmChangeOfBaseSemanticError
        ? error.code
        : undefined;
      return Object.freeze({
        fixtureId: fixture.id,
        actualStatus,
        actualErrorCode,
        passed: fixture.expectedStatus === actualStatus &&
          fixture.expectedErrorCode === actualErrorCode
      });
    }
  });
  return deepFreeze({
    schemaVersion: "kp.logarithm-change-of-base-corpus-report.v1" as const,
    corpusId: kpLogarithmChangeOfBaseCorpus.id,
    status: cases.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    cases
  });
}

function accepted(
  suffix: string,
  base: KpLogarithmChangeOfBaseAtom,
  argument: KpLogarithmChangeOfBaseAtom
): KpLogarithmChangeOfBaseCorpusCase {
  return Object.freeze({
    id: `fixture.change-of-base.${suffix}`,
    draft: draft(suffix, base, argument),
    expectedStatus: "verified" as const
  });
}

function rejected(
  suffix: string,
  base: KpLogarithmChangeOfBaseAtom,
  argument: KpLogarithmChangeOfBaseAtom,
  expectedErrorCode: KpLogarithmChangeOfBaseSemanticErrorCode
): KpLogarithmChangeOfBaseCorpusCase {
  return Object.freeze({
    id: `fixture.change-of-base.${suffix}`,
    draft: draft(suffix, base, argument),
    expectedStatus: "rejected" as const,
    expectedErrorCode
  });
}

function draft(
  suffix: string,
  base: KpLogarithmChangeOfBaseAtom,
  argument: KpLogarithmChangeOfBaseAtom,
  evidenceOverrides: Partial<
    KpLogarithmChangeOfBaseDraft["domainEvidence"]
  > = {},
  targetBaseSemanticId = base.semanticId
): KpLogarithmChangeOfBaseDraft {
  return {
    schemaVersion: "kp.logarithm-change-of-base.v1",
    id: `transformation.change-of-base.${suffix}`,
    operationAuthority: KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
    lawAuthority: {
      id: "law.logarithm.change-of-base",
      authorityRefId: "definition.logarithm.change-of-base.natural-target",
      level: "strict"
    },
    source: {
      stateId: `state.${suffix}.source`,
      applicationEntityId: `source.${suffix}.application`,
      operatorEntityId: `source.${suffix}.operator`,
      base: withEntity(base, `source.${suffix}.base`),
      argument: withEntity(argument, `source.${suffix}.argument`)
    },
    target: {
      stateId: `state.${suffix}.target`,
      quotientEntityId: `target.${suffix}.quotient`,
      divisionEntityId: `target.${suffix}.division`,
      numerator: {
        applicationEntityId: `target.${suffix}.numerator.application`,
        operatorEntityId: `target.${suffix}.numerator.operator`,
        argument: withEntity(argument, `target.${suffix}.numerator.argument`)
      },
      denominator: {
        applicationEntityId: `target.${suffix}.denominator.application`,
        operatorEntityId: `target.${suffix}.denominator.operator`,
        argument: withEntity({ ...base, semanticId: targetBaseSemanticId },
          `target.${suffix}.denominator.argument`)
      }
    },
    domainEvidence: {
      sourceBasePositiveEvidenceId: `evidence.${suffix}.base-positive`,
      sourceBaseNotOneEvidenceId: `evidence.${suffix}.base-not-one`,
      sourceArgumentPositiveEvidenceId: `evidence.${suffix}.argument-positive`,
      naturalLogarithmTargetEvidenceId: `evidence.${suffix}.natural-target`,
      ...evidenceOverrides
    }
  };
}

function numberAtom(
  role: string,
  value: number
): KpLogarithmChangeOfBaseAtom {
  return Object.freeze({
    kind: "number" as const,
    entityId: `seed.${role}.${String(value)}`,
    semanticId: `semantic.${role}.${String(value)}`,
    value
  });
}

function symbolAtom(
  role: string,
  symbol: string
): KpLogarithmChangeOfBaseAtom {
  return Object.freeze({
    kind: "symbol" as const,
    entityId: `seed.${role}.${symbol}`,
    semanticId: `semantic.${role}.${symbol}`,
    symbol
  });
}

function withEntity(
  atom: KpLogarithmChangeOfBaseAtom,
  entityId: string
): KpLogarithmChangeOfBaseAtom {
  return atom.kind === "number"
    ? { ...atom, entityId }
    : { ...atom, entityId };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
