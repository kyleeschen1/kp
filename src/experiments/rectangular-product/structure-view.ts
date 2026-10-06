import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { structureModel, sampleStructure } from './structure-model.ts';
import './structure.css';
export { structureBeats, sampleStructure } from './structure-model.ts';

const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false });
const annotation = (id: string, text: string) => renderKpFocusDeckAnnotation({ entityId: id, text });
const band = (id: string, ids: readonly string[], vertical: boolean, extra = '') => `<div class="structure-band ${vertical ? 'structure-vertical' : ''} ${extra}" data-band="${id}" data-source-ids="${ids.join(' ')}">${ids.map(value => `<span data-source-id="${value}"></span>`).join('')}</div>`;
export function structureHtml() {
  const { product, next } = structureModel;
  return `<div class="structure-stage" aria-hidden="true">
    <div class="structure-label" style="left:142px;top:22px">${math('C')}</div>
    <div class="structure-label" style="left:265px;top:22px">${math('=')}</div>
    <div class="structure-label" style="left:418px;top:22px">${math('B')}</div>
    <div class="structure-label" style="left:490px;top:22px">${math('A')}</div>
    <div class="structure-label" style="left:128px;top:62px">${math('2\\times2')}</div>
    <div class="structure-label" style="left:404px;top:62px">${math('2\\times3')}</div>
    <div class="structure-label" style="left:488px;top:62px">${math('3\\times2')}</div>
    <div class="structure-label" style="left:340px;top:290px">${annotation('B.ports', '3 in → 2 out')}</div>
    ${product.rightParts.columns.map((col, c) => band(`source-${c}`, col.entries.map(e => e.id), true, 'structure-input')).join('')}
    ${product.leftParts.rows.map((row, r) => band(`row-${r}`, row.entries.map(e => e.id), false, 'structure-receiver')).join('')}
    ${product.columns.map((column, c) => column.map((cell, r) => band(`copy-${c}-${r}`, cell.column.entries.map(e => e.id), false, 'structure-copy') + band(`result-${c}-${r}`, [cell.result.id], false, 'structure-result')).join('')).join('')}
    <div class="structure-next"><div class="structure-label" style="left:245px;top:345px">${math('D (3\\times2)')}</div>
    <div class="structure-label" style="left:245px;top:380px">${annotation('D.ports', '2 in → 3 out')}</div>
    <div class="structure-label" style="left:510px;top:345px">${annotation('DC.first', 'First column of DC')}</div>
    ${next.leftParts.rows.map((row, r) => band(`next-row-${r}`, row.entries.map(e => e.id), false, 'structure-receiver')).join('')}</div>
    ${next.columns[0]!.map((cell, r) => band(`next-copy-${r}`, cell.column.entries.map(e => e.id), false, 'structure-copy') + band(`next-result-${r}`, [cell.result.id], false, 'structure-result')).join('')}
    <div class="structure-chain">${math('\\mathbb{R}^{3}\\xrightarrow{B}\\mathbb{R}^{2}\\xrightarrow{D}\\mathbb{R}^{3}')}</div>
  </div>`;
}
const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
export function mountStructureView(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.structure-stage')!;
  const bands = new Map([...stage.querySelectorAll<HTMLElement>('[data-band]')].map(node => [node.dataset['band']!, node]));
  let disposed = false;
  const pose = (id: string, x: number, y: number, width: number, angle = 0, present = true) => {
    const node = bands.get(id); if (!node) throw new Error(`Missing structural occurrence ${id}`);
    node.style.width = `${width}px`; node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${angle}deg)`;
    node.style.visibility = present ? 'visible' : 'hidden';
  };
  const render = (progress: number) => {
    if (disposed) return;
    const { phase } = sampleStructure(progress); stage.dataset['phase'] = String(phase);
    for (let c = 0; c < 2; c++) pose(`source-${c}`, 480 + c * 36, 156, 24);
    for (let r = 0; r < 2; r++) pose(`row-${r}`, 426, 230 + r * 36, 108);
    for (let c = 0; c < 2; c++) {
      const q = phase - c * 4;
      for (let r = 0; r < 2; r++) {
        const y = 230 + r * 36;
        let x = 426, cy = y - 20, angle = 0;
        if (r === 0 && q < 1) {
          const turn = ease(q / .65);
          angle = interpolate(90, 0, turn);
          // The band's right endpoint is the lower hinge. CSS's downward y axis
          // makes this Cartesian 90→180 turn a CSS 90→0 rotation. DOM order
          // remains top-to-bottom at departure and left-to-right at reception.
          const radians = angle * Math.PI / 180;
          x = 480 + c * 36 - 54 * Math.cos(radians) - c * 36 * ease((q - .65) / .2);
          cy = 210 - 54 * Math.sin(radians);
        } else if (r === 1 && q < 2) cy = interpolate(210, y - 20, ease((q - 1) / .65));
        const synthesis = ease((q - 2.25) / .55);
        cy = interpolate(cy, y, synthesis);
        // A row-vector pairing changes semantic role only when synthesis ends.
        // Retain lineage on the incoming band; the resulting tile owns the scalar.
        pose(`copy-${c}-${r}`, x, cy, interpolate(108, 24, synthesis), angle, q > r && q < 2.8);
        const thinning = r === 0 ? ease(q / .65) : 1;
        bands.get(`copy-${c}-${r}`)!.style.height = `${interpolate(interpolate(24, 16, thinning), 36, synthesis)}px`;
        const docking = ease((q - 3) / .8);
        pose(`result-${c}-${r}`, interpolate(426, 132 + c * 36, docking), y, 24, 0, q >= 2.8);
        bands.get(`result-${c}-${r}`)!.style.height = '36px';
      }
    }
    const nextReveal = ease((phase - 8) / .35);
    const nextPanel = stage.querySelector<HTMLElement>('.structure-next')!;
    nextPanel.style.opacity = String(nextReveal);
    for (let r = 0; r < 3; r++) {
      const y = 437 + r * 36;
      pose(`next-row-${r}`, 320, y, 72 * nextReveal);
      let x = 320, cy = y, angle = 0;
      if (r === 0 && phase < 9) {
        const t = ease((phase - 8.35) / .55);
        x = interpolate(132, 320, t); cy = interpolate(248, 437, t); angle = interpolate(90, 0, t);
      } else if (r > 0) cy = interpolate(437, y, ease((phase - 9 - (r - 1) * .2) / .6));
      const synth = ease((phase - 10) / .8);
      pose(`next-copy-${r}`, x, cy, interpolate(72, 24, synth), angle,
        phase > (r === 0 ? 8.35 : 9 + (r - 1) * .2) && phase < 10.8);
      bands.get(`next-copy-${r}`)!.style.height = `${interpolate(24, 36, synth)}px`;
      pose(`next-result-${r}`, interpolate(320, 540, ease((phase - 11) / .8)), y, 24, 0, phase >= 10.8);
      bands.get(`next-result-${r}`)!.style.height = '36px';
    }
    stage.querySelector<HTMLElement>('.structure-chain')!.style.opacity = String(ease((phase - 11) / .6));
  };
  return { prepare() {}, render, dispose() { disposed = true; bands.clear(); } };
}
