import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-dom.ts";
import type { KpNativeKatexSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpFactoringChoreographyPlan } from "../animation/factoring-choreography.ts";

/** A compiled binding is consumable without loading the factoring compiler. */
export interface KpNativeKatexFactoringSceneBinding {
  readonly semanticClock?: KpFactoringChoreographyPlan | undefined;
  readonly claimTracks:
    (tracks: readonly KpNativeKatexSceneTrack[]) =>
      readonly KpNativeKatexSceneTrack[];
  readonly claimedTargetAtomIds: ReadonlySet<string>;
  readonly sampleMaterialOwners:
    (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];
  readonly recordEvidence: () => void;
}
