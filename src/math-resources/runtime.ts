import { constant } from '../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrix, multiplyKpTypedMatrices, evaluateKpTypedMatrix,
  projectKpTypedMathToLatex, type KpTypedMatrix } from '../math/typed-semantic-math.ts';
import { createKpTypedMathStateValue } from '../math/typed-math-state-value.ts';
import { assembleKpSemanticStateModel } from '../semantic-state/authoring-model-assembly.ts';
import { kpStateDerived, kpStateGroup, kpStateValue } from '../semantic-state/authoring-schema.ts';
import { defineKpSemanticStateTransform } from '../semantic-state/authoring-state-transform.ts';
import { createKpSemanticDerivedValueCache } from '../semantic-state/derived-cache.ts';
import { MathResourceGap, readMatrixVectorDocument, type MatrixVectorDocument, type Vector2 } from './model.ts';
import { createMatrixResourceExplanationOwner } from './explanation.ts';

/** Source UUIDs survive remounts; a runtime owns only disposable derived state.
 * The existing typed-math owner supplies multiplication, values and notation. */
export function createMatrixVectorRuntime(initial: MatrixVectorDocument) {
  let document = readMatrixVectorDocument(initial), disposed = false, edits = 0;
  const identity = { document: document.id, matrix: document.matrix.id, vector: document.vector.id, result: document.result.id };
  const calls = { matrix: 0, vector: 0, product: 0 };
  const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
  const model = assembleKpSemanticStateModel({ namespace: `matrix-resource.${document.id}`,
    schema: kpStateGroup({ a00: kpStateValue<number>(1), a01: kpStateValue<number>(0), a10: kpStateValue<number>(0), a11: kpStateValue<number>(1),
      x: kpStateValue<number>(0), y: kpStateValue<number>(0), matrix: kpStateDerived<KpTypedMatrix<2, 2>>(),
      vector: kpStateDerived<KpTypedMatrix<2, 1>>(), product: kpStateDerived<KpTypedMatrix<2, 1>>() }),
    derive: ({ refs, derive }) => [
      derive({ target: refs.matrix, dependencies: [refs.a00, refs.a01, refs.a10, refs.a11], compute: ([a, b, c, d]) => {
        calls.matrix++; return createKpTypedMathStateValue(createKpTypedMatrix({ id: identity.matrix, rows: [
          [scalar(`${identity.matrix}.00`, a), scalar(`${identity.matrix}.01`, b)],
          [scalar(`${identity.matrix}.10`, c), scalar(`${identity.matrix}.11`, d)] ] as const }));
      } }),
      derive({ target: refs.vector, dependencies: [refs.x, refs.y], compute: ([x, y]) => {
        calls.vector++; return createKpTypedMathStateValue(createKpTypedMatrix({ id: identity.vector, rows: [[scalar(`${identity.vector}.0`, x)], [scalar(`${identity.vector}.1`, y)]] as const }));
      } }),
      derive({ target: refs.product, dependencies: [refs.matrix, refs.vector], compute: ([matrix, vector]) => {
        calls.product++; return createKpTypedMathStateValue(multiplyKpTypedMatrices({ id: identity.result, left: matrix, right: vector }));
      } })
    ] });
  let snapshot = model.initial, previous: readonly number[] = [1, 0, 0, 1, 0, 0];
  const cache = createKpSemanticDerivedValueCache({ maxEntries: 3 });
  const explanationOwner = createMatrixResourceExplanationOwner();
  const active = () => { if (disposed) throw new MathResourceGap('owner-closed', identity.document, 'This evaluator is disposed.'); };
  const values = () => {
    active();
    return { matrix: cache.evaluate({ graph: model.graph, snapshot, target: model.handles.refs.matrix }),
      vector: cache.evaluate({ graph: model.graph, snapshot, target: model.handles.refs.vector }),
      product: cache.evaluate({ graph: model.graph, snapshot, target: model.handles.refs.product }) };
  };
  function update(raw: MatrixVectorDocument) {
    active(); const next = readMatrixVectorDocument(raw);
    if (next.id !== identity.document || next.matrix.id !== identity.matrix || next.vector.id !== identity.vector || next.result.id !== identity.result)
      throw new MathResourceGap('identity-changed', next.id, 'Create another runtime for different resources.');
    const values = [...next.matrix.entries[0], ...next.matrix.entries[1], ...next.vector.entries];
    if (values.some((value, index) => value !== previous[index])) {
      // Snapshots never escape this owner. Rebase retained version history,
      // while the caller retains its complete persistent document and history.
      if (edits >= 128) { snapshot = model.initial; edits = 0; cache.reset(); }
      const transform = defineKpSemanticStateTransform({ compiled: model.compiled, handles: model.handles, id: 'edit-matrix-vector', author(state) {
        for (const [index, field] of (['a00', 'a01', 'a10', 'a11', 'x', 'y'] as const).entries())
          if (state[field].read() !== values[index]) state[field].update(() => values[index]!);
      } });
      snapshot = transform.apply(snapshot, `edit-${++edits}`).commit.after; previous = values;
    }
    document = next;
  }
  update(document);
  return {
    update,
    sample() {
      const { matrix, vector, product } = values();
      const rows = evaluateKpTypedMatrix(product, {}), result: Vector2 = Object.freeze([rows[0]![0]!, rows[1]![0]!]);
      return { matrix, vector, product, input: document.vector.entries, result,
        latex: `${projectKpTypedMathToLatex(matrix)}${projectKpTypedMathToLatex(vector)}=${projectKpTypedMathToLatex(product)}` };
    },
    explanation() {
      const { matrix, vector, product } = values();
      return explanationOwner.read(document, matrix, vector, product);
    },
    inspect() { return { calls: { ...calls }, retainedEdits: edits, cache: cache.inspect(), explanation: explanationOwner.inspect(), disposed }; },
    dispose() { if (disposed) return; disposed = true; cache.dispose(); explanationOwner.dispose(); }
  };
}
export type MatrixVectorRuntime = ReturnType<typeof createMatrixVectorRuntime>;
