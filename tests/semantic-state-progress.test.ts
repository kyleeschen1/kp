import assert from "node:assert/strict";
import test from "node:test";

import {
  compareKpSemanticProgress,
  createKpSemanticProgress,
  encodeKpSemanticProgress,
  isKpSemanticProgressOne,
  isKpSemanticProgressZero,
  kpSemanticProgressOne,
  kpSemanticProgressZero
} from "../src/semantic-state/semantic-progress.ts";

test("semantic progress normalizes exact fractions into one frozen value", () => {
  const half = createKpSemanticProgress(2n, 4n);
  const equivalent = createKpSemanticProgress(-3n, -6n);

  assert.deepEqual(half, { numerator: 1n, denominator: 2n });
  assert.deepEqual(equivalent, half);
  assert.equal(Object.isFrozen(half), true);
  assert.equal(encodeKpSemanticProgress(half), "1/2");
  assert.equal(encodeKpSemanticProgress(equivalent), "1/2");
  assert.equal(compareKpSemanticProgress(half, equivalent), 0);
});

test("semantic progress owns canonical exact endpoints", () => {
  assert.equal(createKpSemanticProgress(0n, 99n), kpSemanticProgressZero);
  assert.equal(createKpSemanticProgress(27n, 27n), kpSemanticProgressOne);
  assert.deepEqual(kpSemanticProgressZero, {
    numerator: 0n,
    denominator: 1n
  });
  assert.deepEqual(kpSemanticProgressOne, {
    numerator: 1n,
    denominator: 1n
  });
  assert.equal(isKpSemanticProgressZero(kpSemanticProgressZero), true);
  assert.equal(isKpSemanticProgressZero(kpSemanticProgressOne), false);
  assert.equal(isKpSemanticProgressOne(kpSemanticProgressOne), true);
  assert.equal(isKpSemanticProgressOne(kpSemanticProgressZero), false);
  assert.equal(Object.isFrozen(kpSemanticProgressZero), true);
  assert.equal(Object.isFrozen(kpSemanticProgressOne), true);
});

test("semantic progress compares without numeric conversion", () => {
  const oneThird = createKpSemanticProgress(1n, 3n);
  const oneHalf = createKpSemanticProgress(1n, 2n);

  assert.equal(compareKpSemanticProgress(oneThird, oneHalf), -1);
  assert.equal(compareKpSemanticProgress(oneHalf, oneThird), 1);
  assert.equal(compareKpSemanticProgress(oneThird, oneThird), 0);
});

test("semantic progress rejects invalid and out-of-range rationals", () => {
  assert.throws(
    () => createKpSemanticProgress(1n, 0n),
    /denominator cannot be zero/u
  );
  assert.throws(
    () => createKpSemanticProgress(-1n, 2n),
    /between zero and one/u
  );
  assert.throws(
    () => createKpSemanticProgress(3n, 2n),
    /between zero and one/u
  );
});
