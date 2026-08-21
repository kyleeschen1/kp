import type {
  KpAnimationGenerationRequestDiagnostic
} from "./animation-generation-request.ts";
import type {
  KpCodeRefactorGenerationDiagnostic
} from "./code-refactor-generation-diagnostic.ts";
import type {
  KpCodeRefactorGenerationRequestDiagnostic,
  KpCodeRefactorLanguage
} from "./code-refactor-generation-request.ts";

export const KP_CODE_GENERATION_ORCHESTRATION_SCHEMA =
  "kp.code-generation-orchestration.v1" as const;

export interface KpExistingCodeAnimationHandle {
  readonly status: "existing-artifact";
  readonly artifactId: string;
  readonly timelineId: string;
  readonly clockAuthority: "canonical-artifact-timeline";
  readonly paintAuthority: "canonical-artifact-renderer";
}

export interface KpSemanticPlanOnlyHandle {
  readonly status: "semantic-plan-only";
  readonly reason:
    "generated-semantics-require-governed-artifact-compilation";
}

export type KpCodeGenerationTargetHandle =
  | KpExistingCodeAnimationHandle
  | KpSemanticPlanOnlyHandle;

export interface KpCodeGenerationOrchestrationDiagnostic {
  readonly code:
    | "code-generation.orchestration-route-mismatch"
    | "code-generation.artifact-unavailable";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export type KpCodeGenerationOrchestrationRepair =
  | KpAnimationGenerationRequestDiagnostic
  | KpCodeRefactorGenerationRequestDiagnostic
  | KpCodeRefactorGenerationDiagnostic
  | KpCodeGenerationOrchestrationDiagnostic;

export interface KpAcceptedCodeGenerationOrchestration<TSemanticPlan> {
  readonly schemaVersion: typeof KP_CODE_GENERATION_ORCHESTRATION_SCHEMA;
  readonly status: "accepted";
  readonly requestId: string;
  readonly language: KpCodeRefactorLanguage;
  readonly semanticPlan: TSemanticPlan;
  readonly target: KpCodeGenerationTargetHandle;
  readonly diagnostics: readonly [];
}

export interface KpRejectedCodeGenerationOrchestration {
  readonly schemaVersion: typeof KP_CODE_GENERATION_ORCHESTRATION_SCHEMA;
  readonly status: "repair-required";
  readonly requestId?: string;
  readonly language?: KpCodeRefactorLanguage;
  readonly diagnostics: readonly KpCodeGenerationOrchestrationRepair[];
}
