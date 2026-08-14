import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpNormalMatrixProofCheckpoints,
  findKpNormalMatrixProofCheckpoint,
  kpNormalMatrixProofCheckpointIds,
  kpNormalMatrixProofCheckpointTimeMs,
  kpNormalMatrixProofCheckpoints,
  kpNormalMatrixProofDurationMs,
  projectKpNormalMatrixProofClock
} from "../src/semantic/normal-matrix-proof-checkpoints.ts";

test("six settled proof checkpoints own the complete clock", () => {
  assert.deepEqual(checkKpNormalMatrixProofCheckpoints(), []);
  assert.deepEqual(
    kpNormalMatrixProofCheckpoints.map(({ id }) => id),
    kpNormalMatrixProofCheckpointIds
  );
  assert.equal(kpNormalMatrixProofCheckpointTimeMs("statement"), 0);
  assert.equal(
    kpNormalMatrixProofCheckpointTimeMs("recursion"),
    kpNormalMatrixProofDurationMs
  );
});

test("direct checkpoint seeks are exact and require no replay", () => {
  for (const checkpoint of kpNormalMatrixProofCheckpoints) {
    const projection = projectKpNormalMatrixProofClock(checkpoint.timeMs);
    assert.equal(projection.from.id, checkpoint.id);
    assert.equal(projection.timeMs, checkpoint.timeMs);
    assert.equal(projection.localProgress, 0);
  }
});

test("dense forward, reverse, and shuffled samples are order independent", () => {
  const times = Array.from({ length: 121 }, (_, index) => index * 100);
  const canonical = new Map(
    times.map((timeMs) => [timeMs, projectKpNormalMatrixProofClock(timeMs)])
  );

  for (const timeMs of [...times].reverse()) {
    assert.deepEqual(projectKpNormalMatrixProofClock(timeMs), canonical.get(timeMs));
  }
  for (const timeMs of [...times.slice(0, 60).reverse(), ...times.slice(60)]) {
    assert.deepEqual(projectKpNormalMatrixProofClock(timeMs), canonical.get(timeMs));
  }
});

test("each interval derives active transformations from settled endpoints", () => {
  const rowColumn = projectKpNormalMatrixProofClock(1_200);
  const normEquation = projectKpNormalMatrixProofClock(6_600);

  assert.deepEqual(rowColumn.activeTransformationPaths, [
    "interpret-left-first-entry",
    "interpret-right-first-entry"
  ]);
  assert.deepEqual(normEquation.activeTransformationPaths, [
    "compare-first-entries"
  ]);
  assert.equal(
    findKpNormalMatrixProofCheckpoint("norm-equation").primaryPath,
    "inference/norm-equality"
  );
});

test("clock projection clamps endpoints and rejects non-finite requests", () => {
  assert.equal(projectKpNormalMatrixProofClock(-1).timeMs, 0);
  assert.equal(
    projectKpNormalMatrixProofClock(kpNormalMatrixProofDurationMs + 1).timeMs,
    kpNormalMatrixProofDurationMs
  );
  assert.throws(() => projectKpNormalMatrixProofClock(Number.NaN), /finite/);
});
