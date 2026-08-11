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
const geometryContainmentEpsilonPx = 1e-6;

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

/**
 * A staged equation is one continuous coordinate system. Phase-local row
 * fitting may choose different horizontal origins for the same endpoint, so
 * propagate each shared semantic endpoint before any renderer owns motion.
 */
export function alignKpEquationStageSequence(
  layouts: readonly KpCorridorCertifiedEquationStageLayout[]
): readonly KpCorridorCertifiedEquationStageLayout[] {
  if (layouts.length < 2) return Object.freeze([...layouts]);
  const aligned = [layouts[0]!];
  for (const layout of layouts.slice(1)) {
    const previous = aligned.at(-1)!;
    if (previous.policy !== layout.policy) {
      throw new Error("Equation stage sequence cannot change layout policy.");
    }
    const previousRows = rowRoleIndex(previous);
    const rows = rowRoleIndex(layout);
    if (!sameValues([...previousRows.keys()].sort(), [...rows.keys()].sort())) {
      throw new Error("Equation stage sequence changed its semantic row roles.");
    }
    const shiftByRowId = new Map<string, KpEquationStagePoint>();
    for (const [role, row] of rows) {
      const previousRow = previousRows.get(role)!;
      const sharedEndpointIds = rowEndpointIds(previous, previousRow)
        .filter((id) => rowEndpointIds(layout, row).includes(id));
      if (sharedEndpointIds.length !== 1) {
        throw new Error(
          `Equation stage row ${role} must share exactly one adjacent endpoint.`
        );
      }
      const endpointId = sharedEndpointIds[0]!;
      const previousEnvelope = endpointEnvelope(previous, previousRow, endpointId);
      const envelope = endpointEnvelope(layout, row, endpointId);
      shiftByRowId.set(
        row.id,
        {
          x: previousEnvelope.rect.left + previousRow.translateX -
            (envelope.rect.left + row.translateX),
          y: previousEnvelope.rect.top + previousRow.translateY -
            (envelope.rect.top + row.translateY)
        }
      );
    }
    aligned.push(shiftCorridorLayout(layout, shiftByRowId));
  }
  if (aligned[0]!.rows.length !== 2) return Object.freeze(aligned);
  const extraCorridorHeight = Math.max(0, ...aligned.map((layout, index) =>
    layouts[index]!.protectedTransitCorridor.rect.height -
      layout.protectedTransitCorridor.rect.height
  ));
  const expanded = aligned.map((layout) => shiftCorridorLayout(
    layout,
    new Map(layout.rows.map((row, index) => [
      row.id,
      { x: 0, y: index === 0
        ? -extraCorridorHeight / 2
        : extraCorridorHeight / 2 }
    ]))
  ));
  expanded.forEach((layout, index) => {
    if (
      layout.protectedTransitCorridor.rect.height + 1e-6 <
      layouts[index]!.protectedTransitCorridor.rect.height
    ) {
      throw new Error(
        "Equation stage sequence cannot preserve its protected corridor."
      );
    }
  });
  return Object.freeze(expanded);
}

export function translateKpEquationStageLayoutRows(
  layout: KpCorridorCertifiedEquationStageLayout,
  offsets: ReadonlyMap<string, KpEquationStagePoint>
): KpCorridorCertifiedEquationStageLayout {
  for (const [rowId, offset] of offsets) {
    if (
      !layout.rows.some(({ id }) => id === rowId) ||
      !Number.isFinite(offset.x) ||
      !Number.isFinite(offset.y)
    ) {
      throw new Error(`Equation stage row translation is invalid for ${rowId}.`);
    }
  }
  if (offsets.size !== layout.rows.length) {
    throw new Error("Equation stage translation must cover every semantic row.");
  }
  return shiftCorridorLayout(layout, offsets);
}

