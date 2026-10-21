import * as algebra from '../../../src/authoring/algebra/compile.ts';
export function compile(source: unknown) {
  const draft = algebra.compile(source);
  return { source: algebra.serialize(draft), revision: draft.revisionId, animation: draft.animation };
}
