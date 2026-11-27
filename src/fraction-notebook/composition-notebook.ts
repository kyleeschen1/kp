import fixture from '../../content/notebooks/composition-object-exemplar.json';
import { readNotebook } from './model.ts';
export { createCompositionExtension as createMathematicalExtension } from './composition-controller.ts';
export const seed = readNotebook(fixture);
export function prepare(value: unknown) {
  const notebook = readNotebook(value);
  if (!notebook.compositionResources || notebook.cells.some(c => c.type === 'story' || c.type === 'mathObject' || c.type === 'matrixObject' || c.type === 'projectionObject'))
    throw new Error('This composition notebook uses its own matrix pairs and views.');
  return { notebook };
}
