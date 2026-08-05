import type {
  DotProjectionComponentPairFrame,
  DotProjectionRuntimeFrame
} from "../animation/dot-projection-runtime-frame.ts";
import {
  kpVectorDotProjectionExemplarContract
} from "../animation/vector-dot-projection-exemplar-contract.ts";
import {
  createKpDimensionalContinuityGraphPresentationProfile
} from "./dimensional-continuity-graph-profile.ts";
import {
  renderKpDimensionalContinuityInlineLatex
} from "./dimensional-continuity-inline-latex.ts";

export interface KpVectorDotProjectionGraphViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export const kpVectorDotProjectionGraphPresentationProfile =
  createKpDimensionalContinuityGraphPresentationProfile("linear-algebra");

export function renderKpVectorDotProjectionRuntimeContent(input: {
  readonly frame: DotProjectionRuntimeFrame;
  readonly viewport: KpVectorDotProjectionGraphViewport;
}): string {
  const point = (coordinates: readonly [number, number]) => [
    scale(coordinates[0], input.viewport.xDomain, [36, input.viewport.width - 20]),
    scale(coordinates[1], input.viewport.yDomain, [input.viewport.height - 28, 20])
  ] as const;
  const origin = point([0, 0]);
  const source = point(input.frame.leftVector);
  const target = point(input.frame.rightVector);
  const projection = point(input.frame.projectionVector);
  const drop = point(input.frame.dropPoint);
  const projectionVisible = input.frame.graphProgress >= 4 / 8;
  const residualVisible = input.frame.graphProgress >= 5 / 8;
  const projectionGuideOpacity = projectionVisible
    ? 0.18 + 0.24 * input.frame.projectionDropProgress
    : 0;
  const projectionOpacity = projectionVisible
    ? 0.3 + 0.7 * input.frame.projectionDropProgress
    : 0;
  const residualOpacity = residualVisible
    ? 0.28 + 0.72 * Math.max(
        input.frame.projectionDropProgress,
        input.frame.residualRevealProgress
      )
    : 0;

  return `<g data-kp-vector-dot-projection-view data-kp-vector-dot-projection-beat="${escapeHtml(input.frame.semanticBeatId)}" data-kp-vector-dot-projection-beat-progress="${input.frame.semanticBeatProgress}" data-kp-vector-dot-projection-drop-progress="${input.frame.projectionDropProgress}" data-kp-vector-dot-projection-residual-progress="${input.frame.residualRevealProgress}">
    <desc id="kp-vector-dot-projection-description" data-kp-vector-nonvisual-summary>${escapeHtml(input.frame.accessibleDescription)}</desc>
    ${renderGrid(input.viewport, point)}
    ${renderComponentGeometry({
      frame: input.frame,
      origin,
      source,
      target,
      projection,
      point,
      projectionGuideOpacity
    })}
    <line class="editor-graph-stage__vector-target-span" data-kp-vector-target-span x1="${origin[0]}" y1="${origin[1]}" x2="${projection[0]}" y2="${projection[1]}" />
    <line class="editor-graph-stage__vector-source" data-kp-vector-source x1="${origin[0]}" y1="${origin[1]}" x2="${source[0]}" y2="${source[1]}" marker-end="url(#kp-editor-graph-arrow)" />
    <line class="editor-graph-stage__vector-target" data-kp-vector-target x1="${origin[0]}" y1="${origin[1]}" x2="${target[0]}" y2="${target[1]}" marker-end="url(#kp-editor-graph-arrow)" />
    <line class="editor-graph-stage__vector-projection" data-kp-editor-graph-projection data-kp-editor-graph-drop-point="${input.frame.dropPoint.join(",")}" data-kp-vector-projection x1="${origin[0]}" y1="${origin[1]}" x2="${drop[0]}" y2="${drop[1]}" marker-end="url(#kp-editor-graph-arrow)" style="opacity:${projectionOpacity}" />
    <line class="editor-graph-stage__vector-residual" data-kp-vector-residual x1="${source[0]}" y1="${source[1]}" x2="${drop[0]}" y2="${drop[1]}" style="opacity:${residualOpacity}" />
    <circle class="editor-graph-stage__vector-projection-point" data-kp-editor-graph-projection-point data-kp-editor-graph-dot-product="${input.frame.dotProduct}" cx="${drop[0]}" cy="${drop[1]}" r="3.25" style="opacity:${projectionOpacity}" />
    ${input.frame.rightAngleVisible ? renderRightAngle({ source, projection, origin }) : ""}
    ${renderMathLabel({
      role: "source-vector",
      latex: "\\mathbf a",
      x: source[0] + 5,
      y: source[1] - 26,
      width: 42,
      height: 26,
      className: "editor-graph-stage__vector-math-label--source"
    })}
    ${renderMathLabel({
      role: "target-vector",
      latex: "\\mathbf b",
      x: target[0] + 8,
      y: target[1] + 3,
      width: 42,
      height: 26,
      className: "editor-graph-stage__vector-math-label--target"
    })}
    ${renderMathLabel({
      role: "projection-vector",
      latex: "\\operatorname{proj}_{\\mathbf b}(\\mathbf a)",
      x: projection[0] + 8,
      y: projection[1] - 26,
      width: 150,
      height: 28,
      opacity: projectionOpacity,
      className: "editor-graph-stage__vector-math-label--projection"
    })}
    ${renderMathLabel({
      role: "residual-vector",
      latex: "\\mathbf a-\\operatorname{proj}_{\\mathbf b}(\\mathbf a)",
      x: (source[0] + projection[0]) / 2 - 178,
      y: (source[1] + projection[1]) / 2 + 4,
      width: 174,
      height: 28,
      opacity: residualOpacity,
      className: "editor-graph-stage__vector-math-label--residual"
    })}
    ${renderEquationStrip(input.frame, input.viewport)}
  </g>`;
}

