import type {
  KpCertifiedEquationStageLayout,
  KpCertifiedEquationStageRow,
  KpEquationStageRect
} from "./equation-stage-layout.ts";

export interface KpEquationStagePoint {
  readonly x: number;
  readonly y: number;
}

export interface KpEquationStageMaterialTransitIntent {
  readonly id: string;
  readonly sourceRowId: string;
  readonly targetRowId: string;
  readonly sourceRect: KpEquationStageRect;
  readonly targetRect: KpEquationStageRect;
}

export interface KpEquationStageMaterialTransitPlan {
  readonly id: string;
  readonly route: "direct" | "lifted";
  readonly sourceRowId: string;
  readonly targetRowId: string;
  readonly points: readonly KpEquationStagePoint[];
  readonly sweptBounds: KpEquationStageRect;
}

export interface KpEquationStageTransitCorridor {
  readonly rect: KpEquationStageRect;
  readonly clearancePx: number;
  readonly geometryAuthority: "measured-row-occupancy";
}

const corridorCertifiedEquationStageLayoutAuthority: unique symbol =
  Symbol("kp.corridor-certified-equation-stage-layout");

export interface KpCorridorCertifiedEquationStageLayout
  extends KpCertifiedEquationStageLayout {
  readonly rows: readonly KpCertifiedEquationStageRow[];
  readonly protectedTransitCorridor: KpEquationStageTransitCorridor;
  readonly transits: readonly KpEquationStageMaterialTransitPlan[];
  readonly sweptBounds: KpEquationStageRect;
  readonly [corridorCertifiedEquationStageLayoutAuthority]: true;
}

export function certifyKpEquationStageTransitCorridor(input: {
  readonly layout: KpCertifiedEquationStageLayout;
  readonly transits: readonly KpEquationStageMaterialTransitIntent[];
}): KpCorridorCertifiedEquationStageLayout {
  if (input.transits.length === 0) {
    throw new Error("Equation stage transit certification requires material transit.");
  }
  assertUnique(input.transits.map(({ id }) => id), "Equation stage transit");
  const emSizePx = Math.max(
    ...input.layout.measuredInput.envelopes.map(({ emSizePx }) => emSizePx)
  );
  const materialHeight = Math.max(
    ...input.transits.flatMap(({ sourceRect, targetRect }) => [
      sourceRect.height,
      targetRect.height
    ])
  );
  const clearancePx = emSizePx * 0.25;
  const corridorHeight = Math.max(
    input.layout.minimumGutterPx,
    materialHeight + clearancePx * 2
  );
  const rows = placeCorridorRows(input.layout, corridorHeight);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const rowBounds = unionRects(rows.map(({ rect }) => rect));
  const corridorTop = rows.length === 1
    ? rows[0]!.rect.top - corridorHeight
    : rows[0]!.rect.top + rows[0]!.rect.height;
  const corridor = Object.freeze({
    rect: Object.freeze({
      left: rowBounds.left,
      top: corridorTop,
      width: rowBounds.width,
      height: corridorHeight
    }),
    clearancePx,
    geometryAuthority: "measured-row-occupancy" as const
  });
  const transits = input.transits.map((transit) =>
    planTransit(transit, rowById, corridor)
  );
  const sweptBounds = unionRects([
    ...rows.map(({ rect }) => rect),
    corridor.rect,
    ...transits.map(({ sweptBounds }) => sweptBounds)
  ]);
  return Object.freeze({
    ...input.layout,
    rows: Object.freeze(rows),
    stageBounds: rowBounds,
    minimumGutterPx: corridorHeight,
    protectedTransitCorridor: corridor,
    transits: Object.freeze(transits),
    sweptBounds,
    [corridorCertifiedEquationStageLayoutAuthority]: true as const
  });
}

