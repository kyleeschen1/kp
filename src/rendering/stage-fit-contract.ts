export const KP_STAGE_FIT_CONTRACT_SCHEMA =
  "kp.stage-fit-contract.v1" as const;

export interface KpStageFitRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpStageFitInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface KpStageFitContractV1 {
  readonly schemaVersion: typeof KP_STAGE_FIT_CONTRACT_SCHEMA;
  readonly id: string;
  readonly geometryPolicy: "swept-contain";
  readonly cropPolicy: "forbid" | "explicit-only";
  readonly passageOverflowPolicy: "typed-repair";
  readonly safeInsets: KpStageFitInsets;
  readonly readability: Readonly<{
    minimumPassageTextPx: number;
    minimumMathTextPx: number;
  }>;
}

export type KpStageFitRepairCode =
  | "stage-fit.geometry-outside-safe-frame"
  | "stage-fit.passage-overflow"
  | "stage-fit.passage-readability-floor"
  | "stage-fit.math-readability-floor"
  | "stage-fit.invalid-measurement";

export interface KpStageFitRepairGap {
  readonly kind: "stage-fit-repair-gap";
  readonly code: KpStageFitRepairCode;
  readonly contractId: string;
  readonly subjectId: string;
  readonly message: string;
  readonly preservationBoundary:
    "semantic-content-and-playhead";
}

export interface KpStageFitObservation {
  readonly stageRect: KpStageFitRect;
  readonly requiredGeometryBounds: KpStageFitRect;
  readonly passages: readonly Readonly<{
    id: string;
    viewportHeight: number;
    contentHeight: number;
    textPx: number;
  }>[];
  readonly math: readonly Readonly<{
    id: string;
    textPx: number;
  }>[];
}

export function createKpStageFitContract(
  input: Omit<KpStageFitContractV1, "schemaVersion">
): KpStageFitContractV1 {
  requireId(input.id, "id");
  for (const [name, value] of Object.entries(input.safeInsets)) {
    requireNonnegative(value, `safeInsets.${name}`);
  }
  requirePositive(
    input.readability.minimumPassageTextPx,
    "readability.minimumPassageTextPx"
  );
  requirePositive(
    input.readability.minimumMathTextPx,
    "readability.minimumMathTextPx"
  );
  return deepFreeze({
    schemaVersion: KP_STAGE_FIT_CONTRACT_SCHEMA,
    ...input
  });
}

export function checkKpStageFitObservation(input: {
  readonly contract: KpStageFitContractV1;
  readonly observation: KpStageFitObservation;
}): readonly KpStageFitRepairGap[] {
  const { contract, observation } = input;
  if (!validRect(observation.stageRect) ||
    !validRect(observation.requiredGeometryBounds)) {
    return Object.freeze([gap(
      contract,
      "stage-fit.invalid-measurement",
      contract.id,
      "Stage fit received a non-finite or non-positive geometry measurement."
    )]);
  }
  const safeRect = insetRect(observation.stageRect, contract.safeInsets);
  const gaps: KpStageFitRepairGap[] = [];
  if (!containsRect(safeRect, observation.requiredGeometryBounds, 0.75)) {
    gaps.push(gap(
      contract,
      "stage-fit.geometry-outside-safe-frame",
      "required-geometry",
      "Required stage geometry escapes the declared swept safe frame."
    ));
  }
  for (const passage of observation.passages) {
    if (![passage.viewportHeight, passage.contentHeight, passage.textPx]
      .every(Number.isFinite)) {
      gaps.push(gap(
        contract,
        "stage-fit.invalid-measurement",
        passage.id,
        `Passage ${passage.id} has an invalid fit measurement.`
      ));
      continue;
    }
    if (passage.contentHeight > passage.viewportHeight + 0.75) {
      gaps.push(gap(
        contract,
        "stage-fit.passage-overflow",
        passage.id,
        `Passage ${passage.id} exceeds its available block space; split the attentional beat.`
      ));
    }
    if (passage.textPx < contract.readability.minimumPassageTextPx) {
      gaps.push(gap(
        contract,
        "stage-fit.passage-readability-floor",
        passage.id,
        `Passage ${passage.id} falls below the readable text floor.`
      ));
    }
  }
  for (const item of observation.math) {
    if (!Number.isFinite(item.textPx)) {
      gaps.push(gap(
        contract,
        "stage-fit.invalid-measurement",
        item.id,
        `Math label ${item.id} has an invalid fit measurement.`
      ));
    } else if (item.textPx < contract.readability.minimumMathTextPx) {
      gaps.push(gap(
        contract,
        "stage-fit.math-readability-floor",
        item.id,
        `Math label ${item.id} falls below the readable notation floor.`
      ));
    }
  }
  return Object.freeze(gaps);
}

export function insetKpStageFitRect(
  rect: KpStageFitRect,
  insets: KpStageFitInsets
): KpStageFitRect {
  return insetRect(rect, insets);
}

export function unionKpStageFitRects(
  rects: readonly KpStageFitRect[]
): KpStageFitRect {
  if (rects.length === 0) {
    throw new Error("Stage fit requires at least one bounds rectangle.");
  }
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return Object.freeze({ left, top, width: right - left, height: bottom - top });
}

export function kpStageFitRectContains(
  outer: KpStageFitRect,
  inner: KpStageFitRect,
  tolerance = 0
): boolean {
  return containsRect(outer, inner, tolerance);
}

function insetRect(
  rect: KpStageFitRect,
  insets: KpStageFitInsets
): KpStageFitRect {
  const width = rect.width - insets.left - insets.right;
  const height = rect.height - insets.top - insets.bottom;
  if (width <= 0 || height <= 0) {
    throw new Error("Stage fit insets leave no usable safe frame.");
  }
  return Object.freeze({
    left: rect.left + insets.left,
    top: rect.top + insets.top,
    width,
    height
  });
}

function containsRect(
  outer: KpStageFitRect,
  inner: KpStageFitRect,
  tolerance: number
): boolean {
  return inner.left >= outer.left - tolerance &&
    inner.top >= outer.top - tolerance &&
    inner.left + inner.width <= outer.left + outer.width + tolerance &&
    inner.top + inner.height <= outer.top + outer.height + tolerance;
}

function validRect(rect: KpStageFitRect): boolean {
  return [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) &&
    rect.width > 0 && rect.height > 0;
}

function gap(
  contract: KpStageFitContractV1,
  code: KpStageFitRepairCode,
  subjectId: string,
  message: string
): KpStageFitRepairGap {
  return Object.freeze({
    kind: "stage-fit-repair-gap" as const,
    code,
    contractId: contract.id,
    subjectId,
    message,
    preservationBoundary: "semantic-content-and-playhead" as const
  });
}

function requireId(value: string, path: string): void {
  if (value.trim() === "") throw new Error(`${path} must be non-empty.`);
}

function requirePositive(value: number, path: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${path} must be finite and positive.`);
  }
}

function requireNonnegative(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${path} must be finite and non-negative.`);
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
