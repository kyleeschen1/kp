import type { KpNativeKatexSceneContribution } from "./native-katex-scene-contribution.ts";
import type { KpNativeKatexSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpFactoringChoreographyPlan } from "../animation/factoring-choreography.ts";
import type { KpNativeKatexSceneAssembly } from "./native-katex-scene-assembly.ts";

/** A compiled binding is consumable without loading the factoring compiler. */
export interface KpNativeKatexFactoringSceneBinding {
  readonly semanticClock?: KpFactoringChoreographyPlan | undefined;
  readonly claimTracks:
    (tracks: readonly KpNativeKatexSceneTrack[]) =>
      readonly KpNativeKatexSceneTrack[];
  readonly claimedTargetAtomIds: ReadonlySet<string>;
  readonly contribution: KpNativeKatexSceneContribution;
  readonly recordEvidence: (assembly: KpNativeKatexSceneAssembly) => void;
}
