import katex from 'katex';
import type { CollectionModel } from './collection-source.ts';

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** A standalone reading projection: native MathML, no script, fonts or runtime. */
export function renderCollectionReading(model: CollectionModel): string {
  const math = (source: string) => katex.renderToString(source, { output: 'mathml', displayMode: true, trust: false, throwOnError: true });
  const title = model.kind === 'polynomials' ? 'Polynomials as a matrix product' : 'A linear system as a matrix equation';
  const meaning = model.kind === 'polynomials'
    ? 'The named outputs are polynomial definitions. Each row retains its coefficients in the declared input order.'
    : 'These equations constrain the unknowns. The right-hand-side values are independent of the computed expressions. This is b = Ax, equivalently Ax = b; no solution is asserted.';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body><main>
<h1>${title}</h1><p>${meaning}</p>
<h2>Expanded equations</h2>${math(model.expandedEquation)}
<h2>Matrix representation</h2>${math(model.equation)}
<h2>Correspondences</h2><p>Each input occupies one column. Each expanded equation occupies one row. Missing terms have zero coefficients; changing input order also changes coefficient-column order.</p>
<h2>Explanation</h2><ol>${model.beats.map(beat => `<li id="${beat.id}">${escape(beat.cue)}</li>`).join('')}</ol>
</main></body></html>`;
}
