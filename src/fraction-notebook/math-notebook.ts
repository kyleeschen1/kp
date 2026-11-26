import fixture from '../../content/notebooks/math-object-exemplar.json';
import { readNotebook } from './model.ts';
export { createMathematicalExtension } from './math-controller.ts';
export const seed = readNotebook(fixture);
export function prepare(value: unknown) {
  const notebook = readNotebook(value);
  if (!notebook.mathematics || notebook.cells.some(cell => cell.type === 'story')) throw new Error('This mathematical exemplar uses its own resources and views.');
  return { notebook };
}
