import {
  compileKpFocusProfile,
  sampleKpFocusProfile,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
import type { KpChoreographyEnvelopePhaseId } from "./choreography-plan.ts";

export type KpFocusExperimentMode = "flat" | "elevated" | "no-depth";

export interface KpElevatedFocusComparison {
  readonly kind: "kp-elevated-focus-comparison";
  readonly groupId: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly phaseProgress: number;
  readonly flat: {
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  };
  readonly elevated: {
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  };
  readonly noDepth: {
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  };
  readonly invariance: {
    readonly sameTranslateX: true;
    readonly sameTranslateY: true;
    readonly sameLayoutParticipation: true;
    readonly samePhase: true;
    readonly passed: true;
  };
}

export function createKpElevatedFocusComparison(input: {
  readonly id: string;
  readonly groupId: string;
  readonly semanticEntityIds: readonly string[];
  readonly fragmentIds?: readonly string[] | undefined;
  readonly strength: number;
  readonly contextDimming: number;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly phaseProgress: number;
}): KpElevatedFocusComparison {
  const plan = (
    profile: "flat" | "elevated",
    accessibilityMode: "full" | "no-depth"
  ) => compileKpFocusProfile({
    id: `${input.id}.${profile}.${accessibilityMode}`,
    groupId: input.groupId,
    semanticEntityIds: input.semanticEntityIds,
    fragmentIds: input.fragmentIds ?? [],
    profile,
    strength: input.strength,
    contextDimming: input.contextDimming,
    accessibilityMode
  });
  const flatPlan = plan("flat", "full");
  const elevatedPlan = plan("elevated", "full");
  const noDepthPlan = plan("elevated", "no-depth");
  const sample = (focusPlan: KpFocusProfilePlan) =>
    sampleKpFocusProfile({
      plan: focusPlan,
      phaseId: input.phaseId,
      phaseProgress: input.phaseProgress
    });
  const flatFrame = sample(flatPlan);
  const elevatedFrame = sample(elevatedPlan);
  const noDepthFrame = sample(noDepthPlan);
  if (
    flatFrame.translateX !== elevatedFrame.translateX ||
    flatFrame.translateY !== elevatedFrame.translateY ||
    flatFrame.layoutParticipation !== elevatedFrame.layoutParticipation ||
    flatFrame.phaseId !== elevatedFrame.phaseId
  ) {
    throw new Error("Elevated focus changed the authoritative x/y choreography.");
  }
  return {
    kind: "kp-elevated-focus-comparison",
    groupId: input.groupId,
    phaseId: input.phaseId,
    phaseProgress: input.phaseProgress,
    flat: { plan: flatPlan, frame: flatFrame },
    elevated: { plan: elevatedPlan, frame: elevatedFrame },
    noDepth: { plan: noDepthPlan, frame: noDepthFrame },
    invariance: {
      sameTranslateX: true,
      sameTranslateY: true,
      sameLayoutParticipation: true,
      samePhase: true,
      passed: true
    }
  };
}
