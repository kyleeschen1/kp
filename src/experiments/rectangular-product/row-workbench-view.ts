import { expressionToLatex } from '../../math/expression.ts';
import type { CheckedRowOperation, LinearSystem } from '../../math/linear-system-row-operation.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { prepareFusion } from '../dot-product-passage/fusion.ts';
import './row-workbench.css';

const ease = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * t * (t * (t * 6 - 15) + 10); };
const ink = (node: HTMLElement) => node.firstElementChild as HTMLElement;
const pose = (node: HTMLElement, x: number, y: number) => { node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; };
export interface RowWorkbenchLayout {
  readonly width: number; readonly height: number;
  readonly columns: readonly [number, number, number, number];
  readonly rows: readonly [number, number];
  readonly lanes: readonly [number, number];
  readonly equality: readonly [number, number];
  readonly unknowns: readonly (readonly [number, number])[];
  readonly brackets: readonly (readonly [number, number, number, number])[];
  readonly stroke: number;
  readonly copyClearance?: number;
}
const defaultLayout: RowWorkbenchLayout = {
  width: 580, height: 240, columns: [220, 310, 400, 90], rows: [75, 165], lanes: [123, 117], equality: [150, 120],
  unknowns: [[512, 60], [512, 120], [512, 180]], brackets: [[52, 46, 76, 148], [177, 46, 266, 148], [480, 30, 64, 180]], stroke: 1.4,
};
const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false });
const brackets = (left: number, top: number, width: number, height: number, stroke: number) => `<svg class="row-wb-bracket" style="left:${left}px;top:${top}px;stroke-width:${stroke}" width="${width}" height="${height}" aria-hidden="true"><path d="M10 2H2V${height - 2}H10 M${width - 10} 2H${width - 2}V${height - 2}H${width - 10}"/></svg>`;
export const rowWorkbenchStageHtml = (unknowns: readonly KpScalarValue[], layout: RowWorkbenchLayout = defaultLayout, interactive = true) => `<div class="row-wb-stage" style="width:${layout.width}px;min-width:${layout.width}px;height:${layout.height}px"><div aria-hidden="true">${layout.brackets.map(b => brackets(...b, layout.stroke)).join('')}<span class="row-wb-equal" style="left:${layout.equality[0]}px;top:${layout.equality[1]}px">${math('=')}</span><div data-native></div><div data-transient></div>${unknowns.map((v, i) => `<span class="row-wb-token" data-unknown="${v.id}" data-source-id="${v.id}" style="transform:translate(${layout.unknowns[i]![0]}px,${layout.unknowns[i]![1]}px) translate(-50%,-50%)">${math(expressionToLatex(v.expression))}</span>`).join('')}</div>${interactive ? [0, 1].map(row => `<button type="button" class="row-wb-row-select" data-matrix-row="${row}" aria-label="Select matrix row ${row + 1}" style="top:${layout.rows[row]}px">${row + 1}</button>`).join('') : ''}</div>`;

/** Persistent semantic occurrences stay mounted. Only changed values are retired;
 * the shared fusion sampler owns evaluation, not the transport carrier. */
