import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type {
  KpWitnessedAnnihilationBinding,
  KpWitnessedAnnihilationFrame,
  KpWitnessedAnnihilationPlan
} from "../animation/witnessed-annihilation.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type { KpEquationTokenMotionFrameToken } from "./semantic-equation-token-renderer.ts";

export interface KpEquationWitnessedAnnihilationRuntime {
  readonly createBinding: (input: {
    readonly operationId: string;
    readonly transformation: KpSemanticTransformation;
    readonly bundle: KpAssetBundle;
    readonly cancellationRecordId: string;
    readonly slotId?: string | undefined;
  }) => KpWitnessedAnnihilationBinding;
  readonly createPlan: (
    geometry: KpMeasuredEquationTransitionGeometry
  ) => KpWitnessedAnnihilationPlan | undefined;
  readonly sample: (
    plan: KpWitnessedAnnihilationPlan,
    progress: number
  ) => KpWitnessedAnnihilationFrame;
  readonly sampleRelation: (input: {
    readonly plan: KpWitnessedAnnihilationPlan;
    readonly frame: KpWitnessedAnnihilationFrame;
    readonly relation: KpMeasuredEquationTransitionRelationGeometry;
    readonly sourceTokens: readonly AnnotatedMotionToken[];
    readonly targetTokens: readonly AnnotatedMotionToken[];
  }) => readonly KpEquationTokenMotionFrameToken[] | undefined;
}

let runtime: KpEquationWitnessedAnnihilationRuntime | undefined;

export function registerKpEquationWitnessedAnnihilationRuntime(
  implementation: KpEquationWitnessedAnnihilationRuntime
): void {
  runtime = implementation;
}

export function kpEquationWitnessedAnnihilationRuntime():
  KpEquationWitnessedAnnihilationRuntime | undefined {
  return runtime;
}
