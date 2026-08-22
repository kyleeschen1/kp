import { kpFiniteProductExpansionExemplarId } from
  "../animation/finite-product-expansion-exemplar.ts";
import { kpFiniteSumExpansionExemplarId } from
  "../animation/finite-sum-expansion-exemplar.ts";
import {
  KP_FINITE_BINDER_EXPAND_OPERATION,
  type KpVerifiedFiniteBinderExpansionOperation
} from "../semantic/finite-binder-expansion-operation.ts";
import {
  compileKpFiniteBinderCorpusRequest
} from "../semantic/finite-binder-expansion-corpus.ts";
import { defineKpFiniteBinderRange } from
  "../semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../semantic/finite-binder-scope-proof.ts";
import {
  KP_FINITE_PRODUCT_EXPAND_OPERATION,
  defineKpFiniteProductExpansionOperation,
  type KpVerifiedFiniteProductExpansionOperation
} from "../semantic/finite-product-expansion-operation.ts";
import {
  normalizeKpFiniteProductSourceEndpoint,
  normalizeKpFiniteProductTargetEndpoint
} from "../semantic/finite-product-endpoint-normalizer.ts";
import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX
} from "../semantic/canonical-finite-product-expansion.ts";
import {
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX
} from "../semantic/canonical-finite-sum-expansion.ts";
import { findKpForbiddenPresentationAuthority } from
  "./presentation-authority-firewall.ts";

export const KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA =
  "kp.finite-binder-authoring-request.v1" as const;
export const KP_FINITE_BINDER_AUTHORING_COMPILER_AUTHORITY =
  "compiler.authoring.finite-binder-expansion.v1" as const;

export type KpFiniteBinderAuthoringOperator = "sum" | "product";

export interface KpFiniteBinderAuthoringRequest {
  readonly schemaVersion: typeof KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA;
  readonly id: string;
  readonly operator: KpFiniteBinderAuthoringOperator;
  readonly source: string;
  readonly target: string;
}

export interface KpFiniteBinderAuthoringDeclaration {
  readonly id: string;
  readonly operator: KpFiniteBinderAuthoringOperator;
  readonly operationId: string;
  readonly friendlyName: string;
  readonly aliases: readonly string[];
  readonly canonicalAnimationId: string;
  readonly requiredEvidenceIds: readonly string[];
}

export interface KpVerifiedFiniteBinderAuthoringArtifact {
  readonly schemaVersion: "kp.verified-finite-binder-authoring-artifact.v1";
  readonly kind: "verified-finite-binder-authoring-artifact";
  readonly authority: typeof KP_FINITE_BINDER_AUTHORING_COMPILER_AUTHORITY;
  readonly request: KpFiniteBinderAuthoringRequest;
  readonly declaration: KpFiniteBinderAuthoringDeclaration;
  readonly operation:
    | KpVerifiedFiniteBinderExpansionOperation
    | KpVerifiedFiniteProductExpansionOperation;
  readonly catalogue: Readonly<{
    status: "canonical-asset" | "semantic-only";
    animationId?: string | undefined;
    reason: string;
  }>;
}

export type KpFiniteBinderAuthoringRepairCode =
  | "finite-binder-authoring.invalid-request"
  | "finite-binder-authoring.unknown-field"
  | "finite-binder-authoring.unsafe-authority"
  | "finite-binder-authoring.unknown-operator"
  | "finite-binder-authoring.source-unsupported"
  | "finite-binder-authoring.target-unsupported"
  | "finite-binder-authoring.scope-illegal"
  | "finite-binder-authoring.range-unsupported"
  | "finite-binder-authoring.expansion-invalid";

export interface KpFiniteBinderAuthoringDiagnostic {
  readonly code: KpFiniteBinderAuthoringRepairCode;
  readonly path: string;
  readonly message: string;
  readonly causeCode?: string | undefined;
  readonly repair: string;
}

export type KpFiniteBinderAuthoringResult =
  | Readonly<{
      status: "accepted";
      artifact: KpVerifiedFiniteBinderAuthoringArtifact;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly KpFiniteBinderAuthoringDiagnostic[];
    }>;

