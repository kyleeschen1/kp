import type { KpMatrixLinearMapFrame } from
  "../animation/matrix-linear-map-frame.ts";
import {
  createKpDimensionalContinuityGraphPresentationProfile,
  renderKpDimensionalContinuityInlineLatex
} from "./dimensional-continuity-graph-profile.ts";

export interface KpMatrixLinearMapGraphViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export const kpMatrixLinearMapGraphPresentationProfile =
  createKpDimensionalContinuityGraphPresentationProfile("linear-algebra");

export function renderKpMatrixLinearMapRuntimeContent(input: {
  readonly frame: KpMatrixLinearMapFrame;
  readonly viewport: KpMatrixLinearMapGraphViewport;
}): string {
  const point = (coordinates: readonly number[]) => [
    scale(coordinates[0] ?? 0, input.viewport.xDomain, [36, input.viewport.width - 20]),
    scale(coordinates[1] ?? 0, input.viewport.yDomain, [input.viewport.height - 28, 20])
  ] as const;
  const origin = point([0, 0]);
  const source = point(input.frame.geometry.inputCoordinates);
  const current = point(input.frame.geometry.currentVectorCoordinates);
  const output = point(input.frame.geometry.outputCoordinates);
  const basis = input.frame.geometry.currentBasisVectors.map(point);
  const visibility = input.frame.geometry.visibility;
  const basisOpacity = visibility * input.frame.geometry.basisRevealProgress;
  const sourceOpacity = visibility *
    input.frame.geometry.sourceVectorRevealProgress;
  const mappedOpacity = visibility * Math.max(
    input.frame.geometry.vectorMapProgress,
    input.frame.geometry.outputVectorRevealProgress
  );

  return `<g data-kp-matrix-linear-map-view data-kp-matrix-linear-map-progress="${input.frame.semanticProgress}" data-kp-matrix-linear-map-grid-progress="${input.frame.geometry.gridTransformProgress}" data-kp-matrix-linear-map-vector-progress="${input.frame.geometry.vectorMapProgress}" data-kp-matrix-linear-map-output-progress="${input.frame.geometry.outputVectorRevealProgress}" data-kp-matrix-linear-map-motion-policy="${input.frame.accessibility.motionPolicy}">
    <desc id="kp-matrix-linear-map-description" data-kp-matrix-linear-map-nonvisual-summary>${escapeHtml(input.frame.accessibility.description)}</desc>
    ${renderReferenceGrid(input.viewport, point, 0.18 + visibility * 0.22)}
    <g class="editor-graph-stage__matrix-map-grid" data-kp-matrix-linear-map-grid style="opacity:${visibility * 0.54}">
      ${input.frame.geometry.transformedGridSegments.map((segment) => {
        const from = point(segment.from);
        const to = point(segment.to);
        return `<line data-kp-matrix-linear-map-grid-line="${segment.id}" data-kp-matrix-linear-map-grid-family="${segment.family}" x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}" />`;
      }).join("")}
    </g>
    <line class="editor-graph-stage__matrix-map-path" data-kp-matrix-linear-map-path x1="${source[0]}" y1="${source[1]}" x2="${output[0]}" y2="${output[1]}" style="opacity:${visibility * 0.28}" />
    ${basis.map((endpoint, index) => `
      <line class="editor-graph-stage__matrix-map-basis editor-graph-stage__matrix-map-basis--${index + 1}" data-kp-matrix-linear-map-basis="${index}" x1="${origin[0]}" y1="${origin[1]}" x2="${endpoint[0]}" y2="${endpoint[1]}" marker-end="url(#kp-editor-graph-arrow)" style="opacity:${basisOpacity}" />
      ${renderMathLabel({
        role: `basis-${index + 1}`,
        latex: `T_A(\\mathbf e_${index + 1})`,
        x: endpoint[0] + 6,
        y: endpoint[1] - 24,
        width: 102,
        opacity: basisOpacity
      })}
    `).join("")}
    <line class="editor-graph-stage__matrix-map-source" data-kp-matrix-linear-map-source-vector data-kp-matrix-linear-map-source-coordinates="${input.frame.geometry.inputCoordinates.join(",")}" x1="${origin[0]}" y1="${origin[1]}" x2="${source[0]}" y2="${source[1]}" marker-end="url(#kp-editor-graph-arrow)" style="opacity:${sourceOpacity}" />
    <line class="editor-graph-stage__matrix-map-vector" data-kp-matrix-linear-map-current-vector data-kp-matrix-linear-map-current-coordinates="${input.frame.geometry.currentVectorCoordinates.join(",")}" x1="${origin[0]}" y1="${origin[1]}" x2="${current[0]}" y2="${current[1]}" marker-end="url(#kp-editor-graph-arrow)" style="opacity:${mappedOpacity}" />
    <circle class="editor-graph-stage__matrix-map-output" data-kp-matrix-linear-map-output-vector data-kp-matrix-linear-map-output-coordinates="${input.frame.geometry.outputCoordinates.join(",")}" cx="${output[0]}" cy="${output[1]}" r="4" style="opacity:${visibility * input.frame.geometry.outputVectorRevealProgress}" />
    ${renderMathLabel({
      role: "source-vector",
      latex: "\\mathbf v",
      x: source[0] + 5,
      y: source[1] - 24,
      width: 42,
      opacity: sourceOpacity
    })}
    ${renderMathLabel({
      role: "mapped-vector",
      latex: "T_A(\\mathbf v)",
      x: current[0] - 82,
      y: current[1] + 4,
      width: 90,
      opacity: mappedOpacity
    })}
    ${renderRelation(input.frame, input.viewport)}
  </g>`;
}

function renderReferenceGrid(
  viewport: KpMatrixLinearMapGraphViewport,
  point: (coordinates: readonly number[]) => readonly [number, number],
  opacity: number
): string {
  const ticks = [0, 5, 10, 15];
  const lines = ticks.flatMap((value) => {
    const [x] = point([value, 0]);
    const [, y] = point([0, value]);
    return [
      `<line data-kp-matrix-linear-map-reference-grid="x.${value}" x1="${x}" y1="20" x2="${x}" y2="${viewport.height - 28}" />`,
      `<line data-kp-matrix-linear-map-reference-grid="y.${value}" x1="36" y1="${y}" x2="${viewport.width - 20}" y2="${y}" />`
    ];
  }).join("");
  return `<g class="editor-graph-stage__matrix-map-reference-grid" style="opacity:${opacity}">${lines}</g>`;
}

function renderRelation(
  frame: KpMatrixLinearMapFrame,
  viewport: KpMatrixLinearMapGraphViewport
): string {
  const opacity = frame.geometry.visibility * Math.max(
    frame.geometry.basisRevealProgress,
    frame.geometry.outputVectorRevealProgress
  );
  const latex = frame.geometry.outputVectorRevealProgress >= 0.5
    ? String.raw`T_A(\mathbf v)=A\mathbf v=\begin{bmatrix}13\\15\end{bmatrix}`
    : String.raw`T_A(\mathbf e_1)=\begin{bmatrix}2\\0\end{bmatrix},\quad T_A(\mathbf e_2)=\begin{bmatrix}1\\3\end{bmatrix}`;
  return `<foreignObject class="editor-graph-stage__matrix-map-relation" x="${Math.max(56, viewport.width / 2 - 176)}" y="12" width="352" height="48" style="opacity:${opacity}">
    <div xmlns="http://www.w3.org/1999/xhtml" data-kp-matrix-linear-map-relation data-kp-latex="${escapeHtml(latex)}">${renderKpDimensionalContinuityInlineLatex(latex)}</div>
  </foreignObject>`;
}

function renderMathLabel(input: {
  readonly role: string;
  readonly latex: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly opacity: number;
}): string {
  return `<foreignObject class="editor-graph-stage__matrix-map-label" data-kp-matrix-linear-map-label="${input.role}" x="${input.x}" y="${input.y}" width="${input.width}" height="28" style="opacity:${input.opacity}">
    <span xmlns="http://www.w3.org/1999/xhtml" data-kp-latex="${escapeHtml(input.latex)}">${renderKpDimensionalContinuityInlineLatex(input.latex)}</span>
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
  return value.replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
