import { createKpRational } from '../../domains/math/exact-rational.ts';
import { checkLinearSystemRowOperation, readExactRowValue } from './linear-system-row-operation.ts';
import type { KpScalarValue, KpTypedMatrix } from './typed-semantic-math.ts';

export interface RowAdditionInput {
  readonly id: string;
  readonly coefficients: KpTypedMatrix;
  readonly rhs: readonly KpScalarValue[];
  readonly sourceRow: number;
  readonly targetRow: number;
  readonly multiple: number;
}
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
const integer = (v: KpScalarValue) => v.expression.kind === 'constant' && Number.isSafeInteger(v.expression.value) ? v.expression.value : undefined;

/** Exact integer row replacement. The RHS is mandatory, so a coefficient-only
 * change cannot accidentally acquire solution-set-preservation authority. */
export function checkLinearSystemRowAddition(input: RowAdditionInput) {
  if (!Number.isSafeInteger(input.multiple)) return repair('multiple', 'This exact checker supports safe integer multiples.');
  if ([...input.coefficients.rows.flat(), ...input.rhs].some(v => integer(v) === undefined))
    return repair('entries', 'This bounded checker requires safe integer coefficients and right-hand sides.');
  const step = checkLinearSystemRowOperation({ id: input.id, before: input,
    operation: { kind: 'add', sourceRow: input.sourceRow, targetRow: input.targetRow, factor: createKpRational(BigInt(input.multiple)) } });
  if (step.status !== 'checked') return step;
  return Object.freeze({ status: 'checked' as const, id: input.id, sourceRow: input.sourceRow, targetRow: input.targetRow, multiple: input.multiple,
    before: step.before, after: step.after,
    contributions: Object.freeze(step.contributions.map(p => Object.freeze({ ...p, scaled: Number(readExactRowValue(p.scaled)!.numerator) }))),
    witness: Object.freeze({ relation: 'same-solution-set' as const,
      lawId: step.witness.lawId, inverseMultiple: -input.multiple,
      residualIdentity: 'target-next = target + multiple * source; source-next = source' as const }),
  });
}
export type CheckedRowAddition = Extract<ReturnType<typeof checkLinearSystemRowAddition>, { status: 'checked' }>;
