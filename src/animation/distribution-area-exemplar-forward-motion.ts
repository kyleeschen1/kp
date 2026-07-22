import {
  compileKpDistributionAreaExemplarPresentationPlan,
  type KpDistributionAreaExemplarPresentationPlan
} from "./distribution-area-exemplar-presentation.ts";
import {
  sampleKpDistributionChoreography,
  type KpDistributionChoreographyFrame
} from "./distribution-choreography.ts";

export type KpDistributionAreaForwardOwner =
  | "factored-native"
  | "material"
  | "expanded-native";

export interface KpDistributionAreaForwardMotionFrame {
  readonly progress: number;
  readonly owner: KpDistributionAreaForwardOwner;
  readonly opacity: {
    readonly factoredNative: 0 | 1;
    readonly material: 0 | 1;
    readonly expandedNative: 0 | 1;
  };
  readonly distributionProgress: number;
  readonly evaluationProgress: number;
  readonly algebra: KpDistributionChoreographyFrame;
  readonly area: {
    readonly partitionProgress: number;
    readonly combinedWidthOpacity: number;
    readonly componentWidthOpacity: number;
    readonly leftAreaLabelOpacity: number;
    readonly rightFactorPairOpacity: number;
    readonly rightAreaLabelOpacity: number;
  };
}

export function createKpDistributionAreaForwardMotionPlan():
  KpDistributionAreaExemplarPresentationPlan {
  return compileKpDistributionAreaExemplarPresentationPlan();
}

export function sampleKpDistributionAreaForwardMotion(input: {
  readonly plan: KpDistributionAreaExemplarPresentationPlan;
  readonly progress: number;
}): KpDistributionAreaForwardMotionFrame {
  const progress = clamp01(input.progress);
  const distributionProgress = clamp01(progress / 0.72);
  const evaluationProgress = clamp01((progress - 0.72) / 0.28);
  const owner: KpDistributionAreaForwardOwner =
    progress === 0 ? "factored-native" :
      progress === 1 ? "expanded-native" : "material";
  const partitionProgress = smoothstep(distributionProgress, 0.2, 0.78);
  const algebra = sampleKpDistributionChoreography({
    plan: input.plan.forward[0],
    progress: distributionProgress
  });

  // Endpoint ownership is discrete so transient material never crossfades with
  // a duplicate native anchor at settlement.
  return {
    progress,
    owner,
    opacity: {
      factoredNative: owner === "factored-native" ? 1 : 0,
      material: owner === "material" ? 1 : 0,
      expandedNative: owner === "expanded-native" ? 1 : 0
    },
    distributionProgress,
    evaluationProgress,
    algebra,
    area: {
      partitionProgress,
      combinedWidthOpacity: 1 - partitionProgress,
      componentWidthOpacity: partitionProgress,
      leftAreaLabelOpacity: partitionProgress,
      rightFactorPairOpacity: partitionProgress * (1 - evaluationProgress),
      rightAreaLabelOpacity: evaluationProgress
    }
  };
}

function smoothstep(value: number, start: number, end: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const local = (value - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
