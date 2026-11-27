import fixture from '../../content/notebooks/matrix-object-exemplar.json';
import { readNotebook } from './model.ts';
export { createMatrixExtension as createMathematicalExtension } from './matrix-controller.ts';
export const seed = readNotebook(fixture);
export function prepare(value: unknown) {
  const notebook = readNotebook(value);
  if (!notebook.matrixResources || notebook.cells.some(c => c.type === 'story' || c.type === 'mathObject')) throw new Error('This matrix exemplar uses its own resources and views.');
  return { notebook };
}
