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
}

export type KpEquationOperationChoreography =
  | KpCounterOrbitCancellationChoreography
  | KpSynchronizedBalancedIntroductionChoreography;
