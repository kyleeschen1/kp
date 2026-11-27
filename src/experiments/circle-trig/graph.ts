import { createGraph2DObject, createAxis2DObject, type Curve2DObject } from '../../semantic/graph.ts';
import { projectGraphPoint } from '../../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../../rendering/graph-2d-svg.ts';
import { entities, expressions, type CircleFrame } from './model.ts';

const circle = createGraph2DObject({ id: 'circle-trig.circle', label: 'Unit circle and signed coordinates', xAxisId: 'circle.x', yAxisId: 'circle.y', xDomain: [-1.2, 1.2], yDomain: [-1.2, 1.2], width: 280, height: 280 });
const functions = createGraph2DObject({ id: 'circle-trig.functions', label: 'Cosine and sine over one revolution', xAxisId: 'functions.x', yAxisId: 'functions.y', xDomain: [0, 2 * Math.PI], yDomain: [-1.2, 1.2], width: 320, height: 200 });
const axes = (graph: typeof circle) => (['x', 'y'] as const).map(orientation => createAxis2DObject({
  id: orientation === 'x' ? graph.xAxisId : graph.yAxisId, graphId: graph.id, orientation,
  label: '', domain: orientation === 'x' ? graph.xDomain : graph.yDomain, tickStep: 1
}));
const curves: readonly Curve2DObject[] = (['x', 'y'] as const).map(axis => ({ id: entities[axis], type: 'curve-2d', graphId: functions.id,
  label: axis === 'x' ? 'cosine' : 'sine', equation: axis === 'x' ? 'cos(θ)' : 'sin(θ)', expression: expressions[axis], xDomain: functions.xDomain, sampleCount: 129 }));
export function graphAttributes(frame: CircleFrame) {
  const origin = projectGraphPoint(circle, { x: 0, y: 0 }), p = projectGraphPoint(circle, frame), foot = projectGraphPoint(circle, { x: frame.x, y: 0 });
  const fx = projectGraphPoint(functions, { x: frame.radians, y: frame.x }), fy = projectGraphPoint(functions, { x: frame.radians, y: frame.y });
  const line = (a: typeof origin, b: typeof origin) => ({ x1: String(a.x), y1: String(a.y), x2: String(b.x), y2: String(b.y) });
  const point = (p: typeof origin) => ({ cx: String(p.x), cy: String(p.y) });
  return { radius: line(origin, p), cosine: line(origin, foot), sine: line(foot, p), point: point(p),
    cursor: line({ x: fx.x, y: 0 }, { x: fx.x, y: functions.height }), 'cosine-marker': point(fx), 'sine-marker': point(fy) };
}
const attributes = (a: Record<string, string>) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
export function renderCircleGraphs(frame: CircleFrame) {
  const a = graphAttributes(frame), o = projectGraphPoint(circle, { x: 0, y: 0 }), unit = projectGraphPoint(circle, { x: 1, y: 0 });
  const c = renderGraphToSvg(axes(circle), circle).replace('</svg>', `
    <circle class="unit" cx="${o.x}" cy="${o.y}" r="${unit.x - o.x}"/>
    <line data-part="radius" ${attributes(a.radius)}/>
    <line data-part="cosine" data-entity="${entities.x}" ${attributes(a.cosine)}/>
    <line data-part="sine" data-entity="${entities.y}" ${attributes(a.sine)}/>
    <circle data-part="point" data-entity="${entities.point}" r="4" ${attributes(a.point)}/>
  </svg>`);
  const f = renderGraphToSvg([...axes(functions), ...curves], functions).replace('</svg>', `
    <line data-part="cursor" ${attributes(a.cursor)}/>
    <circle data-part="cosine-marker" data-entity="${entities.x}" r="4" ${attributes(a['cosine-marker'])}/>
    <rect data-part="sine-marker" data-entity="${entities.y}" x="${Number(a['sine-marker'].cx) - 4}" y="${Number(a['sine-marker'].cy) - 4}" width="8" height="8"/>
  </svg>`);
  return { circle: c, functions: f };
}
export function bindCircleGraphs(host: HTMLElement) {
  const ids = ['radius', 'cosine', 'sine', 'point', 'cursor', 'cosine-marker', 'sine-marker'] as const;
  const nodes = ids.map(id => { const node = host.querySelector<SVGElement>(`[data-part="${id}"]`); if (!node) throw new Error('Missing circle graph part: ' + id); return { id, node }; });
  return (frame: CircleFrame) => {
    const a = graphAttributes(frame);
    for (const { id, node } of nodes) {
      if (id === 'sine-marker') { node.setAttribute('x', String(Number(a[id].cx) - 4)); node.setAttribute('y', String(Number(a[id].cy) - 4)); }
      else for (const [key, value] of Object.entries(a[id])) node.setAttribute(key, value);
    }
    host.dataset['x'] = String(frame.x); host.dataset['y'] = String(frame.y);
    host.querySelector('[data-circle] svg')!.setAttribute('aria-label', `Unit circle at ${frame.angle} degrees: x ${frame.x.toFixed(3)}, y ${frame.y.toFixed(3)}.`);
  };
}