function renderGrid(
  viewport: KpVectorDotProjectionGraphViewport,
  point: (coordinates: readonly [number, number]) => readonly [number, number]
): string {
  const ticks = [1, 2, 3, 4];
  const vertical = ticks.map((value) => {
    const [x] = point([value, 0]);
    const [, axisY] = point([0, 0]);
    return `<line class="editor-graph-stage__vector-grid-line" data-kp-vector-grid-axis="x" data-kp-vector-grid-value="${value}" x1="${x}" y1="20" x2="${x}" y2="${viewport.height - 28}" />
      <line class="editor-graph-stage__vector-tick" x1="${x}" y1="${axisY - 4}" x2="${x}" y2="${axisY + 4}" />
      ${renderMathLabel({
        role: `tick-x-${value}`,
        latex: String(value),
        x: x - 14,
        y: axisY + 5,
        width: 28,
        height: 22,
        className: "editor-graph-stage__vector-math-label--tick"
      })}`;
  }).join("");
  const horizontal = ticks.map((value) => {
    const [axisX, y] = point([0, value]);
    return `<line class="editor-graph-stage__vector-grid-line" data-kp-vector-grid-axis="y" data-kp-vector-grid-value="${value}" x1="36" y1="${y}" x2="${viewport.width - 20}" y2="${y}" />
      <line class="editor-graph-stage__vector-tick" x1="${axisX - 4}" y1="${y}" x2="${axisX + 4}" y2="${y}" />
      ${renderMathLabel({
        role: `tick-y-${value}`,
        latex: String(value),
        x: axisX - 31,
        y: y - 11,
        width: 26,
        height: 22,
        className: "editor-graph-stage__vector-math-label--tick editor-graph-stage__vector-math-label--tick-y"
      })}`;
  }).join("");
  const [axisX, axisY] = point([0, 0]);
  return `<g class="editor-graph-stage__vector-grid" aria-hidden="true">${vertical}${horizontal}
    ${renderMathLabel({
      role: "axis-x",
      latex: "x",
      x: viewport.width - 44,
      y: axisY + 8,
      width: 26,
      height: 24,
      className: "editor-graph-stage__vector-math-label--axis"
    })}
    ${renderMathLabel({
      role: "axis-y",
      latex: "y",
      x: axisX + 8,
      y: 18,
      width: 26,
      height: 24,
      className: "editor-graph-stage__vector-math-label--axis"
    })}
  </g>`;
}

function renderComponentGeometry(input: {
  readonly frame: DotProjectionRuntimeFrame;
  readonly origin: readonly [number, number];
  readonly source: readonly [number, number];
  readonly target: readonly [number, number];
  readonly projection: readonly [number, number];
  readonly point: (coordinates: readonly [number, number]) => readonly [number, number];
  readonly projectionGuideOpacity: number;
}): string {
  const sourceCorner = input.point([input.frame.leftVector[0], 0]);
  const targetCorner = input.point([input.frame.rightVector[0], 0]);
  const projectionCorner = input.point([input.frame.projectionVector[0], 0]);

  return input.frame.componentPairs.map((pair) => {
    const sourceSegment = pair.index === 0
      ? [input.origin, sourceCorner]
      : [sourceCorner, input.source];
    const targetSegment = pair.index === 0
      ? [input.origin, targetCorner]
      : [targetCorner, input.target];
    const projectionSegment = pair.index === 0
      ? [input.origin, projectionCorner]
      : [projectionCorner, input.projection];
    return `<g data-kp-vector-component-geometry="${pair.axis}" data-kp-vector-component-status="${pair.status}">
      ${componentLine(pair, "source", pair.sourceGeometryId, sourceSegment)}
      ${componentLine(pair, "target", pair.targetGeometryId, targetSegment)}
      ${componentLine(pair, "projection", pair.projectionGeometryId, projectionSegment, input.projectionGuideOpacity)}
    </g>`;
  }).join("");
}

