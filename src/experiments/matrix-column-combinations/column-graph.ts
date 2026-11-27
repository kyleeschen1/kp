import { createGraph2DObject, createAxis2DObject } from '../../semantic/graph.ts';
import { projectGraphPoint } from '../../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../../rendering/graph-2d-svg.ts';
import { sampleColumnGeometry, type PreparedColumnGeometry, type ColumnPoint } from './column-geometry.ts';

/** A paint-only observer of the equation player's frame. Domain values and
 * framing are prepared once; there are no layout reads or clocks while drawing. */
export function mountColumnGraph(host: HTMLElement, source: PreparedColumnGeometry, id: string) {
  const doc = host.ownerDocument;
  const element = doc.createElement('figure'); element.className = 'reference-geometry';
  const graph = createGraph2DObject({ id, label: 'Matrix columns and their weighted sum',
    xAxisId: `${id}-x`, yAxisId: `${id}-y`, xDomain: source.domain, yDomain: source.domain, width: 320, height: 320 });
  const axes = (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: `${id}-${orientation}`,
    graphId: id, orientation, label: orientation, domain: source.domain, tickStep: Math.max(1, Math.ceil(source.domain[1] / 3)) }));
  element.innerHTML = renderGraphToSvg(axes, graph);
  const svg = element.querySelector('svg')!; svg.setAttribute('viewBox', '-18 -18 356 356');
  const svgNode = <K extends keyof SVGElementTagNameMap>(tag: K) => doc.createElementNS('http://www.w3.org/2000/svg', tag);
  const vector = (entity: string, term?: number) => {
    const group = svgNode('g'), line = svgNode('line'), arrow = svgNode('path'), zero = svgNode('circle');
    group.dataset['entityId'] = entity;
    for (const node of [line, arrow, zero]) {
      node.classList.add('reference-vector');
      if (term !== undefined) node.dataset['term'] = String(term); else node.dataset['role'] = 'result';
    }
    zero.setAttribute('r', '3'); group.append(line, arrow, zero); svg.append(group);
    return { group, line, arrow, zero };
  };
  // The resultant is supporting evidence under the two persistent contributions.
  const result = vector(source.result.id), terms = source.terms.map(term => vector(term.columnId, term.index));
  const caption = doc.createElement('figcaption'), heading = doc.createElement('span'), legend = doc.createElement('ul');
  const format = (point: ColumnPoint) => `(${point.map(value => Number(value.toPrecision(6))).join(', ')})`;
  for (const term of source.terms) {
    const item = doc.createElement('li'); item.dataset['term'] = String(term.index);
    item.textContent = `Column ${term.index + 1}: ${format(term.column)} × ${term.weight} → ${format(term.contribution)}${term.index === 1 ? ' · dashed' : ' · solid'}`;
    legend.append(item);
  }
  const total = doc.createElement('p'); total.dataset['resultLabel'] = '';
  total.textContent = `Sum: ${format(source.result.value)}`;
  caption.append(heading, legend, total); element.append(caption); host.append(element);
  let disposed = false, lastBeat = '';
  const draw = (owner: ReturnType<typeof vector>, start: ColumnPoint, end: ColumnPoint) => {
    const a = projectGraphPoint(graph, { x: start[0], y: start[1] }), b = projectGraphPoint(graph, { x: end[0], y: end[1] });
    for (const [key, value] of Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })) owner.line.setAttribute(key, String(value));
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const size = Math.min(7, length / 3), ux = length ? dx / length : 0, uy = length ? dy / length : 0;
    owner.arrow.setAttribute('d', `M ${b.x - ux * size - uy * size / 2} ${b.y - uy * size + ux * size / 2} L ${b.x} ${b.y} L ${b.x - ux * size + uy * size / 2} ${b.y - uy * size - ux * size / 2}`);
    owner.zero.setAttribute('cx', String(b.x)); owner.zero.setAttribute('cy', String(b.y));
    owner.zero.style.display = length === 0 ? '' : 'none';
    owner.group.dataset['start'] = start.join(','); owner.group.dataset['end'] = end.join(',');
  };
  return {
    render(progress: number) {
      if (disposed) return;
      const frame = sampleColumnGeometry(source, progress);
      element.dataset['progress'] = String(frame.progress); element.dataset['milestone'] = frame.beatId;
      for (const [index, term] of frame.terms.entries()) {
        const owner = terms[index]!; draw(owner, term.start, term.end);
        owner.group.dataset['coefficientId'] = term.coefficientId;
        owner.group.dataset['role'] = term.role;
      }
      draw(result, frame.result.start, frame.result.end);
      result.group.style.display = frame.result.visible ? '' : 'none';
      if (lastBeat !== frame.beatId) {
        heading.textContent = frame.index < 4 ? 'The columns supply the directions.' : frame.index === 4 ? 'Each weight scales its column.' : 'Place the weighted columns head to tail.';
        svg.setAttribute('aria-label', `${heading.textContent} ${legend.textContent} ${total.textContent}`);
        lastBeat = frame.beatId;
      }
    },
    dispose() { if (disposed) return; disposed = true; element.remove(); }
  };
}
