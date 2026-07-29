import {
  createKpRational,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame,
  type KpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionAtomicViewParts
} from "./exact-fraction-quantity-atomic-projection.ts";

export interface KpExactFractionNumberLineTick {
  readonly id: string;
  readonly ordinal: number;
  readonly exactPosition: KpNormalizedRational;
  readonly x: number;
  readonly label: string;
}

export interface KpExactFractionNumberLineInterval {
  readonly id: string;
  readonly atomicPartId: string;
  readonly exactStart: KpNormalizedRational;
  readonly exactEnd: KpNormalizedRational;
  readonly x1: number;
  readonly x2: number;
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly selected: boolean;
}

export interface KpExactFractionNumberLineContributorSpan {
  readonly selectionId: string;
  readonly atomicPartIds: readonly string[];
  readonly exactStart: KpNormalizedRational;
  readonly exactEnd: KpNormalizedRational;
  readonly x1: number;
  readonly x2: number;
}

export interface KpExactFractionQuantityNumberLineFrame {
  readonly schemaVersion: "kp.exact-fraction-quantity-number-line-frame.v1";
  readonly neutralFrameId: string;
  readonly traceId: string;
  readonly progressPermille: number;
  readonly viewBox: "0 0 360 120";
  readonly preserveAspectRatio: "xMidYMid meet";
  readonly ticks: readonly KpExactFractionNumberLineTick[];
  readonly intervals: readonly KpExactFractionNumberLineInterval[];
  readonly contributorSpans: readonly KpExactFractionNumberLineContributorSpan[];
  readonly exactEndpoint: KpNormalizedRational;
  readonly endpointX: number;
  readonly accessibleSummary: string;
}

const lineStartX = 30;
const intervalWidth = 50;
const lineY = 64;

export function projectKpExactFractionQuantityNumberLine(
  frame: KpExactFractionQuantityNeutralFrame
): KpExactFractionQuantityNumberLineFrame {
  const atomicParts = projectKpExactFractionAtomicViewParts(frame);
  const ticks = Object.freeze(Array.from({ length: 7 }, (_, ordinal) =>
    Object.freeze({
      id: `number-line.tick.${ordinal}`,
      ordinal,
      exactPosition: createKpRational(BigInt(ordinal), 6n),
      x: coordinateForOrdinal(ordinal),
      label: tickLabel(ordinal)
    })
  ));
  const intervals = Object.freeze(atomicParts.map((part, ordinal) =>
    Object.freeze({
      id: `number-line.interval.${part.atomicPartId}`,
      atomicPartId: part.atomicPartId,
      exactStart: createKpRational(BigInt(ordinal), 6n),
      exactEnd: createKpRational(BigInt(ordinal + 1), 6n),
      x1: coordinateForOrdinal(ordinal),
      x2: coordinateForOrdinal(ordinal + 1),
      sourceSelectionIds: part.sourceSelectionIds,
      targetSelectionIds: part.targetSelectionIds,
      lifecycle: part.lifecycle,
      selected: part.selected
    })
  ));
  const contributorSpans = Object.freeze(frame.targetSelections.map(
    (selection) => contributorSpan(selection.selectionId, selection.atomicPartIds)
  ));
  const endpointOrdinal = endpointOrdinalForExactTotal(frame.exactTotal);
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-number-line-frame.v1",
    neutralFrameId: frame.id,
    traceId: frame.traceId,
    progressPermille: frame.progressPermille,
    viewBox: "0 0 360 120",
    preserveAspectRatio: "xMidYMid meet",
    ticks,
    intervals,
    contributorSpans,
    exactEndpoint: frame.exactTotal,
    endpointX: coordinateForOrdinal(endpointOrdinal),
    accessibleSummary:
      "A number line from zero to one in exact sixths; " +
      "the composed endpoint is exactly one half."
  });
}

export function sampleKpExactFractionQuantityNumberLine(input: {
  readonly progress: number;
}): KpExactFractionQuantityNumberLineFrame {
  return projectKpExactFractionQuantityNumberLine(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: input.progress
    })
  );
}

export function renderKpExactFractionQuantityNumberLineSvg(
  frame: KpExactFractionQuantityNumberLineFrame
): string {
  const base = `<line data-kp-number-line-axis="true" ` +
    `x1="${lineStartX}" y1="${lineY}" x2="${coordinateForOrdinal(6)}" ` +
    `y2="${lineY}"/>`;
  const intervals = frame.intervals.map((interval) =>
    `<line data-kp-atomic-part-id="${interval.atomicPartId}" ` +
    `data-kp-number-line-interval-id="${interval.id}" ` +
    `data-kp-selected="${interval.selected}" x1="${interval.x1}" ` +
    `y1="${lineY}" x2="${interval.x2}" y2="${lineY}"/>`
  ).join("");
  const ticks = frame.ticks.map((tick) =>
    `<g data-kp-number-line-tick-id="${tick.id}">` +
    `<line x1="${tick.x}" y1="${lineY - 8}" x2="${tick.x}" ` +
    `y2="${lineY + 8}"/><text x="${tick.x}" y="${lineY + 28}" ` +
    `text-anchor="middle">${tick.label}</text></g>`
  ).join("");
  const endpoint = `<circle data-kp-number-line-endpoint="true" ` +
    `cx="${frame.endpointX}" cy="${lineY}" r="5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${frame.viewBox}" ` +
    `preserveAspectRatio="${frame.preserveAspectRatio}" role="img" ` +
    `aria-label="${frame.accessibleSummary}">` +
    `${base}${intervals}${ticks}${endpoint}</svg>`;
}

function contributorSpan(
  selectionId: string,
  atomicPartIds: readonly string[]
): KpExactFractionNumberLineContributorSpan {
  const ordinals = atomicPartIds.map(partOrdinal).sort((left, right) =>
    left - right
  );
  if (
    ordinals.length === 0 ||
    ordinals.some((ordinal, index) =>
      index > 0 && ordinal !== ordinals[index - 1]! + 1
    )
  ) {
    throw new Error(
      `Number-line contributor ${selectionId} must be a contiguous interval.`
    );
  }
  const start = ordinals[0]!;
  const end = ordinals.at(-1)! + 1;
  return Object.freeze({
    selectionId,
    atomicPartIds: Object.freeze([...atomicPartIds]),
    exactStart: createKpRational(BigInt(start), 6n),
    exactEnd: createKpRational(BigInt(end), 6n),
    x1: coordinateForOrdinal(start),
    x2: coordinateForOrdinal(end)
  });
}

function partOrdinal(atomicPartId: string): number {
  const value = Number(atomicPartId.split(".").at(-1));
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new Error(
      `Number-line interval has invalid canonical atom ${atomicPartId}.`
    );
  }
  return value;
}

function endpointOrdinalForExactTotal(
  exactTotal: KpNormalizedRational
): number {
  const scaledNumerator = exactTotal.numerator * 6n;
  if (scaledNumerator % exactTotal.denominator !== 0n) {
    throw new Error(
      "Number-line endpoint must fall on the certified sixth partition."
    );
  }
  const ordinal = Number(scaledNumerator / exactTotal.denominator);
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal > 6) {
    throw new Error("Number-line endpoint must remain within one whole.");
  }
  return ordinal;
}

function coordinateForOrdinal(ordinal: number): number {
  return lineStartX + ordinal * intervalWidth;
}

function tickLabel(ordinal: number): string {
  if (ordinal === 0) return "0";
  if (ordinal === 3) return "1/2";
  if (ordinal === 6) return "1";
  return `${ordinal}/6`;
}
