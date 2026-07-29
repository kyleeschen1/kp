import type {
  KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame,
  type KpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionAtomicViewParts
} from "./exact-fraction-quantity-atomic-projection.ts";

export interface KpExactFractionBarPart {
  readonly id: string;
  readonly atomicPartId: string;
  readonly exactMeasure: KpNormalizedRational;
  readonly x: number;
  readonly y: 35;
  readonly width: 50;
  readonly height: 50;
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly selected: boolean;
}

export interface KpExactFractionBarRefinement {
  readonly sourceSelectionId: string;
  readonly sourceAtomicPartIds: readonly string[];
  readonly sourceExtent: {
    readonly x: 30;
    readonly width: 100;
    readonly exactMeasure: KpNormalizedRational;
  };
  readonly targetPartIds: readonly string[];
  readonly dividerX: 80;
  readonly localProgress: number;
}

export interface KpExactFractionQuantityBarFrame {
  readonly schemaVersion: "kp.exact-fraction-quantity-bar-frame.v1";
  readonly neutralFrameId: string;
  readonly traceId: string;
  readonly progressPermille: number;
  readonly viewBox: "0 0 360 120";
  readonly preserveAspectRatio: "xMidYMid meet";
  readonly intrinsicAspectRatio: 3;
  readonly parts: readonly KpExactFractionBarPart[];
  readonly refinement?: KpExactFractionBarRefinement | undefined;
  readonly exactSelectedMeasure: KpNormalizedRational;
  readonly accessibleSummary: string;
}

const barX = 30 as const;
const barY = 35 as const;
const partWidth = 50 as const;
const barHeight = 50 as const;

export function projectKpExactFractionQuantityBar(
  frame: KpExactFractionQuantityNeutralFrame
): KpExactFractionQuantityBarFrame {
  const atomicParts = projectKpExactFractionAtomicViewParts(frame);
  const parts = Object.freeze(atomicParts.map((part, index) => Object.freeze({
    id: `bar.part.${part.atomicPartId}`,
    atomicPartId: part.atomicPartId,
    exactMeasure: part.exactMeasure,
    x: barX + index * partWidth,
    y: barY,
    width: partWidth,
    height: barHeight,
    sourceSelectionIds: part.sourceSelectionIds,
    targetSelectionIds: part.targetSelectionIds,
    lifecycle: part.lifecycle,
    selected: part.selected
  })));
  const refinement = frame.beat.operation === "refine-partition"
    ? createRefinement(frame, parts)
    : undefined;
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-bar-frame.v1",
    neutralFrameId: frame.id,
    traceId: frame.traceId,
    progressPermille: frame.progressPermille,
    viewBox: "0 0 360 120",
    preserveAspectRatio: "xMidYMid meet",
    intrinsicAspectRatio: 3,
    parts,
    ...(refinement === undefined ? {} : { refinement }),
    exactSelectedMeasure: frame.exactTotal,
    accessibleSummary:
      "One whole bar partitioned into six equal parts; " +
      "the selected extent represents exactly one half."
  });
}

export function sampleKpExactFractionQuantityBar(input: {
  readonly progress: number;
}): KpExactFractionQuantityBarFrame {
  return projectKpExactFractionQuantityBar(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: input.progress
    })
  );
}

export function renderKpExactFractionQuantityBarSvg(
  frame: KpExactFractionQuantityBarFrame
): string {
  const parts = frame.parts.map((part) =>
    `<rect data-kp-atomic-part-id="${part.atomicPartId}" ` +
    `data-kp-bar-part-id="${part.id}" data-kp-selected="${part.selected}" ` +
    `x="${part.x}" y="${part.y}" width="${part.width}" height="${part.height}"/>`
  ).join("");
  const divider = frame.refinement === undefined
    ? ""
    : `<line data-kp-refinement-divider="true" ` +
      `data-kp-progress="${formatNumber(frame.refinement.localProgress)}" ` +
      `x1="${frame.refinement.dividerX}" y1="${barY}" ` +
      `x2="${frame.refinement.dividerX}" y2="${barY + barHeight}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${frame.viewBox}" ` +
    `preserveAspectRatio="${frame.preserveAspectRatio}" role="img" ` +
    `aria-label="${frame.accessibleSummary}">${parts}${divider}</svg>`;
}

function createRefinement(
  frame: KpExactFractionQuantityNeutralFrame,
  parts: readonly KpExactFractionBarPart[]
): KpExactFractionBarRefinement {
  const transition = frame.selectionTransitions.find(
    ({ lifecycle }) => lifecycle === "fission"
  );
  if (transition === undefined) {
    throw new Error("Bar refinement requires the verified fission transition.");
  }
  if (transition.atomicPartIds.length !== 2) {
    throw new Error(
      "Bar refinement requires the certified third-to-two-sixths cohort."
    );
  }
  const targetPartIds = transition.atomicPartIds.map((atomicPartId) => {
    const part = parts.find((candidate) =>
      candidate.atomicPartId === atomicPartId
    );
    if (part === undefined) {
      throw new Error(`Bar refinement lacks part ${atomicPartId}.`);
    }
    return part.id;
  });
  return Object.freeze({
    sourceSelectionId: transition.sourceSelectionIds[0]!,
    sourceAtomicPartIds: transition.atomicPartIds,
    sourceExtent: Object.freeze({
      x: barX,
      width: 100,
      exactMeasure: transition.exactMeasure
    }),
    targetPartIds: Object.freeze(targetPartIds),
    dividerX: 80,
    localProgress: frame.beat.localProgress
  });
}

function formatNumber(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/u, "");
}