interface KpFiniteBinderAuthoringDriver {
  readonly declaration: KpFiniteBinderAuthoringDeclaration;
  readonly canonicalSource: string;
  readonly canonicalTarget: string;
  readonly compile: (request: KpFiniteBinderAuthoringRequest) =>
    KpFiniteBinderDriverResult;
}

type KpFiniteBinderDriverResult =
  | Readonly<{
      status: "verified";
      operation:
        | KpVerifiedFiniteBinderExpansionOperation
        | KpVerifiedFiniteProductExpansionOperation;
    }>
  | Readonly<{
      status: "repair-required";
      diagnostic: KpFiniteBinderAuthoringDiagnostic;
    }>;

const verifiedArtifacts = new WeakSet<object>();
const drivers = defineDrivers([{
  declaration: declaration({
    id: "authoring.finite-binder.sum-expansion.v1",
    operator: "sum",
    operationId: KP_FINITE_BINDER_EXPAND_OPERATION,
    friendlyName: "Expand a finite sum",
    aliases: ["finite sum", "sum expansion", "expand sigma"],
    canonicalAnimationId: kpFiniteSumExpansionExemplarId
  }),
  canonicalSource: KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  canonicalTarget: KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
  compile: compileSum
}, {
  declaration: declaration({
    id: "authoring.finite-binder.product-expansion.v1",
    operator: "product",
    operationId: KP_FINITE_PRODUCT_EXPAND_OPERATION,
    friendlyName: "Expand a finite product",
    aliases: ["finite product", "product expansion", "expand pi"],
    canonicalAnimationId: kpFiniteProductExpansionExemplarId
  }),
  canonicalSource: KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  canonicalTarget: KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
  compile: compileProduct
}]);

export interface KpFiniteBinderAuthoringApi {
  readonly schemaVersion: "kp.finite-binder-authoring-api.v1";
  readonly list: (query?: string) => readonly KpFiniteBinderAuthoringDeclaration[];
  readonly inspect: (operationOrAlias: string) =>
    KpFiniteBinderAuthoringDeclaration | undefined;
  readonly compile: (request: unknown) => KpFiniteBinderAuthoringResult;
}

/**
 * Declarations own dispatch, keeping future operator families additive. The
 * API exposes semantic requests and typed repairs but never motion parameters.
 */
export function createKpFiniteBinderAuthoringApi(): KpFiniteBinderAuthoringApi {
  const declarations = Object.freeze(drivers.map(({ declaration }) =>
    declaration
  ));
  const aliases = new Map<string, KpFiniteBinderAuthoringDeclaration>();
  for (const declaration of declarations) {
    [declaration.id, declaration.operationId, declaration.friendlyName,
      ...declaration.aliases].forEach((alias) => {
      const key = normalizeAlias(alias);
      if (aliases.has(key)) {
        throw new Error(`Duplicate finite-binder authoring alias ${key}.`);
      }
      aliases.set(key, declaration);
    });
  }
  return Object.freeze({
    schemaVersion: "kp.finite-binder-authoring-api.v1" as const,
    list: (query = "") => {
      const terms = normalizeAlias(query).split(" ").filter(Boolean);
      if (terms.length === 0) return declarations;
      return Object.freeze(declarations.filter((candidate) => {
        const haystack = normalizeAlias([
          candidate.id,
          candidate.operationId,
          candidate.friendlyName,
          ...candidate.aliases
        ].join(" "));
        return terms.every((term) => haystack.includes(term));
      }));
    },
    inspect: (requested: string) => aliases.get(normalizeAlias(requested)),
    compile: compileRequest
  });
}

export function isKpVerifiedFiniteBinderAuthoringArtifact(
  value: unknown
): value is KpVerifiedFiniteBinderAuthoringArtifact {
  return typeof value === "object" && value !== null &&
    verifiedArtifacts.has(value);
}

