import type {
  KpOperationPresentationLawId
} from "./operation-presentation-law-types.ts";

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

export interface KpOperationEvaluationPresentationRegistry {
  readonly kind: "operation-evaluation-presentation-registry";
  readonly schemaVersion: "kp.operation-evaluation-presentation-registry.v2";
  readonly packs: readonly KpOperationEvaluationPresentationPack[];
  readonly entries: readonly KpOperationEvaluationPresentationEntry[];
  readonly planCompilers:
    readonly KpOperationEvaluationPresentationPlanCompilerDescriptor[];
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
  readonly schemaVersion: "kp.resolved-operation-evaluation-presentation.v2";
  readonly presentationId: string;
  readonly transformationKind: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly motifKind: string;
  readonly planCompiler:
    KpOperationEvaluationPresentationPlanCompilerDescriptor;
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
        | "missing-pin"
        | "version-mismatch";
      readonly transformationKind: string;
      readonly message: string;
    };
