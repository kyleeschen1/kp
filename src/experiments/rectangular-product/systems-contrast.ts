import { constant, variable } from '../../math/expression.ts';
import { createKpScalarExpression } from '../../math/typed-semantic-math.ts';
import { eliminateSystem } from '../../math/system-elimination.ts';
import { readExactRowValue } from '../../math/row-exact-value.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { requireCollectionSource } from './collection-source.ts';
import { linearSystemSource } from './linear-system-source.ts';
import { composeCheckedRowSteps, projectSystemCollection } from './row-composition-model.ts';

const template = requireCollectionSource({ ...linearSystemSource, id: 'consistency.shared',
  coefficients: [[1, 1], [2, 2]], inputs: [variable('x'), variable('y')],
  domain: { kind: 'linear-system', rhs: [3, 6] }, focus: { row: 1, column: 0 } });
const firstRhs = createKpScalarExpression({ id: 'consistency.b.first', expression: constant(3) });
export type ContrastCase = 'compatible' | 'incompatible';

function buildCase(key: ContrastCase, secondRhs: number) {
  // A is the same referent in both systems. Only the changed RHS component
  // receives a new identity; equal-looking derived results remain distinct.
  const initial = Object.freeze({ coefficients: template.product.left,
    rhs: Object.freeze([firstRhs, createKpScalarExpression({ id: `consistency.${key}.b.second`, expression: constant(secondRhs) })]) });
  const trace = eliminateSystem(`consistency.${key}`, initial);
  if (trace.status !== 'solved') throw new Error(`${trace.path}: ${trace.message}`);
  const projected = projectSystemCollection(template, initial);
  if (projected.status !== 'projected') throw new Error(`${projected.path}: ${projected.message}`);
  const residual = readExactRowValue(trace.echelon.rhs[1]!)!;
  const compatible = trace.solution.kind === 'infinite';
  const outcome = compatible
    ? 'The second row says 0 = 0. It adds no constraint. Any real y gives a solution x = 3 − y: infinitely many solutions.'
    : 'The second row says 1 = 0. This is impossible for every x and y: there are no solutions.';
  const model = composeCheckedRowSteps({ before: projected.model,
    title: 'Same coefficients, different answers',
    introduction: 'Both systems have the same dependent coefficient rows. Change only the second right-hand side, then compare the same subtraction.',
    annotations: {
      equations: `The second left-hand side is twice the first. ${compatible ? 'Its right-hand side is also twice the first: 6 = 2 × 3.' : 'Its right-hand side is 7, not twice 3. Can both equations hold?'}`,
      matrix: 'Keep A fixed. Subtract twice row 1 from row 2, including the right-hand side.', expanded: outcome,
    } }, trace.steps.map(step => ({ id: 'eliminate', operation: step.checked.operation, checked: step.checked,
      during: 'Subtract twice row 1 from row 2. The coefficients cancel in both systems; compare what happens on the right-hand side.',
      after: outcome })));
  if (model.status !== 'compiled') throw new Error(`${model.path}: ${model.message}`);
  return Object.freeze({ key, initial, trace, model, residual, outcome });
}

export const consistencyCases = Object.freeze({ compatible: buildCase('compatible', 6), incompatible: buildCase('incompatible', 7) });
export function selectConsistencyCase(key: string) {
  if (key !== 'compatible' && key !== 'incompatible')
    return { status: 'repair-required' as const, path: 'case', message: 'Choose compatible or incompatible.' };
  return { status: 'ready' as const, selected: consistencyCases[key] };
}
const math = (latex: string) => renderLatexToHtml(latex, { output: 'htmlAndMathml' });
export function contrastControls(key: ContrastCase) {
  return `<nav class="matrix-controls" aria-label="Compare right-hand sides">
    ${(['compatible', 'incompatible'] as const).map(k => `<a data-contrast-case="${k}" ${k === key ? 'aria-current="page"' : ''}
      href="?view=row-composition&amp;example=contrast&amp;case=${k}#equations">${k === 'compatible' ? 'b = (3, 6)' : 'b = (3, 7)'}</a>${k === key ? ' (shown)' : ''}`).join(' · ')}
    </nav><p class="matrix-help">Switch right-hand sides at the same named milestone. This compares two systems; it is not a solution-preserving operation between them.</p>`;
}
export function contrastReading(key: ContrastCase) {
  const c = consistencyCases[key];
  return `<details data-contrast-reading><summary>Why the right-hand side matters</summary>
    <p>The coefficient relation is unchanged: row 2 is twice row 1. For both equations to hold, their right-hand sides must obey that same relation.</p>
    <div class="pour-static">${math('b_2-2b_1=0')} ${math(key === 'compatible' ? '6-2\\cdot3=0' : '7-2\\cdot3=1\\ne0')}</div>
    <p>${c.outcome}</p><p>Rank of A: ${c.trace.rank}. Rank of the augmented matrix: ${c.trace.augmentedRank}.
    Dependent coefficient rows can describe either redundant or conflicting constraints.</p></details>`;
}
export function updateContrastLinks(root: HTMLElement, milestone: string) {
  root.querySelectorAll<HTMLAnchorElement>('[data-contrast-case]').forEach(link => { link.hash = milestone; });
}
