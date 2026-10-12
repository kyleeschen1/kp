import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { expressionToLatex } from '../../math/expression.ts';
import { prepareFusion } from '../dot-product-passage/fusion.ts';
import { mountPolynomialView, polynomialHtml } from './polynomial-view.ts';
import { rowOperation, rowOperationBase, sampleRowOperation } from './row-operation-model.ts';
import './row-operation.css';
export { rowOperationBeats, rowOperationDurationMs, rowOperationReading, sampleRowOperation } from './row-operation-model.ts';

const math = (value: string) => renderLatexToHtml(value, { displayMode: false });
const part = (role: string, id: string, value: string) => `<span class="poly-token" data-row-operation="${role}" data-source-id="${id}">${math(value)}</span>`;
export function rowOperationHtml() {
  return `<div class="row-operation-stage" aria-hidden="true">${polynomialHtml(rowOperationBase)}
    ${rowOperation.contributions.map((p, c) => part(`copy-${c}`, p.source.id, expressionToLatex(p.source.expression)) +
      part(`plus-${c}`, rowOperation.id, '+') + part(`result-${c}`, p.result.id, expressionToLatex(p.result.expression))).join('')}
    ${part('operation', rowOperation.id, 'R_1\\leftarrow R_1+R_2')}
    ${part('inverse', `${rowOperation.id}.inverse`, "R_1=R_1'-R_2")}
  </div>`;
}
const ease = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One opt-in exemplar: collection owns the native matrix, the existing fusion
 * motif owns arithmetic, and this adapter only stages the whole-row transfer. */
export function mountRowOperationView(root: HTMLElement) {
  const base = mountPolynomialView(root, rowOperationBase);
  const stage = root.querySelector<HTMLElement>('.row-operation-stage')!;
  const node = (role: string) => stage.querySelector<HTMLElement>(`[data-row-operation="${role}"]`)!;
  const original = (r: number, c: number) => stage.querySelector<HTMLElement>(`[data-poly="${c === rowOperationBase.inputs.length ? `name-${r}` : `coefficient-${r}-${c}`}"]`)!;
  const ink = (n: HTMLElement) => n.querySelector<HTMLElement>('.katex')!;
  // The collection's -1 has separate minus/unit spans. Keep the complete
  // coefficient as one contributor so its sign cannot fuse independently.
  const targetInk = rowOperation.contributions.map((_, c) => {
    const target = original(rowOperation.targetRow, c), wrapper = document.createElement('span');
    wrapper.className = 'row-operation-ink';
    wrapper.append(...target.childNodes); target.append(wrapper); return wrapper;
  });
  const pose = (n: HTMLElement, x: number, y: number) => { n.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; };
  let disposed = false;
  let entries: { target: HTMLElement; copy: HTMLElement; plus: HTMLElement; result: HTMLElement; x: number; targetY: number; sourceY: number; fuse: (p: number) => void }[] = [];
  const prepare = () => {
    if (disposed) return;
    for (const n of stage.querySelectorAll<HTMLElement>('[data-row-operation] .katex, .row-operation-ink')) {
      n.style.transform = ''; n.style.opacity = '1'; n.style.clipPath = '';
    }
    base.prepare(); base.render(1);
    const bounds = stage.getBoundingClientRect();
    entries = rowOperation.contributions.map((_, c) => {
      const target = original(rowOperation.targetRow, c), source = original(rowOperation.sourceRow, c);
      const b = target.getBoundingClientRect(), s = source.getBoundingClientRect();
      const x = b.x - bounds.x + b.width / 2, targetY = b.y - bounds.y + b.height / 2, sourceY = s.y - bounds.y + s.height / 2;
      const copy = node(`copy-${c}`), plus = node(`plus-${c}`), result = node(`result-${c}`);
      pose(target, x, 88); pose(copy, x, 144); pose(plus, x, 116); pose(result, x, 88);
      const fuse = prepareFusion(stage, [targetInk[c]!, ink(copy)], [ink(plus)], ink(result));
      return { target, copy, plus, result, x, targetY, sourceY, fuse };
    });
  };
  const render = (progress: number) => {
    if (disposed) return;
    const { phase } = sampleRowOperation(progress); stage.dataset['phase'] = String(phase);
    base.render(1);
    const lift = ease(phase - 1), evaluate = ease((phase - 3) / .85), settle = ease((phase - 4) / .85);
    for (const entry of entries) {
      const { target, copy, plus, result, x, targetY, sourceY, fuse } = entry;
      pose(target, x, mix(targetY, 88, lift));
      pose(copy, x, mix(sourceY, 144, lift));
      pose(result, x, mix(88, targetY, settle));
      copy.style.opacity = phase > 1 && phase < 4 ? '1' : '0';
      // The copy shares its source position only at the branching endpoint;
      // there is never an extra stationary owner of the same glyph there.
      fuse(evaluate);
      const plusPresence = ease((phase - 2) / .65);
      plus.style.opacity = String(plusPresence);
      if (phase < 3) ink(plus).style.transform = `scale(${plusPresence})`;
    }
    // During work, the equation is intentionally incomplete. Restore its
    // equality only after the new row occupies every native destination.
    stage.querySelector<HTMLElement>('[data-poly="equals-0"]')!.style.opacity = String(1 - ease((phase - 1) / .2) + ease((phase - 4.85) / .15));
    const op = node('operation'), inverse = node('inverse');
    pose(op, 310, 35); op.style.opacity = String(ease(phase / .65)); ink(op).style.transform = `scale(${mix(.85, 1, ease(phase / .65))})`;
    pose(inverse, 310, 345); inverse.style.opacity = String(ease((phase - 5) / .65)); ink(inverse).style.transform = `scale(${mix(.85, 1, ease((phase - 5) / .65))})`;
  };
  prepare();
  return { prepare, render, dispose() { if (disposed) return; disposed = true; entries = []; base.dispose(); } };
}
