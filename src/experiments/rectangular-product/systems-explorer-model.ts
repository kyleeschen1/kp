import { variable } from '../../math/expression.ts';
import { generateSystemProblem, type SystemProblemRequest } from '../../math/system-generator.ts';
import { createKpScalarExpression } from '../../math/typed-semantic-math.ts';
import { constant, divide } from '../../math/expression.ts';
import type { KpNormalizedRational } from '../../../domains/math/exact-rational.ts';
import { addKpRationals, createKpRational, multiplyKpRationals } from '../../../domains/math/exact-rational.ts';
import { readExactRowValue } from '../../math/row-exact-value.ts';
import { requireCollectionSource } from './collection-source.ts';
import { linearSystemSource } from './linear-system-source.ts';
import { composeCheckedRowSteps, projectSystemCollection } from './row-composition-model.ts';
import { rowValueLatex } from './row-value-latex.ts';

const valueLatex = (value: KpNormalizedRational) => rowValueLatex(createKpScalarExpression({ id: 'answer.value', expression: divide(constant(Number(value.numerator)), constant(Number(value.denominator))) }));
const valueText = (value: KpNormalizedRational) => value.denominator === 1n ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

export function createSystemsExplorer(request: SystemProblemRequest) {
  if (!Number.isInteger(request.seed) || request.seed < 0 || request.seed > 0xffffffff)
    return { status: 'repair-required' as const, path: 'seed', message: 'Use an unsigned 32-bit integer seed.' };
  // Retry only presentation-ineligible candidates; the original seed reproduces
  // the same first admitted problem. No unsupported animation is substituted.
  for (let attempt = 0; attempt < 64; attempt++) {
    const generated = generateSystemProblem({ ...request, seed: (request.seed + attempt * 7919) >>> 0 });
    if (generated.status !== 'generated') return generated;
    const trace = generated.solution, n = request.size;
    if (!trace.steps.length || trace.steps.length > 16) continue;
    const inputs = ['x', 'y', 'z'].slice(0, n).map(variable);
    const template = requireCollectionSource({ ...linearSystemSource, id: `${generated.id}.presentation`,
      coefficients: Array.from({ length: n }, () => Array.from({ length: n }, () => 1)), inputs,
      domain: { kind: 'linear-system', rhs: Array.from({ length: n }, () => 0) }, focus: { row: 0, column: 0 } });
    const projected = projectSystemCollection(template, generated.initial);
    if (projected.status !== 'projected') continue;
    const answer = trace.solution.kind === 'none'
      ? `Row ${trace.solution.contradictionRow + 1} requires zero to equal a nonzero number. No assignment can satisfy this system.`
      : trace.solution.kind === 'unique' ? 'Every unknown has a pivot. The reduced equations specify exactly one solution.'
        : `${n - trace.rank} free ${n - trace.rank === 1 ? 'variable remains. Choose its value' : 'variables remain. Choose their values'}; the pivot equations determine the others. There are infinitely many real solutions.`;
    const steps = trace.steps.map((step, i) => {
      const op = step.checked.operation;
      const during = op.kind === 'swap' ? `Exchange complete rows ${op.first + 1} and ${op.second + 1}, including their right-hand sides.`
        : op.kind === 'scale' ? `Scale row ${op.row + 1} by ${valueText(op.factor)} to make its pivot 1. Apply the factor to its right-hand side too.`
          : `Add ${valueText(op.factor)} times row ${op.sourceRow + 1} to row ${op.targetRow + 1}. Cancel the ${['x', 'y', 'z'][step.pivotColumn]} coefficient; retain the source row.`;
      const after = i === trace.steps.length - 1 ? answer : i + 1 === trace.echelonStepCount
        ? `Echelon form: ${trace.rank} pivots, with zeros below them. Now inspect the constraints or continue to reduced form.`
        : `Operation ${i + 1} is complete. The solution set is unchanged.`;
      return Object.freeze({ id: `step-${i + 1}`, operation: op, during, after, checked: step.checked });
    });
    const model = composeCheckedRowSteps({ before: projected.model, title: 'Explore a linear system',
      introduction: 'Generate a system, follow exact elimination, and inspect what its pivots and zero rows imply.',
      annotations: { equations: 'Start with ordinary equations. Every operation will preserve all their joint solutions.',
        matrix: 'Coefficients follow the ordered unknowns. Keep the right-hand-side vector with its rows.', expanded: answer } }, steps);
    if (model.status !== 'compiled') continue;
    const vector = (values: readonly KpNormalizedRational[]) => `\\begin{bmatrix}${values.map(valueLatex).join('\\\\')}\\end{bmatrix}`;
    const solutionLatex = trace.solution.kind === 'none' ? '\\varnothing'
      : trace.solution.kind === 'unique' ? vector(trace.solution.values)
        : `${vector(trace.solution.particular)}${trace.solution.directions.map((direction, i) => `+t_${i + 1}${vector(direction)}`).join('')},\\quad ${trace.solution.directions.map((_, i) => `t_${i + 1}\\in\\mathbb{R}`).join(',')}`;
    const questions = [
      { id: 'outcome', title: 'How many solutions?', milestone: 'expanded', answer },
      { id: 'echelon', title: 'What does echelon form show?', milestone: trace.echelonStepCount ? `step-${trace.echelonStepCount}` : 'matrix',
        answer: `There are ${trace.rank} pivots. Zeros below each pivot expose which constraints add independent information. Echelon form alone does not guarantee consistency; inspect the right-hand side of every zero row.` },
      { id: 'independence', title: 'Are the rows and columns independent?', milestone: 'expanded',
        answer: `The coefficient matrix has rank ${trace.rank} and ${n} rows and columns. Its rows are ${trace.rowsIndependent ? 'independent' : 'dependent'}; its columns are ${trace.columnsIndependent ? 'independent' : 'dependent'}. ${trace.solution.kind === 'none' ? 'Dependence alone did not cause inconsistency: the right-hand side conflicts with a relation among the rows.' : 'Consistency additionally depends on the right-hand side.'}` },
      { id: 'free', title: 'Which variables are free?', milestone: 'expanded',
        answer: trace.solution.kind === 'infinite' ? `The nonpivot variables are ${trace.solution.freeColumns.map(c => ['x', 'y', 'z'][c]).join(', ')}. Each parameter in the solution family is independently selectable; the pivot variables then adjust.`
          : trace.solution.kind === 'none' ? 'There is no solution family to parameterize: a contradictory row excludes every assignment.' : 'None: every variable has a pivot.' },
      { id: 'preserve', title: 'Why do the operations preserve solutions?', milestone: 'matrix',
        answer: 'Each operation has an inverse: swap again, divide by the nonzero scale factor, or subtract the multiple just added. Applying it to the entire equation, including the right-hand side, preserves exactly the same assignments.' },
    ];
    const solution = trace.solution;
    const inspectParameters = (parameters: readonly number[]) => {
      if (solution.kind !== 'infinite' || parameters.length !== solution.directions.length || parameters.some(p => !Number.isSafeInteger(p) || Math.abs(p) > 9))
        return { status: 'repair-required' as const, message: 'Supply one integer parameter from -9 to 9 per free variable.' };
      const point = solution.particular.map((value, c) => solution.directions.reduce((sum, direction, i) =>
        addKpRationals(sum, multiplyKpRationals(direction[c]!, createKpRational(BigInt(parameters[i]!)))), value));
      const image = generated.initial.coefficients.rows.map(row => row.reduce((sum, coefficient, c) =>
        addKpRationals(sum, multiplyKpRationals(readExactRowValue(coefficient)!, point[c]!)), createKpRational(0n)));
      return { status: 'evaluated' as const, point, image, latex: `A${vector(point)}=${vector(image)}=b` };
    };
    return { status: 'ready' as const, model, generated, questions, solutionLatex, attempt, inspectParameters };
  }
  return { status: 'repair-required' as const, path: 'presentation', message: 'No eligible small exact trace was found for this seed. Try another seed; the existing problem remains valid.' };
}
