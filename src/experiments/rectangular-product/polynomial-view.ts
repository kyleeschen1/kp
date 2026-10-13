import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { expressionToLatex } from '../../math/expression.ts';
import { polynomialModel } from './polynomial-model.ts';
import { sampleCollection, type CollectionModel } from './collection-source.ts';
import './polynomial.css';
export { polynomialBeats, samplePolynomial } from './polynomial-model.ts';
export { polynomialModel } from './polynomial-model.ts';
export { sampleCollection } from './collection-source.ts';

const latex = (s: string) => renderLatexToHtml(s, { displayMode: false });
const token = (id: string, source: string, math: string) => `<span class="poly-token" data-poly="${id}" data-source-id="${source}">${latex(math)}</span>`;
const enclosure = (id: string, x: number, y: number, w: number, h: number) =>
  `<svg class="poly-enclosure" data-poly="${id}" style="left:${x}px;top:${y}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path pathLength="1" d="M10 2 H2 V${h - 2} H10 M${w - 10} 2 H${w - 2} V${h - 2} H${w - 10}"/></svg>`;
export function collectionLayout(model: CollectionModel) {
  const offsets = [0];
  for (let c = 1; c < model.inputs.length; c++) {
    const previous = model.inputs[c - 1]!.expression;
    // Signed constants and powers need more room for temporary grouping and
    // explicit multiplication; reserve it before the next term's plus.
    const wideSignedTerm = previous.kind !== 'variable' && model.coefficients.some(row => row[c - 1]! < 0);
    offsets.push(offsets[c - 1]! + (wideSignedTerm ? 90 : 72));
  }
  const span = offsets.at(-1)!;
  const matrixWidth = span + 50;
  // Keep the accepted four-column gap, measured between the enclosure boxes.
  // The destination and rigid pivot must agree, including for shorter factors.
  const vectorLeft = 215 + matrixWidth + 53, vectorX = vectorLeft + 26;
  const centerX = 240 + span / 2;
  const pivotX = (vectorX + 118 + centerX - 226) / 2;
  return { offsets, span, matrixWidth, vectorLeft, pivotX, pivotY: vectorX + 118 - pivotX };
}
export const polynomialEquation = polynomialModel.equation;
export function polynomialHtml(model: CollectionModel = polynomialModel) {
  const { coefficients: polynomialCoefficients, inputs: polynomialBasis, product: polynomialProduct } = model;
  const layout = collectionLayout(model);
  return `<div class="polynomial-stage" aria-hidden="true">
    ${polynomialCoefficients.map((row, r) => token(`name-${r}`, model.outputs[r]!.id, model.outputs[r]!.latex) + token(`equals-${r}`, `${model.id}.representation`, '=') + row.map((n, c) =>
      (n === -1 ? `<span class="poly-token" data-poly="coefficient-${r}-${c}" data-source-id="${polynomialProduct.left.rows[r]![c]!.id}">${latex('-')}<span data-unit>${latex('1')}</span></span>` : token(`coefficient-${r}-${c}`, polynomialProduct.left.rows[r]![c]!.id, String(n))) +
      (n < 0 ? token(`open-${r}-${c}`, polynomialProduct.left.rows[r]![c]!.id, '(') + token(`close-${r}-${c}`, polynomialProduct.left.rows[r]![c]!.id, ')') : '') +
      token(`basis-${r}-${c}`, polynomialBasis[c]!.id, expressionToLatex(polynomialBasis[c]!.expression)) +
      token(`plus-${r}-${c}`, `${model.id}.sum.${r}`, '+') + token(`dot-${r}-${c}`, `${model.id}.term.${r}.${c}`, '\\cdot')
    ).join('')).join('')}
    ${enclosure('coefficient-brackets', 215, 177, layout.matrixWidth, 98)}
    ${enclosure('basis-brackets', layout.vectorLeft, 226 - layout.span / 2 - 25, 52, layout.span + 50)}
    ${enclosure('output-brackets', 75, 177, 74, 98)}
  </div>`;
}
const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function mountPolynomialView(root: HTMLElement, model: CollectionModel = polynomialModel) {
  const polynomialCoefficients = model.coefficients;
  const stage = root.querySelector<HTMLElement>('.polynomial-stage')!;
  const nodes = new Map([...stage.querySelectorAll<HTMLElement>('[data-poly]')].map(n => [n.dataset['poly']!, n]));
  const layout = collectionLayout(model);
  const tokenWidths = new Map<string, number>();
  const prepare = () => {
    for (const [id, node] of nodes) if (node.classList.contains('poly-token')) tokenWidths.set(id, node.getBoundingClientRect().width);
  };
  prepare();
  let disposed = false;
  const pose = (id: string, x: number, y: number, opacity = 1) => {
    const node = nodes.get(id)!;
    node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    node.style.opacity = String(opacity);
  };
  const render = (progress: number) => {
    if (disposed) return;
    const { phase } = sampleCollection(model, progress); stage.dataset['phase'] = String(phase);
    const align = ease(phase), collect = ease((phase - 2.2) / .6), turn = ease(phase - 3);
    // Enclosure receives the settling column as one event, then the equation
    // holds. Equality waits for both the rigid turn and every enclosure.
    const enclose = ease((phase - 3.65) / .45);
    // Establish grouping before introducing addition; reverse seek removes the
    // plus first. The signed coefficient itself is never replaced or detached.
    const grouping = ease(phase / .4) * (1 - collect);
    const negativeAddition = ease((phase - .4) / .6) * (1 - collect);
    // Equality only accompanies complete expressions, including on reverse seek.
    const equality = 1 - ease((phase - 2) / .2) + ease((phase - 4.1) / .15);
    const cubicFocus = ease(phase - 1) * (1 - ease((phase - 2) / .2));
    const rowFocus = ease(phase - 5) * (1 - ease(phase - 6));
    const columnFocus = ease(phase - 6) * (1 - ease(phase - 7));
    for (let r = 0; r < polynomialCoefficients.length; r++) {
      const y = 202 + r * 48;
      pose(`name-${r}`, 112, y);
      pose(`equals-${r}`, 174, mix(y, 226, enclose), equality * (r ? 1 - enclose : 1));
      for (let c = 0; c < model.inputs.length; c++) {
        const value = polynomialCoefficients[r]![c]!;
        const presentBefore = polynomialCoefficients[r]!.slice(0, c).filter(n => n !== 0).length;
        const x = mix(240 + presentBefore * 96, 240 + layout.offsets[c]!, align);
        const presence = value === 0 ? align : 1;
        const expression = model.inputs[c]!.expression;
        const constantInput = expression.kind === 'constant' && expression.value === 1;
        pose(`coefficient-${r}-${c}`, x, y, value === 1 && !constantInput ? align : presence);
        nodes.get(`coefficient-${r}-${c}`)!.querySelector<HTMLElement>('[data-unit]')?.style.setProperty('opacity', String(constantInput ? 1 : align));
        const halfWidth = (tokenWidths.get(`coefficient-${r}-${c}`) ?? 0) / 2;
        if (value < 0) {
          pose(`open-${r}-${c}`, x - halfWidth - 4, y, grouping);
          pose(`close-${r}-${c}`, x + halfWidth + 4, y, grouping);
        }
        pose(`plus-${r}-${c}`, x - (value < 0 ? halfWidth + 18 : 24), y, value >= 0
          ? mix(presentBefore > 0 && value !== 0 ? 1 : 0, c > 0 ? 1 : 0, align) * (1 - collect)
          : c > 0 ? negativeAddition : 0);
        // A single retained occurrence owns each collected basis expression.
        // Its sibling converges to that exact pose before relinquishing paint.
        // Rotate the arrangement rigidly around one fixed point. All inter-term
        // distances remain fixed; upright native glyphs do not rotate with it.
        const { pivotX, pivotY } = layout;
        const angle = turn * Math.PI / 2, dx = 240 + layout.offsets[c]! - pivotX, dy = 118 - pivotY;
        const bx = pivotX + dx * Math.cos(angle) - dy * Math.sin(angle);
        const by = pivotY + dx * Math.sin(angle) + dy * Math.cos(angle);
        const basisPresence = constantInput ? align : presence;
        const initialOffset = value === 1 ? 0 : value === -1 ? 14 : 23;
        const closingHalfWidth = (tokenWidths.get(`close-${r}-${c}`) ?? 0) / 2;
        const inputHalfWidth = (tokenWidths.get(`basis-${r}-${c}`) ?? 0) / 2;
        const groupedOffset = value < 0 ? Math.max(23, halfWidth + 4 + closingHalfWidth + inputHalfWidth + (constantInput ? 18 : 6)) : 23;
        pose(`basis-${r}-${c}`, mix(x + mix(initialOffset, groupedOffset, align), bx, collect), mix(y, by, collect),
          basisPresence * (r ? 1 - ease((phase - 2.8) / .2) : 1));
        pose(`dot-${r}-${c}`, x + (value < 0 ? halfWidth + 12 : 11), y, constantInput ? align * (1 - collect) : 0);
      }
    }
    // Correspondence is resolved against the fixture's row and basis roles;
    // opacity expresses attention, independently of each occurrence's presence.
    for (const [id, node] of nodes) {
      const coefficient = /^(?:coefficient|open|close)-(\d)-(\d)$/.exec(id);
      const basis = /^basis-(\d)-(\d)$/.exec(id);
      const name = /^name-(\d)$/.exec(id);
      const fade = Math.max(
        cubicFocus * ((coefficient?.[2] === String(model.focus.column) || basis?.[2] === String(model.focus.column)) ? 0 : 1),
        rowFocus * ((coefficient?.[1] === String(model.focus.row) || name?.[1] === String(model.focus.row)) ? 0 : 1),
        columnFocus * ((coefficient?.[2] === String(model.focus.column) || basis?.[2] === String(model.focus.column)) ? 0 : 1),
      );
      if (coefficient || basis || name) node.style.opacity = String(Number(node.style.opacity) * (1 - .55 * fade));
    }
    for (const id of ['coefficient-brackets', 'basis-brackets', 'output-brackets']) {
      const node = nodes.get(id)!;
      node.style.opacity = String(enclose);
      node.style.strokeDashoffset = String(1 - enclose);
    }
  };
  return { prepare, render, dispose() { disposed = true; nodes.clear(); tokenWidths.clear(); } };
}
