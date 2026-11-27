import { createGraph2DObject, createAxis2DObject } from '../semantic/graph.ts';
import { projectGraphPoint } from '../rendering/graph-2d-scene.ts';
import { renderGraphToSvg } from '../rendering/graph-2d-svg.ts';
import type { KpVectorDotProjectionSemanticModel } from '../animation/vector-dot-projection-semantic-model.ts';
import type { sampleDotProjectionModel } from '../animation/dot-projection-model-frame.ts';
import type { KpVector2 } from '../animation/vector-dot-projection-exemplar-contract.ts';

/** Coordinates come only from the prepared semantic model and its sampler.
 * Equal scales preserve angles; framing includes all endpoints before motion. */
export function mountProjectionGraph(host: HTMLElement, model: KpVectorDotProjectionSemanticModel) {
  const extent = Math.max(1, ...[model.sourceVector, model.targetVector, model.projectionVector].flatMap(p => p.map(Math.abs))) * 1.3;
  const domain: readonly [number, number] = [-extent, extent];
  const graph = createGraph2DObject({ id: 'projection.graph', label: 'Projection and perpendicular remainder',
    xAxisId: 'projection.x', yAxisId: 'projection.y', xDomain: domain, yDomain: domain, width: 320, height: 320 });
  const axes = (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: `projection.${orientation}`,
    graphId: graph.id, orientation, label: orientation, domain, tickStep: Math.max(1, Math.ceil(extent / 3)) }));
  host.innerHTML = renderGraphToSvg(axes, graph);
  const svg = host.querySelector('svg')!; svg.setAttribute('viewBox', '-18 -18 356 356');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', model.accessibleDescription);
  const node = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
  const project = (p: KpVector2) => projectGraphPoint(graph, { x: p[0], y: p[1] });
  const line = (role: string, entity: string) => {
    const group = node('g'), body = node('line'), arrow = node('path'), zero = node('circle');
    group.dataset['role'] = role; group.dataset['entityId'] = entity; zero.setAttribute('r', '3');
    group.append(body, arrow, zero); svg.append(group);
    return { group, draw(a: KpVector2, b: KpVector2) {
      const start = project(a), end = project(b), dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy);
      for (const [key, value] of Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y })) body.setAttribute(key, String(value));
      const size = Math.min(7, length / 3), ux = length ? dx / length : 0, uy = length ? dy / length : 0;
      arrow.setAttribute('d', `M ${end.x - ux * size - uy * size / 2} ${end.y - uy * size + ux * size / 2} L ${end.x} ${end.y} L ${end.x - ux * size + uy * size / 2} ${end.y - uy * size - ux * size / 2}`);
      zero.setAttribute('cx', String(end.x)); zero.setAttribute('cy', String(end.y)); zero.style.display = length === 0 ? '' : 'none';
      group.dataset['start'] = a.join(','); group.dataset['end'] = b.join(',');
    } };
  };
  const maxB = Math.max(...model.targetVector.map(Math.abs));
  const guide = line('guide', model.targetVectorId);
  const gx = model.targetVector[0] / maxB * extent, gy = model.targetVector[1] / maxB * extent;
  guide.draw([-gx, -gy], [gx, gy]);
  const target = line('target', model.targetVectorId), source = line('source', model.sourceVectorId);
  target.draw([0, 0], model.targetVector); source.draw([0, 0], model.sourceVector);
  const parallel = line('parallel', model.projectionVectorId), residual = line('residual', model.residualVectorId);
  parallel.draw([0, 0], model.projectionVector);
  // The target shares a line with its multiple. Keep its dashed segment and
  // arrow above the projection so the direction remains identifiable.
  svg.append(target.group);
  const drop = node('circle'); drop.dataset['role'] = 'drop'; drop.setAttribute('r', '3'); svg.append(drop);
  const dropGuide = node('line'); dropGuide.dataset['role'] = 'drop-guide'; svg.append(dropGuide);
  const rightAngle = node('path'); rightAngle.dataset['role'] = 'right-angle'; svg.append(rightAngle);
  // A screen-sized witness is geometry decoration, never proof of orthogonality.
  const p = project(model.projectionVector), a = project(model.sourceVector), b = project(model.targetVector), o = project([0, 0]);
  const rx = a.x - p.x, ry = a.y - p.y, bx = b.x - o.x, by = b.y - o.y;
  const rlen = Math.hypot(rx, ry), blen = Math.hypot(bx, by), size = Math.min(8, rlen / 3, blen / 3);
  if (rlen && blen) rightAngle.setAttribute('d', `M ${p.x + rx / rlen * size} ${p.y + ry / rlen * size} l ${bx / blen * size} ${by / blen * size} l ${-rx / rlen * size} ${-ry / rlen * size}`);
  let disposed = false;
  return {
    render(frame: ReturnType<typeof sampleDotProjectionModel>) {
      if (disposed) return;
      parallel.group.style.display = frame.projectionDropProgress === 1 ? '' : 'none';
      residual.group.style.display = frame.residualRevealProgress > 0 ? '' : 'none';
      const t = frame.residualRevealProgress;
      const residualEnd: KpVector2 = t === 1 ? model.sourceVector :
        [model.projectionVector[0] + model.residualVector[0] * t, model.projectionVector[1] + model.residualVector[1] * t];
      residual.draw(model.projectionVector, residualEnd);
      // The dropped segment remains readable at a stopped/reduced-motion beat.
      // As the residual grows, guide and vector own disjoint portions of it.
      const guideEnd = project(frame.projectionDropProgress < 1 ? frame.dropPoint : residualEnd);
      for (const [key, value] of Object.entries({ x1: a.x, y1: a.y, x2: guideEnd.x, y2: guideEnd.y })) dropGuide.setAttribute(key, String(value));
      dropGuide.style.display = frame.graphProgress >= 5 / 8 && t < 1 ? '' : 'none';
      const point = project(frame.dropPoint); drop.setAttribute('cx', String(point.x)); drop.setAttribute('cy', String(point.y));
      drop.style.display = frame.graphProgress >= 5 / 8 && frame.projectionDropProgress < 1 ? '' : 'none';
      drop.dataset['point'] = frame.dropPoint.join(',');
      rightAngle.style.display = frame.rightAngleVisible && size > 0 ? '' : 'none';
      host.dataset['beat'] = frame.semanticBeatId;
    },
    dispose() { if (disposed) return; disposed = true; svg.remove(); }
  };
}
