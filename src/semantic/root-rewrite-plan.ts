import {
  KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
  type KpRootRewriteClass,
  type KpRootRewriteEvidenceKind
} from "./root-rewrite-vocabulary.ts";

declare const kpVerifiedRootRewritePlanBrand: unique symbol;

export const KP_ROOT_REWRITE_PLAN_AUTHORITY =
  "compiler.equation.root-rewrite-plan.v1" as const;

export interface KpRootRewriteOccurrence {
  readonly entityId: string;
  readonly semanticId: string;
  readonly subtreeId: string;
  readonly subtreeKind:
    | "atomic"
    | "compound"
    | "operator"
    | "enclosure"
    | "value";
}

type KpRootRewriteRole =
  | "source-radical"
  | "source-radicand"
  | "source-exponent"
  | "source-root-index"
  | "source-carrier"
  | "source-coefficient"
  | "source-residual"
  | "source-outer-radical"
  | "source-inner-radical"
  | "source-expression"
  | "target-value"
  | "target-carrier"
  | "target-absolute-value-enclosure"
  | "target-exponent"
  | "target-coefficient"
  | "target-residual"
  | "target-radical";

interface KpRootRewriteDispositionTemplate {
  readonly kind:
    | "persist"
    | "consume"
    | "introduce"
    | "fuse"
    | "retain-enclosure";
  readonly sourceRoles: readonly KpRootRewriteRole[];
  readonly targetRoles: readonly KpRootRewriteRole[];
  readonly evidenceKinds: readonly KpRootRewriteEvidenceKind[];
}

interface KpRootRewritePlanDeclaration {
  readonly planKind: "atomic" | "composite" | "blocked";
  readonly sourceRoles: readonly KpRootRewriteRole[];
  readonly targetRoles: readonly KpRootRewriteRole[];
  readonly requiredEvidence: readonly KpRootRewriteEvidenceKind[];
  readonly requiredPriorOperations: readonly string[];
  readonly dispositions: readonly KpRootRewriteDispositionTemplate[];
}

