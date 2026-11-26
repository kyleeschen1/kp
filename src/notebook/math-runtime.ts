import { assembleKpSemanticStateModel } from '../semantic-state/authoring-model-assembly.ts';
import { kpStateDerived, kpStateGroup, kpStateValue } from '../semantic-state/authoring-schema.ts';
import { defineKpSemanticStateTransform } from '../semantic-state/authoring-state-transform.ts';
import { createKpSemanticDerivedValueCache } from '../semantic-state/derived-cache.ts';
import { quadraticExpression, quadraticDerivative, tangentExpression, type QuadraticCoefficients } from '../math/authoring/quadratic.ts';
import { type MathExpression } from '../math/expression.ts';
import { readNotebookMathematics, type MathResource, type NotebookMathematics } from './math-model.ts';
import { type UUID, NotebookGap } from './model.ts';

function createQuadraticKernel(notebook: UUID, id: UUID) {
  const calls = { expression: 0, derivative: 0, tangent: 0 };
  const model = assembleKpSemanticStateModel({ namespace: `notebook.${notebook}.resource.${id}`,
    schema: kpStateGroup({ a: kpStateValue<number>(1), b: kpStateValue<number>(0), c: kpStateValue<number>(0), at: kpStateValue<number>(1),
      expression: kpStateDerived<MathExpression>(), derivative: kpStateDerived<MathExpression>(), tangent: kpStateDerived<MathExpression>() }),
    derive: ({ refs, derive }) => [
      derive({ target: refs.expression, dependencies: [refs.a, refs.b, refs.c], compute: ([a, b, c]) => { calls.expression++; return quadraticExpression({ a, b, c }); } }),
      // A vertical translation has zero derivative, so c is deliberately not a
      // dependency. The existing algebra owner still derives the expression.
      derive({ target: refs.derivative, dependencies: [refs.a, refs.b], compute: ([a, b]) => { calls.derivative++; return quadraticDerivative({ a, b, c: 0 }); } }),
      derive({ target: refs.tangent, dependencies: [refs.expression, refs.derivative, refs.at], compute: ([expression, derivative, at]) => { calls.tangent++; return tangentExpression(expression, derivative, at); } })
    ] });
  let snapshot = model.initial, values = { a: 1, b: 0, c: 0, at: 1 }, sequence = 0;
  const cache = createKpSemanticDerivedValueCache({ maxEntries: 3 });
  return {
    read(coefficients: QuadraticCoefficients, kind: MathResource['kind'], at = values.at) {
      const next = { ...coefficients, at };
      if ((['a', 'b', 'c', 'at'] as const).some(key => next[key] !== values[key])) {
        // No kernel snapshot escapes this owner. User history is the persisted
        // notebook/ProseMirror history, so periodic rebasing bounds runtime
        // entity-version retention without discarding a user undo point.
        if (sequence >= 128) { snapshot = model.initial; sequence = 0; cache.reset(); values = { a: 1, b: 0, c: 0, at: 1 }; }
        if ((['a', 'b', 'c', 'at'] as const).some(key => next[key] !== values[key])) {
          const transform = defineKpSemanticStateTransform({ compiled: model.compiled, handles: model.handles, id: 'edit-parameters', author(state) {
            for (const key of ['a', 'b', 'c', 'at'] as const) if (next[key] !== state[key].read()) state[key].update(() => next[key]);
          } });
          snapshot = transform.apply(snapshot, `edit-${++sequence}`).commit.after;
        }
        values = next;
      }
      const target = kind === 'quadratic' ? model.handles.refs.expression : kind === 'derivative' ? model.handles.refs.derivative : model.handles.refs.tangent;
      return cache.evaluate({ graph: model.graph, snapshot, target });
    },
    inspect: () => ({ calls: { ...calls }, cache: cache.inspect(), namespace: model.compiled.namespace, retainedEdits: sequence }),
    dispose: () => cache.dispose()
  };
}

/** One evaluator owner per mounted notebook. Resources and occurrences are data;
 * executable recipes are restored here, never deserialized or inferred by views. */
export function createNotebookMathRuntime(notebook: UUID) {
  const kernels = new Map<UUID, ReturnType<typeof createQuadraticKernel>>();
  let document: NotebookMathematics = { schemaVersion: 1, resources: [] }, disposed = false;
  const active = () => { if (disposed) throw new NotebookGap('math-owner-closed', notebook, 'The notebook mathematical owner has closed.'); };
  const resource = (id: UUID): MathResource => {
    active(); const value = document.resources.find(item => item.id === id);
    if (!value) throw new NotebookGap('missing-math-resource', id, 'Restore the referenced mathematical resource.'); return value;
  };
  return {
    update(value: NotebookMathematics) {
      active(); document = readNotebookMathematics(value);
      const ids = new Set(document.resources.filter(r => r.kind === 'quadratic').map(r => r.id));
      for (const [id, kernel] of kernels) if (!ids.has(id)) { kernel.dispose(); kernels.delete(id); }
    },
    resource,
    expression(id: UUID): MathExpression {
      const requested = resource(id), source = requested.kind === 'quadratic' ? requested : resource(requested.source);
      if (source.kind !== 'quadratic') throw new NotebookGap('invalid-math-dependency', id, 'Expected a source quadratic.');
      let kernel = kernels.get(source.id);
      if (!kernel) { kernel = createQuadraticKernel(notebook, source.id); kernels.set(source.id, kernel); }
      return kernel.read(source.coefficients, requested.kind, requested.kind === 'tangent' ? requested.at : undefined);
    },
    inspect: () => [...kernels].map(([id, kernel]) => ({ id, ...kernel.inspect() })),
    dispose() { if (disposed) return; disposed = true; for (const kernel of kernels.values()) kernel.dispose(); kernels.clear(); }
  };
}
export type NotebookMathRuntime = ReturnType<typeof createNotebookMathRuntime>;