function shiftCorridorLayout(
  layout: KpCorridorCertifiedEquationStageLayout,
  shiftByRowId: ReadonlyMap<string, KpEquationStagePoint>
): KpCorridorCertifiedEquationStageLayout {
  const rows = layout.rows.map((row) => {
    const shift = shiftByRowId.get(row.id) ?? { x: 0, y: 0 };
    return Object.freeze({
      ...row,
      rect: translateRect(row.rect, shift.x, shift.y),
      translateX: row.translateX + shift.x,
      translateY: row.translateY + shift.y
    });
  });
  const stageBounds = unionRects(rows.map(({ rect }) => rect));
  const corridorRect = sequenceCorridorRect(layout, rows, stageBounds);
  const transits = layout.transits.map((transit) => {
    const sourceShift = shiftByRowId.get(transit.sourceRowId) ?? { x: 0, y: 0 };
    const targetShift = shiftByRowId.get(transit.targetRowId) ?? { x: 0, y: 0 };
    const shifts = [sourceShift, targetShift];
    const points = transit.route === "direct"
      ? transit.points.map((point, index) => translatePoint(point, shifts[index]!))
      : [
          translatePoint(transit.points[0]!, sourceShift),
          { x: transit.points[1]!.x + sourceShift.x,
            y: corridorRect.top + corridorRect.height / 2 },
          { x: transit.points[2]!.x + targetShift.x,
            y: corridorRect.top + corridorRect.height / 2 },
          translatePoint(transit.points[3]!, targetShift)
        ];
    const minimumX = Math.min(sourceShift.x, targetShift.x);
    const maximumX = Math.max(sourceShift.x, targetShift.x);
    const minimumY = Math.min(sourceShift.y, targetShift.y);
    const maximumY = Math.max(sourceShift.y, targetShift.y);
    return Object.freeze({
      ...transit,
      points: Object.freeze(points),
      sweptBounds: Object.freeze({
        ...transit.sweptBounds,
        left: transit.sweptBounds.left + minimumX,
        top: transit.sweptBounds.top + minimumY,
        width: transit.sweptBounds.width + maximumX - minimumX,
        height: transit.sweptBounds.height + maximumY - minimumY
      })
    });
  });
  const protectedTransitCorridor = Object.freeze({
    ...layout.protectedTransitCorridor,
    rect: corridorRect
  });
  return Object.freeze({
    ...layout,
    rows: Object.freeze(rows),
    stageBounds,
    minimumGutterPx: corridorRect.height,
    protectedTransitCorridor,
    transits: Object.freeze(transits),
    sweptBounds: unionRects([
      ...rows.map(({ rect }) => rect),
      protectedTransitCorridor.rect,
      ...transits.map(({ sweptBounds }) => sweptBounds)
    ]),
    [corridorCertifiedEquationStageLayoutAuthority]: true as const
  });
}

function sequenceCorridorRect(
  layout: KpCorridorCertifiedEquationStageLayout,
  rows: readonly KpCertifiedEquationStageRow[],
  stageBounds: KpEquationStageRect
): KpEquationStageRect {
  if (rows.length === 1) {
    const shiftY = rows[0]!.rect.top - layout.rows[0]!.rect.top;
    return Object.freeze({
      ...layout.protectedTransitCorridor.rect,
      left: stageBounds.left,
      top: layout.protectedTransitCorridor.rect.top + shiftY,
      width: stageBounds.width
    });
  }
  const top = rows[0]!.rect.top + rows[0]!.rect.height;
  const height = Math.max(0, rows[1]!.rect.top - top);
  return Object.freeze({ left: stageBounds.left, top,
    width: stageBounds.width, height });
}

function translatePoint(
  point: KpEquationStagePoint,
  shift: KpEquationStagePoint
): KpEquationStagePoint {
  return { x: point.x + shift.x, y: point.y + shift.y };
}

function rowRoleIndex(
  layout: KpCorridorCertifiedEquationStageLayout
): ReadonlyMap<string, KpCertifiedEquationStageRow> {
  const intents = new Map(
    layout.measuredInput.intent.rows.map((row) => [row.id, row.role])
  );
  const rows = new Map<string, KpCertifiedEquationStageRow>();
  for (const row of layout.rows) {
    const role = intents.get(row.id);
    if (role === undefined || rows.has(role)) {
      throw new Error("Equation stage rows require unique semantic roles.");
    }
    rows.set(role, row);
  }
  return rows;
}

function rowEndpointIds(
  layout: KpCorridorCertifiedEquationStageLayout,
  row: KpCertifiedEquationStageRow
): readonly string[] {
  const envelopes = new Map(
    layout.measuredInput.envelopes.map((envelope) => [envelope.id, envelope])
  );
  return row.envelopeIds.map((id) => envelopes.get(id)!.endpointObjectId);
}

function endpointEnvelope(
  layout: KpCorridorCertifiedEquationStageLayout,
  row: KpCertifiedEquationStageRow,
  endpointId: string
) {
  const envelope = layout.measuredInput.envelopes.find((candidate) =>
    row.envelopeIds.includes(candidate.id) &&
    candidate.endpointObjectId === endpointId
  );
  if (envelope === undefined) {
    throw new Error(`Equation stage row ${row.id} lacks endpoint ${endpointId}.`);
  }
  return envelope;
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
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
  const firstShiftY = -shiftY / 2;
  const secondShiftY = shiftY / 2;
  return Object.freeze([
    Object.freeze({
      ...first!,
      rect: translateRect(first!.rect, 0, firstShiftY),
      translateY: first!.translateY + firstShiftY
    }),
    Object.freeze({
      ...second!,
      rect: translateRect(second!.rect, 0, secondShiftY),
      translateY: second!.translateY + secondShiftY
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
  // DOMRect union arithmetic can differ at a shared edge by machine epsilon
  // while a responsive host is between fractional CSS widths.
  return inner.left >= outer.left - geometryContainmentEpsilonPx &&
    inner.top >= outer.top - geometryContainmentEpsilonPx &&
    inner.left + inner.width <=
      outer.left + outer.width + geometryContainmentEpsilonPx &&
    inner.top + inner.height <=
      outer.top + outer.height + geometryContainmentEpsilonPx;
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