const rootRewritePlanDeclarationSeed = {
  "closed-evaluation": declaration("atomic",
    ["source-radical", "source-radicand"], ["target-value"],
    ["closed-value", "exact-root"], [], [
      disposition("fuse", ["source-radical", "source-radicand"],
        ["target-value"], ["closed-value", "exact-root"])
    ]),
  "inverse-normalization": declaration("atomic",
    ["source-radical", "source-exponent", "source-carrier"],
    ["target-carrier", "target-absolute-value-enclosure"],
    ["even-positive-integer-power", "real-valued-carrier"], [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["even-positive-integer-power", "real-valued-carrier"]),
      disposition("consume", ["source-radical", "source-exponent"], [],
        ["even-positive-integer-power"]),
      disposition("introduce", [], ["target-absolute-value-enclosure"],
        ["even-positive-integer-power", "real-valued-carrier"])
    ]),
  "compound-carrier-normalization": declaration("atomic",
    ["source-radical", "source-exponent", "source-carrier"],
    ["target-carrier", "target-absolute-value-enclosure"],
    ["even-positive-integer-power", "real-valued-carrier"], [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["even-positive-integer-power", "real-valued-carrier"]),
      disposition("consume", ["source-radical", "source-exponent"], [],
        ["even-positive-integer-power"]),
      disposition("introduce", [], ["target-absolute-value-enclosure"],
        ["even-positive-integer-power", "real-valued-carrier"])
    ]),
  "assumption-qualified-cancellation": declaration("atomic",
    ["source-radical", "source-exponent", "source-carrier"],
    ["target-carrier"],
    ["even-positive-integer-power", "nonnegative-domain"], [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["even-positive-integer-power", "nonnegative-domain"]),
      disposition("consume", ["source-radical", "source-exponent"], [],
        ["even-positive-integer-power", "nonnegative-domain"])
    ]),
  "exponent-index-composition": declaration("atomic",
    ["source-radical", "source-root-index", "source-exponent",
      "source-carrier"], ["target-carrier", "target-exponent"],
    ["positive-integer-root-index"], [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["positive-integer-root-index"]),
      disposition("fuse", ["source-root-index", "source-exponent"],
        ["target-exponent"], ["positive-integer-root-index"]),
      disposition("consume", ["source-radical"], [],
        ["positive-integer-root-index"])
    ]),
  "mixed-evaluation": declaration("composite",
    ["source-radical", "source-coefficient", "source-exponent",
      "source-carrier"],
    ["target-coefficient", "target-carrier",
      "target-absolute-value-enclosure"],
    ["closed-value", "exact-root", "even-positive-integer-power",
      "real-valued-carrier"],
    ["operation.root.extract-perfect-power-factor"], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["even-positive-integer-power", "real-valued-carrier"]),
      disposition("fuse", ["source-coefficient"], ["target-coefficient"],
        ["closed-value", "exact-root"]),
      disposition("consume", ["source-radical", "source-exponent"], [],
        ["even-positive-integer-power"]),
      disposition("introduce", [], ["target-absolute-value-enclosure"],
        ["even-positive-integer-power", "real-valued-carrier"])
    ]),
  "partial-extraction": declaration("atomic",
    ["source-radical", "source-exponent", "source-carrier",
      "source-residual"],
    ["target-carrier", "target-residual", "target-radical",
      "target-absolute-value-enclosure"],
    ["perfect-power-factor", "residual-radicand", "real-valued-carrier"],
    [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["perfect-power-factor", "real-valued-carrier"]),
      disposition("persist", ["source-residual"], ["target-residual"],
        ["residual-radicand"]),
      disposition("consume", ["source-exponent"], [],
        ["perfect-power-factor"]),
      disposition("retain-enclosure", ["source-radical"],
        ["target-radical"], ["residual-radicand"]),
      disposition("introduce", [], ["target-absolute-value-enclosure"],
        ["perfect-power-factor", "real-valued-carrier"])
    ]),
  "nested-root-composition": declaration("atomic",
    ["source-outer-radical", "source-inner-radical", "source-carrier"],
    ["target-radical", "target-carrier"], ["nested-index-product"], [], [
      disposition("persist", ["source-carrier"], ["target-carrier"],
        ["nested-index-product"]),
      disposition("fuse", ["source-outer-radical", "source-inner-radical"],
        ["target-radical"], ["nested-index-product"])
    ]),
  "blocked-rewrite": declaration("blocked", ["source-expression"], [],
    ["no-valid-root-law"], [], []),
  "composed-derivation": declaration("composite", ["source-expression"],
    ["target-carrier", "target-absolute-value-enclosure"],
    ["prior-factoring-state", "even-positive-integer-power",
      "real-valued-carrier"],
    ["operation.equation.factor-perfect-square"], [])
} as const satisfies Record<KpRootRewriteClass,
  KpRootRewritePlanDeclaration>;

export const kpRootRewritePlanDeclarations = deepFreeze(
  rootRewritePlanDeclarationSeed
);

type KpDirectRootRewriteClass = Exclude<KpRootRewriteClass,
  "blocked-rewrite">;
type DeclarationFor<C extends KpRootRewriteClass> =
  typeof rootRewritePlanDeclarationSeed[C];
type RoleFor<C extends KpRootRewriteClass> =
  DeclarationFor<C>["sourceRoles"][number] |
  DeclarationFor<C>["targetRoles"][number];
type EvidenceFor<C extends KpRootRewriteClass> =
  DeclarationFor<C>["requiredEvidence"][number];

