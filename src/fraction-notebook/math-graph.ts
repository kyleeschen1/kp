import { expressionToLatex, type MathExpression } from '../math/expression.ts';
import { createGraph2DSceneModel, projectGraphPoint } from '../rendering/graph-2d-scene.ts';
import { renderGraphToSvg, pointsToSmoothPathData } from '../rendering/graph-2d-svg.ts';
import type { Axis2DObject, Curve2DObject, Graph2DObject } from '../semantic/graph.ts';
import type { NotebookMathRuntime } from '../notebook/math-runtime.ts';
import type { MathObjectCell } from './types.ts';

/** Keeps the existing SVG nodes alive while projecting a new semantic frame.
 * Expressions and tangent coordinates are supplied by the domain owner. */
export function mountMathGraph(host: HTMLElement, cell: MathObjectCell, runtime: NotebookMathRuntime) {
  const identity = `math-${cell.id}`, width = 600, height = 320;
  let signature = '', expressions: readonly MathExpression[] = [], svg: SVGSVGElement | undefined;
  const svgNode = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
  const marker = svgNode('circle'); marker.classList.add('fn-math-contact'); marker.setAttribute('r', '5');
  const update = (cell: MathObjectCell) => {
    const resource = runtime.resource(cell.resource), source = resource.kind === 'quadratic' ? resource : runtime.resource(resource.source);
    const shown = resource.kind === 'quadratic' ? [resource] : [source, resource];
    const next = shown.map(r => runtime.expression(r.id)), key = JSON.stringify([cell.viewport, resource.kind === 'tangent' ? resource.at : null]);
    if (signature === key && next.length === expressions.length && next.every((expression, index) => expression === expressions[index])) return;
    signature = key; expressions = next;
    const graph: Graph2DObject = { type: 'graph-2d', id: identity, label: `${resource.name}: ${expressionToLatex(next.at(-1)!)}`,
      xAxisId: `${identity}-x`, yAxisId: `${identity}-y`, xDomain: cell.viewport.x, yDomain: cell.viewport.y, width, height };
    const axes: Axis2DObject[] = [
      { type: 'axis-2d', id: graph.xAxisId, graphId: identity, label: 'x', orientation: 'x', domain: graph.xDomain, tickStep: 1 },
      { type: 'axis-2d', id: graph.yAxisId, graphId: identity, label: 'y', orientation: 'y', domain: graph.yDomain, tickStep: 1 }
    ];
    const curves: Curve2DObject[] = shown.map((r, index) => ({ type: 'curve-2d', id: `${identity}-${r.id}`, graphId: identity,
      label: r.name, equation: expressionToLatex(next[index]!), expression: next[index]!, xDomain: graph.xDomain, sampleCount: 161 }));
    if (!svg || svg.querySelectorAll('.graph-curve').length !== curves.length) {
      // The prose buffer preserves whitespace; surrounding template newlines
      // would otherwise become blank lines above and below this graphic.
      host.innerHTML = renderGraphToSvg([...axes, ...curves], graph).trim();
      svg = host.querySelector<SVGSVGElement>('svg')!; svg.setAttribute('viewBox', '-12 -12 624 344');
      const defs = svgNode('defs'), clip = svgNode('clipPath'), rect = svgNode('rect');
      clip.id = `${identity}-clip`; rect.setAttribute('width', String(width)); rect.setAttribute('height', String(height)); clip.append(rect); defs.append(clip); svg.prepend(defs);
      for (const group of svg.querySelectorAll('.graph-curve')) group.setAttribute('clip-path', `url(#${clip.id})`);
      svg.append(marker);
    }
    svg.setAttribute('aria-label', graph.label); svg.dataset['resource'] = resource.id;
    const scene = createGraph2DSceneModel([...axes, ...curves], graph);
    scene.axes.forEach(({ line, labelPoint }, index) => {
      const group = svg!.querySelectorAll('.graph-axis')[index]!, path = group.querySelector('line')!, label = group.querySelector('text')!;
      for (const [key, value] of Object.entries({ x1: line.from.x, y1: line.from.y, x2: line.to.x, y2: line.to.y })) path.setAttribute(key, String(value));
      label.setAttribute('x', String(Math.min(width - 12, Math.max(8, labelPoint.x)))); label.setAttribute('y', String(Math.min(height - 8, Math.max(18, labelPoint.y))));
    });
    scene.curves.forEach((curve, index) => {
      const group = svg!.querySelectorAll<SVGGElement>('.graph-curve')[index]!;
      group.dataset['mathRole'] = shown[index]!.kind; group.dataset['resource'] = shown[index]!.id;
      group.querySelector('path')!.setAttribute('d', pointsToSmoothPathData(curve.projectedPoints));
    });
    marker.style.display = resource.kind === 'tangent' ? '' : 'none';
    if (resource.kind === 'tangent') {
      const value = runtime.tangentSample(resource.id), point = projectGraphPoint(graph, value);
      marker.setAttribute('cx', String(point.x)); marker.setAttribute('cy', String(point.y));
      marker.dataset['x'] = String(value.x); marker.dataset['y'] = String(value.y); marker.dataset['resource'] = resource.id;
      marker.setAttribute('clip-path', `url(#${identity}-clip)`);
    }
  };
  update(cell);
  return { update, dispose() { host.replaceChildren(); } };
}
