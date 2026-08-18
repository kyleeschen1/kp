declare const kpVerifiedLogarithmChangeOfBaseBrand: unique symbol;

export const KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY =
  "operation.equation.change-logarithm-base.v1" as const;

export type KpLogarithmChangeOfBaseSemanticErrorCode =
  | "change-of-base.unexpected-field"
  | "change-of-base.invalid-id"
  | "change-of-base.invalid-base"
  | "change-of-base.invalid-argument"
  | "change-of-base.missing-evidence"
  | "change-of-base.entity-alias"
  | "change-of-base.identity-mismatch";

export class KpLogarithmChangeOfBaseSemanticError extends Error {
  override readonly name = "KpLogarithmChangeOfBaseSemanticError";
  readonly code: KpLogarithmChangeOfBaseSemanticErrorCode;

  constructor(
    code: KpLogarithmChangeOfBaseSemanticErrorCode,
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

export type KpLogarithmChangeOfBaseAtom =
  | Readonly<{
      kind: "number";
      entityId: string;
      semanticId: string;
      value: number;
    }>
  | Readonly<{
      kind: "symbol";
      entityId: string;
      semanticId: string;
      symbol: string;
    }>;

export interface KpLogarithmChangeOfBaseDraft {
  readonly schemaVersion: "kp.logarithm-change-of-base.v1";
  readonly id: string;
  readonly operationAuthority:
    typeof KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    id: "law.logarithm.change-of-base";
    authorityRefId: string;
    level: "strict";
  }>;
  readonly source: Readonly<{
    stateId: string;
    applicationEntityId: string;
    operatorEntityId: string;
    base: KpLogarithmChangeOfBaseAtom;
    argument: KpLogarithmChangeOfBaseAtom;
  }>;
  readonly target: Readonly<{
    stateId: string;
    quotientEntityId: string;
    divisionEntityId: string;
    numerator: Readonly<{
      applicationEntityId: string;
      operatorEntityId: string;
      argument: KpLogarithmChangeOfBaseAtom;
    }>;
    denominator: Readonly<{
      applicationEntityId: string;
      operatorEntityId: string;
      argument: KpLogarithmChangeOfBaseAtom;
    }>;
  }>;
  readonly domainEvidence: Readonly<{
    sourceBasePositiveEvidenceId: string;
    sourceBaseNotOneEvidenceId: string;
    sourceArgumentPositiveEvidenceId: string;
    naturalLogarithmTargetEvidenceId: string;
  }>;
}

export interface KpVerifiedLogarithmChangeOfBase
extends KpLogarithmChangeOfBaseDraft {
  readonly correspondence: readonly [
    KpLogarithmChangeOfBaseCorrespondence,
    KpLogarithmChangeOfBaseCorrespondence,
    KpLogarithmChangeOfBaseCorrespondence,
    KpLogarithmChangeOfBaseCorrespondence,
    KpLogarithmChangeOfBaseCorrespondence
  ];
  readonly reverseLimits: Readonly<{
    kind: "exact-change-of-base-collapse";
    fromStateId: string;
    toStateId: string;
    requiredLawId: "law.logarithm.change-of-base";
    requiredTargetFunction: "natural-logarithm";
    requiredIdentityCorrespondenceIds: readonly [
      "correspondence.change-of-base.argument",
      "correspondence.change-of-base.base"
    ];
    forbiddenGeneralizations: readonly [
      "mismatched-target-logarithm-functions",
      "arbitrary-logarithm-ratio",
      "missing-domain-evidence"
    ];
  }>;
  readonly [kpVerifiedLogarithmChangeOfBaseBrand]: true;
}

export type KpLogarithmChangeOfBaseCorrespondence = Readonly<{
  id: string;
  relation: "identity" | "derivation" | "introduction";
  sourceEntityIds: readonly string[];
  targetEntityIds: readonly string[];
  summary: string;
}>;

const verifiedContracts = new WeakSet<object>();

/**
 * This verifier mints mathematical authority only. It deliberately owns no
 * glyph shell, fraction geometry, timing, routes, or paint choreography.
 */
export function verifyKpLogarithmChangeOfBase(
  draft: KpLogarithmChangeOfBaseDraft
): KpVerifiedLogarithmChangeOfBase {
  assertDataOnly(draft, "changeOfBase");
  assertExactKeys(draft, [
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "source",
    "target",
    "domainEvidence"
  ], "changeOfBase");
  if (draft.schemaVersion !== "kp.logarithm-change-of-base.v1") {
    fail("change-of-base.unexpected-field", "Unsupported schema version.");
  }
  if (draft.operationAuthority !==
      KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY) {
    fail("change-of-base.unexpected-field", "Unknown operation authority.");
  }
  assertLaw(draft.lawAuthority);
  requireId(draft.id, "changeOfBase.id");
  validateSource(draft.source);
  validateTarget(draft.target);
  validateEvidence(draft.domainEvidence);
  validateDomain(draft.source.base, draft.source.argument);
  validateIdentity(draft);
  validateUniqueEntities(draft);

  const verified = deepFreeze({
    ...draft,
    correspondence: [
      correspondence(
        "correspondence.change-of-base.argument",
        "identity",
        [draft.source.argument.entityId],
        [draft.target.numerator.argument.entityId],
        "The source argument remains the numerator logarithm's argument."
      ),
      correspondence(
        "correspondence.change-of-base.base",
        "identity",
        [draft.source.base.entityId],
        [draft.target.denominator.argument.entityId],
        "The source base remains the denominator logarithm's argument."
      ),
      correspondence(
        "correspondence.change-of-base.operators",
        "derivation",
        [draft.source.operatorEntityId],
        [
          draft.target.numerator.operatorEntityId,
          draft.target.denominator.operatorEntityId
        ],
        "The source base-log operation licenses two natural-log operations; glyph identity is not implied."
      ),
      correspondence(
        "correspondence.change-of-base.quotient",
        "derivation",
        [draft.source.applicationEntityId],
        [draft.target.quotientEntityId],
        "The change-of-base law derives the quotient from the source application."
      ),
      correspondence(
        "correspondence.change-of-base.division",
        "introduction",
        [],
        [draft.target.divisionEntityId],
        "Division is introduced by the law and has no source glyph identity."
      )
    ] as const,
    reverseLimits: {
      kind: "exact-change-of-base-collapse" as const,
      fromStateId: draft.target.stateId,
      toStateId: draft.source.stateId,
      requiredLawId: "law.logarithm.change-of-base" as const,
      requiredTargetFunction: "natural-logarithm" as const,
      requiredIdentityCorrespondenceIds: [
        "correspondence.change-of-base.argument",
        "correspondence.change-of-base.base"
      ] as const,
      forbiddenGeneralizations: [
        "mismatched-target-logarithm-functions",
        "arbitrary-logarithm-ratio",
        "missing-domain-evidence"
      ] as const
    }
  }) as KpVerifiedLogarithmChangeOfBase;
  verifiedContracts.add(verified);
  return verified;
}

export function isKpVerifiedLogarithmChangeOfBase(
  value: unknown
): value is KpVerifiedLogarithmChangeOfBase {
  return typeof value === "object" && value !== null &&
    verifiedContracts.has(value);
}

export const kpCanonicalLogarithmChangeOfBase =
  verifyKpLogarithmChangeOfBase({
    schemaVersion: "kp.logarithm-change-of-base.v1",
    id: "transformation.logarithm.change-base.two-seven-natural",
    operationAuthority: KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
    lawAuthority: {
      id: "law.logarithm.change-of-base",
      authorityRefId: "definition.logarithm.change-of-base.natural-target",
      level: "strict"
    },
    source: {
      stateId: "state.logarithm.change-base.source",
      applicationEntityId: "source.log-base-two.application",
      operatorEntityId: "source.log-base-two.operator",
      base: {
        kind: "number",
        entityId: "source.log-base-two.base",
        semanticId: "semantic.logarithm.base.two",
        value: 2
      },
      argument: {
        kind: "number",
        entityId: "source.log-base-two.argument-seven",
        semanticId: "semantic.logarithm.argument.seven",
        value: 7
      }
    },
    target: {
      stateId: "state.logarithm.change-base.target",
      quotientEntityId: "target.natural-log-quotient",
      divisionEntityId: "target.natural-log-quotient.division",
      numerator: {
        applicationEntityId: "target.numerator.application",
        operatorEntityId: "target.numerator.operator",
        argument: {
          kind: "number",
          entityId: "target.numerator.argument-seven",
          semanticId: "semantic.logarithm.argument.seven",
          value: 7
        }
      },
      denominator: {
        applicationEntityId: "target.denominator.application",
        operatorEntityId: "target.denominator.operator",
        argument: {
          kind: "number",
          entityId: "target.denominator.argument-two",
          semanticId: "semantic.logarithm.base.two",
          value: 2
        }
      }
    },
    domainEvidence: {
      sourceBasePositiveEvidenceId:
        "evidence.logarithm.base.two-positive",
      sourceBaseNotOneEvidenceId:
        "evidence.logarithm.base.two-not-one",
      sourceArgumentPositiveEvidenceId:
        "evidence.logarithm.argument.seven-positive",
      naturalLogarithmTargetEvidenceId:
        "evidence.logarithm.target.natural-valid"
    }
  });

function validateSource(source: KpLogarithmChangeOfBaseDraft["source"]): void {
  assertExactKeys(source, [
    "stateId",
    "applicationEntityId",
    "operatorEntityId",
    "base",
    "argument"
  ], "source");
  requireId(source.stateId, "source.stateId");
  requireId(source.applicationEntityId, "source.applicationEntityId");
  requireId(source.operatorEntityId, "source.operatorEntityId");
  validateAtom(source.base, "source.base");
  validateAtom(source.argument, "source.argument");
}

function validateTarget(target: KpLogarithmChangeOfBaseDraft["target"]): void {
  assertExactKeys(target, [
    "stateId",
    "quotientEntityId",
    "divisionEntityId",
    "numerator",
    "denominator"
  ], "target");
  requireId(target.stateId, "target.stateId");
  requireId(target.quotientEntityId, "target.quotientEntityId");
  requireId(target.divisionEntityId, "target.divisionEntityId");
  for (const [name, application] of [
    ["numerator", target.numerator],
    ["denominator", target.denominator]
  ] as const) {
    assertExactKeys(application, [
      "applicationEntityId",
      "operatorEntityId",
      "argument"
    ], `target.${name}`);
    requireId(application.applicationEntityId,
      `target.${name}.applicationEntityId`);
    requireId(application.operatorEntityId,
      `target.${name}.operatorEntityId`);
    validateAtom(application.argument, `target.${name}.argument`);
  }
}

function validateAtom(
  atom: KpLogarithmChangeOfBaseAtom,
  path: string
): void {
  assertExactKeys(atom, atom.kind === "number"
    ? ["kind", "entityId", "semanticId", "value"]
    : ["kind", "entityId", "semanticId", "symbol"], path);
  requireId(atom.entityId, `${path}.entityId`);
  requireId(atom.semanticId, `${path}.semanticId`);
  if (atom.kind === "number") return;
  if (atom.symbol.trim().length === 0) {
    fail("change-of-base.invalid-id", `${path}.symbol must be non-empty.`);
  }
}

function validateDomain(
  base: KpLogarithmChangeOfBaseAtom,
  argument: KpLogarithmChangeOfBaseAtom
): void {
  if (base.kind === "number" &&
      (!Number.isFinite(base.value) || base.value <= 0 || base.value === 1)) {
    fail(
      "change-of-base.invalid-base",
      "A real logarithm base must be positive and other than one."
    );
  }
  if (argument.kind === "number" &&
      (!Number.isFinite(argument.value) || argument.value <= 0)) {
    fail(
      "change-of-base.invalid-argument",
      "A real logarithm argument must be positive."
    );
  }
}

function validateEvidence(
  evidence: KpLogarithmChangeOfBaseDraft["domainEvidence"]
): void {
  assertExactKeys(evidence, [
    "sourceBasePositiveEvidenceId",
    "sourceBaseNotOneEvidenceId",
    "sourceArgumentPositiveEvidenceId",
    "naturalLogarithmTargetEvidenceId"
  ], "domainEvidence");
  for (const [name, id] of Object.entries(evidence)) {
    if (typeof id !== "string" || id.trim().length === 0) {
      fail(
        "change-of-base.missing-evidence",
        `domainEvidence.${name} must name explicit evidence.`
      );
    }
  }
}

function validateIdentity(draft: KpLogarithmChangeOfBaseDraft): void {
  if (!sameSemanticAtom(
    draft.source.argument,
    draft.target.numerator.argument
  )) {
    fail(
      "change-of-base.identity-mismatch",
      "The numerator argument must retain the source argument semantic ID."
    );
  }
  if (!sameSemanticAtom(
    draft.source.base,
    draft.target.denominator.argument
  )) {
    fail(
      "change-of-base.identity-mismatch",
      "The denominator argument must retain the source base semantic ID."
    );
  }
}

function sameSemanticAtom(
  source: KpLogarithmChangeOfBaseAtom,
  target: KpLogarithmChangeOfBaseAtom
): boolean {
  if (source.kind !== target.kind ||
      source.semanticId !== target.semanticId) return false;
  if (source.kind === "number" && target.kind === "number") {
    return Object.is(source.value, target.value);
  }
  return source.kind === "symbol" && target.kind === "symbol" &&
    source.symbol === target.symbol;
}

function validateUniqueEntities(draft: KpLogarithmChangeOfBaseDraft): void {
  const ids = [
    draft.source.applicationEntityId,
    draft.source.operatorEntityId,
    draft.source.base.entityId,
    draft.source.argument.entityId,
    draft.target.quotientEntityId,
    draft.target.divisionEntityId,
    draft.target.numerator.applicationEntityId,
    draft.target.numerator.operatorEntityId,
    draft.target.numerator.argument.entityId,
    draft.target.denominator.applicationEntityId,
    draft.target.denominator.operatorEntityId,
    draft.target.denominator.argument.entityId
  ];
  if (new Set(ids).size !== ids.length) {
    fail(
      "change-of-base.entity-alias",
      "Source and target render entities must remain distinct from semantic identity."
    );
  }
}

function assertLaw(
  law: KpLogarithmChangeOfBaseDraft["lawAuthority"]
): void {
  assertExactKeys(law, ["id", "authorityRefId", "level"], "lawAuthority");
  if (law.id !== "law.logarithm.change-of-base" || law.level !== "strict") {
    fail("change-of-base.unexpected-field", "Unknown law authority.");
  }
  requireId(law.authorityRefId, "lawAuthority.authorityRefId");
}

function correspondence(
  id: string,
  relation: KpLogarithmChangeOfBaseCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
): KpLogarithmChangeOfBaseCorrespondence {
  return Object.freeze({
    id,
    relation,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds]),
    summary
  });
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  path: string
): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (actual.length === keys.length &&
      actual.every((key, index) => key === keys[index])) return;
  fail(
    "change-of-base.unexpected-field",
    `${path} must contain exactly ${keys.join(", ")}.`
  );
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    fail("change-of-base.unexpected-field", `${path} cannot contain callbacks.`);
  }
  if (value === null || typeof value !== "object") return;
  Object.entries(value).forEach(([key, nested]) =>
    assertDataOnly(nested, `${path}.${key}`));
}

function requireId(value: string, path: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail("change-of-base.invalid-id", `${path} must be a non-empty ID.`);
  }
}

function fail(
  code: KpLogarithmChangeOfBaseSemanticErrorCode,
  message: string
): never {
  throw new KpLogarithmChangeOfBaseSemanticError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
