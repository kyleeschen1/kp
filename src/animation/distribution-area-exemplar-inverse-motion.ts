import {
  sampleKpFactoringChoreography,
  type KpFactoringChoreographyFrame
} from "./factoring-choreography.ts";
import type {
  KpDistributionAreaExemplarPresentationPlan
} from "./distribution-area-exemplar-presentation.ts";
import { sampleKpDistributionAreaForwardMotion } from "./distribution-area-exemplar-forward-motion.ts";

export interface KpDistributionAreaInverseMotionFrame {
  readonly progress: number;
  readonly owner: "expanded-native" | "material" | "factored-native";
  readonly opacity: {
    readonly expandedNative: 0 | 1;
    readonly material: 0 | 1;
    readonly factoredNative: 0 | 1;
  };
  readonly decompositionProgress: number;
  readonly factoringProgress: number;
  readonly algebra: KpFactoringChoreographyFrame;
  readonly area: {
    readonly partitionProgress: number;
    readonly combinedWidthOpacity: number;
    readonly componentWidthOpacity: number;
    readonly leftAreaLabelOpacity: number;
    readonly rightFactorPairOpacity: number;
    readonly rightAreaLabelOpacity: number;
  };
}

export function sampleKpDistributionAreaInverseMotion(input: {
  readonly plan: KpDistributionAreaExemplarPresentationPlan;
  readonly progress: number;
}): KpDistributionAreaInverseMotionFrame {
  const progress = clamp01(input.progress);
  const decompositionProgress = clamp01(progress / 0.28);
  const factoringProgress = clamp01((progress - 0.28) / 0.72);
  const owner = progress === 0 ? "expanded-native" :
    progress === 1 ? "factored-native" : "material";
  const inverseArea = sampleKpDistributionAreaForwardMotion({
    plan: input.plan,
    progress: 1 - progress
  }).area;

  return {
    progress,
    owner,
    opacity: {
      expandedNative: owner === "expanded-native" ? 1 : 0,
      material: owner === "material" ? 1 : 0,
      factoredNative: owner === "factored-native" ? 1 : 0
    },
    decompositionProgress,
    factoringProgress,
    algebra: sampleKpFactoringChoreography({
      plan: input.plan.reverse[1],
      progress: factoringProgress
    }),
    area: inverseArea
  };
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
