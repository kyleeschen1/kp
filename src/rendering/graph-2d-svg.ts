import type { KpSemanticObject } from '../semantic/document.ts';
import type { Graph2DObject } from '../semantic/graph.ts';
import { createGraph2DSceneModel, type Graph2DSceneAxis, type Graph2DSceneCurve } from './graph-2d-scene.ts';
import { catmullRomToBezierPathCommands, type SmoothPoint2D } from './graph-smoothing.ts';

/** The existing 2D paint entry is separate from 3D depth, lighting and surface
 * imports, so a notebook graph does not acquire the spatial renderer. */
export function renderGraphToSvg(objects: readonly KpSemanticObject[], graph: Graph2DObject): string {
  const model = createGraph2DSceneModel(objects, graph);
  return `
    <svg class="graph-svg" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-2d" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${model.axes.map(renderAxis).join('')}
      ${model.curves.map(renderCurve).join('')}
    </svg>
  `;
}
function renderAxis(sceneAxis: Graph2DSceneAxis): string {
  const { axis, labelPoint, line } = sceneAxis;
  return `
    <g class="graph-axis graph-axis--${axis.orientation}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="${escapeHtml(sceneAxis.renderNodeId)}" data-kp-type="axis-2d">
      <line x1="${formatNumber(line.from.x)}" y1="${formatNumber(line.from.y)}" x2="${formatNumber(line.to.x)}" y2="${formatNumber(line.to.y)}" />
      <text x="${formatNumber(labelPoint.x)}" y="${formatNumber(labelPoint.y)}">${escapeHtml(axis.label)}</text>
    </g>
  `;
}
function renderCurve(sceneCurve: Graph2DSceneCurve): string {
  const { curve } = sceneCurve, pathData = pointsToSmoothPathData(sceneCurve.projectedPoints);
  if (!pathData.length) return '';
  return `
    <g class="graph-curve" data-kp-object="${escapeHtml(curve.id)}" data-kp-render-node="${escapeHtml(sceneCurve.renderNodeId)}" data-kp-type="curve-2d">
      <path d="${pathData}" data-kp-smoothing="catmull-rom" />
      <text x="18" y="26">${escapeHtml(curve.label)}</text>
    </g>
  `;
}
export function pointsToSmoothPathData(points: readonly SmoothPoint2D[]): string {
  return catmullRomToBezierPathCommands(points).map(command => command.kind === 'move'
    ? `M ${formatNumber(command.point.x)} ${formatNumber(command.point.y)}`
    : `C ${formatNumber(command.control1.x)} ${formatNumber(command.control1.y)} ${formatNumber(command.control2.x)} ${formatNumber(command.control2.y)} ${formatNumber(command.point.x)} ${formatNumber(command.point.y)}`).join(' ');
}
const formatNumber = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(3);
const escapeHtml = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
