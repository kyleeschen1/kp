import assert from "node:assert/strict";
import test from "node:test";
import * as M from "../src/math/authoring/matrices.ts";
import { compareInputs, InputComparisonGap } from "../src/math/matrix-input-comparison.ts";
import { dependentColumns } from "../content/authoring/linear-algebra/dependent-columns.ts";
import { compileExpression } from "../src/math/expression.ts";
const values = (matrix: Parameters<typeof M.evaluate>[0]) => M.evaluate(matrix, {});

test("the lost difference derives from original inputs and retains contribution identities", () => {
  const relation = compareInputs(dependentColumns.product);
  assert.equal(relation.kind, "lost-difference");
  assert.equal(relation.inputs.before, dependentColumns.product.rightParts.column(0));
  assert.equal(relation.image.left, dependentColumns.product.left);
  assert.equal(relation.image.right, relation.inputDifference);
  assert.deepEqual(values(relation.inputDifference), [[2], [-1]]);
  assert.deepEqual(values(relation.outputDifference), [[0], [0]]);
  assert.deepEqual(values(relation.image.result), [[0], [0]]);
  relation.inputDifference.rows.forEach((row, i) => assert.deepEqual(row[0]!.provenance,
    { kind: "derived", sourceIds: [relation.inputs.after.entries[i]!.id, relation.inputs.before.entries[i]!.id], methodId: "kp.math.scalar-subtract.v1" }));
  relation.combination.terms.forEach((term, k) => {
    assert.equal(term.coefficient, relation.inputDifference.rows[k]![0]);
    term.pairs.forEach((pair, row) => {
      assert.equal(pair, relation.image.cell(row, 0).dot.pairs[k]);
      assert.equal(pair.left, dependentColumns.product.left.rows[row]![k]);
    });
  });
});

test("equal inputs do not masquerade as lost information; other maps distinguish inputs", () => {
  const original = dependentColumns.product;
  assert.equal(compareInputs(original, 0, 0).kind, "identical-inputs");
  const identity = M.product({ id: "identity-inputs", left: M.matrix("I", [[1, 0], [0, 1]]), right: original.right });
  assert.equal(compareInputs(identity).kind, "distinguished-inputs");
  assert.deepEqual(values(compareInputs(identity).image.result), [[2], [-1]]);
  assert.deepEqual(values(compareInputs(original, 1, 0).inputDifference), [[-2], [1]]);
});

test("exact linearity holds across signed integer maps and inputs", () => {
  for (let i = -20; i <= 20; i++) {
    const product = M.product({ id: `p${i}`, left: M.matrix(`a${i}`, [[i, 2], [-3, i + 1]]), right: M.matrix(`b${i}`, [[i + 3, -i], [-2, i - 1]]) });
    const relation = compareInputs(product);
    assert.deepEqual(values(relation.image.result), values(relation.outputDifference));
    for (const [row, entry] of relation.combination.result.entries.entries())
      assert.equal(compileExpression(entry.expression)({}), relation.combination.terms.reduce((sum, term) => sum + compileExpression(term.entries[row]!.expression)({}), 0));
  }
});

test("unsupported dimensions and inexact arithmetic fail instead of claiming cancellation", () => {
  const right = dependentColumns.product.right;
  for (const factor of [0.1, Number.MAX_SAFE_INTEGER, 1e20]) {
    const product = M.product({ id: "unsupported", left: M.matrix("a", [[factor, 2], [2, 4]]), right });
    assert.throws(() => compareInputs(product), InputComparisonGap);
  }
  const product = M.product({ id: "wide", left: M.matrix("wide-a", [[1, 2, 3], [4, 5, 6]]), right: M.matrix("wide-b", [[1, 2], [3, 4], [5, 6]]) });
  assert.throws(() => compareInputs(product), InputComparisonGap);
  assert.throws(() => compareInputs(dependentColumns.product, -1, 1));
});
