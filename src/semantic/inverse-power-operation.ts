import {
  KP_RADICAL_ENDPOINT_NORMALIZER,
  type KpNormalizedPowerRootEndpoint,
  type KpNormalizedRadicalRootEndpoint
} from "./radical-endpoint-normalizer.ts";

declare const kpVerifiedInversePowerOperationBrand: unique symbol;

export const KP_INVERSE_POWER_OPERATION_AUTHORITY =
  "operation.equation.apply-inverse-power.v1" as const;

export type KpInversePowerSemanticErrorCode =
  | "inverse-power.unexpected-field"
  | "inverse-power.invalid-id"
  | "inverse-power.invalid-endpoint"
  | "inverse-power.ambiguous-parity"
  | "inverse-power.index-mismatch"
  | "inverse-power.domain-mismatch"
  | "inverse-power.branch-cardinality"
  | "inverse-power.branch-identity"
  | "inverse-power.candidate-audit";

export class KpInversePowerSemanticError extends Error {
  override readonly name = "KpInversePowerSemanticError";
  readonly code: KpInversePowerSemanticErrorCode;

  constructor(code: KpInversePowerSemanticErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface KpInversePowerOccurrence {
  readonly entityId: string;
  readonly semanticId: string;
}

export interface KpInversePowerBranch<
  Sign extends "positive" | "negative" | "zero" | "unique-real"
> {
  readonly id: string;
  readonly sign: Sign;
  readonly solutionSemanticId: string;
  readonly candidateEntityId: string;
  readonly substitutionEvidenceId: string;
}

export interface KpRejectedInversePowerCandidate {
  readonly id: string;
  readonly candidateSemanticId: string;
  readonly reason: "outside-declared-real-domain" | "fails-substitution";
  readonly rejectionEvidenceId: string;
}

interface KpInversePowerDraftBase {
  readonly schemaVersion: "kp.inverse-power-operation.v1";
  readonly id: string;
  readonly operationAuthority: typeof KP_INVERSE_POWER_OPERATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    id: "law.equation.inverse-positive-integer-power-over-reals";
    authorityRefId: string;
    level: "strict";
  }>;
  readonly relation: Readonly<{
    semanticId: string;
    sourceEntityId: string;
    targetEntityId: string;
  }>;
  readonly source: Readonly<{
    stateId: string;
    poweredExpressionEntityId: string;
    base: KpInversePowerOccurrence;
    exponentEntityId: string;
    right: KpInversePowerOccurrence;
    endpoint: KpNormalizedPowerRootEndpoint;
  }>;
  readonly target: Readonly<{
    stateId: string;
    subject: KpInversePowerOccurrence;
    rootExpressionEntityId: string;
    radicalOperatorEntityId: string;
    rootIndexEntityId: string;
    radicand: KpInversePowerOccurrence;
    endpoint: KpNormalizedRadicalRootEndpoint;
  }>;
}

interface KpInversePowerExponentEvidence<Parity extends "even" | "odd"> {
  readonly kind: "positive-integer-exponent";
  readonly exponent: number;
  readonly parity: Parity;
  readonly positiveIntegerEvidenceId: string;
  readonly parityEvidenceId: string;
}

interface KpInversePowerDomainEvidence<
  Sign extends "positive" | "zero" | "negative"
> {
  readonly scalarDomain: "real";
  readonly sourceBaseDomainEvidenceId: string;
  readonly rightValueDomainEvidenceId: string;
  readonly radicandSign: Sign;
  readonly radicandSignEvidenceId: string;
}

interface KpInversePowerCandidateAudit<
  BranchIds extends readonly string[],
  Rejected extends readonly KpRejectedInversePowerCandidate[] =
    readonly KpRejectedInversePowerCandidate[]
> {
  readonly kind: "complete-candidate-audit";
  readonly acceptedBranchIds: BranchIds;
  readonly rejectedCandidates: Rejected;
  readonly completenessEvidenceId: string;
}

type KpPositiveBranch = KpInversePowerBranch<"positive">;
type KpNegativeBranch = KpInversePowerBranch<"negative">;
type KpZeroBranch = KpInversePowerBranch<"zero">;
type KpUniqueBranch = KpInversePowerBranch<"unique-real">;

export type KpEvenPositiveInversePowerDraft = KpInversePowerDraftBase & {
  readonly exponentEvidence: KpInversePowerExponentEvidence<"even">;
  readonly domainEvidence: KpInversePowerDomainEvidence<"positive">;
  readonly solutionSet: Readonly<{
    kind: "enumerated-real-roots";
    multiplicity: 2;
    branches: readonly [KpPositiveBranch, KpNegativeBranch];
    candidateAudit: KpInversePowerCandidateAudit<readonly [string, string]>;
  }>;
};

export type KpEvenZeroInversePowerDraft = KpInversePowerDraftBase & {
  readonly exponentEvidence: KpInversePowerExponentEvidence<"even">;
  readonly domainEvidence: KpInversePowerDomainEvidence<"zero">;
  readonly solutionSet: Readonly<{
    kind: "enumerated-real-roots";
    multiplicity: 1;
    branches: readonly [KpZeroBranch];
    candidateAudit: KpInversePowerCandidateAudit<readonly [string]>;
  }>;
};

export type KpEvenNegativeInversePowerDraft = KpInversePowerDraftBase & {
  readonly exponentEvidence: KpInversePowerExponentEvidence<"even">;
  readonly domainEvidence: KpInversePowerDomainEvidence<"negative">;
  readonly solutionSet: Readonly<{
    kind: "no-real-roots";
    multiplicity: 0;
    branches: readonly [];
    candidateAudit: KpInversePowerCandidateAudit<
      readonly [],
      readonly [
        KpRejectedInversePowerCandidate,
        ...KpRejectedInversePowerCandidate[]
      ]
    >;
  }>;
};

export type KpOddInversePowerDraft = KpInversePowerDraftBase & {
  readonly exponentEvidence: KpInversePowerExponentEvidence<"odd">;
  readonly domainEvidence: KpInversePowerDomainEvidence<
    "positive" | "zero" | "negative"
  >;
  readonly solutionSet: Readonly<{
    kind: "enumerated-real-roots";
    multiplicity: 1;
    branches: readonly [KpUniqueBranch];
    candidateAudit: KpInversePowerCandidateAudit<readonly [string]>;
  }>;
};

export type KpInversePowerOperationDraft =
  | KpEvenPositiveInversePowerDraft
  | KpEvenZeroInversePowerDraft
  | KpEvenNegativeInversePowerDraft
  | KpOddInversePowerDraft;

export type KpInversePowerCorrespondence = Readonly<{
  id: string;
  relation: "identity" | "role-transfer" | "derivation" | "branching";
  sourceEntityIds: readonly string[];
  targetEntityIds: readonly string[];
  evidenceId: string;
}>;

export type KpVerifiedInversePowerOperation = KpInversePowerOperationDraft & {
  readonly correspondence: readonly [
    KpInversePowerCorrespondence,
    KpInversePowerCorrespondence,
    KpInversePowerCorrespondence,
    KpInversePowerCorrespondence,
    KpInversePowerCorrespondence,
    KpInversePowerCorrespondence
  ];
  readonly [kpVerifiedInversePowerOperationBrand]: true;
};

const verifiedOperations = new WeakSet<object>();

/**
 * This verifier owns mathematical authority only. In particular it requires
 * the caller to declare every real branch; it never derives a preferred sign
 * from principal-radical notation and owns no timing, geometry, or paint.
 */
export function verifyKpInversePowerOperation(
  draft: KpInversePowerOperationDraft
): KpVerifiedInversePowerOperation {
  assertDataOnly(draft, "inversePower");
  assertExactKeys(draft, [
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "relation",
    "source",
    "target",
    "exponentEvidence",
    "domainEvidence",
    "solutionSet"
  ], "inversePower");
  if (draft.schemaVersion !== "kp.inverse-power-operation.v1") {
    fail("inverse-power.unexpected-field", "Unsupported schema version.");
  }
  if (draft.operationAuthority !== KP_INVERSE_POWER_OPERATION_AUTHORITY) {
    fail("inverse-power.unexpected-field", "Unknown operation authority.");
  }
  requireId(draft.id, "id");
  validateLaw(draft.lawAuthority);
  validateRelation(draft.relation);
  validateSource(draft.source);
  validateTarget(draft.target);
  validateExponentAndIndex(draft);
  validateDomain(draft.domainEvidence);
  validateSolutionSet(draft);
  validateSemanticIdentity(draft);

  const branches = draft.solutionSet.branches;
  const correspondences = [
    correspondence(
      "correspondence.inverse-power.base-subject",
      "identity",
      [draft.source.base.entityId],
      [draft.target.subject.entityId],
      draft.solutionSet.candidateAudit.completenessEvidenceId
    ),
    correspondence(
      "correspondence.inverse-power.right-radicand",
      "identity",
      [draft.source.right.entityId],
      [draft.target.radicand.entityId],
      draft.domainEvidence.radicandSignEvidenceId
    ),
    correspondence(
      "correspondence.inverse-power.relation",
      "identity",
      [draft.relation.sourceEntityId],
      [draft.relation.targetEntityId],
      draft.lawAuthority.authorityRefId
    ),
    correspondence(
      "correspondence.inverse-power.exponent-index",
      "role-transfer",
      [draft.source.exponentEntityId],
      [draft.target.rootIndexEntityId],
      draft.exponentEvidence.parityEvidenceId
    ),
    correspondence(
      "correspondence.inverse-power.expression-root",
      "derivation",
      [draft.source.poweredExpressionEntityId, draft.source.right.entityId],
      [draft.target.rootExpressionEntityId],
      draft.lawAuthority.authorityRefId
    ),
    correspondence(
      "correspondence.inverse-power.solution-branches",
      "branching",
      [draft.target.rootExpressionEntityId],
      branches.map(({ candidateEntityId }) => candidateEntityId),
      draft.solutionSet.candidateAudit.completenessEvidenceId
    )
  ] as const;
  const verified = deepFreeze({
    ...draft,
    correspondence: correspondences
  }) as KpVerifiedInversePowerOperation;
  verifiedOperations.add(verified);
  return verified;
}

export function isKpVerifiedInversePowerOperation(
  value: unknown
): value is KpVerifiedInversePowerOperation {
  return typeof value === "object" && value !== null &&
    verifiedOperations.has(value);
}

function validateLaw(law: KpInversePowerDraftBase["lawAuthority"]): void {
  assertExactKeys(law, ["id", "authorityRefId", "level"], "lawAuthority");
  if (
    law.id !== "law.equation.inverse-positive-integer-power-over-reals" ||
    law.level !== "strict"
  ) {
    fail("inverse-power.unexpected-field",
      "Inverse-power operations require the strict real positive-integer law.");
  }
  requireId(law.authorityRefId, "lawAuthority.authorityRefId");
}

function validateRelation(relation: KpInversePowerDraftBase["relation"]): void {
  assertExactKeys(relation, [
    "semanticId",
    "sourceEntityId",
    "targetEntityId"
  ], "relation");
  requireId(relation.semanticId, "relation.semanticId");
  requireDistinctIds([
    relation.sourceEntityId,
    relation.targetEntityId
  ], "relation occurrences");
}

function validateSource(source: KpInversePowerDraftBase["source"]): void {
  assertExactKeys(source, [
    "stateId",
    "poweredExpressionEntityId",
    "base",
    "exponentEntityId",
    "right",
    "endpoint"
  ], "source");
  requireId(source.stateId, "source.stateId");
  validateOccurrence(source.base, "source.base");
  validateOccurrence(source.right, "source.right");
  requireDistinctIds([
    source.poweredExpressionEntityId,
    source.base.entityId,
    source.exponentEntityId,
    source.right.entityId
  ], "source occurrences");
  if (
    source.endpoint.schemaVersion !== "kp.normalized-radical-endpoint.v1" ||
    source.endpoint.authority !== KP_RADICAL_ENDPOINT_NORMALIZER ||
    source.endpoint.notation !== "power"
  ) {
    fail("inverse-power.invalid-endpoint",
      "The source must be a normalized power endpoint.");
  }
}

function validateTarget(target: KpInversePowerDraftBase["target"]): void {
  assertExactKeys(target, [
    "stateId",
    "subject",
    "rootExpressionEntityId",
    "radicalOperatorEntityId",
    "rootIndexEntityId",
    "radicand",
    "endpoint"
  ], "target");
  requireId(target.stateId, "target.stateId");
  validateOccurrence(target.subject, "target.subject");
  validateOccurrence(target.radicand, "target.radicand");
  requireDistinctIds([
    target.rootExpressionEntityId,
    target.subject.entityId,
    target.radicalOperatorEntityId,
    target.rootIndexEntityId,
    target.radicand.entityId
  ], "target occurrences");
  if (
    target.endpoint.schemaVersion !== "kp.normalized-radical-endpoint.v1" ||
    target.endpoint.authority !== KP_RADICAL_ENDPOINT_NORMALIZER ||
    target.endpoint.notation !== "radical"
  ) {
    fail("inverse-power.invalid-endpoint",
      "The target must be a normalized radical endpoint.");
  }
}

function validateExponentAndIndex(draft: KpInversePowerOperationDraft): void {
  assertExactKeys(draft.exponentEvidence, [
    "kind",
    "exponent",
    "parity",
    "positiveIntegerEvidenceId",
    "parityEvidenceId"
  ], "exponentEvidence");
  const evidence = draft.exponentEvidence;
  if (
    evidence.kind !== "positive-integer-exponent" ||
    !Number.isInteger(evidence.exponent) || evidence.exponent <= 0
  ) {
    fail("inverse-power.ambiguous-parity",
      "Inverse-power semantics require an explicit positive integer exponent.");
  }
  requireId(evidence.positiveIntegerEvidenceId,
    "exponentEvidence.positiveIntegerEvidenceId");
  requireId(evidence.parityEvidenceId,
    "exponentEvidence.parityEvidenceId");
  const actualParity = evidence.exponent % 2 === 0 ? "even" : "odd";
  if (evidence.parity !== actualParity) {
    fail("inverse-power.ambiguous-parity",
      `Exponent ${evidence.exponent} is ${actualParity}, not ${evidence.parity}.`);
  }
  const sourceExponent = numericExpressionValue(
    draft.source.endpoint.exponent.expression
  );
  const targetIndex = numericExpressionValue(draft.target.endpoint.index.expression);
  if (sourceExponent !== evidence.exponent || targetIndex !== evidence.exponent) {
    fail("inverse-power.index-mismatch",
      "Source exponent, declared parity evidence, and target root index must agree.");
  }
  if (draft.source.endpoint.exponent.classification !==
      `${actualParity}-integer`) {
    fail("inverse-power.ambiguous-parity",
      "The normalized source exponent does not carry the declared parity.");
  }
}

function validateDomain(
  evidence: KpInversePowerOperationDraft["domainEvidence"]
): void {
  assertExactKeys(evidence, [
    "scalarDomain",
    "sourceBaseDomainEvidenceId",
    "rightValueDomainEvidenceId",
    "radicandSign",
    "radicandSignEvidenceId"
  ], "domainEvidence");
  if (evidence.scalarDomain !== "real") {
    fail("inverse-power.domain-mismatch",
      "This operation version is deliberately limited to the real domain.");
  }
  requireId(evidence.sourceBaseDomainEvidenceId,
    "domainEvidence.sourceBaseDomainEvidenceId");
  requireId(evidence.rightValueDomainEvidenceId,
    "domainEvidence.rightValueDomainEvidenceId");
  requireId(evidence.radicandSignEvidenceId,
    "domainEvidence.radicandSignEvidenceId");
}

function validateSolutionSet(draft: KpInversePowerOperationDraft): void {
  assertExactKeys(draft.solutionSet, [
    "kind",
    "multiplicity",
    "branches",
    "candidateAudit"
  ], "solutionSet");
  const expected = expectedBranchShape(
    draft.exponentEvidence.parity,
    draft.domainEvidence.radicandSign
  );
  if (
    draft.solutionSet.multiplicity !== expected.multiplicity ||
    draft.solutionSet.branches.length !== expected.signs.length ||
    draft.solutionSet.branches.some((branch, index) =>
      branch.sign !== expected.signs[index])
  ) {
    fail("inverse-power.branch-cardinality",
      `Expected ${expected.multiplicity} ${draft.exponentEvidence.parity} real-root branch(es) for a ${draft.domainEvidence.radicandSign} radicand.`);
  }
  if ((expected.multiplicity === 0) !==
      (draft.solutionSet.kind === "no-real-roots")) {
    fail("inverse-power.branch-cardinality",
      "The solution-set kind must agree with real-root multiplicity.");
  }
  const branchIds = draft.solutionSet.branches.map(({ id }) => id);
  if (new Set(branchIds).size !== branchIds.length) {
    fail("inverse-power.branch-identity", "Solution branch IDs must be unique.");
  }
  draft.solutionSet.branches.forEach((branch, index) => {
    assertExactKeys(branch, [
      "id",
      "sign",
      "solutionSemanticId",
      "candidateEntityId",
      "substitutionEvidenceId"
    ], `solutionSet.branches[${index}]`);
    requireId(branch.id, `solutionSet.branches[${index}].id`);
    requireId(branch.solutionSemanticId,
      `solutionSet.branches[${index}].solutionSemanticId`);
    requireId(branch.candidateEntityId,
      `solutionSet.branches[${index}].candidateEntityId`);
    requireId(branch.substitutionEvidenceId,
      `solutionSet.branches[${index}].substitutionEvidenceId`);
  });
  validateCandidateAudit(draft.solutionSet.candidateAudit, branchIds,
    expected.multiplicity === 0);
}

function validateCandidateAudit(
  audit: KpInversePowerOperationDraft["solutionSet"]["candidateAudit"],
  branchIds: readonly string[],
  requiresRejection: boolean
): void {
  assertExactKeys(audit, [
    "kind",
    "acceptedBranchIds",
    "rejectedCandidates",
    "completenessEvidenceId"
  ], "solutionSet.candidateAudit");
  if (audit.kind !== "complete-candidate-audit") {
    fail("inverse-power.candidate-audit", "Candidate audit must be complete.");
  }
  requireId(audit.completenessEvidenceId,
    "solutionSet.candidateAudit.completenessEvidenceId");
  if (
    audit.acceptedBranchIds.length !== branchIds.length ||
    audit.acceptedBranchIds.some((id, index) => id !== branchIds[index])
  ) {
    fail("inverse-power.candidate-audit",
      "The candidate audit must enumerate every accepted branch in order.");
  }
  if (requiresRejection && audit.rejectedCandidates.length === 0) {
    fail("inverse-power.candidate-audit",
      "A no-real-root result requires explicit rejected-candidate evidence.");
  }
  const allIds = new Set(branchIds);
  audit.rejectedCandidates.forEach((candidate, index) => {
    assertExactKeys(candidate, [
      "id",
      "candidateSemanticId",
      "reason",
      "rejectionEvidenceId"
    ], `solutionSet.candidateAudit.rejectedCandidates[${index}]`);
    for (const [name, id] of Object.entries(candidate)) {
      if (name !== "reason") requireId(id,
        `solutionSet.candidateAudit.rejectedCandidates[${index}].${name}`);
    }
    if (allIds.has(candidate.id)) {
      fail("inverse-power.candidate-audit",
        "Accepted and rejected candidate identities must be disjoint.");
    }
    allIds.add(candidate.id);
  });
}

function validateSemanticIdentity(draft: KpInversePowerOperationDraft): void {
  if (draft.source.base.semanticId !== draft.target.subject.semanticId) {
    fail("inverse-power.branch-identity",
      "The powered base must persist as the target equation subject.");
  }
  if (draft.source.right.semanticId !== draft.target.radicand.semanticId) {
    fail("inverse-power.branch-identity",
      "The source right value must persist as the target radicand.");
  }
}

function expectedBranchShape(
  parity: "even" | "odd",
  sign: "positive" | "zero" | "negative"
): Readonly<{
  multiplicity: 0 | 1 | 2;
  signs: readonly ("positive" | "negative" | "zero" | "unique-real")[];
}> {
  if (parity === "odd") {
    return Object.freeze({
      multiplicity: 1 as const,
      signs: ["unique-real"] as const
    });
  }
  if (sign === "positive") {
    return Object.freeze({
      multiplicity: 2 as const,
      signs: ["positive", "negative"] as const
    });
  }
  if (sign === "zero") {
    return Object.freeze({
      multiplicity: 1 as const,
      signs: ["zero"] as const
    });
  }
  return Object.freeze({ multiplicity: 0 as const, signs: [] });
}

function numericExpressionValue(
  expression: KpNormalizedPowerRootEndpoint["exponent"]["expression"]
): number | undefined {
  return expression.kind === "number" ? expression.value : undefined;
}

function validateOccurrence(
  occurrence: KpInversePowerOccurrence,
  path: string
): void {
  assertExactKeys(occurrence, ["entityId", "semanticId"], path);
  requireId(occurrence.entityId, `${path}.entityId`);
  requireId(occurrence.semanticId, `${path}.semanticId`);
}

function correspondence(
  id: string,
  relation: KpInversePowerCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  evidenceId: string
): KpInversePowerCorrespondence {
  return Object.freeze({
    id,
    relation,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds]),
    evidenceId
  });
}