export type KpRootRewritePlanDraft<C extends KpDirectRootRewriteClass =
  KpDirectRootRewriteClass> = C extends KpDirectRootRewriteClass
  ? Readonly<{
      schemaVersion: "kp.root-rewrite-plan-draft.v1";
      id: string;
      operationClass: C;
      vocabularyAuthority: typeof KP_ROOT_REWRITE_VOCABULARY_AUTHORITY;
      sourceStateId: string;
      targetStateId: string;
      roleBindings: Readonly<Record<RoleFor<C>, KpRootRewriteOccurrence>>;
      evidence: Readonly<Record<EvidenceFor<C>, string>>;
      priorOperationIds: readonly string[];
    }>
  : never;

export type KpBlockedRootRewriteDraft = Readonly<{
  schemaVersion: "kp.root-rewrite-plan-draft.v1";
  id: string;
  operationClass: "blocked-rewrite";
  vocabularyAuthority: typeof KP_ROOT_REWRITE_VOCABULARY_AUTHORITY;
  sourceStateId: string;
  roleBindings: Readonly<Record<RoleFor<"blocked-rewrite">,
    KpRootRewriteOccurrence>>;
  evidence: Readonly<Record<EvidenceFor<"blocked-rewrite">, string>>;
  priorOperationIds: readonly [];
}>;

export type KpRootRewritePlanInput =
  | KpRootRewritePlanDraft
  | KpBlockedRootRewriteDraft;

export type KpRootRewriteNodeDisposition = Readonly<{
  kind: KpRootRewriteDispositionTemplate["kind"];
  sourceEntityIds: readonly string[];
  targetEntityIds: readonly string[];
  evidenceIds: readonly string[];
}>;

export type KpVerifiedRootRewritePlan = Readonly<{
  schemaVersion: "kp.verified-root-rewrite-plan.v1";
  kind: "verified-root-rewrite-plan";
  authority: typeof KP_ROOT_REWRITE_PLAN_AUTHORITY;
  id: string;
  operationClass: KpDirectRootRewriteClass;
  sourceStateId: string;
  targetStateId: string;
  execution: "atomic" | "sequence-only";
  roleBindings: Readonly<Record<string, KpRootRewriteOccurrence>>;
  evidence: Readonly<Record<string, string>>;
  priorOperationIds: readonly string[];
  dispositions: readonly KpRootRewriteNodeDisposition[];
  readonly [kpVerifiedRootRewritePlanBrand]: true;
}>;

export type KpRootRewritePlanResult =
  | Readonly<{ status: "verified"; plan: KpVerifiedRootRewritePlan }>
  | Readonly<{
      status: "typed-gap";
      diagnostic: Readonly<{
        code: "root-rewrite.no-valid-law";
        operationClass: "blocked-rewrite";
        message: string;
        repair: string;
      }>;
    }>;

export type KpRootRewritePlanErrorCode =
  | "root-rewrite.unexpected-field"
  | "root-rewrite.invalid-id"
  | "root-rewrite.role-mismatch"
  | "root-rewrite.evidence-mismatch"
  | "root-rewrite.prior-operation-mismatch"
  | "root-rewrite.carrier-identity-mismatch"
  | "root-rewrite.enclosure-identity-mismatch";

export class KpRootRewritePlanError extends Error {
  override readonly name = "KpRootRewritePlanError";
  readonly code: KpRootRewritePlanErrorCode;

