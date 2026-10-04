import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { cloneElementWithComputedStyles, stripKpMaterialCloneAuthority, makeKpMaterialOwnerInert } from '../../rendering/computed-style-clone.ts';
import type { KpTypedMatrix } from '../../math/typed-semantic-math.ts';
import { stageHtml, signedToken } from '../dot-product-passage/presentation.ts';
import { prepareFusion } from '../dot-product-passage/fusion.ts';
import { samplePouring, type PouringModel } from './pouring-model.ts';
import './pouring.css';

const math = (latex: string) => renderLatexToHtml(latex, { trust: true, displayMode: false });
export const matrixLatex = (matrix: KpTypedMatrix, label?: string) => `\\begin{bmatrix}${matrix.rows.map((row, i) => row.map((entry, j) => label
  ? `\\htmlData{pour-entry=${label}-${i}-${j}}{${signedToken(entry)}}` : signedToken(entry)).join('&')).join('\\\\')}\\end{bmatrix}`;
export function pouringHtml(model: PouringModel) {
  const { product } = model;
  const matrix = (value: KpTypedMatrix, label: string) => `<span class="pour-matrix" data-matrix="${label}">${math(matrixLatex(value, label))}<span class="pour-name">${math(label)}</span></span>`;
  return `<div class="pour-stage" aria-hidden="true"><div class="pour-equation">${matrix(product.result, 'C')}${math('=')}${matrix(product.left, 'B')}${math('\\cdot')}${matrix(product.right, 'A')}</div>
    ${model.columns.map((column, c) => column.map((passage, r) => `<div class="pour-row" data-column="${c}" data-row="${r}">${stageHtml(passage)}</div>`).join('')).join('')}
    <div class="pour-collection">${math(matrixLatex(product.result, 'collected'))}</div><div class="pour-material"></div></div>`;
}
interface Point { x: number; y: number }
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = clamp(x); return t * t * t * (10 + t * (-15 + 6 * t)); };
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const at = (node: HTMLElement, point: Point) => { node.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`; };

export function mountPouringView(root: HTMLElement, model: PouringModel) {
  const stage = root.querySelector<HTMLElement>('.pour-stage')!;
  const layer = stage.querySelector<HTMLElement>('.pour-material')!;
  const collection = stage.querySelector<HTMLElement>('.pour-collection')!;
  const entry = (key: string) => {
    const node = stage.querySelector<HTMLElement>(`[data-pour-entry="${key}"]`);
    if (!node) throw new Error(`Missing pouring endpoint ${key}`);
    return node;
  };
  for (const [label, matrix] of [['B', model.product.left], ['A', model.product.right], ['C', model.product.result], ['collected', model.product.result]] as const)
    matrix.rows.forEach((row, r) => row.forEach((value, c) => { entry(`${label}-${r}-${c}`).dataset['sourceId'] = value.id; }));
  const rows = model.columns.flatMap((column, c) => column.map((passage, r) => {
    const container = stage.querySelector<HTMLElement>(`.pour-row[data-column="${c}"][data-row="${r}"]`)!;
    const native = (key: string) => container.querySelector<HTMLElement>(`[data-kp-dot-key="${key}"]`)!;
    passage.dot.pairs.forEach(pair => {
      native(`pair-left-${pair.index}`).dataset['sourceId'] = pair.left.id;
      native(`pair-right-${pair.index}`).dataset['sourceId'] = pair.right.id;
      native(`product-${pair.index}`).dataset['sourceId'] = pair.product.id;
    });
    native('sum').dataset['sourceId'] = passage.dot.result.id;
    return { c, r, passage, container, native, multiply: [] as ((p: number) => void)[], add: (_p: number) => {} };
  }));
  let copies: { node: HTMLElement; c: number; r: number; k: number; side: 'left' | 'right'; start: Point; end: Point }[] = [];
  let points = new Map<HTMLElement, Point>();
  let assembly = { x: 0, y: 0 };
  let disposed = false;
  let brackets: { node: HTMLElement; side: number; start: Point; opened: Point; closed: Point; dock: Point }[] = [];
  const reset = () => {
    for (const node of stage.querySelectorAll<HTMLElement>('.pour-row, [data-kp-dot-key], .dot-plus, .dot-pairs, .dot-products, .dot-sum, [data-pour-entry], .pour-collection, .pour-collection .mopen, .pour-collection .mclose')) {
      node.style.opacity = '1'; node.style.transform = ''; node.style.clipPath = '';
    }
  };
  const prepare = () => {
    if (disposed) return;
    reset(); copies.forEach(copy => copy.node.remove()); brackets.forEach(bracket => bracket.node.remove());
    copies = []; brackets = []; points = new Map();
    const bounds = stage.getBoundingClientRect();
    const point = (node: HTMLElement) => {
      const b = node.getBoundingClientRect(); const p = { x: b.x - bounds.x + b.width / 2, y: b.y - bounds.y + b.height / 2 }; points.set(node, p); return p;
    };
    // A component's vertical lane must not drift when a different receiving
    // coefficient has a minus sign or a wider glyph. Share measured slot widths
    // across rows and both input columns, while leaving the glyphs unscaled.
    for (const side of ['left', 'right']) {
      const operands = rows.flatMap(row => row.passage.dot.pairs.map(pair => row.native(`pair-${side}-${pair.index}`)));
      operands.forEach(node => { node.style.width = ''; });
      const width = Math.max(...operands.map(node => node.getBoundingClientRect().width));
      operands.forEach(node => { node.style.width = `${width}px`; node.style.textAlign = 'center'; });
    }
    // Translate the source grid as a block: row spacing is measured from B,
    // never chosen independently for the working rows or output collection.
    const descent = 125;
    for (const row of rows) {
      row.container.style.top = '0px';
      const offset = point(row.native('pair-left-0')).y;
      row.container.style.top = `${point(entry(`B-${row.r}-0`)).y + descent - offset}px`;
    }
    const firstRow = rows[0]!;
    const leftEdge = firstRow.container.querySelector<HTMLElement>('.dot-pairs .dot-term')!.getBoundingClientRect().left - bounds.left;
    collection.style.left = `${leftEdge - collection.getBoundingClientRect().width - 30}px`;
    collection.style.top = '0px';
    collection.style.top = `${point(firstRow.native('sum')).y - point(entry('collected-0-0')).y}px`;
    // Prepare all native geometry before hiding inactive columns. Layout is
    // immutable during playback; every seek projects from these same endpoints.
    for (const row of rows) {
      for (const pair of row.passage.dot.pairs) {
        const width = row.container.querySelector<HTMLElement>(`[data-pair="${pair.index}"]`)!.getBoundingClientRect().width;
        row.container.querySelector<HTMLElement>(`[data-product="${pair.index}"]`)!.style.width = `${width}px`;
      }
      row.multiply = row.passage.dot.pairs.map(pair => prepareFusion(stage,
        [row.native(`pair-left-${pair.index}`), row.native(`pair-right-${pair.index}`)],
        [row.native(`syntax-multiply-${pair.index}`)], row.native(`product-${pair.index}`),
        [row.native(`syntax-open-${pair.index}`), row.native(`syntax-close-${pair.index}`)]));
      row.add = prepareFusion(stage, row.passage.dot.pairs.map(pair => row.native(`product-${pair.index}`)),
        [...row.container.querySelectorAll<HTMLElement>('.dot-products .dot-plus')], row.native('sum'));
      point(row.native('sum')); point(entry(`collected-${row.r}-${row.c}`));
      for (const pair of row.passage.dot.pairs) for (const side of ['left', 'right'] as const) {
        const native = row.native(`pair-${side}-${pair.index}`);
        const ink = cloneElementWithComputedStyles(native); stripKpMaterialCloneAuthority(ink);
        const node = document.createElement('span'); node.className = 'pour-ink';
        node.dataset['sourceId'] = pair[side].id; node.dataset['occurrence'] = `${row.c}-${row.r}-${side}-${pair.index}`;
        node.dataset['resultId'] = row.passage.dot.result.id;
        node.append(ink); makeKpMaterialOwnerInert(node); layer.append(node);
        copies.push({ node, c: row.c, r: row.r, k: pair.index, side,
          start: point(entry(side === 'left' ? `B-${row.r}-${pair.index}` : `A-${pair.index}-${row.c}`)), end: point(native) });
      }
    }
    const a = collection.querySelector<HTMLElement>('.katex')!.getBoundingClientRect();
    const b = stage.querySelector<HTMLElement>('[data-matrix="C"] > .katex')!.getBoundingClientRect();
    assembly = { x: b.x - a.x, y: b.y - a.y };
    const terms = [...firstRow.container.querySelectorAll<HTMLElement>('.dot-pairs .dot-term')];
    const rightEdge = terms.at(-1)!.getBoundingClientRect().right - bounds.left;
    const sumCenter = point(firstRow.native('sum')).x;
    const sumWidth = Math.max(...rows.map(row => row.native('sum').getBoundingClientRect().width));
    for (const [side, selector] of [[-1, '.mopen'], [1, '.mclose']] as const) {
      const source = stage.querySelector<HTMLElement>(`[data-matrix="B"] > .katex .katex-html ${selector}`)!;
      const destination = collection.querySelector<HTMLElement>(`.katex-html ${selector}`)!;
      const ink = cloneElementWithComputedStyles(source); stripKpMaterialCloneAuthority(ink);
      const node = document.createElement('span'); node.className = 'pour-ink pour-working-bracket';
      node.dataset['matrixSourceId'] = model.product.left.id; node.dataset['side'] = String(side);
      node.append(ink); makeKpMaterialOwnerInert(node); layer.append(node);
      const start = point(source), y = start.y + descent;
      brackets.push({ node, side, start, opened: { x: side < 0 ? leftEdge - 8 : rightEdge + 8, y },
        closed: { x: sumCenter + side * (sumWidth / 2 + 9), y }, dock: point(destination) });
    }
  };
  const render = (progress: number) => {
    if (disposed) return;
    reset(); const { phase } = samplePouring(progress);
    stage.dataset['phase'] = String(phase);
    const assemblyT = ease((phase - 16) / .85);
    collection.style.transform = `translate(${assembly.x * assemblyT}px, ${assembly.y * assemblyT}px)`;
    collection.style.opacity = phase >= 17 ? '0' : '1';
    for (const node of collection.querySelectorAll<HTMLElement>('.katex-html .mopen, .katex-html .mclose')) {
      node.style.opacity = phase >= 8 ? '1' : '0';
    }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      entry(`C-${r}-${c}`).style.opacity = phase >= 17 ? '1' : '0';
      entry(`collected-${r}-${c}`).style.opacity = phase >= 8 + c * 8 ? '1' : '0';
    }
    for (const row of rows) {
      const q = phase - row.c * 8;
      row.container.style.opacity = q > 0 && q < 8 ? '1' : '0';
      const pairGroup = row.container.querySelector<HTMLElement>('.dot-pairs')!;
      const productGroup = row.container.querySelector<HTMLElement>('.dot-products')!;
      const sumGroup = row.container.querySelector<HTMLElement>('.dot-sum')!;
      pairGroup.style.opacity = q < 5 ? '1' : '0';
      productGroup.style.opacity = q >= 4 && q < 7 ? '1' : '0';
      sumGroup.style.opacity = q >= 6 ? '1' : '0';
      row.multiply.forEach(apply => apply(ease((q - 4.3) / .55)));
      if (q >= 6) row.add(ease((q - 6) / .85));
      for (const node of row.container.querySelectorAll<HTMLElement>('.dot-pairs .dot-plus')) node.style.opacity = '0';
      for (const node of row.container.querySelectorAll<HTMLElement>('.dot-products .dot-plus')) {
        if (q < 6) { const t = ease((q - 5) / .6); node.style.opacity = String(t); node.style.transform = `scale(${t})`; }
      }
      for (const pair of row.passage.dot.pairs) {
        if (q < 1) row.native(`pair-left-${pair.index}`).style.opacity = '0';
        if (q < (row.r === 0 ? 3 : 4)) row.native(`pair-right-${pair.index}`).style.opacity = '0';
        if (q < 4.3) for (const part of ['open', 'multiply', 'close']) {
          const t = ease((q - 4) / .22); const node = row.native(`syntax-${part}-${pair.index}`);
          node.style.opacity = String(t); node.style.transform = `scale(${t})`;
        }
      }
      const sum = row.native('sum'), from = points.get(sum)!, to = points.get(entry(`collected-${row.r}-${row.c}`))!;
      if (q >= 7) {
        const t = ease((q - 7) / .85);
        sum.style.transform = `translate(${(to.x - from.x) * t}px, ${(to.y - from.y) * t}px)`;
        sum.style.opacity = q < 8 ? '1' : '0';
      }
    }
    for (const copy of copies) {
      const q = phase - copy.c * 8;
      let visible = false, position = copy.start;
      if (copy.side === 'left') {
        visible = q > 0 && q < 1; position = mix(copy.start, copy.end, ease(q / .85));
      } else if (copy.r === 0) {
        visible = q > 1 && q < 3;
        position = copy.start;
        if (q >= 1) {
          // One column axis pivots; letters remain upright. Its ordered radii
          // open to the measured receiving slots without changing vector type.
          const cohort = copies.filter(other => other.c === copy.c && other.r === 0 && other.side === 'right');
          const center = cohort[1]!; const t = ease((q - 1.15) / 1.7);
          const axis = mix(center.start, center.end, t);
          const radius = (copy.start.y - center.start.y) * (1 - t) + (copy.end.x - center.end.x) * t;
          position = { x: axis.x + radius * Math.sin(t * Math.PI / 2), y: axis.y + radius * Math.cos(t * Math.PI / 2) };
        }
      } else {
        visible = q > 3 && q < 4;
        const first = copies.find(other => other.c === copy.c && other.r === 0 && other.side === 'right' && other.k === copy.k)!;
        position = mix(first.end, copy.end, ease((q - 3) / .85));
      }
      at(copy.node, position); copy.node.style.opacity = visible ? '1' : '0';
    }
    const c = phase >= 8 ? 1 : 0, q = phase - c * 8;
    brackets.forEach(bracket => {
      let position = mix(bracket.start, bracket.opened, ease(q / .85));
      if (q >= 6) position = mix(bracket.opened, bracket.closed, ease((q - 6) / .85));
      if (q >= 7) position = mix(bracket.closed, bracket.dock, ease((q - 7) / .85));
      at(bracket.node, position);
      // First-column enclosure hands off at the collected matrix. For the
      // second column, merge the arriving enclosure into that same frame.
      bracket.node.style.opacity = q > 0 && q < 8 ? String(c === 1 && q >= 7 ? 1 - ease((q - 7) / .85) : 1) : '0';
    });
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; copies.forEach(copy => copy.node.remove()); brackets.forEach(bracket => bracket.node.remove()); } };
}
