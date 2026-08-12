import type {
  KpCanonicalReverseCausalEmphasis,
  KpCanonicalReverseChoreographyKind
} from "../semantic/canonical-operation-contract.ts";

export interface KpCanonicalReverseChoreographyPlan {
  readonly kind: "canonical-reverse-choreography-plan";
  readonly sourceOperationId: string;
  readonly inverseOperationId?: string | undefined;
  readonly validity: "identity" | "mathematical-inverse" | "authored-history-only";
  readonly choreographyKind: KpCanonicalReverseChoreographyKind;
  readonly causalEmphasis: KpCanonicalReverseCausalEmphasis;
  readonly traversal: "target-to-source";
  readonly interpretation: string;
  readonly narration: string;
}

export interface KpCanonicalReverseChoreographyEntry {
  readonly transformType: string;
  readonly plan: KpCanonicalReverseChoreographyPlan;
}

export interface KpCanonicalReverseChoreographyCapability {
  readonly entries: readonly KpCanonicalReverseChoreographyEntry[];
  readonly planForTransformationType: (
    transformType: string
  ) => KpCanonicalReverseChoreographyPlan | undefined;
}

export function createKpCanonicalReverseChoreographyCapability(
  entries: readonly KpCanonicalReverseChoreographyEntry[]
): KpCanonicalReverseChoreographyCapability {
  const plans = new Map<string, KpCanonicalReverseChoreographyPlan>();
  const frozenEntries = entries.map(({ transformType, plan }) => {
    if (plans.has(transformType)) {
      throw new Error(`Duplicate reverse operation plan for ${transformType}.`);
    }
    const frozenPlan = Object.freeze({ ...plan });
    plans.set(transformType, frozenPlan);
    return Object.freeze({ transformType, plan: frozenPlan });
  });

  return Object.freeze({
    entries: Object.freeze(frozenEntries),
    planForTransformationType: (transformType: string) =>
      plans.get(transformType)
  });
}
