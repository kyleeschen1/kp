import type { KpAssetProvenance } from "./asset.ts";
import type { KpTransformationLawRef } from "./asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";

/** Read-only audit data, never a capability to execute or certify mathematics. */
export type KpSymbolicInspectionCheck =
  | { readonly status: "checked"; readonly scope: "reference-and-lifecycle"; readonly owner: "validateKpSemanticTransformation" }
  | { readonly status: "declared"; readonly scope: "law"; readonly law: KpTransformationLawRef }
  | { readonly status: "unknown"; readonly scope: "assumption"; readonly statement: string };

export interface KpSymbolicInspectionOccurrence {
  readonly side: "source" | "target";
  readonly objectId: string;
  readonly selectorId: string;
  readonly label: string;
  readonly kind: string;
  readonly provenance?: KpAssetProvenance;
}

export interface KpSymbolicInspectionEvidence {
  readonly schemaVersion: "kp.symbolic-inspection.v1";
  readonly assetId: string;
  readonly sourceRevision: string;
  readonly targetRevision: string;
  readonly transformationId: string;
  readonly title: string;
  readonly operation: string;
  readonly definitionId?: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly checks: readonly KpSymbolicInspectionCheck[];
  readonly correspondence: readonly SelectorCorrespondenceRecord[];
}