function compileRequest(request: unknown): KpFiniteBinderAuthoringResult {
  const issues = validateRequest(request);
  if (issues.length > 0) return repairRequired(issues);
  const input = request as KpFiniteBinderAuthoringRequest;
  const sanitized = deepFreeze({
    schemaVersion: KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA,
    id: input.id.trim(),
    operator: input.operator,
    source: input.source.trim(),
    target: input.target.trim()
  });
  const driver = drivers.find(({ declaration }) =>
    declaration.operator === sanitized.operator
  );
  if (driver === undefined) return repairRequired([diagnostic(
    "finite-binder-authoring.unknown-operator",
    "$.operator",
    `Unknown finite-binder operator ${String(sanitized.operator)}.`,
    "Choose one operation returned by list()."
  )]);
  const result = driver.compile(sanitized);
  if (result.status !== "verified") {
    return repairRequired([result.diagnostic]);
  }
  const canonical = sanitized.source === driver.canonicalSource &&
    sanitized.target === driver.canonicalTarget;
  const artifact = deepFreeze({
    schemaVersion: "kp.verified-finite-binder-authoring-artifact.v1" as const,
    kind: "verified-finite-binder-authoring-artifact" as const,
    authority: KP_FINITE_BINDER_AUTHORING_COMPILER_AUTHORITY,
    request: sanitized,
    declaration: driver.declaration,
    operation: result.operation,
    catalogue: canonical ? {
      status: "canonical-asset" as const,
      animationId: driver.declaration.canonicalAnimationId,
      reason: "The verified endpoints match the reviewed canonical asset."
    } : {
      status: "semantic-only" as const,
      reason:
        "The semantic expansion is verified, but no reviewed visual asset owns these endpoints."
    }
  });
  verifiedArtifacts.add(artifact);
  return deepFreeze({
    status: "accepted" as const,
    artifact,
    diagnostics: [] as const
  });
}

function compileSum(
  request: KpFiniteBinderAuthoringRequest
): KpFiniteBinderDriverResult {
  const result = compileKpFiniteBinderCorpusRequest({
    id: request.id,
    sourceLatex: request.source,
    targetLatex: request.target
  });
  if (result.status === "accepted") return Object.freeze({
    status: "verified" as const,
    operation: result.operation
  });
  return Object.freeze({
    status: "repair-required" as const,
    diagnostic: diagnostic(
      mapCorpusCode(result.code),
      result.code.includes("target") ? "$.target" : "$.source",
      result.message,
      result.repair,
      result.causeCode
    )
  });
}

function compileProduct(
  request: KpFiniteBinderAuthoringRequest
): KpFiniteBinderDriverResult {
  const source = normalizeKpFiniteProductSourceEndpoint(request.source);
  if (source.status !== "normalized") return driverRepair(
    "finite-binder-authoring.source-unsupported", "$.source",
    source.diagnostic
  );
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  if (scope.status !== "verified") return driverRepair(
    "finite-binder-authoring.scope-illegal", "$.source", scope.diagnostic
  );
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  if (range.status !== "verified") return driverRepair(
    "finite-binder-authoring.range-unsupported", "$.source", range.diagnostic
  );
  const target = normalizeKpFiniteProductTargetEndpoint(request.target);
  if (target.status !== "normalized") return driverRepair(
    "finite-binder-authoring.target-unsupported", "$.target",
    target.diagnostic
  );
  const operation = defineKpFiniteProductExpansionOperation({
    source: source.endpoint,
    target: target.endpoint,
    scopeProof: scope.proof,
    rangeProof: range.range
  });
  if (operation.status !== "verified") return driverRepair(
    "finite-binder-authoring.expansion-invalid", "$.target",
    operation.diagnostic
  );
  return Object.freeze({
    status: "verified" as const,
    operation: operation.operation
  });
}

