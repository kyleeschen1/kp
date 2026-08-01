import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../animation/motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../animation/motifs/executable-successor-motif-program-authority.ts";
import {
  isKpExecutableSuccessorMotifProgramRoute,
  resolveKpExecutableSuccessorMotifProgramRoute,
  type KpExecutableSuccessorMotifProgramRoute
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";

const kpExecutableMotifPromotionCertificateAuthority = Symbol(
  "kp.executable-motif-promotion-certificate"
);
const verifiedPromotionCertificates = new WeakSet<object>();

const evidenceFields = Object.freeze([
  "exhaustiveAdapterEvidenceSourceIds",
  "phaseRoleConformanceEvidenceSourceIds",
  "perceptualContinuityEvidenceSourceIds",
  "endpointEquivalenceEvidenceSourceIds",
  "browserEvidenceSourceIds"
] as const);

export interface KpExecutableMotifPromotionEvidenceDraft {
  readonly schemaVersion: "kp.executable-motif-promotion-evidence.v1";
  readonly animationId: string;
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly route: KpExecutableSuccessorMotifProgramRoute;
  readonly exhaustiveAdapterEvidenceSourceIds: readonly string[];
  readonly phaseRoleConformanceEvidenceSourceIds: readonly string[];
  readonly perceptualContinuityEvidenceSourceIds: readonly string[];
  readonly endpointEquivalenceEvidenceSourceIds: readonly string[];
  readonly browserEvidenceSourceIds: readonly string[];
  readonly humanApprovalEvidenceSourceId: string;
}

export interface KpVerifiedExecutableMotifPromotionCertificate {
  readonly schemaVersion:
    "kp.verified-executable-motif-promotion-certificate.v1";
  readonly kind: "verified-executable-motif-promotion-certificate";
  readonly animationId: string;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind:
    KpVerifiedExecutableSuccessorMotifProgram["kind"];
  readonly primitiveRoute:
    KpExecutableSuccessorMotifProgramRoute["primitiveRoute"];
  readonly evidenceSourceIds: readonly string[];
  readonly humanApprovalEvidenceSourceId: string;
  readonly [kpExecutableMotifPromotionCertificateAuthority]: true;
}

export type KpExecutableMotifPromotionEvidenceIssueCode =
  | "promotion.input.invalid"
  | "promotion.input.unsupported-field"
  | "promotion.schema.unsupported"
  | "promotion.animation-id.missing"
  | "promotion.program.unverified"
  | "promotion.route.unverified"
  | "promotion.route.mismatch"
  | "promotion.evidence.missing"
  | "promotion.evidence.duplicate"
  | "promotion.human-review.missing";

export interface KpExecutableMotifPromotionEvidenceIssue {
  readonly code: KpExecutableMotifPromotionEvidenceIssueCode;
  readonly field?: string | undefined;
  readonly message: string;
}

/**
 * A display label or a checked boolean is not promotion authority. This mint
 * ties promotion to the exact trusted program and route objects plus complete
 * evidence categories; the WeakSet check makes copied JSON and unsafe casts
 * fail at the consumer boundary.
 */
export function certifyKpExecutableMotifPromotionEvidence(
  draft: KpExecutableMotifPromotionEvidenceDraft
): KpVerifiedExecutableMotifPromotionCertificate {
  const issues = checkKpExecutableMotifPromotionEvidence(draft);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }

  const evidenceSourceIds = Object.freeze([
    ...draft.exhaustiveAdapterEvidenceSourceIds,
    ...draft.phaseRoleConformanceEvidenceSourceIds,
    ...draft.perceptualContinuityEvidenceSourceIds,
    ...draft.endpointEquivalenceEvidenceSourceIds,
    ...draft.browserEvidenceSourceIds
  ]);
  const certificate = Object.freeze({
    schemaVersion:
      "kp.verified-executable-motif-promotion-certificate.v1" as const,
    kind: "verified-executable-motif-promotion-certificate" as const,
    animationId: draft.animationId,
    programId: draft.program.id,
    programVersion: draft.program.programVersion,
    programKind: draft.program.kind,
    primitiveRoute: draft.route.primitiveRoute,
    evidenceSourceIds,
    humanApprovalEvidenceSourceId: draft.humanApprovalEvidenceSourceId,
    [kpExecutableMotifPromotionCertificateAuthority]: true as const
  });
  verifiedPromotionCertificates.add(certificate);
  return certificate;
}

