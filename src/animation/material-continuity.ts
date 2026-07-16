export type KpVisualMaterialAuthority =
  | {
      readonly kind: "semantic-continuant";
      readonly continuantId: string;
    }
  | {
      readonly kind: "representational-lineage";
      readonly lineageId: string;
    }
  | {
      readonly kind: "artifact-provenance";
      readonly artifactId: string;
    };

/**
 * A material continuant is the visual object that survives renderer state
 * changes. Semantic identity authorizes it, but does not require source and
 * target DOM nodes to remain independently visible.
 */
export interface KpMaterialContinuant {
  readonly id: string;
  readonly authority: KpVisualMaterialAuthority;
  readonly semanticEntityIds: readonly string[];
  readonly sourceMotionIds: readonly string[];
  readonly targetMotionIds: readonly string[];
  readonly ownership:
    | "stable-owner"
    | "shared-reconciliation"
    | "native-handoff";
  readonly preserveThrough: readonly (
    | "movement"
    | "operation-boundary"
    | "seek"
    | "rewind"
    | "renderer-handoff"
  )[];
}

export interface KpMaterialFragment {
  readonly id: string;
  readonly materialContinuantId: string;
  readonly role:
    | "token"
    | "numerator"
    | "fraction-rule"
    | "denominator"
    | "radical-hook"
    | "radical-overbar"
    | "root-index";
  readonly sourceMotionIds: readonly string[];
  readonly targetMotionIds: readonly string[];
  readonly normalizedRegion?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
  readonly propagationRank?: number | undefined;
  readonly semanticAuthority: false;
}

export interface KpMaterialBundle {
  readonly id: string;
  readonly materialContinuantId: string;
  readonly sourceFragmentIds: readonly string[];
  readonly targetFragmentIds: readonly string[];
  readonly reconciliation: "shared-point" | "shared-region";
  readonly nativeSettlementRequired: true;
}

export interface KpEnvelopeBridge {
  readonly id: string;
  readonly fromTransformationId: string;
  readonly toTransformationId: string;
  readonly preserveMaterialContinuantIds: readonly string[];
  readonly attention:
    | "hold"
    | "transfer"
    | "release-and-reacquire";
  readonly velocity: "continuous" | "settle-before-next";
}

export interface KpMaterialContinuityPlan {
  readonly id: string;
  readonly materialContinuants: readonly KpMaterialContinuant[];
  readonly fragments: readonly KpMaterialFragment[];
  readonly bundles: readonly KpMaterialBundle[];
  readonly envelopeBridges: readonly KpEnvelopeBridge[];
}

export function createKpMaterialContinuityPlan(
  plan: KpMaterialContinuityPlan
): KpMaterialContinuityPlan {
  assertUnique(plan.materialContinuants.map((item) => item.id), "material continuant");
  assertUnique(plan.fragments.map((item) => item.id), "material fragment");
  assertUnique(plan.bundles.map((item) => item.id), "material bundle");
  assertUnique(plan.envelopeBridges.map((item) => item.id), "envelope bridge");

  const continuantIds = new Set(
    plan.materialContinuants.map((continuant) => continuant.id)
  );
  const fragmentIds = new Set(plan.fragments.map((fragment) => fragment.id));
  for (const fragment of plan.fragments) {
    if (!continuantIds.has(fragment.materialContinuantId)) {
      throw new Error(
        `Material fragment ${fragment.id} references missing continuant ${fragment.materialContinuantId}.`
      );
    }
  }
  for (const bundle of plan.bundles) {
    if (!continuantIds.has(bundle.materialContinuantId)) {
      throw new Error(
        `Material bundle ${bundle.id} references missing continuant ${bundle.materialContinuantId}.`
      );
    }
    for (const fragmentId of [
      ...bundle.sourceFragmentIds,
      ...bundle.targetFragmentIds
    ]) {
      if (!fragmentIds.has(fragmentId)) {
        throw new Error(
          `Material bundle ${bundle.id} references missing fragment ${fragmentId}.`
        );
      }
    }
  }
  for (const bridge of plan.envelopeBridges) {
    for (const continuantId of bridge.preserveMaterialContinuantIds) {
      if (!continuantIds.has(continuantId)) {
        throw new Error(
          `Envelope bridge ${bridge.id} references missing continuant ${continuantId}.`
        );
      }
    }
  }
  return plan;
}

function assertUnique(ids: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (id.length === 0) throw new Error(`${label} id must not be empty.`);
    if (seen.has(id)) throw new Error(`Duplicate ${label} id ${id}.`);
    seen.add(id);
  }
}
