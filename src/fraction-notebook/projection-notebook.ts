import fixture from '../../content/notebooks/projection-object-exemplar.json';
import { readNotebook } from './model.ts';
export { createProjectionExtension as createMathematicalExtension } from './projection-controller.ts';
export const seed = readNotebook(fixture);
export function prepare(value: unknown) {
  const notebook = readNotebook(value);
  if (!notebook.projectionResources || notebook.cells.some(c => c.type === 'story' || c.type === 'mathObject' || c.type === 'matrixObject'))
    throw new Error('This projection notebook uses its own vector pairs and views.');
  return { notebook };
}
