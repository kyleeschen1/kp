import { createGraph2DObject, createAxis2DObject } from '../semantic/graph.ts';
import { projectGraphPoint } from '../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../rendering/graph-2d-svg.ts';
import type { Vector2 } from '../math-resources/public-api.ts';

export function mountMatrixGraph(host: HTMLElement, id: string) {
  // Equal units on both axes preserve the matrix's geometric meaning.
  const width = 320, height = 320;
  const svgNode = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
  let svg: SVGSVGElement | undefined;
  const vectors = (['result', 'input'] as const).map(role => {
    const line = svgNode('line'), dot = svgNode('circle');
    for (const node of [line, dot]) { node.classList.add('fn-matrix-vector'); node.dataset['role'] = role; node.setAttribute('clip-path', `url(#matrix-${id}-clip)`); }
    dot.setAttribute('r', role === 'input' ? '5' : '3'); return { role, line, dot };
  });
  return { update(extent: number, input: Vector2, result: Vector2) {
    const graph = createGraph2DObject({ id, label: `Input v (${input.join(', ')}); product Av (${result.join(', ')}). Range ±${extent}.`,
      xAxisId: `${id}-x`, yAxisId: `${id}-y`, xDomain: [-extent, extent], yDomain: [-extent, extent], width, height });
    if (!svg) {
      const axes = (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: `${id}-${orientation}`, graphId: id, orientation, label: orientation, domain: [-extent, extent], tickStep: 1 }));
      host.innerHTML = renderGraphToSvg(axes, graph).trim(); svg = host.querySelector<SVGSVGElement>('svg')!;
      svg.setAttribute('viewBox', '-12 -12 344 344');
      const defs = svgNode('defs'), clip = svgNode('clipPath'), rect = svgNode('rect'); clip.id = `matrix-${id}-clip`;
      rect.setAttribute('width', String(width)); rect.setAttribute('height', String(height)); clip.append(rect); defs.append(clip); svg.prepend(defs);
      for (const v of vectors) svg.append(v.line, v.dot);
      for (const label of svg.querySelectorAll('text')) {
        label.setAttribute('x', String(Math.min(width - 12, Math.max(8, Number(label.getAttribute('x'))))));
        label.setAttribute('y', String(Math.min(height - 8, Math.max(18, Number(label.getAttribute('y'))))));
      }
    }
    // Symmetric extents retain axis geometry; only domain-owned vector endpoints move.
    svg.setAttribute('aria-label', graph.label);
    const start = projectGraphPoint(graph, { x: 0, y: 0 });
    for (const v of vectors) {
      const value = v.role === 'input' ? input : result, end = projectGraphPoint(graph, { x: value[0], y: value[1] });
      for (const [key, number] of Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y })) v.line.setAttribute(key, String(number));
      v.dot.setAttribute('cx', String(end.x)); v.dot.setAttribute('cy', String(end.y));
      v.line.dataset['x'] = String(value[0]); v.line.dataset['y'] = String(value[1]);
    }
  }, dispose() { host.replaceChildren(); } };
}
