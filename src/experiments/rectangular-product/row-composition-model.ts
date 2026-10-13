import { checkLinearSystemRowOperation, parseRowFactor, readExactRowValue, type LinearSystem } from '../../math/linear-system-row-operation.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { expressionToLatex } from '../../math/expression.ts';
import type { KpScalarExpression } from '../../math/typed-semantic-math.ts';
import type { CollectionModel } from './collection-source.ts';
import { linearSystemModel } from './linear-system-source.ts';
import { projectRowEquations } from './row-equations.ts';
import { rowOperationLatex, rowSystemLatex } from './row-workbench-model.ts';
import { compileAuthoredRowSteps, type CompiledRowStep } from './row-authored-steps.ts';
import type { RowWorkbenchSource } from './row-workbench-source.ts';

const gap = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });

/** Project existing checked referents into collection's bounded presentation.
 * Numeric layout data is derived; it never replaces the supplied math objects. */
export function projectSystemCollection(template: CollectionModel, system: LinearSystem) {
  if (template.kind !== 'linear-system' || template.inputs.length !== 3 || system.coefficients.rowCount !== 2 || system.coefficients.columnCount !== 3 || system.rhs.length !== 2)
    return gap('shape', 'This composition needs two constraints and three unknowns.');
  const coefficients: number[][] = [];
  for (const [r, row] of system.coefficients.rows.entries()) {
    const values: number[] = [];
    for (const [c, value] of row.entries()) {
      const q = readExactRowValue(value);
      if (!q || q.denominator !== 1n || q.numerator < -9n || q.numerator > 9n)
        return gap(`coefficients.${r}.${c}`, 'Collection currently requires single-digit integer coefficients.');
      values.push(Number(q.numerator));
    }
    if (values.every(n => n === 0)) return gap(`coefficients.${r}`, 'A whole-zero row needs a separate collection presentation.');
    coefficients.push(values);
  }
  const rhs: KpScalarExpression[] = [];
  for (const [r, value] of system.rhs.entries()) {
    const q = readExactRowValue(value);
    if (value.kind !== 'scalar-expression' || !q || q.denominator !== 1n || q.numerator < -99n || q.numerator > 99n)
      return gap(`rhs.${r}`, 'Collection currently requires integer scalar RHS values from -99 to 99.');
    rhs.push(value);
  }
  const equations = projectRowEquations(system, template.inputs, template.id);
  const model: CollectionModel = Object.freeze({ ...template,
    coefficients: Object.freeze(coefficients.map(row => Object.freeze(row))),
    product: matrixProduct({ id: `${system.coefficients.id}.collection`, left: system.coefficients, right: template.product.right }),
    outputs: Object.freeze(rhs.map(value => Object.freeze({ kind: 'constraint-rhs' as const, id: value.id,
      value, latex: expressionToLatex(value.expression) }))),
    equation: rowSystemLatex(system, template.inputs),
    expandedEquation: `\\begin{gathered}${equations.rows.map(row => row.latex).join('\\\\')}\\end{gathered}`,
  });
  return { status: 'projected' as const, model };
}

