import test from 'node:test';
import assert from 'node:assert/strict';
import { basisComposition, composeRepresentations, BasisCompositionGap } from '../src/experiments/matrix-column-combinations/basis-composition.ts';
import { columnCombinations } from '../src/math/matrix-interpretations.ts';
import { applyKpMatrixRepresentation } from '../src/math/algebra/matrix-representation.ts';

test('changing the shared intermediate basis changes factors but preserves the composite map', () => {
  const adapted = basisComposition(), standard = basisComposition('standard');
  assert.deepEqual(adapted.inner.rows, [[2, 0], [-2, 1]]);
  assert.deepEqual(adapted.outer.rows, [[2, 1], [1, 1]]);
  assert.deepEqual(standard.inner.rows, [[2, 0], [0, 1]]);
  assert.deepEqual(standard.outer.rows, [[1, 1], [0, 1]]);
  for (const example of [adapted, standard]) {
    assert.deepEqual(example.representation.rows, [[2, 1], [0, 1]]);
    assert.equal(example.inner.codomainBasis, example.outer.domainBasis);
    assert.equal(example.representation.domainBasis, example.standard);
    assert.equal(example.representation.codomainBasis, example.standard);
    assert.equal(example.product.left.representation?.domainBasisId, example.middle.id);
    assert.equal(example.product.right.representation?.codomainBasisId, example.middle.id);
    for (const x of [-3, 0, 1, 4]) for (const y of [-2, 0, 2]) {
      const value = [x, y] as const;
      assert.deepEqual(example.adapted.fromCoordinates(example.adapted.coordinates(value)), value);
      assert.deepEqual(example.map.apply(value), [2 * x + y, y]);
      assert.deepEqual(applyKpMatrixRepresentation(example.representation, value), example.map.apply(value));
      for (const map of [example.T, example.S]) {
        const vectors = map.domain.vectors, other = [2, -1] as const;
        assert.deepEqual(map.apply(vectors.add(value, other)), vectors.add(map.apply(value), map.apply(other)));
        assert.deepEqual(map.apply(map.domain.scale(-2, value)), map.codomain.scale(-2, map.apply(value)));
      }
    }
    const reading = columnCombinations(example.product);
    for (const cell of example.product.cells) for (const pair of cell.dot.pairs) {
      assert.equal(reading.column(cell.columnIndex).terms[pair.index]!.pairs[cell.rowIndex], pair);
    }
    assert.equal(example.scene.env.product, example.product);
  }
});

test('same shape with mismatched intermediate bases is rejected before arithmetic composition', () => {
  for (const mode of ['adapted', 'standard'] as const) {
    const example = basisComposition(mode, 1);
    assert.equal(example.incompatibleOuter.columnCount, example.inner.rowCount);
    assert.throws(() => composeRepresentations('wrong', example.incompatibleOuter, example.inner), BasisCompositionGap);
    assert.match(example.mismatch, /intermediate bases must match/);
    assert.equal(example.scene.column, 1);
  }
});
