import { expressionToLatex } from '../../math/expression.ts';
import { createKpSelectorAnnotatedLatex, type KpSelectorAnnotatedLatexSegment } from '../../rendering/selector-annotated-latex.ts';
import { renderSelectorAnnotatedLatexToHtml } from '../../rendering/katex-adapter.ts';
import { measureKpNativeKatexSubtreePaintRect } from '../../rendering/native-katex-paint-geometry.ts';
import type { CollectionModel } from './collection-source.ts';
import { rowValueLatex } from './row-value-latex.ts';

function naturalRow(model: CollectionModel, r: number) {
  const segments: KpSelectorAnnotatedLatexSegment[] = [];
  const part = (selectorId: string, latex: string) => segments.push({ kind: 'selector', selectorId, latex });
  part(`name-${r}`, model.outputs[r]!.latex); part(`equals-${r}`, '=');
  let first = true;
  model.coefficients[r]!.forEach((value, c) => {
    if (!value) return;
    const constant = model.inputs[c]!.expression.kind === 'constant';
    if (value < 0) part(`sign-${r}-${c}`, '-');
    else if (!first) part(`plus-${r}-${c}`, '+');
    if (Math.abs(value) !== 1 || constant) part(`${value < 0 ? 'magnitude' : 'coefficient'}-${r}-${c}`, rowValueLatex(model.product.left.rows[r]![c]!, true));
    if (!constant) part(`basis-${r}-${c}`, expressionToLatex(model.inputs[c]!.expression));
    first = false;
  });
  if (first) part(`zero-${r}`, '0');
  return createKpSelectorAnnotatedLatex({ id: `natural.row-${r}`, segments,
    expectedSelectorIds: segments.flatMap(s => s.kind === 'selector' ? [s.selectorId] : []) });
}

export function collectionNaturalHtml(model: CollectionModel) {
  return `<div class="poly-natural">${model.coefficients.map((_, r) =>
    `<div class="poly-natural-row" data-natural-row="${r}">${renderSelectorAnnotatedLatexToHtml(naturalRow(model, r), { displayMode: false })}</div>`).join('')}</div>`;
}

/** Native KaTeX owns resting typography. The existing collection tokens own
 * working typography; measured fragment translations join the two without
 * replacing a whole equation or guessing spacing from the printed glyphs. */
export function mountCollectionNaturalLayout(stage: HTMLElement, model: CollectionModel, nodes: ReadonlyMap<string, HTMLElement>) {
  const surface = stage.querySelector<HTMLElement>('.poly-natural')!;
  const rows = [...surface.querySelectorAll<HTMLElement>('[data-natural-row]')];
  const entries = rows.flatMap((row, r) => naturalRow(model, r).annotations.map(a => {
    const node = row.querySelector<HTMLElement>(`[data-kp-motion-id="${a.motionId}"]`)!;
    const subpart = /^(sign|magnitude)-(\d)-(\d)$/.exec(a.selectorId);
    const owner = nodes.get(subpart ? `coefficient-${subpart[2]}-${subpart[3]}` : a.selectorId)!;
    const target = subpart ? owner.querySelector<HTMLElement>(`[data-${subpart[1]}]`)! : owner;
    if (!node || !target) throw new Error(`Missing natural collection binding: ${a.selectorId}`);
    node.dataset['sourceId'] = owner.dataset['sourceId']!;
    node.dataset['naturalKey'] = a.selectorId;
    return { node, target, dx: 0, dy: 0 };
  }));
  const rect = (node: HTMLElement) => node.getBoundingClientRect();
  const reset = () => { for (const e of entries) { e.node.style.left = '0px'; e.node.style.top = '0px'; } };
  return {
    // Called only after fonts and the existing aligned layout have settled.
    prepare() {
      reset();
      rows.forEach(row => { row.style.left = '0px'; row.style.top = '0px'; });
      const measurements = rows.map((row, r) => {
        const b = rect(row), eq = rect(row.querySelector<HTMLElement>(`[data-kp-motion-id="natural.row-${r}.equals-${r}"]`)!);
        return { left: eq.x + eq.width / 2 - b.x, right: b.right - eq.x - eq.width / 2, y: eq.y + eq.height / 2 - b.y };
      });
      const left = Math.max(...measurements.map(m => m.left)), right = Math.max(...measurements.map(m => m.right));
      const equalX = (stage.clientWidth + left - right) / 2;
      rows.forEach((row, r) => { row.style.left = `${equalX - measurements[r]!.left}px`; row.style.top = `${202 + r * 48 - measurements[r]!.y}px`; });
      for (const e of entries) {
        // Whole-equation wrappers include contextual spacing and struts.
        // Align the actual paint through the existing native measurement seam.
        const from = measureKpNativeKatexSubtreePaintRect(stage, e.node);
        const to = measureKpNativeKatexSubtreePaintRect(stage, e.target);
        if (!from || !to) throw new Error(`Unmeasurable natural collection fragment: ${e.node.dataset['naturalKey']}`);
        e.dx = to.left + to.width / 2 - from.left - from.width / 2;
        e.dy = to.top + to.height / 2 - from.top - from.height / 2;
      }
    },
    render(open: number) {
      // Relative offsets preserve native inline spacing and baseline metrics.
      // No layout measurements happen while sampling the clock.
      surface.style.opacity = open < 1 ? '1' : '0';
      for (const e of entries) {
        e.node.style.left = `${e.dx * open}px`; e.node.style.top = `${e.dy * open}px`;
        e.target.style.visibility = open < 1 ? 'hidden' : 'visible';
      }
    },
  };
}