export function mountRowWorkbenchView(root: HTMLElement, layout: RowWorkbenchLayout = defaultLayout) {
  const x = (column: number) => layout.columns[column]!, y = (row: number) => layout.rows[row]!;
  const stage = root.querySelector<HTMLElement>('.row-wb-stage')!;
  const native = stage.querySelector<HTMLElement>('[data-native]')!, transient = stage.querySelector<HTMLElement>('[data-transient]')!;
  // Equality is a persistent scene anchor, outside operation paint ownership.
  const passage = (frame: (progress: number) => void) => (progress: number) => {
    if (!Number.isFinite(progress)) throw new Error('Operation progress must be finite.');
    const p = Math.max(0, Math.min(1, progress));
    frame(Math.max(0, Math.min(1, (p - .06) / .88)));
    stage.dataset['progress'] = String(p);
  };
  const nodes = new Map<string, HTMLElement>();
  const token = (latex: string, parent: HTMLElement, id?: string) => {
    const node = document.createElement('span'); node.className = 'row-wb-token';
    node.innerHTML = `<span class="row-wb-ink">${math(latex)}</span>`;
    if (id) node.dataset['sourceId'] = id;
    parent.append(node); return node;
  };
  const reset = (node: HTMLElement) => { node.style.opacity = '1'; ink(node).style.cssText = ''; };
  const show = (system: LinearSystem) => {
    transient.replaceChildren(); stage.dataset['progress'] = '0';
    const retained = new Set<string>();
    system.coefficients.rows.forEach((row, r) => [...row, system.rhs[r]!].forEach((value, c) => {
      retained.add(value.id);
      let node = nodes.get(value.id);
      if (!node) { node = token(expressionToLatex(value.expression), native, value.id); nodes.set(value.id, node); }
      reset(node); node.dataset['row'] = String(r); node.dataset['column'] = String(c); pose(node, x(c), y(r));
    }));
    for (const [id, node] of nodes) if (!retained.has(id)) { node.remove(); nodes.delete(id); }
  };
  const prepare = (step: CheckedRowOperation) => {
    show(step.before);
    const op = step.operation;
    if (op.kind === 'swap') {
      const rows = [op.first, op.second].map(row => [...step.before.coefficients.rows[row]!, step.before.rhs[row]!].map(value => nodes.get(value.id)!));
      return passage((progress: number) => {
        const p = ease(progress); stage.dataset['progress'] = String(progress);
        rows.forEach((row, i) => row.forEach((node, c) => pose(node, x(c) + (i ? -1 : 1) * 28 * Math.sin(p * Math.PI),
          y(i ? op.second : op.first) * (1 - p) + y(i ? op.first : op.second) * p)));
      });
    }
    const targetRow = op.kind === 'add' ? op.targetRow : op.row;
    const unitAddition = op.kind === 'add' && op.factor.numerator === op.factor.denominator;
    // Preserve the arithmetic lane's clearance for fractions and the plus sign;
    // compact the rest of the grid without expanding it during an operation.
    const targetY = y(targetRow), laneY = layout.lanes[targetRow]!;
    const entries = step.contributions.map(p => {
      const target = nodes.get(p.target.id)!, cx = x(p.column);
      const copy = op.kind === 'add' ? token(expressionToLatex(p.source.expression), transient, p.source.id) : target;
      const factor = token(`(${expressionToLatex(p.multiplier.expression)})`, transient), dot = token('\\cdot', transient);
      const scaled = token(expressionToLatex(p.scaled.expression), transient, p.scaled.id);
      const result = token(expressionToLatex(p.result.expression), transient, p.result.id);
      const plus = token('+', transient);
      const productY = op.kind === 'add' ? laneY : targetY;
      pose(copy, cx + 24, productY); pose(factor, cx - 24, productY); pose(dot, cx, productY); pose(scaled, cx, productY);
      pose(result, cx, targetY); pose(plus, cx, (laneY + targetY) / 2);
      const multiply = prepareFusion(stage, [ink(factor), ink(copy)], [ink(dot)], ink(op.kind === 'add' ? scaled : result));
      if (unitAddition) pose(copy, cx, laneY);
      const add = op.kind === 'add' ? prepareFusion(stage, [ink(target), ink(unitAddition ? copy : scaled)], [ink(plus)], ink(result)) : undefined;
      return { target, copy, factor, dot, scaled, result, plus, multiply, add, cx };
    });
    return passage((progress: number) => {
      stage.dataset['progress'] = String(progress);
      for (const e of entries) {
        const { copy, factor, dot, scaled, plus, multiply, add, cx } = e;
        // Reset both fusion layers before sampling: seeking backward must not
        // inherit styles from the later arithmetic operation.
        for (const node of [e.target, copy, factor, dot, scaled, e.result, plus]) reset(node);
        if (op.kind === 'add' && unitAddition) {
          const travel = ease(progress / .3), presence = ease((progress - .3) / .15);
          // An outward lane may cross the receiving row. The layout supplies
          // clearance only for that crossing; the ordinary compact path is direct.
          pose(copy, cx + (layout.copyClearance ?? 0) * Math.sin(Math.PI * travel), y(op.sourceRow) * (1 - travel) + laneY * travel);
          copy.style.opacity = progress === 0 ? '0' : '1';
          add!(ease((progress - .48) / .49));
          factor.style.opacity = dot.style.opacity = scaled.style.opacity = '0';
          plus.style.opacity = String(presence);
          if (progress < .48) ink(plus).style.transform = `scale(${presence})`;
        } else if (op.kind === 'add') {
          const travel = ease(progress / .24), open = ease((progress - .2) / .12);
          pose(copy, cx + 24 * open, y(op.sourceRow) * (1 - travel) + laneY * travel);
          copy.style.opacity = progress === 0 ? '0' : '1';
          multiply(ease((progress - .34) / .23));
          factor.style.opacity = dot.style.opacity = String(open);
          if (progress < .34) { ink(factor).style.transform = ink(dot).style.transform = `scale(${open})`; }
          const plusPresence = ease((progress - .57) / .12);
          plus.style.opacity = String(plusPresence);
          if (progress < .69) ink(plus).style.transform = `scale(${plusPresence})`;
          if (progress >= .57) add!(ease((progress - .7) / .28));
          else ink(e.result).style.opacity = '0';
        } else {
          const open = ease(progress / .22);
          pose(copy, cx + 24 * open, targetY);
          multiply(ease((progress - .3) / .65));
          factor.style.opacity = dot.style.opacity = String(open);
          if (progress < .3) ink(factor).style.transform = ink(dot).style.transform = `scale(${open})`;
          scaled.style.opacity = plus.style.opacity = '0';
        }
      }
    });
  };
  return { show, prepare, dispose() { nodes.clear(); transient.replaceChildren(); } };
}
