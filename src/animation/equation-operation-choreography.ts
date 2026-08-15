import type { KpSemanticBranchSchedule } from "./branch-schedule.ts";

declare const kpEquationOperationChoreographyBrand: unique symbol;

interface KpEquationOperationChoreographyBase {
  readonly schemaVersion: "kp.equation-operation-choreography.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly [kpEquationOperationChoreographyBrand]: true;
}

export interface KpCounterOrbitCancellationChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "counter-orbit-cancellation";
  readonly linearRearrangementKind:
    | "cancel-additive-inverses"
    | "cancel-multiplicative-inverses";
  readonly relationRecordId: string;
  readonly semanticEntityIds: readonly string[];
  readonly cancellationRecipe: "counter-orbit-v1";
  readonly zeroWitnessRecipe: "none";
}

export interface KpSynchronizedBalancedIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "synchronized-balanced-introduction";
  readonly linearRearrangementKind: "balanced-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly branchSchedule: KpSemanticBranchSchedule;
  readonly entryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}

export interface KpCausalStructuralIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "causal-structural-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: {
    readonly start: number;
    readonly end: number;
  };
}

export type KpEquationOperationChoreography =
  | KpCounterOrbitCancellationChoreography
  | KpSynchronizedBalancedIntroductionChoreography
  | KpCausalStructuralIntroductionChoreography;

export function createKpCausalStructuralIntroductionChoreography(input: {
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: { readonly start: number; readonly end: number };
}): KpCausalStructuralIntroductionChoreography {
  if (
    input.id.trim() === "" ||
    input.transformationId.trim() === "" ||
    input.semanticEntityIds.length === 0 ||
    input.semanticEntityIds.some((id) => id.trim() === "") ||
    new Set(input.semanticEntityIds).size !== input.semanticEntityIds.length ||
    !Number.isFinite(input.entryWindow.start) ||
    !Number.isFinite(input.entryWindow.end) ||
    input.entryWindow.start < 0 ||
    input.entryWindow.end > 1 ||
    input.entryWindow.start >= input.entryWindow.end
  ) {
    throw new Error(
      "Causal structural introduction requires unique entities and an increasing unit entry window."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "causal-structural-introduction" as const,
    id: input.id,
    transformationId: input.transformationId,
    direction: input.direction,
    semanticEntityIds: Object.freeze([...input.semanticEntityIds]),
    entryWindow: Object.freeze({ ...input.entryWindow })
  }) as KpCausalStructuralIntroductionChoreography;
}
