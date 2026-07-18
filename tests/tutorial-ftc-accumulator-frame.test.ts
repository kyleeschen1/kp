import assert from "node:assert/strict";
import test from "node:test";
import { sampleKpFtcAccumulatorFrame } from "../src/tutorial/ftc-accumulator-frame.ts";

test("FTC accumulator keeps graph and curve stable while x and area move", () => {
  const before = sampleKpFtcAccumulatorFrame({
    lensId: "quadratic",
    upperBound: 1
  });
  const after = sampleKpFtcAccumulatorFrame({
    lensId: "quadratic",
    upperBound: 2
  });

  assert.deepEqual(before.xDomain, after.xDomain);
  assert.deepEqual(before.yDomain, after.yDomain);
  assert.deepEqual(before.curvePoints, after.curvePoints);
  assert.deepEqual(before.persistentSelectorIds, after.persistentSelectorIds);
  assert.equal(before.accumulatedArea, 1 / 3);
  assert.equal(after.accumulatedArea, 8 / 3);
  assert.deepEqual(after.upperBoundSegment, [
    [2, 0],
    [2, 4]
  ]);
});

test("FTC accumulator clamps the movable upper bound to a curated lens domain", () => {
  const frame = sampleKpFtcAccumulatorFrame({
    lensId: "affine",
    upperBound: 10
  });

  assert.equal(frame.upperBound, 3);
  assert.deepEqual(frame.areaPolygon.at(-1), [3, 0]);
});
