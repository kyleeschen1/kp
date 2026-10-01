import test from 'node:test';
import assert from 'node:assert/strict';
import { costExample } from '../src/experiments/semantic-cost/cases.ts';
import { matrixEnvironmentFromProduct, MatrixColumnGap } from '../src/experiments/matrix-column-product/environment.ts';
import { matrixColumnStory } from '../src/experiments/matrix-column-product/score.ts';
import { columnExampleFromProduct } from '../src/experiments/matrix-column-combinations/model.ts';
import { createKpScalarParameter, createKpTypedMatrixFromRows } from '../src/math/typed-semantic-math.ts';
import { matrixProduct } from '../src/math/matrix-product.ts';

test('ten value-only variations share operands, contributions and results across both real presentations', () => {
  for (let index = 0; index < 10; index++) {
    const product = costExample(index, 'rows');
    const env = matrixEnvironmentFromProduct(product);
    const story = matrixColumnStory(env);
    assert.equal(env.product, product);
    for (const j of [0, 1]) {
      const scene = columnExampleFromProduct(product, j);
      assert.equal(scene.env.product, product);
      const results: number[] = [];
      for (const [i, cell] of product.rows.entries()) {
        const target = cell[j]!;
        const projection = env.cells.find(c => c.row === i && c.col === j)!;
        assert.equal(projection.semantic, target);
        assert.equal(scene.combination.result.entries[i], target.result);
        results.push(projection.result);
        for (const term of scene.combination.terms) {
          assert.equal(term.pairs[i], target.dot.pairs[term.index]);
          assert.equal(term.coefficient, product.right.rows[term.index]![j]);
        }
      }
      assert.ok(story.steps.find(step => step.name === (j === 0 ? 'evaluate-first' : 'evaluate-second'))!.cue.includes(results.join(' and ')));
      assert.ok(scene.beats.find(beat => beat.id === 'sum')!.cue.includes(results.join(' above ')));
    }
  }
});

test('unsupported shape, selection and unresolved symbolic inputs fail at the presentation boundary', () => {
  const row = costExample(0, 'dot');
  assert.throws(() => matrixEnvironmentFromProduct(row), MatrixColumnGap);
  assert.throws(() => columnExampleFromProduct(row), MatrixColumnGap);
  const product = costExample(0, 'columns');
  for (const column of [-1, 2, 0.5, NaN]) assert.throws(() => columnExampleFromProduct(product, column), MatrixColumnGap);
  const symbolic = createKpTypedMatrixFromRows({ id: 'symbolic', rows: [0, 1].map(i => [0, 1].map(j =>
    createKpScalarParameter({ id: `x.${i}.${j}`, name: `x${i}${j}` }))) });
  assert.throws(() => columnExampleFromProduct(matrixProduct({ id: 'symbolic.product', left: symbolic, right: symbolic })), MatrixColumnGap);
});
