import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";

declare const kpVerifiedCommonDenominatorBrand: unique symbol;
declare const kpCommonDenominatorProofBrand: unique symbol;

const verifiedAlignments = new WeakSet<object>();
const sealedProofs = new WeakSet<object>();

export const KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY =
  "operation.equation.common-denominator-alignment.v1" as const;

export interface KpCommonDenominatorIntegerOccurrence {
  readonly entityId: string;
  readonly semanticId: string;
  readonly value: bigint;
}

export interface KpCommonDenominatorFractionTermDraft {
  readonly termEntityId: string;
  readonly fractionEntityId: string;
  readonly divisionEntityId: string;
  readonly numerator: KpCommonDenominatorIntegerOccurrence;
  readonly denominator: KpCommonDenominatorIntegerOccurrence;
}

export interface KpCommonDenominatorMultiplierDraft {
  readonly entityId: string;
  readonly semanticId: string;
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export interface KpCommonDenominatorAlignmentDraft {
  readonly schemaVersion: "kp.common-denominator-alignment.v1";
  readonly id: string;
  readonly operationAuthority:
    typeof KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    readonly id: "law.fraction.equivalent-common-denominator";
    readonly authorityRefId: string;
    readonly level: "strict";
  }>;
  readonly source: Readonly<{
    readonly stateId: string;
    readonly expressionEntityId: string;
    readonly operatorEntityId: string;
    readonly terms: readonly [
      KpCommonDenominatorFractionTermDraft,
      KpCommonDenominatorFractionTermDraft
    ];
  }>;
  readonly target: Readonly<{
    readonly stateId: string;
    readonly expressionEntityId: string;
    readonly operatorEntityId: string;
    readonly terms: readonly [
      KpCommonDenominatorFractionTermDraft,
      KpCommonDenominatorFractionTermDraft
    ];
  }>;
  /**
   * Factors are explicit witnesses supplied by the caller. This bounded
   * operation verifies them; it never searches for an LCM or invents one.
   */
  readonly equivalenceMultipliers: readonly [
    KpCommonDenominatorMultiplierDraft,
    KpCommonDenominatorMultiplierDraft
  ];
}

export interface KpExactFractionForm {
  readonly numerator: bigint;
  readonly denominator: bigint;
  readonly value: KpNormalizedRational;
}

export interface KpFractionEquivalenceMultiplier
extends KpCommonDenominatorMultiplierDraft {
  readonly exactValue: KpNormalizedRational;
}

export interface KpVerifiedCommonDenominatorAlignment
extends KpCommonDenominatorAlignmentDraft {
  readonly lawId: "law.fraction.equivalent-common-denominator";
  readonly sourceForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly targetForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly equivalenceMultipliers: readonly [
    KpFractionEquivalenceMultiplier,
    KpFractionEquivalenceMultiplier
  ];
  readonly exactTotal: KpNormalizedRational;
  readonly proof: KpCommonDenominatorCertificate;
  readonly [kpVerifiedCommonDenominatorBrand]: true;
}

export interface KpCommonDenominatorCertificate {
  readonly schemaVersion: "kp.common-denominator-certificate.v1";
  readonly id: string;
  readonly lawId: "law.fraction.equivalent-common-denominator";
  readonly sourceForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly targetForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly equivalenceMultipliers: readonly [
    KpFractionEquivalenceMultiplier,
    KpFractionEquivalenceMultiplier
  ];
  readonly exactTotal: KpNormalizedRational;
  readonly [kpCommonDenominatorProofBrand]: true;
}

export class KpCommonDenominatorSemanticError extends Error {
  override readonly name = "KpCommonDenominatorSemanticError";
  readonly code:
    | "common-denominator.unsupported-contract"
    | "common-denominator.invalid-denominator"
    | "common-denominator.invalid-factor"
    | "common-denominator.unaligned-target"
    | "common-denominator.value-mismatch";

