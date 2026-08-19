declare const kpVerifiedFractionEquivalenceBrand: unique symbol;

export const KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY =
  "operation.equation.fraction-equivalence.v1" as const;

export type KpFractionEquivalenceScalar =
  | Readonly<{
      readonly kind: "number";
      readonly entityId: string;
      readonly semanticId: string;
      readonly value: number;
    }>
  | Readonly<{
      readonly kind: "symbol";
      readonly entityId: string;
      readonly semanticId: string;
      readonly symbol: string;
    }>;

export interface KpFractionEquivalenceDraft {
  readonly schemaVersion: "kp.fraction-equivalence.v1";
  readonly id: string;
  readonly operationAuthority:
    typeof KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    readonly id: "law.fraction.scale-by-nonzero-unity";
    readonly authorityRefId: string;
    readonly level: "strict";
  }>;
  readonly source: Readonly<{
    readonly stateId: string;
    readonly fractionEntityId: string;
    readonly divisionEntityId: string;
    readonly numerator: KpFractionEquivalenceScalar;
    readonly denominator: KpFractionEquivalenceScalar;
  }>;
  readonly factor: KpFractionEquivalenceScalar;
  readonly target: Readonly<{
    readonly stateId: string;
    readonly fractionEntityId: string;
    readonly divisionEntityId: string;
    readonly numeratorProductEntityId: string;
    readonly denominatorProductEntityId: string;
    readonly numeratorSourceOccurrenceEntityId: string;
    readonly numeratorFactorOccurrenceEntityId: string;
    readonly denominatorSourceOccurrenceEntityId: string;
    readonly denominatorFactorOccurrenceEntityId: string;
  }>;
  readonly nonzeroEvidence: Readonly<{
    readonly sourceDenominatorNonzeroEvidenceId: string;
    readonly scaleFactorNonzeroEvidenceId: string;
  }>;
}

export type KpFractionEquivalenceCorrespondence = Readonly<{
  readonly id: string;
  readonly relation: "identity" | "copy" | "derivation" | "equivalence";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly summary: string;
}>;

export interface KpVerifiedFractionEquivalence
extends KpFractionEquivalenceDraft {
  readonly correspondence: readonly KpFractionEquivalenceCorrespondence[];
  readonly reverseLimits: Readonly<{
    readonly kind: "exact-fraction-equivalence-collapse";
    readonly fromStateId: string;
    readonly toStateId: string;
    readonly requiredLawId: "law.fraction.scale-by-nonzero-unity";
    readonly requiredEvidenceIds: readonly [string, string];
    readonly forbiddenGeneralizations: readonly [
      "zero-scale-factor",
      "zero-source-denominator",
      "unequal-numerator-denominator-factors",
      "factor-cancellation-without-evidence"
    ];
  }>;
  readonly [kpVerifiedFractionEquivalenceBrand]: true;
}

export class KpFractionEquivalenceSemanticError extends Error {
  override readonly name = "KpFractionEquivalenceSemanticError";
  readonly code:
    | "fraction-equivalence.unexpected-field"
    | "fraction-equivalence.invalid-id"
    | "fraction-equivalence.invalid-scalar"
    | "fraction-equivalence.zero-denominator"
    | "fraction-equivalence.zero-factor"
    | "fraction-equivalence.entity-alias"
    | "fraction-equivalence.state-alias"
    | "fraction-equivalence.evidence-alias";

