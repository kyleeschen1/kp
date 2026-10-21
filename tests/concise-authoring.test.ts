import assert from "node:assert/strict";
import test from "node:test";
import * as M from "../src/math/authoring/matrices.ts";
import * as algebra from "../src/authoring/algebra.ts";
import { prepareKpComposedAlgebraDraftV2 } from "../src/authoring/composed-algebra-session-v2.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpTypedMatrix } from "../src/math/typed-semantic-math.ts";
import { constant } from "../src/math/expression.ts";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };

test("concise matrices preserve dimensions, canonical identities and source independence", () => {
  const values: [[number, number], [number, number]] = [[1, -2], [3, 4]];
  const A: KpTypedMatrix<2, 2> = M.matrix("A", values);
  const original = createKpTypedMatrixFromRows({ id: "A", rows: values.map((row, i) => row.map((value, j) =>
    createKpScalarExpression({ id: `A.${i}.${j}`, expression: constant(value) }))) });
  assert.deepEqual(A, original);
  values[0][0] = 99;
  assert.deepEqual(M.evaluate(A, {}), [[1, -2], [3, 4]]);
  const B = M.matrix("B", [[5], [6]]);
  const p = M.product({ id: "AB", left: A, right: B });
  const result: KpTypedMatrix<2, 1> = p.result;
  assert.deepEqual(M.evaluate(result, {}), [[-7], [39]]);
  assert.equal(p.cell(0, 0).dot.pairs[1]!.left, M.parts(A).row(0).entries[1]);
  assert.equal(p.cell(0, 0).dot.pairs[1]!.right, M.parts(B).column(0).entries[1]);
  assert.ok(Object.isFrozen(A.rows[0]));
});

test("numeric authoring rejects nonfinite entries and malformed runtime shapes", () => {
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => M.matrix("A", [[value]]), /must be finite/);
  // JavaScript callers still reach the canonical shape checks.
  // @ts-expect-error Empty matrices are not authorable.
  assert.throws(() => M.matrix("A", []), /at least one entry/);
  // @ts-expect-error Ragged literal dimensions are rejected before runtime.
  assert.throws(() => M.matrix("A", [[1, 2], [3]]), /rectangular/);
  assert.throws(() => M.matrix(" ", [[1]]), /id/);
});

test("algebra facade preserves checked source, animation and located repairs", () => {
  const draft = algebra.compile(primary), previous = prepareKpComposedAlgebraDraftV2(primary);
  assert.deepEqual(draft.animation, previous.animation);
  assert.deepEqual(draft.checkpointProgress, previous.checkpointProgress);
  assert.equal(draft.revisionId, previous.revisionId);
  assert.deepEqual(algebra.parse(algebra.serialize(draft)), algebra.read(primary));
  const changed = structuredClone(primary);
  changed.states[2]!.latex = "9(x+3)";
  const invalid = algebra.check(JSON.stringify(changed));
  assert.equal(invalid.status, "repair-gap");
  if (invalid.status === "repair-gap") {
    assert.ok(invalid.diagnostic.path.startsWith("$."));
    assert.ok(invalid.diagnostic.expected.length > 0);
  }
  assert.equal(algebra.check("not JSON").status, "repair-gap");
});

function incompatibleDimensions() {
  const A = M.matrix("A", [[1, 2]]), B = M.matrix("B", [[3]]);
  // @ts-expect-error The facade must not erase inner dimensions.
  M.product({ id: "AB", left: A, right: B });
}
void incompatibleDimensions;
