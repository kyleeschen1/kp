import type { KpSemanticObject } from "../semantic/document.ts";
import type { Axis2DObject, Curve2DObject, Graph2DObject } from "../semantic/graph.ts";

export interface GraphPoint {
  x: number;
  y: number;
}

export function projectGraphPoint(
  graph: Graph2DObject,
  point: GraphPoint
): GraphPoint {
  const [minX, maxX] = graph.xDomain;
  const [minY, maxY] = graph.yDomain;

  return {
    x: ((point.x - minX) / (maxX - minX)) * graph.width,
    y: graph.height - ((point.y - minY) / (maxY - minY)) * graph.height
  };
}

export function sampleParabolaCurve(curve: Curve2DObject): readonly GraphPoint[] {
  const [minX, maxX] = curve.xDomain;
  const step = (maxX - minX) / (curve.sampleCount - 1);

  return Array.from({ length: curve.sampleCount }, (_, index) => {
    const x = minX + step * index;

    return {
      x,
      y: x * x
    };
  });
}

export function renderGraphToSvg(
  objects: readonly KpSemanticObject[],
  graph: Graph2DObject
): string {
  const axes = objects.filter(
    (object): object is Axis2DObject =>
      object.type === "axis-2d" && object.graphId === graph.id
  );
  const curves = objects.filter(
    (object): object is Curve2DObject =>
      object.type === "curve-2d" && object.graphId === graph.id
  );

  return `
    <svg class="graph-svg" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-2d" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${axes.map((axis) => renderAxis(axis, graph)).join("")}
      ${curves.map((curve) => renderCurve(curve, graph)).join("")}
    </svg>
  `;
}

function renderAxis(axis: Axis2DObject, graph: Graph2DObject): string {
  const line =
    axis.orientation === "x"
      ? {
          from: projectGraphPoint(graph, { x: graph.xDomain[0], y: 0 }),
          to: projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
        }
      : {
          from: projectGraphPoint(graph, { x: 0, y: graph.yDomain[0] }),
          to: projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] })
        };
  const labelPoint =
    axis.orientation === "x"
      ? projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
      : projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] });

  return `
    <g class="graph-axis graph-axis--${axis.orientation}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line" data-kp-type="axis-2d">
      <line x1="${formatNumber(line.from.x)}" y1="${formatNumber(line.from.y)}" x2="${formatNumber(line.to.x)}" y2="${formatNumber(line.to.y)}" />
      <text x="${formatNumber(labelPoint.x)}" y="${formatNumber(labelPoint.y)}">${escapeHtml(axis.label)}</text>
    </g>
  `;
}

function renderCurve(curve: Curve2DObject, graph: Graph2DObject): string {
  const points = sampleParabolaCurve(curve).map((point) =>
    projectGraphPoint(graph, point)
  );
  const [firstPoint, ...remainingPoints] = points;

  if (firstPoint === undefined) {
    return "";
  }

  const pathData = [
    `M ${formatNumber(firstPoint.x)} ${formatNumber(firstPoint.y)}`,
    ...remainingPoints.map(
      (point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`
    )
  ].join(" ");

  return `
    <g class="graph-curve" data-kp-object="${escapeHtml(curve.id)}" data-kp-render-node="rn-${escapeHtml(curve.id)}-svg-path" data-kp-type="curve-2d">
      <path d="${pathData}" />
      <text x="18" y="26">${escapeHtml(curve.label)}</text>
    </g>
  `;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
