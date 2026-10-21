// Complete source author: construct actual products and query their results.
import { matrixInputs } from '../../../content/authoring/convergence/matrices.ts';
import * as M from '../../../src/math/authoring/matrices.ts';
export const results = matrixInputs.map(({ id, product }) => ({ id, result: M.evaluate(product.result, {}) }));
