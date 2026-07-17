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

export interface KpCanonicalReverseRuntimeRegistration {
  readonly transformType: string;
  readonly plan: KpCanonicalReverseChoreographyPlan;
}

const plansByTransformType = new Map<string, KpCanonicalReverseChoreographyPlan>();

export function registerKpCanonicalReverseRuntimePlans(
  registrations: readonly KpCanonicalReverseRuntimeRegistration[]
): void {
  registrations.forEach(({ transformType, plan }) => {
    const existing = plansByTransformType.get(transformType);
    if (existing !== undefined && existing.sourceOperationId !== plan.sourceOperationId) {
      throw new Error(`Conflicting reverse operation plan for ${transformType}.`);
    }
    plansByTransformType.set(transformType, plan);
  });
}

export function canonicalReverseRuntimePlanForTransformationType(
  transformType: string
): KpCanonicalReverseChoreographyPlan | undefined {
  return plansByTransformType.get(transformType);
}
