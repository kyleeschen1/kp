import type {
  KpOperationPresentationLawId
} from "./operation-presentation-law-types.ts";
import type {
  KpExplicitStaticCheckpointPlan
} from "./operation-presentation-plan-types.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";

export const kpCanonicalOperationEvaluationTransformationKinds = [
  "simplifyConstantProduct",
  "simplifyConstantQuotient",
  "simplifyConstantDifference",
  "simplifyConstantSum"
] as const;

export type KpCanonicalOperationEvaluationTransformationKind =
  (typeof kpCanonicalOperationEvaluationTransformationKinds)[number];

export type KpOperationEvaluationPresentationPackScope = "core" | "extension";

export interface KpOperationEvaluationPresentationPackDependency {
  readonly packId: string;
  readonly version: string;
}

export interface KpOperationEvaluationPresentationPack {
  readonly kind: "operation-evaluation-presentation-pack";
  readonly id: string;
  readonly scope: KpOperationEvaluationPresentationPackScope;
  readonly version: string;
  readonly title: string;
  readonly presentationIds: readonly string[];
  readonly dependencies: readonly KpOperationEvaluationPresentationPackDependency[];
}

export interface KpOperationEvaluationPresentationEntry {
  readonly id: string;
  readonly packId: string;
  readonly transformationKind: string;
  /**
   * Extension packs remain open to the shared vocabulary; registry creation
   * closes this string against the current equation motif descriptors.
   */
  readonly motifKind: string;
  readonly planCompiler:
    KpOperationEvaluationPresentationPlanCompilerRef;
  readonly executableProgramCompiler:
    KpOperationEvaluationExecutableProgramCompilerRef;
  readonly paintContinuityCompiler:
    KpOperationEvaluationPaintContinuityCompilerRef;
  /**
   * A compound transformation can host several distinct evaluations. Binding
   * dispatch therefore follows the semantic operation that owns the material,
   * not the broader parent transformation kind.
   */
  readonly semanticOperationIds: readonly string[];
  readonly definitionIds: readonly string[];
  readonly canonicalOperationIds: readonly string[];
  readonly trustedMotifIds: readonly string[];
  readonly summary: string;
}

export interface KpOperationEvaluationPresentationPlanCompilerRef {
  readonly id: string;
  readonly version: string;
}

export interface KpOperationEvaluationPresentationPlanCompilerDescriptor
  extends KpOperationEvaluationPresentationPlanCompilerRef {
  readonly planKind: string;
  readonly motifKind: string;
  readonly lawIds: readonly KpOperationPresentationLawId[];
}

export interface KpOperationEvaluationExecutableProgramCompilerRef {
  readonly id: string;
  readonly version: string;
}

export interface KpOperationEvaluationExecutableProgramCompilerDescriptor
  extends KpOperationEvaluationExecutableProgramCompilerRef {
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
}

export interface KpOperationEvaluationPaintContinuityCompilerRef {
  readonly id: string;
  readonly version: string;
}

export interface KpOperationEvaluationPaintContinuityCompilerDescriptor
  extends KpOperationEvaluationPaintContinuityCompilerRef {
  readonly transferTopology: "shared-zero-area-junction";
  readonly nonZeroPaint: "opaque";
  readonly endpointSettlement: "native-source-and-target";
  readonly boundaryLawId: "paint-continuity.t-epsilon-boundary";
}

export interface KpOperationEvaluationPresentationRegistry {
  readonly kind: "operation-evaluation-presentation-registry";
  readonly schemaVersion: "kp.operation-evaluation-presentation-registry.v4";
  readonly packs: readonly KpOperationEvaluationPresentationPack[];
  readonly entries: readonly KpOperationEvaluationPresentationEntry[];
  readonly planCompilers:
    readonly KpOperationEvaluationPresentationPlanCompilerDescriptor[];
  readonly executableProgramCompilers:
    readonly KpOperationEvaluationExecutableProgramCompilerDescriptor[];
  readonly paintContinuityCompilers:
    readonly KpOperationEvaluationPaintContinuityCompilerDescriptor[];
}

export interface KpOperationEvaluationPresentationPackPin {
  readonly packId: string;
  readonly version: string;
}

export interface KpOperationEvaluationPresentationPins {
  readonly schemaVersion: "kp.operation-evaluation-presentation-pins.v1";
  readonly packs: readonly KpOperationEvaluationPresentationPackPin[];
}

declare const kpResolvedOperationEvaluationPresentationBrand: unique symbol;

/**
 * Only registry resolution can mint this certificate. Canonical callers must
 * not bypass version checks by reconstructing a visually similar raw rule.
 */
export interface KpResolvedOperationEvaluationPresentation {
  readonly schemaVersion: "kp.resolved-operation-evaluation-presentation.v4";
  readonly presentationId: string;
  readonly transformationKind: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly motifKind: string;
  readonly planCompiler:
    KpOperationEvaluationPresentationPlanCompilerDescriptor;
  readonly executableProgramCompiler:
    KpOperationEvaluationExecutableProgramCompilerDescriptor;
  readonly paintContinuityCompiler:
    KpOperationEvaluationPaintContinuityCompilerDescriptor;
  readonly semanticOperationIds: readonly string[];
  readonly definitionIds: readonly string[];
  readonly canonicalOperationIds: readonly string[];
  readonly trustedMotifIds: readonly string[];
  readonly summary: string;
  readonly [kpResolvedOperationEvaluationPresentationBrand]: true;
}

export type KpOperationEvaluationPresentationResolution =
  | {
      readonly status: "resolved";
      readonly certificate: KpResolvedOperationEvaluationPresentation;
    }
  | {
      readonly status:
        | "unknown-transformation"
        | "unknown-operation"
        | "missing-pin"
        | "version-mismatch";
      readonly transformationKind: string;
      readonly message: string;
    };

export type KpOperationEvaluationPresentationRoute =
  | {
      readonly status: "resolved";
      readonly certificate: KpResolvedOperationEvaluationPresentation;
    }
  | {
      readonly status: "explicit-static";
      readonly resolutionStatus:
        | "unknown-transformation"
        | "unknown-operation"
        | "missing-pin"
        | "version-mismatch";
      readonly checkpoint: KpExplicitStaticCheckpointPlan;
    };
