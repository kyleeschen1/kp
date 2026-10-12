import { expressionToLatex } from '../../math/expression.ts';
import { checkLinearSystemRowAddition } from '../../math/linear-system-row-addition.ts';
import { linearSystemModel } from './linear-system-source.ts';

export const rowOperationBase = linearSystemModel;
const checked = checkLinearSystemRowAddition({ id: 'system.add-second-to-first', coefficients: linearSystemModel.product.left,
  rhs: linearSystemModel.outputs.map(output => { if (output.kind !== 'constraint-rhs') throw new Error('Row replacement requires system RHS referents.'); return output.value; }),
  sourceRow: 1, targetRow: 0, multiple: 1 });
if (checked.status !== 'checked') throw new Error(`${checked.path}: ${checked.message}`);
export const rowOperation = checked;
export const rowOperationBeats = [
  { id: 'system', cue: 'Start with the same system. Each coefficient row belongs with the number on the left.' },
  { id: 'choose', cue: 'Add row 2 to row 1. Keep row 2: we will need it to undo the change.' },
  { id: 'copy', cue: 'Bring row 1 above the matrix, then copy row 2 beneath it—including both right-hand sides.' },
  { id: 'add', cue: 'Add matching entries. The right-hand sides participate in exactly the same operation.' },
  { id: 'evaluate', cue: 'The y coefficients cancel: −1 + 1 = 0. The first right-hand side becomes 7 + (−1) = 6.' },
  { id: 'replace', cue: 'Settle the new row into place. Row 2 and the ordered unknowns have not changed.' },
  { id: 'why', cue: 'The solutions are unchanged: subtract the retained row 2 from the new row 1 to recover the original equation.' },
] as const;
export const rowOperationDurationMs = 27000;
export function sampleRowOperation(progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Row operation progress must be finite.');
  const p = Math.max(0, Math.min(1, progress)), phase = p * (rowOperationBeats.length - 1), index = Math.ceil(phase);
  return { progress: p, phase, index, beat: rowOperationBeats[index]! };
}
const matrix = (rows: readonly (readonly string[])[]) => `\\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\\end{bmatrix}`;
export const rowOperationAfterEquation = `${matrix(rowOperation.after.rhs.map(value => [expressionToLatex(value.expression)]))}=${matrix(rowOperation.after.coefficients.rows.map(row => row.map(value => expressionToLatex(value.expression))))}${matrix(rowOperationBase.inputs.map(value => [expressionToLatex(value.expression)]))}`;
export const rowOperationReading = `\\begin{gathered}${rowOperationBase.expandedEquation}\\\\[1em]
  R_1' = R_1 + R_2\\\\[1em]${rowOperationAfterEquation}\\\\[1em]
  6=2x+z,\\quad -1=y-2z\\\\[1em]R_1=R_1'-R_2
\\end{gathered}`;