function requireDistinctIds(ids: readonly string[], summary: string): void {
  ids.forEach((id, index) => requireId(id, `${summary}[${index}]`));
  if (new Set(ids).size !== ids.length) {
    fail("inverse-power.branch-identity", `${summary} must be distinct.`);
  }
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    fail("inverse-power.unexpected-field",
      `Inverse-power semantics cannot contain a function at ${path}.`);
  }
  if (typeof value !== "object" || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDataOnly(item, `${path}[${index}]`));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    fail("inverse-power.unexpected-field",
      `Inverse-power semantics require plain data at ${path}.`);
  }
  Object.entries(value).forEach(([key, item]) =>
    assertDataOnly(item, `${path}.${key}`)
  );
}

function assertExactKeys(
  value: object,
  allowed: readonly string[],
  path: string
): void {
  const allowedKeys = new Set(allowed);
  const unexpected = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unexpected !== undefined) {
    fail("inverse-power.unexpected-field",
      `Unexpected inverse-power field ${path}.${unexpected}.`);
  }
  const missing = allowed.find((key) => !Object.hasOwn(value, key));
  if (missing !== undefined) {
    fail("inverse-power.unexpected-field",
      `Missing inverse-power field ${path}.${missing}.`);
  }
}

function requireId(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail("inverse-power.invalid-id", `${path} must be a nonempty semantic ID.`);
  }
}

function fail(code: KpInversePowerSemanticErrorCode, message: string): never {
  throw new KpInversePowerSemanticError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