function validateRequest(value: unknown): KpFiniteBinderAuthoringDiagnostic[] {
  if (!isRecord(value)) return [diagnostic(
    "finite-binder-authoring.invalid-request", "$",
    "A finite-binder request must be an object.",
    "Provide schemaVersion, id, operator, source, and target."
  )];
  const issues: KpFiniteBinderAuthoringDiagnostic[] = [];
  const allowed = new Set(["schemaVersion", "id", "operator", "source", "target"]);
  Object.keys(value).filter((key) => !allowed.has(key)).forEach((key) =>
    issues.push(diagnostic(
      "finite-binder-authoring.unknown-field", `$.${key}`,
      `Field ${key} is outside the finite-binder request vocabulary.`,
      `Remove $.${key}; the compiler owns semantic and presentation authority.`
    ))
  );
  // Source and target text are intentionally authored here; all other
  // mathematical truth is reconstructed and verified by the compiler chain.
  findKpForbiddenPresentationAuthority(value)
    .filter(({ authority }) => authority !== "math-truth")
    .forEach((issue) => issues.push(diagnostic(
      "finite-binder-authoring.unsafe-authority", issue.path,
      issue.message,
      `Remove ${issue.path}; authors choose the operation, not its presentation.`
    )));
  if (value["schemaVersion"] !== KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA) {
    issues.push(diagnostic(
      "finite-binder-authoring.invalid-request", "$.schemaVersion",
      `Expected ${KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA}.`,
      `Set schemaVersion to ${KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA}.`
    ));
  }
  for (const key of ["id", "source", "target"] as const) {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
      issues.push(diagnostic(
        "finite-binder-authoring.invalid-request", `$.${key}`,
        `${key} must be a non-empty string.`, `Provide $.${key}.`
      ));
    }
  }
  if (value["operator"] !== "sum" && value["operator"] !== "product") {
    issues.push(diagnostic(
      "finite-binder-authoring.unknown-operator", "$.operator",
      "operator must be sum or product.",
      "Use list() to inspect supported finite-binder operators."
    ));
  }
  return issues;
}

function defineDrivers(
  candidates: readonly KpFiniteBinderAuthoringDriver[]
): readonly KpFiniteBinderAuthoringDriver[] {
  const operators = new Set<string>();
  const ids = new Set<string>();
  for (const candidate of candidates) {
    if (operators.has(candidate.declaration.operator) ||
        ids.has(candidate.declaration.id)) {
      throw new Error(
        `Duplicate finite-binder authoring driver ${candidate.declaration.id}.`
      );
    }
    operators.add(candidate.declaration.operator);
    ids.add(candidate.declaration.id);
  }
  return Object.freeze([...candidates]);
}

function declaration(input: Omit<KpFiniteBinderAuthoringDeclaration,
  "requiredEvidenceIds">): KpFiniteBinderAuthoringDeclaration {
  return deepFreeze({
    ...input,
    aliases: [...input.aliases],
    requiredEvidenceIds: [
      "finite-binder.scope-proof",
      "finite-binder.inclusive-range-proof",
      "finite-binder.expansion-kernel",
      `${input.operator}.connective-topology`
    ]
  });
}

function driverRepair(
  code: KpFiniteBinderAuthoringRepairCode,
  path: string,
  cause: { readonly code: string; readonly message: string; readonly repair: string }
): KpFiniteBinderDriverResult {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostic: diagnostic(code, path, cause.message, cause.repair, cause.code)
  });
}

function mapCorpusCode(
  code: string
): KpFiniteBinderAuthoringRepairCode {
  if (code.includes("source")) return "finite-binder-authoring.source-unsupported";
  if (code.includes("target")) return "finite-binder-authoring.target-unsupported";
  if (code.includes("scope")) return "finite-binder-authoring.scope-illegal";
  if (code.includes("range")) return "finite-binder-authoring.range-unsupported";
  return "finite-binder-authoring.expansion-invalid";
}

function diagnostic(
  code: KpFiniteBinderAuthoringRepairCode,
  path: string,
  message: string,
  repair: string,
  causeCode?: string
): KpFiniteBinderAuthoringDiagnostic {
  return Object.freeze({ code, path, message, repair, ...(causeCode === undefined
    ? {} : { causeCode }) });
}

function repairRequired(
  diagnostics: readonly KpFiniteBinderAuthoringDiagnostic[]
): KpFiniteBinderAuthoringResult {
  return deepFreeze({
    status: "repair-required" as const,
    diagnostics: [...diagnostics]
  });
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