  constructor(
    code:
      | "fraction-equivalence.unexpected-field"
      | "fraction-equivalence.invalid-id"
      | "fraction-equivalence.invalid-scalar"
      | "fraction-equivalence.zero-denominator"
      | "fraction-equivalence.zero-factor"
      | "fraction-equivalence.entity-alias"
      | "fraction-equivalence.state-alias"
      | "fraction-equivalence.evidence-alias",
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

const verifiedContracts = new WeakSet<object>();

/**
 * This verifier mints one bounded equality law. It deliberately derives no
 * simplification, cancellation, notation, timing, geometry, or motion.
 */
export function verifyKpFractionEquivalence(
  draft: KpFractionEquivalenceDraft
): KpVerifiedFractionEquivalence {
  assertExactKeys(draft, [
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "source",
    "factor",
    "target",
    "nonzeroEvidence"
  ], "fractionEquivalence");
  if (
    draft.schemaVersion !== "kp.fraction-equivalence.v1" ||
    draft.operationAuthority !== KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY
  ) fail(
    "fraction-equivalence.unexpected-field",
    "Unsupported fraction-equivalence schema or operation authority."
  );
  requireId(draft.id, "fractionEquivalence.id");
  validateLaw(draft.lawAuthority);
  validateSource(draft.source);
  validateScalar(draft.factor, "factor");
  validateTarget(draft.target);
  validateEvidence(draft.nonzeroEvidence);
  if (draft.source.stateId === draft.target.stateId) fail(
    "fraction-equivalence.state-alias",
    "Source and target states require distinct identities."
  );
  if (draft.source.denominator.kind === "number" &&
      draft.source.denominator.value === 0) fail(
    "fraction-equivalence.zero-denominator",
    "A source fraction with denominator zero is undefined."
  );
  if (draft.factor.kind === "number" && draft.factor.value === 0) fail(
    "fraction-equivalence.zero-factor",
    "Scaling numerator and denominator by zero does not preserve the fraction."
  );
  requireUniqueEntityIds(draft);

  const correspondence = createCorrespondence(draft);
  const verified = deepFreeze({
    ...draft,
    correspondence,
    reverseLimits: {
      kind: "exact-fraction-equivalence-collapse" as const,
      fromStateId: draft.target.stateId,
      toStateId: draft.source.stateId,
      requiredLawId: "law.fraction.scale-by-nonzero-unity" as const,
      requiredEvidenceIds: [
        draft.nonzeroEvidence.sourceDenominatorNonzeroEvidenceId,
        draft.nonzeroEvidence.scaleFactorNonzeroEvidenceId
      ] as const,
      forbiddenGeneralizations: [
        "zero-scale-factor",
        "zero-source-denominator",
        "unequal-numerator-denominator-factors",
        "factor-cancellation-without-evidence"
      ] as const
    }
  }) as KpVerifiedFractionEquivalence;
  verifiedContracts.add(verified);
  return verified;
}

export function isKpVerifiedFractionEquivalence(
  value: unknown
): value is KpVerifiedFractionEquivalence {
  return typeof value === "object" && value !== null &&
    verifiedContracts.has(value);
}

export const kpCanonicalFractionEquivalence = verifyKpFractionEquivalence({
  schemaVersion: "kp.fraction-equivalence.v1",
  id: "transformation.fraction-equivalence.symbolic-times-two",
  operationAuthority: KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY,
  lawAuthority: {
    id: "law.fraction.scale-by-nonzero-unity",
    authorityRefId: "definition.fraction.equivalent-nonzero-scaling",
    level: "strict"
  },
  source: {
    stateId: "state.fraction-equivalence.source",
    fractionEntityId: "fraction-equivalence.source.fraction",
    divisionEntityId: "fraction-equivalence.source.division",
    numerator: {
      kind: "symbol",
      entityId: "fraction-equivalence.source.numerator",
      semanticId: "semantic.fraction-equivalence.numerator.a",
      symbol: "a"
    },
    denominator: {
      kind: "symbol",
      entityId: "fraction-equivalence.source.denominator",
      semanticId: "semantic.fraction-equivalence.denominator.b",
      symbol: "b"
    }
  },
  factor: {
    kind: "number",
    entityId: "fraction-equivalence.factor.parameter",
    semanticId: "semantic.fraction-equivalence.factor.two",
    value: 2
  },
  target: {
    stateId: "state.fraction-equivalence.target",
    fractionEntityId: "fraction-equivalence.target.fraction",
    divisionEntityId: "fraction-equivalence.target.division",
    numeratorProductEntityId: "fraction-equivalence.target.numerator-product",
    denominatorProductEntityId:
      "fraction-equivalence.target.denominator-product",
    numeratorSourceOccurrenceEntityId:
      "fraction-equivalence.target.numerator-source",
    numeratorFactorOccurrenceEntityId:
      "fraction-equivalence.target.numerator-factor",
    denominatorSourceOccurrenceEntityId:
      "fraction-equivalence.target.denominator-source",
    denominatorFactorOccurrenceEntityId:
      "fraction-equivalence.target.denominator-factor"
  },
  nonzeroEvidence: {
    sourceDenominatorNonzeroEvidenceId:
      "evidence.fraction-equivalence.denominator-b-nonzero",
    scaleFactorNonzeroEvidenceId:
      "evidence.fraction-equivalence.factor-two-nonzero"
  }
});

function createCorrespondence(
  draft: KpFractionEquivalenceDraft
): readonly KpFractionEquivalenceCorrespondence[] {
  return [
    correspondence(
      "correspondence.fraction-equivalence.fraction",
      "equivalence",
      [draft.source.fractionEntityId],
      [draft.target.fractionEntityId],
      "The source and target fractions denote the same value."
    ),
    correspondence(
      "correspondence.fraction-equivalence.division",
      "identity",
      [draft.source.divisionEntityId],
      [draft.target.divisionEntityId],
      "Fraction division structure persists across equivalent scaling."
    ),
    correspondence(
      "correspondence.fraction-equivalence.numerator",
      "identity",
      [draft.source.numerator.entityId],
      [draft.target.numeratorSourceOccurrenceEntityId],
      "The original numerator persists as a target numerator factor."
    ),
    correspondence(
      "correspondence.fraction-equivalence.denominator",
      "identity",
      [draft.source.denominator.entityId],
      [draft.target.denominatorSourceOccurrenceEntityId],
      "The original denominator persists as a target denominator factor."
    ),
    correspondence(
      "correspondence.fraction-equivalence.factor",
      "copy",
      [draft.factor.entityId],
      [
        draft.target.numeratorFactorOccurrenceEntityId,
        draft.target.denominatorFactorOccurrenceEntityId
      ],
      "One semantic scale factor is copied into both fraction branches."
    ),
    correspondence(
      "correspondence.fraction-equivalence.products",
      "derivation",
      [
        draft.source.numerator.entityId,
        draft.source.denominator.entityId,
        draft.factor.entityId
      ],
      [
        draft.target.numeratorProductEntityId,
        draft.target.denominatorProductEntityId
      ],
      "The law derives parallel numerator and denominator products."
    )
  ];
}

function validateLaw(value: KpFractionEquivalenceDraft["lawAuthority"]): void {
  assertExactKeys(value, ["id", "authorityRefId", "level"], "lawAuthority");
  if (
    value.id !== "law.fraction.scale-by-nonzero-unity" ||
    value.level !== "strict"
  ) fail("fraction-equivalence.unexpected-field", "Unknown fraction law.");
  requireId(value.authorityRefId, "lawAuthority.authorityRefId");
}

function validateSource(value: KpFractionEquivalenceDraft["source"]): void {
  assertExactKeys(value, [
    "stateId",
    "fractionEntityId",
    "divisionEntityId",
    "numerator",
    "denominator"
  ], "source");
  requireIds([
    value.stateId,
    value.fractionEntityId,
    value.divisionEntityId
  ], "source");
  validateScalar(value.numerator, "source.numerator");
  validateScalar(value.denominator, "source.denominator");
}

function validateTarget(value: KpFractionEquivalenceDraft["target"]): void {
  const keys = [
    "stateId",
    "fractionEntityId",
    "divisionEntityId",
    "numeratorProductEntityId",
    "denominatorProductEntityId",
    "numeratorSourceOccurrenceEntityId",
    "numeratorFactorOccurrenceEntityId",
    "denominatorSourceOccurrenceEntityId",
    "denominatorFactorOccurrenceEntityId"
  ] as const;
  assertExactKeys(value, keys, "target");
  requireIds(keys.map((key) => value[key]), "target");
}

function validateEvidence(
  value: KpFractionEquivalenceDraft["nonzeroEvidence"]
): void {
  assertExactKeys(value, [
    "sourceDenominatorNonzeroEvidenceId",
    "scaleFactorNonzeroEvidenceId"
  ], "nonzeroEvidence");
  const ids = [
    value.sourceDenominatorNonzeroEvidenceId,
    value.scaleFactorNonzeroEvidenceId
  ];
  requireIds(ids, "nonzeroEvidence");
  if (new Set(ids).size !== ids.length) fail(
    "fraction-equivalence.evidence-alias",
    "Denominator and scale-factor evidence require distinct identities."
  );
}

function validateScalar(value: KpFractionEquivalenceScalar, path: string): void {
  if (value.kind === "number") {
    assertExactKeys(value, ["kind", "entityId", "semanticId", "value"], path);
    requireIds([value.entityId, value.semanticId], path);
    if (!Number.isFinite(value.value)) fail(
      "fraction-equivalence.invalid-scalar",
      `${path} requires a finite number.`
    );
    return;
  }
  if (value.kind === "symbol") {
    assertExactKeys(value, ["kind", "entityId", "semanticId", "symbol"], path);
    requireIds([value.entityId, value.semanticId], path);
    if (value.symbol.trim() === "") fail(
      "fraction-equivalence.invalid-scalar",
      `${path} requires a nonblank symbol.`
    );
    return;
  }
  fail("fraction-equivalence.invalid-scalar", `${path} has no scalar kind.`);
}

function requireUniqueEntityIds(draft: KpFractionEquivalenceDraft): void {
  const ids = [
    draft.source.fractionEntityId,
    draft.source.divisionEntityId,
    draft.source.numerator.entityId,
    draft.source.denominator.entityId,
    draft.factor.entityId,
    draft.target.fractionEntityId,
    draft.target.divisionEntityId,
    draft.target.numeratorProductEntityId,
    draft.target.denominatorProductEntityId,
    draft.target.numeratorSourceOccurrenceEntityId,
    draft.target.numeratorFactorOccurrenceEntityId,
    draft.target.denominatorSourceOccurrenceEntityId,
    draft.target.denominatorFactorOccurrenceEntityId
  ];
  if (new Set(ids).size !== ids.length) fail(
    "fraction-equivalence.entity-alias",
    "Every source, parameter, product, and target occurrence needs one entity ID."
  );
}

function correspondence(
  id: string,
  relation: KpFractionEquivalenceCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
): KpFractionEquivalenceCorrespondence {
  return { id, relation, sourceEntityIds, targetEntityIds, summary };
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  path: string
): void {
  const keys = Object.keys(value);
  const unexpected = keys.filter((key) => !expected.includes(key));
  const missing = expected.filter((key) => !keys.includes(key));
  if (unexpected.length > 0 || missing.length > 0) fail(
    "fraction-equivalence.unexpected-field",
    `${path} fields differ: missing=${missing.join(",")}; ` +
      `unexpected=${unexpected.join(",")}.`
  );
}

function requireIds(values: readonly string[], path: string): void {
  values.forEach((value, index) => requireId(value, `${path}[${index}]`));
}

function requireId(value: string, path: string): void {
  if (!/^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u.test(value)) fail(
    "fraction-equivalence.invalid-id",
    `${path} requires a protocol ID.`
  );
}

function fail(
  code: KpFractionEquivalenceSemanticError["code"],
  message: string
): never {
  throw new KpFractionEquivalenceSemanticError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
