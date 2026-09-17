import {
  addKpRationals,
  subtractKpRationals,
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import type {
  KpExactFractionForm,
  KpExactFractionTermDraft,
  KpExactIntegerOccurrenceDraft
} from "./exact-fraction-expression.ts";

export type {
  KpExactFractionForm
} from "./exact-fraction-expression.ts";

declare const kpVerifiedCommonDenominatorBrand: unique symbol;
declare const kpCommonDenominatorProofBrand: unique symbol;

const verifiedAlignments = new WeakSet<object>();
const sealedProofs = new WeakSet<object>();

export const KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY =
  "operation.equation.common-denominator-alignment.v1" as const;

export type KpCommonDenominatorIntegerOccurrence =
  KpExactIntegerOccurrenceDraft;

export type KpCommonDenominatorFractionTermDraft =
  KpExactFractionTermDraft;

export interface KpCommonDenominatorMultiplierDraft {
  readonly entityId: string;
  readonly semanticId: string;
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export interface KpCommonDenominatorAlignmentDraft {
  readonly operator?: "+" | "-";
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

export interface KpFractionEquivalenceMultiplier
extends KpCommonDenominatorMultiplierDraft {
  readonly exactValue: KpNormalizedRational;
}

export interface KpVerifiedCommonDenominatorAlignment
extends KpCommonDenominatorAlignmentDraft {
  readonly operator: "+" | "-";
  readonly lawId: "law.fraction.equivalent-common-denominator";
  readonly sourceForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly targetForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly equivalenceMultipliers: readonly [
    KpFractionEquivalenceMultiplier,
    KpFractionEquivalenceMultiplier
  ];
  readonly exactTotal: KpNormalizedRational;
  readonly proof: KpCommonDenominatorCertificate;
  readonly correspondence: readonly KpCommonDenominatorCorrespondence[];
  readonly [kpVerifiedCommonDenominatorBrand]: true;
}

export interface KpCommonDenominatorCorrespondence {
  readonly id: string;
  readonly relation: "identity" | "equivalence" | "derivation";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly summary: string;
}

export interface KpCommonDenominatorCertificate {
  readonly operator: "+" | "-";
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
    | "common-denominator.value-mismatch"
    | "common-denominator.invalid-id"
    | "common-denominator.state-alias"
    | "common-denominator.entity-alias"
    | "common-denominator.unexpected-field";

  constructor(
    code:
      | "common-denominator.unsupported-contract"
      | "common-denominator.invalid-denominator"
      | "common-denominator.invalid-factor"
      | "common-denominator.unaligned-target"
      | "common-denominator.value-mismatch"
      | "common-denominator.invalid-id"
      | "common-denominator.state-alias"
      | "common-denominator.entity-alias"
      | "common-denominator.unexpected-field",
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
  validateDraftShape(draft);
  if (draft.operator !== undefined && draft.operator !== "+" && draft.operator !== "-")
    fail("common-denominator.unsupported-contract", "Alignment requires an ordered addition or subtraction operator.");
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
    equivalenceMultipliers: draft.equivalenceMultipliers, operator: draft.operator ?? "+"
  });
  const verified = deepFreeze({
    ...draft,
    operator: draft.operator ?? "+",
    lawId: draft.lawAuthority.id,
    sourceForms: proof.sourceForms,
    targetForms: proof.targetForms,
    equivalenceMultipliers: proof.equivalenceMultipliers,
    exactTotal: proof.exactTotal,
    proof,
    correspondence: createCorrespondence(draft)
  }) as KpVerifiedCommonDenominatorAlignment;
  verifiedAlignments.add(verified);
  return verified;
}

function validateDraftShape(draft: KpCommonDenominatorAlignmentDraft): void {
  assertExactKeys(draft, [
    ...("operator" in draft ? ["operator"] : []),
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "source",
    "target",
    "equivalenceMultipliers"
  ], "alignment");
  assertExactKeys(draft.lawAuthority, [
    "id",
    "authorityRefId",
    "level"
  ], "lawAuthority");
  requireIds([draft.id, draft.lawAuthority.authorityRefId]);
  if (draft.source.stateId === draft.target.stateId) {
    fail(
      "common-denominator.state-alias",
      "Source and target alignment states require distinct identities."
    );
  }
  [draft.source, draft.target].forEach((stateValue, stateIndex) => {
    assertExactKeys(stateValue, [
      "stateId",
      "expressionEntityId",
      "operatorEntityId",
      "terms"
    ], `state[${stateIndex}]`);
    if (!Array.isArray(stateValue.terms) || stateValue.terms.length !== 2) {
      fail(
        "common-denominator.unexpected-field",
        "Bounded alignment requires exactly two ordered fraction terms."
      );
    }
    requireIds([
      stateValue.stateId,
      stateValue.expressionEntityId,
      stateValue.operatorEntityId
    ]);
    stateValue.terms.forEach((term, termIndex) => {
      assertExactKeys(term, [
        "termEntityId",
        "fractionEntityId",
        "divisionEntityId",
        "numerator",
        "denominator"
      ], `state[${stateIndex}].terms[${termIndex}]`);
      requireIds([
        term.termEntityId,
        term.fractionEntityId,
        term.divisionEntityId
      ]);
      [term.numerator, term.denominator].forEach((occurrence) => {
        assertExactKeys(occurrence, [
          "entityId",
          "semanticId",
          "value"
        ], "integerOccurrence");
        requireIds([occurrence.entityId, occurrence.semanticId]);
        if (typeof occurrence.value !== "bigint") {
          fail(
            "common-denominator.unexpected-field",
            "Exact fraction occurrences require bigint values."
          );
        }
      });
    });
  });
  if (!Array.isArray(draft.equivalenceMultipliers) ||
      draft.equivalenceMultipliers.length !== 2) {
    fail(
      "common-denominator.unexpected-field",
      "Bounded alignment requires exactly two explicit multipliers."
    );
  }
  draft.equivalenceMultipliers.forEach((factor, index) => {
    assertExactKeys(factor, [
      "entityId",
      "semanticId",
      "numerator",
      "denominator"
    ], `equivalenceMultipliers[${index}]`);
    requireIds([factor.entityId, factor.semanticId]);
    if (typeof factor.numerator !== "bigint" ||
        typeof factor.denominator !== "bigint") {
      fail(
        "common-denominator.unexpected-field",
        "Exact multipliers require bigint values."
      );
    }
  });
  const entityIds = [
    draft.source.expressionEntityId,
    draft.source.operatorEntityId,
    draft.target.expressionEntityId,
    draft.target.operatorEntityId,
    ...draft.source.terms.flatMap(termEntityIds),
    ...draft.target.terms.flatMap(termEntityIds),
    ...draft.equivalenceMultipliers.map(({ entityId }) => entityId)
  ];
  if (new Set(entityIds).size !== entityIds.length) {
    fail(
      "common-denominator.entity-alias",
      "Every state occurrence and explicit factor requires one entity ID."
    );
  }
}

function termEntityIds(term: KpCommonDenominatorFractionTermDraft) {
  return [
    term.termEntityId,
    term.fractionEntityId,
    term.divisionEntityId,
    term.numerator.entityId,
    term.denominator.entityId
  ];
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  path: string
): void {
  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const unexpected = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0 || unexpected.length > 0) {
    fail(
      "common-denominator.unexpected-field",
      `${path} fields differ: missing=${missing.join(",")}; ` +
        `unexpected=${unexpected.join(",")}.`
    );
  }
}

function requireIds(ids: readonly string[]): void {
  ids.forEach((id) => {
    if (!/^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u.test(id)) {
      fail(
        "common-denominator.invalid-id",
        `${id || "<blank>"} is not a protocol ID.`
      );
    }
  });
}

function createCorrespondence(
  draft: KpCommonDenominatorAlignmentDraft
): readonly KpCommonDenominatorCorrespondence[] {
  const result: KpCommonDenominatorCorrespondence[] = [
    correspondence(
      "correspondence.common-denominator.expression",
      "equivalence",
      [draft.source.expressionEntityId],
      [draft.target.expressionEntityId],
      "The complete expression preserves its exact value."
    ),
    correspondence(
      "correspondence.common-denominator.operator",
      "identity",
      [draft.source.operatorEntityId],
      [draft.target.operatorEntityId],
      draft.operator === "-" ? "The subtraction operator persists across denominator alignment."
        : "The addition operator persists across denominator alignment."
    )
  ];
  draft.source.terms.forEach((source, index) => {
    const target = draft.target.terms[index]!;
    const factor = draft.equivalenceMultipliers[index]!;
    const position = index === 0 ? "first" : "second";
    const unchanged = factor.numerator === 1n && factor.denominator === 1n &&
      source.numerator.value === target.numerator.value &&
      source.denominator.value === target.denominator.value;
    result.push(
      correspondence(
        `correspondence.common-denominator.${position}.term`,
        unchanged ? "identity" : "equivalence",
        [source.termEntityId],
        [target.termEntityId],
        unchanged
          ? "The untouched term persists as the same semantic addend."
          : "The transformed term remains exactly equivalent."
      ),
      correspondence(
        `correspondence.common-denominator.${position}.fraction`,
        unchanged ? "identity" : "equivalence",
        [source.fractionEntityId],
        [target.fractionEntityId],
        unchanged
          ? "The untouched fraction persists."
          : "The fraction persists by exact equivalence."
      ),
      correspondence(
        `correspondence.common-denominator.${position}.division`,
        "identity",
        [source.divisionEntityId],
        [target.divisionEntityId],
        "Native fraction division structure persists."
      ),
      correspondence(
        `correspondence.common-denominator.${position}.numerator`,
        unchanged ? "identity" : "derivation",
        unchanged
          ? [source.numerator.entityId]
          : [source.numerator.entityId, factor.entityId],
        [target.numerator.entityId],
        unchanged
          ? "The untouched numerator persists."
          : "The target numerator derives from the source and unit factor."
      ),
      correspondence(
        `correspondence.common-denominator.${position}.denominator`,
        unchanged ? "identity" : "derivation",
        unchanged
          ? [source.denominator.entityId]
          : [source.denominator.entityId, factor.entityId],
        [target.denominator.entityId],
        unchanged
          ? "The untouched denominator persists."
          : "The target denominator derives from the source and unit factor."
      ),
      correspondence(
        `correspondence.common-denominator.${position}.factor`,
        "derivation",
        [factor.entityId],
        [target.numerator.entityId, target.denominator.entityId],
        "The explicit unit factor contributes to both target branches."
      )
    );
  });
  return result;
}

function correspondence(
  id: string,
  relation: KpCommonDenominatorCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
): KpCommonDenominatorCorrespondence {
  return { id, relation, sourceEntityIds, targetEntityIds, summary };
}

export function certifyKpCommonDenominator(input: Readonly<{
  readonly operator?: "+" | "-";
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
  const operator = input.operator ?? "+";
  if (operator !== "+" && operator !== "-") fail("common-denominator.unsupported-contract", "Invalid alignment operator.");
  const combine = operator === "+" ? addKpRationals : subtractKpRationals;
  const sourceTotal = combine(sourceForms[0].value,
    sourceForms[1].value);
  const exactTotal = combine(targetForms[0].value,
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
    operator,
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
