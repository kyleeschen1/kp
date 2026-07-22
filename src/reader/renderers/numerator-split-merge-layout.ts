import {
  planKpEquationSequenceEnvelope,
  type KpEquationSequenceEnvelopePlan,
  type KpEquationSequenceStateMeasurement
} from "./equation-sequence-envelope.ts";

export interface KpNumeratorSplitMergeLayoutPlan {
  readonly kind: "numerator-split-merge-layout-plan";
  readonly envelope: KpEquationSequenceEnvelopePlan;
  readonly endpointOrder: readonly [combinedStateId: string, splitStateId: string];
  readonly widestStateId: string;
  readonly hierarchyPolicy: "preserve-native-katex-tree";
  readonly horizontalOriginPolicy: "center-in-sequence-envelope";
  readonly wrapAllowed: false;
}

/**
 * The split endpoint owns the width budget, but both KaTeX endpoint trees stay
 * native. Motion may translate measured fragments; it may not flatten them.
 */
export function planKpNumeratorSplitMergeLayout(input: {
  readonly measurements: readonly KpEquationSequenceStateMeasurement[];
  readonly combinedStateId: string;
  readonly splitStateId: string;
  readonly viewportWidthPx: number;
  readonly horizontalPaddingPx?: number;
  readonly verticalPaddingPx?: number;
  readonly baseFontSizePx?: number;
  readonly minScale?: number;
}): KpNumeratorSplitMergeLayoutPlan {
  const endpointIds = input.measurements.map(({ stateId }) => stateId);
  if (
    input.combinedStateId === input.splitStateId ||
    endpointIds.length !== 2 ||
    !endpointIds.includes(input.combinedStateId) ||
    !endpointIds.includes(input.splitStateId)
  ) {
    throw new Error("Numerator split-merge layout requires exactly one combined and one split endpoint.");
  }

  const envelope = planKpEquationSequenceEnvelope({
    measurements: input.measurements,
    viewportWidthPx: input.viewportWidthPx,
    ...(input.horizontalPaddingPx === undefined
      ? {}
      : { horizontalPaddingPx: input.horizontalPaddingPx }),
    ...(input.verticalPaddingPx === undefined
      ? {}
      : { verticalPaddingPx: input.verticalPaddingPx }),
    ...(input.baseFontSizePx === undefined
      ? {}
      : { baseFontSizePx: input.baseFontSizePx }),
    ...(input.minScale === undefined ? {} : { minScale: input.minScale })
  });
  if (envelope.widestStateId !== input.splitStateId) {
    throw new Error("Numerator split-merge layout requires the split endpoint to own the width budget.");
  }

  return {
    kind: "numerator-split-merge-layout-plan",
    envelope,
    endpointOrder: [input.combinedStateId, input.splitStateId],
    widestStateId: input.splitStateId,
    hierarchyPolicy: "preserve-native-katex-tree",
    horizontalOriginPolicy: "center-in-sequence-envelope",
    wrapAllowed: false
  };
}
