import { passage } from '../dot-product-passage/source.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';

// Occurrence IDs belong to this explanation; refs retain the mathematical
// objects. Rewording or moving a section does not create replacement operands.
interface Step {
  readonly id: string;
  readonly milestone: 0 | 1 | 2 | 3 | 4;
  readonly refs: readonly KpScalarValue[];
}
export const explanation = {
  id: 'dot-reading', role: 'goal', text: 'Understand how one row and one column produce one entry.',
  children: [
    { id: 'select', milestone: 0, refs: [...passage.cell.row.entries, ...passage.cell.column.entries] },
    { id: 'pair', milestone: 1, refs: passage.dot.pairs.flatMap(pair => [pair.left, pair.right]) },
    { id: 'multiply', milestone: 2, refs: passage.dot.pairs.map(pair => pair.product) },
    { id: 'add', milestone: 3, refs: passage.dot.pairs.map(pair => pair.product) },
    { id: 'result', milestone: 4, refs: [passage.dot.result] },
  ] satisfies readonly Step[],
  detour: { id: 'why-pair', parent: 'pair', role: 'why', refs: passage.dot.pairs },
} as const;
