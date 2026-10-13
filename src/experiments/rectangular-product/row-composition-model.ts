import { checkLinearSystemRowOperation, parseRowFactor, readExactRowValue, type LinearSystem } from '../../math/linear-system-row-operation.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { expressionToLatex } from '../../math/expression.ts';
import type { KpScalarExpression } from '../../math/typed-semantic-math.ts';
import type { CollectionModel } from './collection-source.ts';
import { linearSystemModel } from './linear-system-source.ts';
import { projectRowEquations } from './row-equations.ts';
import { rowOperationLatex, rowSystemLatex } from './row-workbench-model.ts';

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

const before = linearSystemModel;
const initial = { coefficients: before.product.left, rhs: before.outputs.map(output => {
  if (output.kind !== 'constraint-rhs') throw new Error('Composition requires independent constraint RHS values.');
  return output.value;
}) };
const factor = parseRowFactor('1');
if (factor.status !== 'parsed') throw new Error(factor.message);
const step = checkLinearSystemRowOperation({ id: 'system.composition.add-second-to-first', before: initial,
  operation: { kind: 'add', sourceRow: 1, targetRow: 0, factor: factor.value } });
if (step.status !== 'checked') throw new Error(`${step.path}: ${step.message}`);
const projected = projectSystemCollection(before, step.after);
if (projected.status !== 'projected') throw new Error(`${projected.path}: ${projected.message}`);
const matrixStop = before.stops[5]!, transferMs = before.durationMs * matrixStop;
export const rowCompositionDurationMs = transferMs * 2 + 2800;
export const rowCompositionStops = [0, transferMs / rowCompositionDurationMs, (transferMs + 2800) / rowCompositionDurationMs, 1] as const;
export const rowComposition = Object.freeze({ before, after: projected.model, step, matrixStop });
export const rowCompositionBeats = [
  { id: 'equations', cue: 'Two equations, one set of unknowns. Follow the same coefficients through three representations.' },
  { id: 'matrix', cue: 'Collect x, y and z into one vector. The coefficients and right-hand sides stay with their equations.' },
  { id: 'changed', cue: 'Add row 2 to row 1, including the right-hand side. Keep row 2 so the change can be undone.' },
  { id: 'expanded', cue: 'Expand the new rows: 6 = 2x + z and −1 = y − 2z. The equations changed; their joint solutions did not.' },
] as const;
export function sampleRowComposition(progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Composition progress must be finite.');
  const p = Math.max(0, Math.min(1, progress));
  const index = rowCompositionStops.findIndex(stop => stop >= p);
  const phase = index === 0 ? 0 : index - 1 + (p - rowCompositionStops[index - 1]!) / (rowCompositionStops[index]! - rowCompositionStops[index - 1]!);
  return { progress: p, phase, index, beat: rowCompositionBeats[index]!,
    layer: p < rowCompositionStops[1] ? 'before' as const : p < rowCompositionStops[2] ? 'operation' as const : 'after' as const,
    local: p < rowCompositionStops[1] ? p / rowCompositionStops[1] * matrixStop
      : p < rowCompositionStops[2] ? (p - rowCompositionStops[1]) / (rowCompositionStops[2] - rowCompositionStops[1])
      : (1 - p) / (1 - rowCompositionStops[2]) * matrixStop };
}
export const rowCompositionReading = `\\begin{gathered}${before.expandedEquation}\\\\[1em]${before.equation}\\\\[1em]
${rowOperationLatex(step.operation)}\\\\[1em]${projected.model.equation}\\\\[1em]${projected.model.expandedEquation}\\end{gathered}`;
