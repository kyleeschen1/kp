import type { EasingName } from "../rendering/equation-motion-plan.ts";

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
    readonly bridgeExpansionPx: number;
    readonly endpointBlendFraction: number;
  };
}

export const kpRadicalConventionalMorphProfile: KpRadicalMorphMotionProfile =
  Object.freeze({
    id: "radical-morph.conventional-solid-mask.v1",
    morph: Object.freeze({
      start: 0.1,
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
      sourceTravelFraction: 0.82,
      bridgeExpansionPx: 1.2,
      endpointBlendFraction: 0.08
    })
  });
