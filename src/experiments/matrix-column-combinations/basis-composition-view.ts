import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import type { basisComposition } from './basis-composition.ts';

export function basisCompositionHtml(example: ReturnType<typeof basisComposition>) {
  const math = (latex: string) => renderLatexToHtml(latex, { output: 'htmlAndMathml' });
  const matrix = (rows: readonly (readonly number[])[]) => `\\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\\end{bmatrix}`;
  const middle = example.mode === 'adapted' ? '\\beta' : 'E';
  const other = example.mode === 'adapted' ? 'E' : '\\beta';
  const v = [1, 2] as const, intermediate = example.middle.coordinates(example.T.apply(v)), result = example.map.apply(v);
  return `<section aria-label="Composition and bases" data-basis-mode="${example.mode}">
    <p>First T doubles the horizontal component. Then S shears by adding the vertical component to the horizontal one.</p>
    <p>${math('T(x,y)=(2x,y),\\qquad S(x,y)=(x+y,y)')}</p>
    <p>E is the standard basis. The slanted basis β is ((1, 1), (0, 1)). Changing the intermediate basis changes the coordinates, not the vector or either map.</p>
    <nav aria-label="Intermediate basis"><a href="?example=composition&basis=adapted&column=${example.scene.column}">Use β between the maps</a> · <a href="?example=composition&basis=standard&column=${example.scene.column}">Use E between the maps</a></nav>
    <p>${math(`B=[T]_{${middle}\\leftarrow E}=${matrix(example.inner.rows)},\\qquad A=[S]_{E\\leftarrow ${middle}}=${matrix(example.outer.rows)}`)}</p>
    <p>B produces ${example.mode === 'adapted' ? 'β' : 'E'} coordinates; A consumes those same coordinates. Read the composition right to left: apply B, then A.</p>
    <p>${math(`AB=[S\\circ T]_{E\\leftarrow E}=${matrix(example.representation.rows)}`)}</p>
    <details><summary>Why matching dimensions are not enough</summary>
      <p>${math(`[S]_{E\\leftarrow ${other}}\\,[T]_{${middle}\\leftarrow E}`)} has matching array dimensions but mismatched intermediate bases. It does not represent the intended composition.</p>
      <p data-basis-gap>${example.mismatch}</p>
      <p>We recompute a matrix from its map and chosen bases; this example does not infer a missing basis conversion.</p>
    </details>
    <details><summary>Follow one vector and inspect its context</summary>
      <p>${math(`[v]_E=${matrix(v.map(n => [n]))},\\quad [T(v)]_{${middle}}=${matrix(intermediate.map(n => [n]))},\\quad [S(T(v))]_E=${matrix(result.map(n => [n]))}`)}</p>
      <p>At the join, T(v) is still the geometric vector (2, 2). Its coordinates are (2, 0) in β and (2, 2) in E.</p>
      <p>Domain: ${example.map.domain.space.label ?? example.map.domain.space.id}; codomain: ${example.map.codomain.space.label ?? example.map.codomain.space.id}. Both endpoint bases are E.</p>
      <p data-map-context>Maps: ${example.T.id} → ${example.S.id}; shared basis: ${example.middle.id}. The animation retains the product's original entries and scalar contributions.</p>
      <p>Evidence is numerical for this example; no general symbolic proof is claimed.</p>
    </details>
  </section>`;
}