export function isKpVerifiedExecutableMotifPromotionCertificate(
  value: unknown
): value is KpVerifiedExecutableMotifPromotionCertificate {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedPromotionCertificates.has(value)
  );
}

export function checkKpExecutableMotifPromotionEvidence(
  value: unknown
): readonly KpExecutableMotifPromotionEvidenceIssue[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return Object.freeze([issue(
      "promotion.input.invalid",
      "Executable motif promotion evidence must be an object."
    )]);
  }
  const draft = value as Record<string, unknown>;
  const supportedFields = new Set([
    "schemaVersion",
    "animationId",
    "program",
    "route",
    ...evidenceFields,
    "humanApprovalEvidenceSourceId"
  ]);
  const issues: KpExecutableMotifPromotionEvidenceIssue[] = [];

  for (const field of Object.keys(draft)) {
    if (!supportedFields.has(field)) {
      issues.push(issue(
        "promotion.input.unsupported-field",
        `Executable motif promotion evidence cannot author ${field}.`,
        field
      ));
    }
  }
  if (draft["schemaVersion"] !== "kp.executable-motif-promotion-evidence.v1") {
    issues.push(issue(
      "promotion.schema.unsupported",
      "Executable motif promotion evidence has an unsupported schema.",
      "schemaVersion"
    ));
  }
  if (!nonEmptyString(draft["animationId"])) {
    issues.push(issue(
      "promotion.animation-id.missing",
      "Executable motif promotion evidence requires an animation id.",
      "animationId"
    ));
  }

  const program = draft["program"];
  const route = draft["route"];
  if (!isKpVerifiedExecutableSuccessorMotifProgram(program)) {
    issues.push(issue(
      "promotion.program.unverified",
      "Executable motif promotion requires a minted program.",
      "program"
    ));
  }
  if (!isKpExecutableSuccessorMotifProgramRoute(route)) {
    issues.push(issue(
      "promotion.route.unverified",
      "Executable motif promotion requires a minted exhaustive adapter route.",
      "route"
    ));
  }
  if (
    isKpVerifiedExecutableSuccessorMotifProgram(program) &&
    isKpExecutableSuccessorMotifProgramRoute(route) &&
    resolveKpExecutableSuccessorMotifProgramRoute(program) !== route
  ) {
    issues.push(issue(
      "promotion.route.mismatch",
      "Executable motif promotion route does not belong to its exact program.",
      "route"
    ));
  }

  const allEvidenceIds: string[] = [];
  for (const field of evidenceFields) {
    const ids = draft[field];
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => !nonEmptyString(id))
    ) {
      issues.push(issue(
        "promotion.evidence.missing",
        `Executable motif promotion requires non-empty ${field}.`,
        field
      ));
      continue;
    }
    allEvidenceIds.push(...ids);
  }
  if (new Set(allEvidenceIds).size !== allEvidenceIds.length) {
    issues.push(issue(
      "promotion.evidence.duplicate",
      "Executable motif promotion evidence source ids must be unique."
    ));
  }
  if (!nonEmptyString(draft["humanApprovalEvidenceSourceId"])) {
    issues.push(issue(
      "promotion.human-review.missing",
      "Executable motif promotion requires explicit human approval evidence.",
      "humanApprovalEvidenceSourceId"
    ));
  }

  return Object.freeze(issues);
}

function issue(
  code: KpExecutableMotifPromotionEvidenceIssueCode,
  message: string,
  field?: string
): KpExecutableMotifPromotionEvidenceIssue {
  return Object.freeze({
    code,
    message,
    ...(field === undefined ? {} : { field })
  });
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