function componentLine(
  pair: DotProjectionComponentPairFrame,
  role: "source" | "target" | "projection",
  geometryId: string,
  segment: readonly (readonly [number, number])[],
  opacity?: number
): string {
  return `<line class="editor-graph-stage__vector-component-guide editor-graph-stage__vector-component-guide--${role}" data-kp-vector-component-lineage="${escapeHtml(pair.lineageId)}" data-kp-vector-component-role="${role}" data-kp-vector-geometry-id="${escapeHtml(geometryId)}" x1="${segment[0]![0]}" y1="${segment[0]![1]}" x2="${segment[1]![0]}" y2="${segment[1]![1]}"${opacity === undefined ? "" : ` style="opacity:${opacity}"`} />`;
}

function renderEquationStrip(
  frame: DotProjectionRuntimeFrame,
  viewport: KpVectorDotProjectionGraphViewport
): string {
  const relation = relationLatex(frame.semanticBeatId);
  const pairChips = frame.componentPairs.map((pair) => {
    const lineage = frame.componentLineage.find(
      (candidate) => candidate.index === pair.index
    );
    if (lineage === undefined) {
      throw new Error(`Missing component lineage for index ${pair.index}.`);
    }
    const latex = `${lineage.sourceComponent}\\cdot${lineage.targetComponent}=${lineage.product}`;
    return `<span class="editor-graph-stage__vector-component-chip" data-kp-vector-component-pair="${pair.axis}" data-kp-vector-component-pair-status="${pair.status}" data-kp-vector-component-product="${pair.product}" data-kp-latex="${escapeHtml(latex)}">${renderKpDimensionalContinuityInlineLatex(latex)}</span>`;
  }).join("");

  return `<foreignObject class="editor-graph-stage__vector-equation-foreign-object" x="${Math.max(74, viewport.width / 2 - 196)}" y="10" width="392" height="72">
    <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__vector-equation-strip" data-kp-vector-equation-strip>
      <div class="editor-graph-stage__vector-current-relation" data-kp-vector-current-relation data-kp-latex="${escapeHtml(relation)}">${renderKpDimensionalContinuityInlineLatex(relation)}</div>
      <div class="editor-graph-stage__vector-component-pairs">${pairChips}</div>
    </div>
  </foreignObject>`;
}

function relationLatex(beatId: string): string {
  const exact = kpVectorDotProjectionExemplarContract.exactLatex;
  switch (beatId) {
    case "source-pose":
      return `${exact.source},\\quad${exact.target}`;
    case "component-pair-x":
      return "a_xb_x=4\\cdot1=4";
    case "component-pair-y":
      return "a_yb_y=2\\cdot1=2";
    case "dot-settlement":
      return exact.componentDotProduct;
    case "projection-scale":
      return exact.projectionScale;
    case "projection-drop":
      return exact.projection;
    case "orthogonal-decomposition":
    case "native-settlement":
      return exact.orthogonalDecomposition;
    default:
      throw new Error(`Unknown vector projection beat ${beatId}.`);
  }
}

function renderRightAngle(input: {
  readonly source: readonly [number, number];
  readonly projection: readonly [number, number];
  readonly origin: readonly [number, number];
}): string {
  // The runtime has already certified perpendicularity. This calculation only
  // sizes the conventional witness in screen space, so SVG owns no vector law.
  const residual = unitVector(input.projection, input.source);
  const target = unitVector(input.projection, input.origin);
  const size = 9;
  const first = addScaled(input.projection, residual, size);
  const corner = addScaled(first, target, size);
  const second = addScaled(input.projection, target, size);
  return `<path class="editor-graph-stage__vector-right-angle" data-kp-vector-right-angle d="M ${first[0]} ${first[1]} L ${corner[0]} ${corner[1]} L ${second[0]} ${second[1]}" />`;
}

function unitVector(
  from: readonly [number, number],
  to: readonly [number, number]
): readonly [number, number] {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  const length = Math.hypot(x, y);
  return length === 0 ? [0, 0] : [x / length, y / length];
}

function addScaled(
  point: readonly [number, number],
  vector: readonly [number, number],
  scaleValue: number
): readonly [number, number] {
  return [point[0] + vector[0] * scaleValue, point[1] + vector[1] * scaleValue];
}

function renderMathLabel(input: {
  readonly role: string;
  readonly latex: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly opacity?: number | undefined;
  readonly className: string;
}): string {
  return `<foreignObject class="editor-graph-stage__vector-math-foreign-object" data-kp-vector-math-label="${input.role}" x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" aria-hidden="true"${input.opacity === undefined ? "" : ` style="opacity:${input.opacity}"`}>
    <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__vector-math-label ${input.className}" data-kp-latex="${escapeHtml(input.latex)}">${renderKpDimensionalContinuityInlineLatex(input.latex)}</div>
  </foreignObject>`;
}

function scale(
  value: number,
  from: readonly [number, number],
  to: readonly [number, number]
): number {
  return to[0] + ((value - from[0]) / (from[1] - from[0])) * (to[1] - to[0]);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
