import { constant, variable } from '../../math/expression.ts';
import { createKpScalarExpression } from '../../math/typed-semantic-math.ts';
import { eliminateSystem } from '../../math/system-elimination.ts';
import { readExactRowValue } from '../../math/row-exact-value.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { requireCollectionSource } from './collection-source.ts';
import { linearSystemSource } from './linear-system-source.ts';
import { composeCheckedRowSteps, projectSystemCollection } from './row-composition-model.ts';
import { contrastSources } from './systems-contrast-sources.ts';

export type ContrastCase = 'compatible' | 'incompatible';
type ContrastSize = keyof typeof contrastSources;

function buildPair(size: ContrastSize) {
  const source = contrastSources[size], id = size === 2 ? 'consistency' : 'consistency-three';
  const template = requireCollectionSource({ ...linearSystemSource, id: `${id}.shared`,
    coefficients: source.coefficients, inputs: source.unknowns.map(variable),
    domain: { kind: 'linear-system', rhs: source.rhs }, focus: { row: size - 1, column: 0 } });
  const retainedRhs = source.rhs.slice(0, -1).map((n, i) => createKpScalarExpression({ id: `${id}.b.${i === 0 ? 'first' : i}`, expression: constant(n) }));
  function buildCase(key: ContrastCase) {
    // A is the same referent in both systems. Only the changed RHS component
    // receives a new identity; equal-looking derived results remain distinct.
    const initial = Object.freeze({ coefficients: template.product.left,
      rhs: Object.freeze([...retainedRhs, createKpScalarExpression({ id: `${id}.${key}.b.${size === 2 ? 'second' : 'third'}`,
        expression: constant(source.rhs[size - 1]! + (key === 'compatible' ? 0 : 1)) })]) });
    const trace = eliminateSystem(`${id}.${key}`, initial);
    if (trace.status !== 'solved') throw new Error(`${trace.path}: ${trace.message}`);
    if (trace.steps.length !== source.steps.length) throw new Error('Contrast annotations must match the complete checked trace.');
    const projected = projectSystemCollection(template, initial);
    if (projected.status !== 'projected') throw new Error(`${projected.path}: ${projected.message}`);
    const residual = readExactRowValue(trace.echelon.rhs[size - 1]!)!;
    const compatible = trace.solution.kind === 'infinite';
    const outcome = compatible
      ? `The ${source.rowName} row says 0 = 0. It adds no constraint. ${source.compatibleSolution}`
      : `The ${source.rowName} row says 1 = 0. This is impossible for every ${source.unknowns.join(' and ')}: there are no solutions.`;
    const model = composeCheckedRowSteps({ before: projected.model,
      title: 'Same coefficients, different answers',
      introduction: source.introduction,
      annotations: {
        equations: source.equations[compatible ? 0 : 1], matrix: source.matrix, expanded: outcome,
      } }, trace.steps.map((step, i) => ({ id: source.steps[i]!.id, operation: step.checked.operation, checked: step.checked,
        during: source.steps[i]!.during, after: source.steps[i]!.after || outcome })));
    if (model.status !== 'compiled') throw new Error(`${model.path}: ${model.message}`);
    return Object.freeze({ key, size, initial, trace, model, residual, outcome });
  }
  return Object.freeze({ compatible: buildCase('compatible'), incompatible: buildCase('incompatible') });
}

export const consistencyPairs = Object.freeze({ 2: buildPair(2), 3: buildPair(3) });
export const consistencyCases = consistencyPairs[2];
export function selectConsistencyCase(key: string, size = '2') {
  if (size !== '2' && size !== '3') return { status: 'repair-required' as const, path: 'size', message: 'Choose size 2 or 3.' };
  if (key !== 'compatible' && key !== 'incompatible')
    return { status: 'repair-required' as const, path: 'case', message: 'Choose compatible or incompatible.' };
  return { status: 'ready' as const, selected: consistencyPairs[size][key] };
}
const math = (latex: string) => renderLatexToHtml(latex, { output: 'htmlAndMathml' });
export function contrastControls(key: ContrastCase, size: ContrastSize = 2) {
  const source = contrastSources[size];
  return `<nav class="matrix-controls" aria-label="Choose coefficient dependency">
    ${([2, 3] as const).map(n => `<a href="?view=row-composition&amp;example=contrast&amp;size=${n}&amp;case=${key}#equations" ${n === size ? 'aria-current="page"' : ''}>${n} × ${n}: ${n === 2 ? 'doubled row' : 'sum of rows'}</a>${n === size ? ' (shown)' : ''}`).join(' · ')}
    </nav><nav class="matrix-controls" aria-label="Compare right-hand sides">
    ${(['compatible', 'incompatible'] as const).map(k => `<a data-contrast-case="${k}" ${k === key ? 'aria-current="page"' : ''}
      href="?view=row-composition&amp;example=contrast&amp;size=${size}&amp;case=${k}#equations">b = (${source.rhs.map((v, i) => v + (i === size - 1 && k === 'incompatible' ? 1 : 0)).join(', ')})</a>${k === key ? ' (shown)' : ''}`).join(' · ')}
    </nav><p class="matrix-help">Switch right-hand sides at the same named milestone. This compares two systems; it is not a solution-preserving operation between them.</p>`;
}
export function contrastReading(key: ContrastCase, size: ContrastSize = 2) {
  const c = consistencyPairs[size][key], source = contrastSources[size];
  return `<details data-contrast-reading><summary>Why the right-hand side matters</summary>
    <p>The coefficient relation is unchanged: ${source.relation}. For all equations to hold, their right-hand sides must obey that same relation.</p>
    <div class="pour-static">${math(source.relationLatex)} ${math(source.checks[key === 'compatible' ? 0 : 1])}</div>
    <p>${c.outcome}</p><p>Rank of A: ${c.trace.rank}. Rank of the augmented matrix: ${c.trace.augmentedRank}.
    Dependent coefficient rows can describe either redundant or conflicting constraints.</p></details>`;
}
export function updateContrastLinks(root: HTMLElement, milestone: string) {
  root.querySelectorAll<HTMLAnchorElement>('[data-contrast-case]').forEach(link => { link.hash = milestone; });
}
