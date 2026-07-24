import type { EasingName } from "./easing.ts";

export interface KpRadicalMorphMotionProfile {
  readonly id: string;
  readonly morph: {
    readonly start: number;
    readonly end: number;
    readonly easing: EasingName;
  };
  readonly settlement: {
    readonly start: number;
    readonly end: number;
    readonly easing: EasingName;
  };
  readonly solidMask: {
    readonly maximumDistancePx: number;
    readonly edgeSoftnessPx: number;
    readonly boundsPaddingPx: number;
    readonly sourceTravelFraction: number;
    readonly sourceArcHeightPx: number;
    readonly shapeLeadFraction: number;
    readonly targetGrowthOriginXFraction: number;
    readonly targetGrowthOriginYFraction: number;
    readonly targetGrowthSoftnessPx: number;
    readonly bridgeExpansionPx: number;
    readonly endpointBlendFraction: number;
  };
}

export const kpRadicalConventionalMorphProfile: KpRadicalMorphMotionProfile =
  Object.freeze({
    id: "radical-morph.conventional-solid-mask.v1",
    morph: Object.freeze({
      start: 0.06,
      end: 0.82,
      easing: "ease-in-out"
    }),
    settlement: Object.freeze({
      start: 0.82,
      end: 0.94,
      easing: "ease-in-out"
    }),
    solidMask: Object.freeze({
      maximumDistancePx: 24,
      edgeSoftnessPx: 0.7,
      boundsPaddingPx: 4,
      sourceTravelFraction: 1,
      sourceArcHeightPx: 6,
      shapeLeadFraction: 0.12,
      targetGrowthOriginXFraction: 0.36,
      targetGrowthOriginYFraction: 0.16,
      targetGrowthSoftnessPx: 0.8,
      bridgeExpansionPx: 0.55,
      endpointBlendFraction: 0.08
    })
  });
