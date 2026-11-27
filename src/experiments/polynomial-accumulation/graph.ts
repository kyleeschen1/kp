import { createGraph2DObject, createAxis2DObject, type Curve2DObject } from '../../semantic/graph.ts';
import { projectGraphPoint } from '../../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../../rendering/graph-2d-svg.ts';
import { add, constant } from '../../math/expression.ts';
import { entities, exactValue, numeric, type AccumulationPolynomial, type AccumulationFrame } from '../../math/authoring/polynomial-accumulation.ts';

function padded(values: readonly number[]): readonly [number, number] {
  const min = Math.min(0, ...values), max = Math.max(0, ...values), pad = Math.max(1, max - min) * .15;
  return [min - pad, max + pad];
}
export function graphModel(model: AccumulationPolynomial, a: number) {
  // Domains depend on the entire supported interval, never the current frame.
  const xs = Array.from({ length: 121 }, (_, i) => -3 + i / 20);
  const offset = numeric(exactValue(model.primitive, a));
  const graph = (id: string, label: string, yDomain: readonly [number, number]) => createGraph2DObject({ id, label, xAxisId: id + '.x', yAxisId: id + '.y', xDomain: [-3, 3], yDomain, width: 320, height: 220 });
  const f = graph('accumulation.integrand', 'Function and swept signed regions', padded(xs.map(x => model.evaluate({ x }))));
  const A = graph('accumulation.integral', 'Accumulated signed integral from the starting bound', padded(xs.map(x => model.evaluatePrimitive({ x }) - offset)));
  const axes = (g: typeof f) => (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: orientation === 'x' ? g.xAxisId : g.yAxisId, graphId: g.id, orientation, label: '', domain: orientation === 'x' ? g.xDomain : g.yDomain, tickStep: 1 }));
  const curve = (g: typeof f, expression: typeof model.f, id: string): Curve2DObject => ({ id, graphId: g.id, type: 'curve-2d', label: '', equation: '', expression, xDomain: [-3, 3], sampleCount: 181 });
  return { f, A, functionObjects: [...axes(f), curve(f, model.f, entities.function)], totalObjects: [...axes(A), curve(A, add(model.F, constant(-offset)), entities.total)] };
}
export type AccumulationGraphs = ReturnType<typeof graphModel>;
const attr = (values: Record<string, number | string>) => Object.entries(values).map(([k, v]) => `${k}="${v}"`).join(' ');
export function graphParts(model: AccumulationPolynomial, graphs: AccumulationGraphs, frame: AccumulationFrame) {
  const area = (sign: string) => frame.segments.filter(s => s.sign === sign).map(s => {
    const left = s.left / 100, right = s.right / 100, count = Math.max(1, Math.ceil((right - left) * 30));
    const points = [{ x: left, y: 0 }, ...Array.from({ length: count + 1 }, (_, i) => {
      const x = left + (right - left) * i / count; return { x, y: model.evaluate({ x }) };
    }), { x: right, y: 0 }].map(p => projectGraphPoint(graphs.f, p));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  }).join(' ');
  const cursor = (g: typeof graphs.f, x: number) => { const p = projectGraphPoint(g, { x, y: 0 }); return { x1: p.x, x2: p.x, y1: 0, y2: g.height }; };
  const point = (g: typeof graphs.f, y: number) => { const p = projectGraphPoint(g, { x: frame.x / 100, y }); return { cx: p.x, cy: p.y }; };
  return { above: { d: area('above') }, below: { d: area('below') }, 'f-cursor': cursor(graphs.f, frame.x / 100), 'A-cursor': cursor(graphs.A, frame.x / 100),
    'f-anchor': cursor(graphs.f, frame.a / 100), 'A-anchor': cursor(graphs.A, frame.a / 100), 'f-point': point(graphs.f, frame.value), 'A-point': point(graphs.A, frame.total) };
}
export function renderAccumulationGraphs(model: AccumulationPolynomial, frame: AccumulationFrame) {
  const graphs = graphModel(model, frame.a), parts = graphParts(model, graphs, frame);
  const overlay = (prefix: 'f' | 'A') => `<line class="anchor" data-part="${prefix}-anchor" ${attr(parts[`${prefix}-anchor`])}/><line class="cursor" data-part="${prefix}-cursor" ${attr(parts[`${prefix}-cursor`])}/><circle class="point" data-part="${prefix}-point" r="4" ${attr(parts[`${prefix}-point`])}/>`;
  const base = renderGraphToSvg(graphs.functionObjects, graphs.f);
  // Place shading under the curve and axes; it must never conceal the evidence.
  const area = `<defs><pattern id="area-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0,7 L7,0"/></pattern></defs><path data-part="above" data-entity="${entities.above}" ${attr(parts.above)}/><path data-part="below" data-entity="${entities.below}" ${attr(parts.below)}/>`;
  const f = base.replace('<g ', area + '<g ').replace('</svg>', overlay('f') + '</svg>');
  const A = renderGraphToSvg(graphs.totalObjects, graphs.A).replace('</svg>', overlay('A') + '</svg>');
  return { f, A, domains: { f: graphs.f.yDomain, A: graphs.A.yDomain } };
}
export function bindAccumulationGraphs(host: HTMLElement, model: AccumulationPolynomial, a: number) {
  const graphs = graphModel(model, a);
  const parts = ['above', 'below', 'f-cursor', 'A-cursor', 'f-anchor', 'A-anchor', 'f-point', 'A-point'] as const;
  const nodes = parts.map(id => { const node = host.querySelector<SVGElement>(`[data-part="${id}"]`); if (!node) throw new Error('Missing accumulation part: ' + id); return { id, node }; });
  return (frame: AccumulationFrame) => {
    const values = graphParts(model, graphs, frame);
    for (const { id, node } of nodes) for (const [key, value] of Object.entries(values[id])) node.setAttribute(key, String(value));
    host.dataset['endpoint'] = String(frame.x / 100); host.dataset['total'] = String(frame.total); host.dataset['area'] = String(frame.area);
  };
}
