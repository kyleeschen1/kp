import {
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame,
  type KpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionAtomicViewParts
} from "./exact-fraction-quantity-atomic-projection.ts";

export interface KpExactFractionCircleSector {
  readonly id: string;
  readonly atomicPartId: string;
  readonly exactMeasure: KpNormalizedRational;
  readonly pathData: string;
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly selected: boolean;
}

export interface KpExactFractionCircleRefinement {
  readonly sourceSelectionId: string;
  readonly sourceAtomicPartIds: readonly string[];
  readonly targetSectorIds: readonly string[];
  readonly sourcePathData: string;
  readonly dividerPathData: string;
  readonly localProgress: number;
  readonly exactMeasure: KpNormalizedRational;
}

export interface KpExactFractionQuantityCircleFrame {
  readonly schemaVersion: "kp.exact-fraction-quantity-circle-frame.v1";
  readonly neutralFrameId: string;
  readonly traceId: string;
  readonly progressPermille: number;
  readonly viewBox: "0 0 240 160";
  readonly center: { readonly x: 120; readonly y: 80 };
  readonly radius: 62;
  readonly sectors: readonly KpExactFractionCircleSector[];
  readonly refinement?: KpExactFractionCircleRefinement | undefined;
  readonly exactSelectedMeasure: KpNormalizedRational;
  readonly accessibleSummary: string;
}

const center = Object.freeze({ x: 120 as const, y: 80 as const });
const radius = 62 as const;

export function projectKpExactFractionQuantityCircle(
  frame: KpExactFractionQuantityNeutralFrame
): KpExactFractionQuantityCircleFrame {
  const atomicParts = projectKpExactFractionAtomicViewParts(frame);
  const sectors = Object.freeze(atomicParts.map((part, index) => {
    return Object.freeze({
      id: `circle.sector.${part.atomicPartId}`,
      atomicPartId: part.atomicPartId,
      exactMeasure: part.exactMeasure,
      pathData: sectorPath(index, index + 1),
      sourceSelectionIds: part.sourceSelectionIds,
      targetSelectionIds: part.targetSelectionIds,
      lifecycle: part.lifecycle,
      selected: part.selected
    });
  }));
  const refinement = frame.beat.operation === "refine-partition"
    ? createRefinement(frame, sectors)
    : undefined;

  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-circle-frame.v1",
    neutralFrameId: frame.id,
    traceId: frame.traceId,
    progressPermille: frame.progressPermille,
    viewBox: "0 0 240 160",
    center,
    radius,
    sectors,
    ...(refinement === undefined ? {} : { refinement }),
    exactSelectedMeasure: frame.exactTotal,
    accessibleSummary:
      "One whole circle partitioned into six equal sectors; " +
      "the selected sectors represent exactly one half."
  });
}

export function sampleKpExactFractionQuantityCircle(input: {
  readonly progress: number;
}): KpExactFractionQuantityCircleFrame {
  return projectKpExactFractionQuantityCircle(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: input.progress
    })
  );
}

export function renderKpExactFractionQuantityCircleSvg(
  frame: KpExactFractionQuantityCircleFrame
): string {
  const sectors = frame.sectors.map((sector) =>
    `<path data-kp-atomic-part-id="${sector.atomicPartId}" ` +
    `data-kp-circle-sector-id="${sector.id}" ` +
    `data-kp-selected="${sector.selected}" d="${sector.pathData}"/>`
  ).join("");
  const refinement = frame.refinement === undefined
    ? ""
    : `<path data-kp-refinement-divider="true" ` +
      `data-kp-progress="${formatNumber(frame.refinement.localProgress)}" ` +
      `d="${frame.refinement.dividerPathData}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${frame.viewBox}" role="img" ` +
    `aria-label="${frame.accessibleSummary}">${sectors}${refinement}</svg>`;
}

function createRefinement(
  frame: KpExactFractionQuantityNeutralFrame,
  sectors: readonly KpExactFractionCircleSector[]
): KpExactFractionCircleRefinement {
  const transition = frame.selectionTransitions.find(
    ({ lifecycle }) => lifecycle === "fission"
  );
  if (transition === undefined) {
    throw new Error(
      "Circle refinement requires the verified fission transition."
    );
  }
  const targetSectorIds = transition.atomicPartIds.map((atomicPartId) => {
    const sector = sectors.find((candidate) =>
      candidate.atomicPartId === atomicPartId
    );
    if (sector === undefined) {
      throw new Error(`Circle refinement lacks sector ${atomicPartId}.`);
    }
    return sector.id;
  });
  const dividerEnd = pointAtTurn(1);
  return Object.freeze({
    sourceSelectionId: transition.sourceSelectionIds[0]!,
    sourceAtomicPartIds: transition.atomicPartIds,
    targetSectorIds: Object.freeze(targetSectorIds),
    sourcePathData: sectorPath(0, 2),
    dividerPathData:
      `M ${center.x} ${center.y} L ${dividerEnd.x} ${dividerEnd.y}`,
    localProgress: frame.beat.localProgress,
    exactMeasure: transition.exactMeasure
  });
}

function sectorPath(startSixth: number, endSixth: number): string {
  const start = pointAtTurn(startSixth);
  const end = pointAtTurn(endSixth);
  const sweepSixths = endSixth - startSixth;
  const largeArc = sweepSixths > 3 ? 1 : 0;
  return `M ${center.x} ${center.y} L ${start.x} ${start.y} ` +
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function pointAtTurn(sixth: number): { readonly x: string; readonly y: string } {
  const angle = -Math.PI / 2 + sixth * Math.PI / 3;
  return Object.freeze({
    x: formatNumber(center.x + radius * Math.cos(angle)),
    y: formatNumber(center.y + radius * Math.sin(angle))
  });
}

function formatNumber(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/u, "");
}