  constructor(
    code:
      | "common-denominator.unsupported-contract"
      | "common-denominator.invalid-denominator"
      | "common-denominator.invalid-factor"
      | "common-denominator.unaligned-target"
      | "common-denominator.value-mismatch",
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

/**
 * Verifies caller-supplied arithmetic witnesses. Common-denominator search is
 * intentionally outside this authority, so verification stays deterministic
 * and cannot silently become a solver.
 */
export function verifyKpCommonDenominatorAlignment(
  draft: KpCommonDenominatorAlignmentDraft
): KpVerifiedCommonDenominatorAlignment {
  if (
    draft.schemaVersion !== "kp.common-denominator-alignment.v1" ||
    draft.operationAuthority !==
      KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY ||
    draft.lawAuthority.id !==
      "law.fraction.equivalent-common-denominator" ||
    draft.lawAuthority.level !== "strict"
  ) {
    fail(
      "common-denominator.unsupported-contract",
      "Unsupported common-denominator schema, operation, or law authority."
    );
  }
  const proof = certifyKpCommonDenominator({
    id: `${draft.id}.proof`,
    sourceForms: forms(draft.source.terms),
    targetForms: forms(draft.target.terms),
    equivalenceMultipliers: draft.equivalenceMultipliers
  });
  const verified = deepFreeze({
    ...draft,
    lawId: draft.lawAuthority.id,
    sourceForms: proof.sourceForms,
    targetForms: proof.targetForms,
    equivalenceMultipliers: proof.equivalenceMultipliers,
    exactTotal: proof.exactTotal,
    proof
  }) as KpVerifiedCommonDenominatorAlignment;
  verifiedAlignments.add(verified);
  return verified;
}

export function certifyKpCommonDenominator(input: Readonly<{
  readonly id: string;
  readonly sourceForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly targetForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly equivalenceMultipliers: readonly [
    KpCommonDenominatorMultiplierDraft,
    KpCommonDenominatorMultiplierDraft
  ];
}>): KpCommonDenominatorCertificate {
  const sourceForms = input.sourceForms.map(({ numerator, denominator }) =>
    createKpExactFractionForm(numerator, denominator)
  ) as unknown as readonly [KpExactFractionForm, KpExactFractionForm];
  const targetForms = input.targetForms.map(({ numerator, denominator }) =>
    createKpExactFractionForm(numerator, denominator)
  ) as unknown as readonly [KpExactFractionForm, KpExactFractionForm];
  const equivalenceMultipliers = input.equivalenceMultipliers.map((factor) =>
    createKpFractionEquivalenceMultiplier(factor)
  ) as unknown as readonly [
    KpFractionEquivalenceMultiplier,
    KpFractionEquivalenceMultiplier
  ];
  if (targetForms[0].denominator !== targetForms[1].denominator) {
    fail(
      "common-denominator.unaligned-target",
      "Both target fractions must expose one common denominator."
    );
  }
  sourceForms.forEach((source, index) => {
    const target = targetForms[index]!;
    const factor = equivalenceMultipliers[index]!;
    if (
      source.numerator * factor.numerator !== target.numerator ||
      source.denominator * factor.denominator !== target.denominator ||
      !equalKpRationals(source.value, target.value)
    ) {
      fail(
        "common-denominator.value-mismatch",
        "Each target term must be the exact source term scaled by its explicit unit factor."
      );
    }
  });
  const sourceTotal = addKpRationals(sourceForms[0].value,
    sourceForms[1].value);
  const exactTotal = addKpRationals(targetForms[0].value,
    targetForms[1].value);
  if (!equalKpRationals(sourceTotal, exactTotal)) {
    fail(
      "common-denominator.value-mismatch",
      "Common-denominator alignment must preserve the exact expression value."
    );
  }
  const proof = deepFreeze({
    schemaVersion: "kp.common-denominator-certificate.v1" as const,
    id: input.id,
    lawId: "law.fraction.equivalent-common-denominator" as const,
    sourceForms,
    targetForms,
    equivalenceMultipliers,
    exactTotal
  }) as KpCommonDenominatorCertificate;
  sealedProofs.add(proof);
  return proof;
}

export function createKpExactFractionForm(
  numerator: bigint,
  denominator: bigint
): KpExactFractionForm {
  if (denominator <= 0n) {
    fail(
      "common-denominator.invalid-denominator",
      "Exact fraction forms require positive denominators."
    );
  }
  return Object.freeze({
    numerator,
    denominator,
    value: createKpRational(numerator, denominator)
  });
}

export function createKpFractionEquivalenceMultiplier(
  factor: KpCommonDenominatorMultiplierDraft
): KpFractionEquivalenceMultiplier {
  if (factor.numerator <= 0n || factor.denominator <= 0n) {
    fail(
      "common-denominator.invalid-factor",
      "Common-denominator multipliers must have positive orientation."
    );
  }
  const exactValue = createKpRational(factor.numerator, factor.denominator);
  if (exactValue.numerator !== 1n || exactValue.denominator !== 1n) {
    fail(
      "common-denominator.invalid-factor",
      "Every explicit common-denominator multiplier must equal one."
    );
  }
  return Object.freeze({ ...factor, exactValue });
}

export function isKpCommonDenominatorProof(
  value: unknown
): value is KpCommonDenominatorCertificate {
  return typeof value === "object" && value !== null &&
    sealedProofs.has(value);
}

export function isKpVerifiedCommonDenominatorAlignment(
  value: unknown
): value is KpVerifiedCommonDenominatorAlignment {
  return typeof value === "object" && value !== null &&
    verifiedAlignments.has(value);
}

export const kpCanonicalCommonDenominatorAlignmentDraft = deepFreeze({
  schemaVersion: "kp.common-denominator-alignment.v1",
  id: "transformation.fraction.common-denominator.third-plus-sixth",
  operationAuthority: KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
  lawAuthority: {
    id: "law.fraction.equivalent-common-denominator",
    authorityRefId: "proof.exact-fraction.common-denominator",
    level: "strict"
  },
  source: state("source", [[1n, 3n], [1n, 6n]]),
  target: state("target", [[2n, 6n], [1n, 6n]]),
  equivalenceMultipliers: [
    multiplier("first", 2n, 2n),
    multiplier("second", 1n, 1n)
  ]
} satisfies KpCommonDenominatorAlignmentDraft);

export const kpCanonicalCommonDenominatorAlignment =
  verifyKpCommonDenominatorAlignment(
    kpCanonicalCommonDenominatorAlignmentDraft
  );

function forms(terms: KpCommonDenominatorAlignmentDraft[
  "source"
]["terms"]): readonly [KpExactFractionForm, KpExactFractionForm] {
  return terms.map(({ numerator, denominator }) => {
    return createKpExactFractionForm(numerator.value, denominator.value);
  }) as unknown as readonly [KpExactFractionForm, KpExactFractionForm];
}

function fail(
  code: KpCommonDenominatorSemanticError["code"],
  message: string
): never {
  throw new KpCommonDenominatorSemanticError(code, message);
}

function state(
  stage: "source" | "target",
  values: readonly [readonly [bigint, bigint], readonly [bigint, bigint]]
) {
  return {
    stateId: `state.fraction.common-denominator.${stage}`,
    expressionEntityId: `entity.fraction.common-denominator.${stage}.expression`,
    operatorEntityId: `entity.fraction.common-denominator.${stage}.plus`,
    terms: values.map(([numerator, denominator], index) => {
      const position = index === 0 ? "first" : "second";
      const prefix = `entity.fraction.common-denominator.${stage}.${position}`;
      return {
        termEntityId: `${prefix}.term`,
        fractionEntityId: `${prefix}.fraction`,
        divisionEntityId: `${prefix}.division`,
        numerator: {
          entityId: `${prefix}.numerator`,
          semanticId: `semantic.fraction.common-denominator.${position}.numerator`,
          value: numerator
        },
        denominator: {
          entityId: `${prefix}.denominator`,
          semanticId: `semantic.fraction.common-denominator.${position}.denominator`,
          value: denominator
        }
      };
    }) as unknown as KpCommonDenominatorAlignmentDraft[
      typeof stage
    ]["terms"]
  };
}

function multiplier(
  position: "first" | "second",
  numerator: bigint,
  denominator: bigint
) {
  return {
    entityId: `entity.fraction.common-denominator.${position}.multiplier`,
    semanticId: `semantic.fraction.common-denominator.${position}.unit-factor`,
    numerator,
    denominator
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
