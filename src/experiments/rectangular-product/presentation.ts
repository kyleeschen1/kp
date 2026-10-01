import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import type { KpTypedMatrix } from '../../math/typed-semantic-math.ts';
import { signedToken } from '../dot-product-passage/presentation.ts';
import type { RectangularContext } from './model.ts';
import './style.css';

export function mountMatrixContext(root: HTMLElement, context: RectangularContext) {
  const stage = root.querySelector<HTMLElement>('.dot-stage')!;
  stage.classList.add('dot-stage--context');
  const { product, passage } = context;
  const selected = new Set([...passage.cell.row.entries, ...passage.cell.column.entries].map(entry => entry.id));
  const refs = new Map<string, string>();
  const matrix = (value: KpTypedMatrix, label: string, result = false) => {
    const rows = value.rows.map((row, i) => row.map((entry, j) => {
      const key = `${label}-${i}-${j}`;
      refs.set(key, entry.id);
      return `\\htmlData{context-key=${key}}{${signedToken(entry)}}`;
    }).join(' & ')).join('\\\\');
    return `<span class="rect-matrix${result ? ' rect-result' : ''}" data-context-matrix="${label}">${renderLatexToHtml(`\\left[\\;\\begin{matrix}${rows}\\end{matrix}\\;\\right]`, { trust: true })}</span>`;
  };
  const contextNode = document.createElement('div'); contextNode.className = 'rect-context';
  contextNode.innerHTML = `${matrix(product.left, 'A')}<span class="rect-operator">${renderLatexToHtml('\\cdot')}</span>${matrix(product.right, 'B')}<span class="rect-operator">${renderLatexToHtml('=')}</span>${matrix(product.result, 'C', true)}`;
  stage.prepend(contextNode);
  // The animated stage is aria-hidden; retain the complete mathematical context
  // in the reader's existing static calculation disclosure.
  const staticMatrix = (value: KpTypedMatrix) => `\\begin{bmatrix}${value.rows.map(row => row.map(signedToken).join(' & ')).join('\\\\')}\\end{bmatrix}`;
  const accessible = document.createElement('div'); accessible.className = 'dot-static';
  accessible.innerHTML = renderLatexToHtml(`${staticMatrix(product.left)}${staticMatrix(product.right)}=${staticMatrix(product.result)}`, { trust: true });
  root.querySelector('details')!.append(accessible);
  const entries = [...contextNode.querySelectorAll<HTMLElement>('[data-context-key]')];
  for (const node of entries) {
    const id = refs.get(node.dataset['contextKey']!)!;
    node.dataset['sourceId'] = id;
    node.toggleAttribute('data-context-selected', selected.has(id));
    if (node.closest('.rect-result')) {
      const ink = document.createElement('span'); ink.className = 'rect-result-ink';
      while (node.firstChild) ink.append(node.firstChild);
      node.append(ink);
    }
  }
  const target = contextNode.querySelector<HTMLElement>(`[data-context-key="C-${passage.cell.rowIndex}-${passage.cell.columnIndex}"]`)!;
  target.dataset['contextDestination'] = '';
  const result = target.querySelector<HTMLElement>('.rect-result-ink')!;
  const sum = root.querySelector<HTMLElement>('[data-kp-dot-key="sum"]')!;
  let dx = 0, dy = 0;
  return {
    prepare() {
      sum.style.transform = '';
      const a = sum.getBoundingClientRect(), b = result.getBoundingClientRect();
      dx = b.x + b.width / 2 - a.x - a.width / 2;
      dy = b.y + b.height / 2 - a.y - a.height / 2;
    },
    render(progress: number) {
      const p = context.sample(progress).placement;
      const t = p * p * p * (p * (p * 6 - 15) + 10);
      // The existing sum owns the direct journey; native destination takes
      // over only at the endpoint, with the exact same semantic result ID.
      if (p > 0) {
        sum.style.transform = `translate(${dx * t}px, ${dy * t}px)`;
        sum.style.opacity = p === 1 ? '0' : '1';
      }
      target.toggleAttribute('data-context-arrived', p === 1);
      stage.dataset['placement'] = String(p);
    },
    dispose() { contextNode.remove(); accessible.remove(); stage.classList.remove('dot-stage--context'); },
  };
}