const beatIds = ['equations', 'matrix', 'changed', 'expanded'] as const;
export interface RowCompositionSource {
  readonly id: string;
  readonly before: CollectionModel;
  readonly title: string;
  readonly introduction: string;
  // This presentation has only been established for one unscaled row copy.
  readonly operation: { readonly kind: 'add'; readonly sourceRow: 0 | 1; readonly targetRow: 0 | 1; readonly factor: 1 };
  readonly annotations: Readonly<Record<typeof beatIds[number], string>>;
}
export function compileRowComposition(source: RowCompositionSource) {
  if (!/^[A-Za-z][\w.-]*$/.test(source.id)) return gap('id', 'Supply a stable composition identifier.');
  for (const key of ['title', 'introduction'] as const)
    if (!source[key].trim() || source[key].length > 600) return gap(key, 'Supply nonempty plain text, up to 600 characters.');
  for (const id of beatIds)
    if (!source.annotations[id]?.trim() || source.annotations[id].length > 600) return gap(`annotations.${id}`, 'Supply nonempty plain text, up to 600 characters.');
  if (source.operation.kind !== 'add' || source.operation.factor !== 1)
    return gap('operation', 'This composition supports one unit row addition.');
  const before = source.before, rhs: KpScalarExpression[] = [];
  for (const [r, output] of before.outputs.entries()) {
    if (output.kind !== 'constraint-rhs') return gap(`before.outputs.${r}`, 'Composition requires independent constraint RHS values.');
    rhs.push(output.value);
  }
  const initial = { coefficients: before.product.left, rhs };
  const initialProjection = projectSystemCollection(before, initial);
  if (initialProjection.status !== 'projected') return gap(`before.${initialProjection.path}`, initialProjection.message);
  const factor = parseRowFactor('1');
  if (factor.status !== 'parsed') return gap('operation.factor', factor.message);
  const step = checkLinearSystemRowOperation({ id: source.id, before: initial, operation: { ...source.operation, factor: factor.value } });
  if (step.status !== 'checked') return gap(`operation.${step.path}`, step.message);
  const projected = projectSystemCollection(before, step.after);
  if (projected.status !== 'projected') return gap(`after.${projected.path}`, projected.message);
  return assembleComposition(source, [Object.freeze({ id: 'changed', operation: step.operation,
    during: source.annotations.changed, after: source.annotations.changed, checked: step })], projected.model);
}

export interface RowSequenceCompositionSource {
  readonly id: string;
  readonly before: CollectionModel;
  readonly title: string;
  readonly introduction: string;
  readonly steps: RowWorkbenchSource['steps'];
  readonly annotations: Readonly<Record<'equations' | 'matrix' | 'expanded', string>>;
}

/** The collection envelope is checked for every intermediate system, before a
 * player can mount. Unsupported endpoints never become a partial animation. */
export function compileRowSequenceComposition(source: RowSequenceCompositionSource) {
  if (!/^[A-Za-z][\w.-]*$/.test(source.id)) return gap('id', 'Supply a stable composition identifier.');
  for (const key of ['title', 'introduction'] as const)
    if (!source[key].trim() || source[key].length > 600) return gap(key, 'Supply nonempty plain text, up to 600 characters.');
  for (const id of ['equations', 'matrix', 'expanded'] as const)
    if (!source.annotations[id]?.trim() || source.annotations[id].length > 600)
      return gap(`annotations.${id}`, 'Supply nonempty plain text, up to 600 characters.');
  if (!source.steps.length || source.steps.length > 8) return gap('steps', 'This composed presentation supports one to eight operations.');
  if (source.steps.some(step => ['equations', 'matrix', 'expanded'].includes(step.id)))
    return gap('steps', 'Step identifiers must not replace the collection or expansion milestones.');
  const rhs: KpScalarExpression[] = [];
  for (const [r, output] of source.before.outputs.entries()) {
    if (output.kind !== 'constraint-rhs') return gap(`before.outputs.${r}`, 'Composition requires independent constraint RHS values.');
    rhs.push(output.value);
  }
  const initial = { coefficients: source.before.product.left, rhs };
  const initialProjection = projectSystemCollection(source.before, initial);
  if (initialProjection.status !== 'projected') return gap(`before.${initialProjection.path}`, initialProjection.message);
  const sequence = compileAuthoredRowSteps(source.id, initial, source.steps);
  if (sequence.status !== 'compiled') return sequence;
  let after = source.before;
  for (const [i, step] of sequence.steps.entries()) {
    const projection = projectSystemCollection(source.before, step.checked.after);
    if (projection.status !== 'projected') return gap(`steps.${i}.after.${projection.path}`, projection.message);
    after = projection.model;
  }
  // Short authored IDs are the stable host milestones; checked IDs retain the
  // source namespace and derivation provenance independently of URL spelling.
  return assembleComposition(source, sequence.steps.map((step, i) => Object.freeze({ ...step, id: source.steps[i]!.id })), after);
}

