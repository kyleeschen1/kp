import type {
  KpAnimationGenerationDomain,
  KpAnimationGenerationRequest
} from "./animation-generation-request.ts";

export const KP_GALLERY_GENERATION_RESULT_SCHEMA =
  "kp.gallery-generation-result.v1" as const;

export interface KpGalleryFrontendAuthorityReference {
  readonly frontendId: string;
  readonly sourcePath: string;
}

export interface KpGallerySemanticTraceReference {
  readonly id: string;
  readonly kind: string;
  readonly authoritySourcePath: string;
}

export interface KpGalleryArtifactReference {
  readonly artifactId: string;
  readonly artifactSourcePath: string;
  readonly timelineId: string;
  readonly hostId: string;
  readonly hostSourcePath: string;
  readonly rendererId: string;
  readonly rendererSourcePath: string;
  readonly directUrl: string;
  readonly directUrlSourcePath: string;
  readonly vignetteId?: string;
  readonly vignetteSourcePath?: string;
}

export interface KpGalleryGenerationDiagnostic {
  readonly authority:
    | "request-envelope"
    | "domain-frontend"
    | "cross-domain-router";
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

interface KpGalleryGenerationAcceptedBase {
  readonly schemaVersion: typeof KP_GALLERY_GENERATION_RESULT_SCHEMA;
  readonly requestId: string;
  readonly domain: KpAnimationGenerationDomain;
  readonly capabilityPins: readonly string[];
  readonly frontendAuthority: KpGalleryFrontendAuthorityReference;
  // This is a reference on purpose: domain plans do not become a shared IR.
  readonly semanticTrace: KpGallerySemanticTraceReference;
  readonly explanationClaimRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly diagnostics: readonly [];
}

export interface KpGalleryCompiledArtifactResult extends
KpGalleryGenerationAcceptedBase {
  readonly status: "compiled-artifact";
  readonly artifact: KpGalleryArtifactReference;
}

export interface KpGalleryExistingArtifactResult extends
KpGalleryGenerationAcceptedBase {
  readonly status: "existing-artifact";
  readonly artifact: KpGalleryArtifactReference;
}

export interface KpGallerySemanticPlanOnlyResult extends
KpGalleryGenerationAcceptedBase {
  readonly status: "semantic-plan-only";
  readonly reason: string;
}

export interface KpGalleryRepairRequiredResult {
  readonly schemaVersion: typeof KP_GALLERY_GENERATION_RESULT_SCHEMA;
  readonly status: "repair-required";
  readonly requestId?: string;
  readonly domain?: KpAnimationGenerationDomain;
  readonly capabilityPins?: readonly string[];
  readonly frontendAuthority?: KpGalleryFrontendAuthorityReference;
  readonly semanticTrace?: KpGallerySemanticTraceReference;
  readonly explanationClaimRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly diagnostics: readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}

export type KpGalleryGenerationResult =
  | KpGalleryCompiledArtifactResult
  | KpGalleryExistingArtifactResult
  | KpGallerySemanticPlanOnlyResult
  | KpGalleryRepairRequiredResult;

interface KpGalleryAcceptedProjectionBase {
  readonly request: KpAnimationGenerationRequest;
  readonly frontendAuthoritySourcePath: string;
  readonly semanticTrace: KpGallerySemanticTraceReference;
  readonly explanationClaimRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export type KpGalleryAcceptedProjectionInput =
  | Readonly<KpGalleryAcceptedProjectionBase & {
      readonly status: "compiled-artifact" | "existing-artifact";
      readonly artifact: KpGalleryArtifactReference;
    }>
  | Readonly<KpGalleryAcceptedProjectionBase & {
      readonly status: "semantic-plan-only";
      readonly reason: string;
    }>;

export interface KpGalleryRepairProjectionInput {
  readonly request?: KpAnimationGenerationRequest;
  readonly frontendAuthoritySourcePath?: string;
  readonly semanticTrace?: KpGallerySemanticTraceReference;
  readonly explanationClaimRefs?: readonly string[];
  readonly evidenceRefs?: readonly string[];
  readonly diagnostics: readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}

export function projectKpGalleryAcceptedGeneration(
  input: KpGalleryAcceptedProjectionInput
): KpGalleryCompiledArtifactResult | KpGalleryExistingArtifactResult |
KpGallerySemanticPlanOnlyResult {
  const base = acceptedBase(input);
  if (input.status === "semantic-plan-only") return deepFreeze({
    ...base,
    status: input.status,
    reason: input.reason
  });
  return deepFreeze({
    ...base,
    status: input.status,
    artifact: input.artifact
  });
}

export function projectKpGalleryGenerationRepair(
  input: KpGalleryRepairProjectionInput
): KpGalleryRepairRequiredResult {
  const request = input.request;
  return deepFreeze({
    schemaVersion: KP_GALLERY_GENERATION_RESULT_SCHEMA,
    status: "repair-required" as const,
    ...(request === undefined ? {} : {
      requestId: request.requestId,
      domain: request.domain,
      capabilityPins: [...request.capabilityPins],
      ...(input.frontendAuthoritySourcePath === undefined ? {} : {
        frontendAuthority: {
          frontendId: request.source.frontendId,
          sourcePath: input.frontendAuthoritySourcePath
        }
      })
    }),
    ...(input.semanticTrace === undefined
      ? {}
      : { semanticTrace: input.semanticTrace }),
    explanationClaimRefs: [...(input.explanationClaimRefs ?? [])],
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    diagnostics: [...input.diagnostics] as [
      KpGalleryGenerationDiagnostic,
      ...KpGalleryGenerationDiagnostic[]
    ]
  });
}

function acceptedBase(input: KpGalleryAcceptedProjectionBase):
KpGalleryGenerationAcceptedBase {
  return {
    schemaVersion: KP_GALLERY_GENERATION_RESULT_SCHEMA,
    requestId: input.request.requestId,
    domain: input.request.domain,
    capabilityPins: [...input.request.capabilityPins],
    frontendAuthority: {
      frontendId: input.request.source.frontendId,
      sourcePath: input.frontendAuthoritySourcePath
    },
    semanticTrace: input.semanticTrace,
    explanationClaimRefs: [...input.explanationClaimRefs],
    evidenceRefs: [...input.evidenceRefs],
    diagnostics: []
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
