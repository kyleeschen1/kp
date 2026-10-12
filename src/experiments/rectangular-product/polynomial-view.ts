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
export const polynomialEquation = polynomialModel.equation;
export function polynomialHtml(model: CollectionModel = polynomialModel) {
  const { coefficients: polynomialCoefficients, inputs: polynomialBasis, product: polynomialProduct } = model;
  const columns = polynomialBasis.length;
  return `<div class="polynomial-stage" aria-hidden="true">
    ${polynomialCoefficients.map((row, r) => token(`name-${r}`, model.outputs[r]!.id, model.outputs[r]!.latex) + token(`equals-${r}`, `${model.id}.representation`, '=') + row.map((n, c) =>
      (n === -1 ? `<span class="poly-token" data-poly="coefficient-${r}-${c}" data-source-id="${polynomialProduct.left.rows[r]![c]!.id}">${latex('-')}<span data-unit>${latex('1')}</span></span>` : token(`coefficient-${r}-${c}`, polynomialProduct.left.rows[r]![c]!.id, String(n))) +
      token(`basis-${r}-${c}`, polynomialBasis[c]!.id, expressionToLatex(polynomialBasis[c]!.expression)) +
      token(`plus-${r}-${c}`, `${model.id}.sum.${r}`, '+') + token(`dot-${r}-${c}`, `${model.id}.term.${r}.${c}`, '\\cdot')
    ).join('')).join('')}
    ${enclosure('coefficient-brackets', 215, 177, (columns - 1) * 72 + 50, 98)}
    ${enclosure('basis-brackets', 534, 226 - (columns - 1) * 36 - 25, 52, (columns - 1) * 72 + 50)}
    ${enclosure('output-brackets', 75, 177, 74, 98)}
  </div>`;
}
const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function mountPolynomialView(root: HTMLElement, model: CollectionModel = polynomialModel) {
  const polynomialCoefficients = model.coefficients;
  const stage = root.querySelector<HTMLElement>('.polynomial-stage')!;
  const nodes = new Map([...stage.querySelectorAll<HTMLElement>('[data-poly]')].map(n => [n.dataset['poly']!, n]));
  let disposed = false;
  const pose = (id: string, x: number, y: number, opacity = 1) => {
    const node = nodes.get(id)!;
    node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    node.style.opacity = String(opacity);
  };
  const render = (progress: number) => {
    if (disposed) return;
    const { phase } = sampleCollection(model, progress); stage.dataset['phase'] = String(phase);
    const align = ease(phase), collect = ease((phase - 2.2) / .6), turn = ease(phase - 3), enclose = ease((phase - 4) / .7);
    // Equality only accompanies complete expressions, including on reverse seek.
    const equality = 1 - ease((phase - 2) / .2) + ease((phase - 4.85) / .15);
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
        const x = mix(240 + presentBefore * 96, 240 + c * 72, align);
        const presence = value === 0 ? align : 1;
        const expression = model.inputs[c]!.expression;
        const constantInput = expression.kind === 'constant' && expression.value === 1;
        pose(`coefficient-${r}-${c}`, x, y, value === 1 && !constantInput ? align : presence);
        nodes.get(`coefficient-${r}-${c}`)!.querySelector<HTMLElement>('[data-unit]')?.style.setProperty('opacity', String(constantInput ? 1 : align));
        pose(`plus-${r}-${c}`, x - 24, y, value >= 0 ? mix(presentBefore > 0 && value !== 0 ? 1 : 0, c > 0 ? 1 : 0, align) * (1 - collect) : 0);
        // A single retained occurrence owns each collected basis expression.
        // Its sibling converges to that exact pose before relinquishing paint.
        // Rotate the arrangement rigidly around one fixed point. All inter-term
        // distances remain 72px; upright native glyphs do not rotate with it.
        const centerX = 240 + (model.inputs.length - 1) * 36;
        const pivotX = (452 + centerX) / 2, pivotY = 678 - pivotX;
        const angle = turn * Math.PI / 2, dx = 240 + c * 72 - pivotX, dy = 118 - pivotY;
        const bx = pivotX + dx * Math.cos(angle) - dy * Math.sin(angle);
        const by = pivotY + dx * Math.sin(angle) + dy * Math.cos(angle);
        const basisPresence = constantInput ? align : presence;
        const initialOffset = value === 1 ? 0 : value === -1 ? 14 : 23;
        pose(`basis-${r}-${c}`, mix(x + mix(initialOffset, 23, align), bx, collect), mix(y, by, collect),
          basisPresence * (r ? 1 - ease((phase - 2.8) / .2) : 1));
        pose(`dot-${r}-${c}`, x + 11, y, constantInput ? align * (1 - collect) : 0);
      }
    }
    // Correspondence is resolved against the fixture's row and basis roles;
    // opacity expresses attention, independently of each occurrence's presence.
    for (const [id, node] of nodes) {
      const coefficient = /^coefficient-(\d)-(\d)$/.exec(id);
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
  return { prepare() {}, render, dispose() { disposed = true; nodes.clear(); } };
}