function placeCorridorRows(
  layout: KpCertifiedEquationStageLayout,
  corridorHeight: number
): readonly KpCertifiedEquationStageRow[] {
  if (layout.rows.length === 1) return layout.rows;
  if (layout.rows.length !== 2) {
    throw new Error("Equation stage corridor supports one or two certified rows.");
  }
  const [first, second] = layout.rows;
  const currentGutter =
    second!.rect.top - (first!.rect.top + first!.rect.height);
  const shiftY = Math.max(0, corridorHeight - currentGutter);
  return Object.freeze([
    first!,
    Object.freeze({
      ...second!,
      rect: translateRect(second!.rect, 0, shiftY),
      translateY: second!.translateY + shiftY
    })
  ]);
}

function planTransit(
  transit: KpEquationStageMaterialTransitIntent,
  rows: ReadonlyMap<string, KpCertifiedEquationStageRow>,
  corridor: KpEquationStageTransitCorridor
): KpEquationStageMaterialTransitPlan {
  if (transit.id.trim() === "") {
    throw new Error("Equation stage transit id must be non-empty.");
  }
  const sourceRow = rows.get(transit.sourceRowId);
  const targetRow = rows.get(transit.targetRowId);
  if (sourceRow === undefined || targetRow === undefined) {
    throw new Error(`Equation stage transit ${transit.id} references unknown row.`);
  }
  assertRect(transit.sourceRect, `Equation stage transit ${transit.id} source`);
  assertRect(transit.targetRect, `Equation stage transit ${transit.id} target`);
  const sourceRect = translateRect(
    transit.sourceRect,
    sourceRow.translateX,
    sourceRow.translateY
  );
  const targetRect = translateRect(
    transit.targetRect,
    targetRow.translateX,
    targetRow.translateY
  );
  if (!contains(sourceRow.rect, sourceRect) || !contains(targetRow.rect, targetRect)) {
    throw new Error(
      `Equation stage transit ${transit.id} escapes its semantic row occupancy.`
    );
  }
  const start = center(sourceRect);
  const end = center(targetRect);
  const route = sourceRow.id === targetRow.id ? "lifted" as const : "direct" as const;
  const corridorY = corridor.rect.top + corridor.rect.height / 2;
  const points = route === "direct"
    ? [start, end]
    : [
        start,
        { x: start.x, y: corridorY },
        { x: end.x, y: corridorY },
        end
      ];
  return Object.freeze({
    id: transit.id,
    route,
    sourceRowId: sourceRow.id,
    targetRowId: targetRow.id,
    points: Object.freeze(points.map((point) => Object.freeze(point))),
    sweptBounds: sweptRect(points, sourceRect, targetRect)
  });
}

function sweptRect(
  points: readonly KpEquationStagePoint[],
  sourceRect: KpEquationStageRect,
  targetRect: KpEquationStageRect
): Readonly<KpEquationStageRect> {
  const halfWidth = Math.max(sourceRect.width, targetRect.width) / 2;
  const halfHeight = Math.max(sourceRect.height, targetRect.height) / 2;
  return unionRects(points.map(({ x, y }) => ({
    left: x - halfWidth,
    top: y - halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2
  })));
}

function translateRect(
  rect: KpEquationStageRect,
  translateX: number,
  translateY: number
): Readonly<KpEquationStageRect> {
  return Object.freeze({
    left: rect.left + translateX,
    top: rect.top + translateY,
    width: rect.width,
    height: rect.height
  });
}

function center(rect: KpEquationStageRect): KpEquationStagePoint {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function contains(outer: KpEquationStageRect, inner: KpEquationStageRect): boolean {
  return inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.left + inner.width <= outer.left + outer.width &&
    inner.top + inner.height <= outer.top + outer.height;
}

function unionRects(rects: readonly KpEquationStageRect[]):
  Readonly<KpEquationStageRect> {
  const left = Math.min(...rects.map(({ left }) => left));
  const top = Math.min(...rects.map(({ top }) => top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return Object.freeze({
    left,
    top,
    width: right - left,
    height: bottom - top
  });
}

function assertRect(rect: KpEquationStageRect, label: string): void {
  if (
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new Error(`${label} must have finite positive geometry.`);
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
