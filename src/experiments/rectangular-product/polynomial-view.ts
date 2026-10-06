import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { expressionToLatex } from '../../math/expression.ts';
import { polynomialCoefficients, polynomialBasis, polynomialProduct, samplePolynomial } from './polynomial-model.ts';
import './polynomial.css';
export { polynomialBeats, samplePolynomial } from './polynomial-model.ts';

const latex = (s: string) => renderLatexToHtml(s, { displayMode: false });
const token = (id: string, source: string, math: string) => `<span class="poly-token" data-poly="${id}" data-source-id="${source}">${latex(math)}</span>`;
const enclosure = (id: string, x: number, y: number, w: number, h: number) =>
  `<svg class="poly-enclosure" data-poly="${id}" style="left:${x}px;top:${y}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path pathLength="1" d="M10 2 H2 V${h - 2} H10 M${w - 10} 2 H${w - 2} V${h - 2} H${w - 10}"/></svg>`;
export const polynomialEquation = String.raw`\begin{bmatrix}p(t)\\q(t)\end{bmatrix}=\begin{bmatrix}2&0&-1&4\\1&3&0&-2\end{bmatrix}\begin{bmatrix}t^3\\t^2\\t\\1\end{bmatrix}`;
export function polynomialHtml() {
  return `<div class="polynomial-stage" aria-hidden="true">
    ${polynomialCoefficients.map((row, r) => token(`name-${r}`, polynomialProduct.result.rows[r]![0]!.id, r ? 'q(t)' : 'p(t)') + token(`equals-${r}`, 'poly.representation', '=') + row.map((n, c) =>
      token(`coefficient-${r}-${c}`, polynomialProduct.left.rows[r]![c]!.id, String(n)) +
      token(`basis-${r}-${c}`, polynomialBasis[c]!.id, expressionToLatex(polynomialBasis[c]!.expression)) +
      token(`plus-${r}-${c}`, `poly.sum.${r}`, '+') + token(`dot-${r}-${c}`, `poly.term.${r}.${c}`, '\\cdot')
    ).join('')).join('')}
    ${enclosure('coefficient-brackets', 215, 177, 266, 98)}
    ${enclosure('basis-brackets', 534, 129, 52, 194)}
    ${enclosure('output-brackets', 75, 177, 74, 98)}
  </div>`;
}
const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function mountPolynomialView(root: HTMLElement) {
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
    const { phase } = samplePolynomial(progress); stage.dataset['phase'] = String(phase);
    const align = ease(phase), collect = ease((phase - 1) / .8), turn = ease(phase - 2), enclose = ease(phase - 3);
    for (let r = 0; r < 2; r++) {
      const y = 202 + r * 48;
      pose(`name-${r}`, 112, y);
      pose(`equals-${r}`, 174, mix(y, 226, enclose), r ? 1 - enclose : 1);
      for (let c = 0; c < 4; c++) {
        const value = polynomialCoefficients[r]![c]!;
        const presentBefore = polynomialCoefficients[r]!.slice(0, c).filter(n => n !== 0).length;
        const x = mix(240 + presentBefore * 96, 240 + c * 72, align);
        const presence = value === 0 ? align : 1;
        pose(`coefficient-${r}-${c}`, x, y, presence);
        pose(`plus-${r}-${c}`, x - 24, y, c > 0 && value >= 0 ? presence * (1 - collect) : 0);
        // A single retained occurrence owns each collected basis expression.
        // Its sibling converges to that exact pose before relinquishing paint.
        const angle = turn * Math.PI / 2, offset = (c - 1.5) * mix(72, 48, turn);
        const bx = mix(348, 560, turn) + offset * Math.cos(angle);
        const by = mix(118, 226, turn) + offset * Math.sin(angle);
        const basisPresence = c === 3 ? align : presence;
        pose(`basis-${r}-${c}`, mix(x + 23, bx, collect), mix(y, by, collect),
          basisPresence * (r ? 1 - ease((phase - 1.8) / .2) : 1));
        pose(`dot-${r}-${c}`, x + 11, y, c === 3 ? align * (1 - collect) : 0);
      }
    }
    for (const id of ['coefficient-brackets', 'basis-brackets', 'output-brackets']) {
      const node = nodes.get(id)!;
      node.style.opacity = String(enclose);
      node.style.strokeDashoffset = String(1 - enclose);
    }
  };
  return { prepare() {}, render, dispose() { disposed = true; nodes.clear(); } };
}