function assembleComposition(source: Pick<RowSequenceCompositionSource, 'before' | 'title' | 'introduction' | 'annotations'>,
  steps: readonly CompiledRowStep[], after: CollectionModel) {
  const before = source.before, matrixStop = before.stops[5]!, transferMs = before.durationMs * matrixStop;
  const durationMs = transferMs * 2 + 2800 * steps.length;
  const stops: [number, number, number, ...number[]] = [0, transferMs / durationMs, (transferMs + 2800) / durationMs,
    ...steps.slice(1).map((_, i) => (transferMs + 2800 * (i + 2)) / durationMs), 1];
  const reading = `\\begin{gathered}${before.expandedEquation}\\\\[1em]${before.equation}\\\\[1em]${steps.map(step =>
    `${rowOperationLatex(step.operation)}\\\\[1em]${rowSystemLatex(step.checked.after, before.inputs)}`).join('\\\\[1em]')}\\\\[1em]${after.expandedEquation}\\end{gathered}`;
  const beats = [{ id: 'equations', cue: source.annotations.equations }, { id: 'matrix', cue: source.annotations.matrix },
    ...steps.map(step => ({ id: step.id, cue: step.after })), { id: 'expanded', cue: source.annotations.expanded }];
  return Object.freeze({ status: 'compiled' as const, before, after, step: steps[0]!.checked,
    steps: Object.freeze(steps), matrixStop, title: source.title, introduction: source.introduction,
    durationMs, stops: Object.freeze(stops), reading, beats: Object.freeze(beats.map(beat => Object.freeze(beat))) });
}
export type RowComposition = Extract<ReturnType<typeof compileRowComposition>, { status: 'compiled' }>;
export function requireRowComposition(source: RowCompositionSource): RowComposition {
  const result = compileRowComposition(source);
  if (result.status !== 'compiled') throw new Error(`${result.path}: ${result.message}`);
  return result;
}
export const originalRowCompositionSource: RowCompositionSource = {
  id: 'system.composition.add-second-to-first', before: linearSystemModel,
  title: 'Equations, through a matrix and back',
  introduction: 'Collect the unknowns, add the second row to the first, then expand the new equations. Follow the coefficients and right-hand sides throughout.',
  operation: { kind: 'add', sourceRow: 1, targetRow: 0, factor: 1 },
  annotations: {
    equations: 'Two equations, one set of unknowns. Follow the same coefficients through three representations.',
    matrix: 'Collect x, y and z into one vector. The coefficients and right-hand sides stay with their equations.',
    changed: 'Add row 2 to row 1, including the right-hand side. Keep row 2 so the change can be undone.',
    expanded: 'Expand the new rows: 6 = 2x + z and −1 = y − 2z. The equations changed; their joint solutions did not.',
  },
};
export const rowComposition = requireRowComposition(originalRowCompositionSource);
export const rowCompositionDurationMs = rowComposition.durationMs;
export const rowCompositionStops = rowComposition.stops;
export const rowCompositionBeats = rowComposition.beats;
export const rowCompositionReading = rowComposition.reading;
export function sampleRowComposition(progress: number) { return sampleCompiledRowComposition(rowComposition, progress); }
export function sampleCompiledRowComposition(model: RowComposition, progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Composition progress must be finite.');
  const p = Math.max(0, Math.min(1, progress));
  const { stops: rowCompositionStops, beats: rowCompositionBeats, matrixStop } = model;
  const index = rowCompositionStops.findIndex(stop => stop >= p);
  const phase = index === 0 ? 0 : index - 1 + (p - rowCompositionStops[index - 1]!) / (rowCompositionStops[index]! - rowCompositionStops[index - 1]!);
  const start = rowCompositionStops[1]!, end = rowCompositionStops[rowCompositionStops.length - 2]!;
  const operationIndex = Math.min(model.steps.length - 1, Math.max(0,
    rowCompositionStops.slice(2, -1).findIndex(stop => p < stop)));
  const operationStart = rowCompositionStops[operationIndex + 1]!, operationEnd = rowCompositionStops[operationIndex + 2]!;
  const layer = p < start ? 'before' as const : p < end ? 'operation' as const : 'after' as const;
  const beat = layer === 'operation' && p > operationStart
    ? { id: model.steps[operationIndex]!.id, cue: model.steps[operationIndex]!.during } : rowCompositionBeats[index]!;
  return { progress: p, phase, index, beat, operationIndex, layer,
    local: layer === 'before' ? p / start * matrixStop
      : layer === 'operation' ? Math.max(0, Math.min(1, (p - operationStart) / (operationEnd - operationStart)))
      : (1 - p) / (1 - end) * matrixStop };
}