  constructor(code: KpRootRewritePlanErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const verifiedPlans = new WeakSet<object>();

/**
 * The declaration chooses roles and dispositions. Drafts provide only exact
 * semantic occurrences and proof IDs, preventing authoring surfaces from
 * smuggling presentation or carrier policy into a verified plan.
 */
export function compileKpRootRewritePlan(
  draft: KpRootRewritePlanInput
): KpRootRewritePlanResult {
  assertDataOnly(draft, "rootRewrite");
  const declaration = kpRootRewritePlanDeclarations[draft.operationClass];
  const topLevelKeys = declaration.planKind === "blocked"
    ? ["schemaVersion", "id", "operationClass", "vocabularyAuthority",
      "sourceStateId", "roleBindings", "evidence", "priorOperationIds"]
    : ["schemaVersion", "id", "operationClass", "vocabularyAuthority",
      "sourceStateId", "targetStateId", "roleBindings", "evidence",
      "priorOperationIds"];
  assertExactKeys(draft, topLevelKeys, "rootRewrite");
  requireId(draft.id, "id");
  requireId(draft.sourceStateId, "sourceStateId");
  if (draft.vocabularyAuthority !== KP_ROOT_REWRITE_VOCABULARY_AUTHORITY) {
    fail("root-rewrite.unexpected-field", "Unknown root vocabulary authority.");
  }
  const roles = draft.roleBindings as Record<string, KpRootRewriteOccurrence>;
  const evidence = draft.evidence as Record<string, string>;
  assertExactKeys(roles,
    [...declaration.sourceRoles, ...declaration.targetRoles], "roleBindings",
    "root-rewrite.role-mismatch");
  assertExactKeys(evidence, declaration.requiredEvidence, "evidence",
    "root-rewrite.evidence-mismatch");
  Object.entries(roles).forEach(([role, occurrence]) =>
    validateOccurrence(occurrence, `roleBindings.${role}`));
  Object.entries(evidence).forEach(([kind, evidenceId]) =>
    requireId(evidenceId, `evidence.${kind}`,
      "root-rewrite.evidence-mismatch"));
  assertPriorOperations(draft.priorOperationIds,
    declaration.requiredPriorOperations);

  if (declaration.planKind === "blocked") {
    return deepFreeze({
      status: "typed-gap" as const,
      diagnostic: {
        code: "root-rewrite.no-valid-law" as const,
        operationClass: "blocked-rewrite" as const,
        message: "No verified root law licenses the requested rewrite.",
        repair:
          "Retain the radical or provide an ordered prior operation with exact evidence."
      }
    });
  }

  if (!("targetStateId" in draft)) {
    fail("root-rewrite.unexpected-field", "A verified plan needs a target state.");
  }
  requireId(draft.targetStateId, "targetStateId");
  const dispositions = declaration.dispositions.map((template) =>
    deriveDisposition(template, roles, evidence));
  const plan = deepFreeze({
    schemaVersion: "kp.verified-root-rewrite-plan.v1" as const,
    kind: "verified-root-rewrite-plan" as const,
    authority: KP_ROOT_REWRITE_PLAN_AUTHORITY,
    id: draft.id,
    operationClass: draft.operationClass as KpDirectRootRewriteClass,
    sourceStateId: draft.sourceStateId,
    targetStateId: draft.targetStateId,
    execution: declaration.planKind === "atomic"
      ? "atomic" as const
      : "sequence-only" as const,
    roleBindings: roles,
    evidence,
    priorOperationIds: [...draft.priorOperationIds],
    dispositions
  }) as unknown as KpVerifiedRootRewritePlan;
  verifiedPlans.add(plan);
  return deepFreeze({ status: "verified" as const, plan });
}

export function isKpVerifiedRootRewritePlan(
  value: unknown
): value is KpVerifiedRootRewritePlan {
  return typeof value === "object" && value !== null &&
    verifiedPlans.has(value);
}

function deriveDisposition(
  template: KpRootRewriteDispositionTemplate,
  roles: Readonly<Record<string, KpRootRewriteOccurrence>>,
  evidence: Readonly<Record<string, string>>
): KpRootRewriteNodeDisposition {
  const source = template.sourceRoles.map((role) => roles[role]!);
  const target = template.targetRoles.map((role) => roles[role]!);
  if (template.kind === "persist") {
    if (source.length !== 1 || target.length !== 1 ||
      source[0]!.semanticId !== target[0]!.semanticId ||
      source[0]!.subtreeId !== target[0]!.subtreeId) {
      fail("root-rewrite.carrier-identity-mismatch",
        "Persistent carriers need the same semantic and subtree identities.");
    }
  }
  if (template.kind === "retain-enclosure") {
    if (source.length !== 1 || target.length !== 1 ||
      source[0]!.semanticId !== target[0]!.semanticId) {
      fail("root-rewrite.enclosure-identity-mismatch",
        "A retained enclosure needs one stable semantic operator identity.");
    }
  }
  return deepFreeze({
    kind: template.kind,
    sourceEntityIds: source.map(({ entityId }) => entityId),
    targetEntityIds: target.map(({ entityId }) => entityId),
    evidenceIds: template.evidenceKinds.map((kind) => evidence[kind]!)
  });
}

function declaration<
  const Kind extends KpRootRewritePlanDeclaration["planKind"],
  const Source extends readonly KpRootRewriteRole[],
  const Target extends readonly KpRootRewriteRole[],
  const Evidence extends readonly KpRootRewriteEvidenceKind[],
  const Prior extends readonly string[],
  const Dispositions extends readonly KpRootRewriteDispositionTemplate[]
>(
  planKind: Kind,
  sourceRoles: Source,
  targetRoles: Target,
  requiredEvidence: Evidence,
  requiredPriorOperations: Prior,
  dispositions: Dispositions
): Readonly<{
  planKind: Kind;
  sourceRoles: Source;
  targetRoles: Target;
  requiredEvidence: Evidence;
  requiredPriorOperations: Prior;
  dispositions: Dispositions;
}> {
  return { planKind, sourceRoles, targetRoles, requiredEvidence,
    requiredPriorOperations, dispositions };
}

function disposition<
  const Kind extends KpRootRewriteDispositionTemplate["kind"],
  const Source extends readonly KpRootRewriteRole[],
  const Target extends readonly KpRootRewriteRole[],
  const Evidence extends readonly KpRootRewriteEvidenceKind[]
>(
  kind: Kind,
  sourceRoles: Source,
  targetRoles: Target,
  evidenceKinds: Evidence
): Readonly<{
  kind: Kind;
  sourceRoles: Source;
  targetRoles: Target;
  evidenceKinds: Evidence;
}> {
  return { kind, sourceRoles, targetRoles, evidenceKinds };
}

function validateOccurrence(
  occurrence: KpRootRewriteOccurrence,
  path: string
): void {
  assertExactKeys(occurrence,
    ["entityId", "semanticId", "subtreeId", "subtreeKind"], path,
    "root-rewrite.role-mismatch");
  requireId(occurrence.entityId, `${path}.entityId`,
    "root-rewrite.role-mismatch");
  requireId(occurrence.semanticId, `${path}.semanticId`,
    "root-rewrite.role-mismatch");
  requireId(occurrence.subtreeId, `${path}.subtreeId`,
    "root-rewrite.role-mismatch");
}

function assertPriorOperations(
  actual: readonly string[],
  required: readonly string[]
): void {
  if (actual.length !== required.length ||
    required.some((id, index) => actual[index] !== id)) {
    fail("root-rewrite.prior-operation-mismatch",
      `Expected prior operations ${required.join(", ") || "none"}.`);
  }
  actual.forEach((id, index) => requireId(id, `priorOperationIds.${index}`,
    "root-rewrite.prior-operation-mismatch"));
}

function requireId(
  value: string,
  path: string,
  code: KpRootRewritePlanErrorCode = "root-rewrite.invalid-id"
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(code, `${path} requires a non-empty ID.`);
  }
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  path: string,
  code: KpRootRewritePlanErrorCode = "root-rewrite.unexpected-field"
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])) {
    fail(code, `${path} must contain exactly ${wanted.join(", ")}.`);
  }
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    fail("root-rewrite.unexpected-field", `${path} cannot contain functions.`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertDataOnly(entry, `${path}.${index}`));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (/geometry|timing|keyframe|opacity|renderer|domNode|duration/iu.test(key)) {
        fail("root-rewrite.unexpected-field",
          `${path}.${key} is presentation authority.`);
      }
      assertDataOnly(entry, `${path}.${key}`);
    });
  }
}

function fail(code: KpRootRewritePlanErrorCode, message: string): never {
  throw new KpRootRewritePlanError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
