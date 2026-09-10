import type { KpNativeKatexSceneContribution } from "./native-katex-scene-contribution.ts";
import type { KpNativeKatexSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpFactoringChoreographyPlan } from "../animation/factoring-choreography.ts";
import type { KpEquationProtectedTransitFrame, KpProtectedTransitAudit } from "./equation-motion-path-planner.ts";

/** A compiled binding is consumable without loading the factoring compiler. */
export interface KpNativeKatexFactoringSceneBinding {
  readonly semanticClock?: KpFactoringChoreographyPlan | undefined;
  readonly claimTracks:
    (tracks: readonly KpNativeKatexSceneTrack[]) =>
      readonly KpNativeKatexSceneTrack[];
  readonly claimedTargetAtomIds: ReadonlySet<string>;
  readonly contribution: KpNativeKatexSceneContribution;
  /** Specialized paint must be audited with the final context, including cached plans. */
  readonly inspectTransit: (
    tracks: readonly KpNativeKatexSceneTrack[],
    sampleFrames: (tracks: readonly KpNativeKatexSceneTrack[], progress: number) => readonly KpEquationProtectedTransitFrame[]
  ) => KpProtectedTransitAudit;
  readonly recordEvidence: () => void;
}
