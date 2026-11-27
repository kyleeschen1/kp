import { createGraph2DObject, createAxis2DObject } from '../../semantic/graph.ts';
import { projectGraphPoint } from '../../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../../rendering/graph-2d-svg.ts';
import type { Point, CompositionModel } from './model.ts';

/** Fixed common framing makes both orders comparable. SVG only paints the
 * sampled images; it does not evaluate transformations or signed area. */
export function mountCompositionGraph(host: HTMLElement, model: CompositionModel, id: string) {
  const graph = createGraph2DObject({ id, label: 'Ordered image of the unit square',
    xAxisId: `${id}.x`, yAxisId: `${id}.y`, xDomain: model.xDomain, yDomain: model.yDomain, width: 280, height: 280 });
  const axes = (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: `${id}.${orientation}`,
    graphId: id, orientation, label: orientation, domain: orientation === 'x' ? model.xDomain : model.yDomain,
    tickStep: Math.max(1, Math.ceil((model.xDomain[1] - model.xDomain[0]) / 6)) }));
  host.innerHTML = renderGraphToSvg(axes, graph);
  const svg = host.querySelector('svg')!; svg.setAttribute('viewBox', '-18 -18 316 316');
  svg.setAttribute('role', 'img');
  const node = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
  const project = (p: Point) => projectGraphPoint(graph, { x: p[0], y: p[1] });
  const polygon = (role: string) => { const p = node('polygon'); p.dataset['role'] = role; svg.append(p); return p; };
  const points = (values: readonly Point[]) => values.map(p => { const v = project(p); return `${v.x},${v.y}`; }).join(' ');
  const unit = polygon('unit'); unit.setAttribute('points', points(model.unit.corners));
  const shape = polygon('image'); shape.dataset['entityId'] = `${id}.square`;
  const basis = [0, 1].map(i => {
    const path = node('path'); path.dataset['role'] = `basis-${i + 1}`; path.dataset['entityId'] = `${id}.e${i + 1}`; svg.append(path); return path;
  });
  const corner = node('circle'); corner.setAttribute('r', '3'); corner.dataset['role'] = 'corner'; svg.append(corner);
  let disposed = false;
  return {
    render(values: readonly Point[], description: string) {
      if (disposed) return;
      shape.setAttribute('points', points(values)); shape.dataset['corners'] = JSON.stringify(values);
      svg.setAttribute('aria-label', description);
      for (const [i, index] of [1, 3].entries()) {
        const a = project(values[0]!), b = project(values[index]!);
        const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), size = Math.min(6, length / 3);
        const ux = length ? dx / length : 0, uy = length ? dy / length : 0;
        basis[i]!.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y} M ${b.x - ux * size - uy * size / 2} ${b.y - uy * size + ux * size / 2} L ${b.x} ${b.y} L ${b.x - ux * size + uy * size / 2} ${b.y - uy * size - ux * size / 2}`);
      }
      const p = project(values[2]!); corner.setAttribute('cx', String(p.x)); corner.setAttribute('cy', String(p.y));
    },
    dispose() { disposed = true; svg.remove(); },
  };
}
