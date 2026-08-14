import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpNormalMatrixProofCycleA
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-cycle-a-projection.ts";

test("cycle A owns one deterministic interval of the proof clock", () => {
  assert.equal(projectKpNormalMatrixProofCycleA(4_799).active, false);
  assert.equal(projectKpNormalMatrixProofCycleA(4_800).phaseKind, "orient");
  assert.equal(projectKpNormalMatrixProofCycleA(5_400).phaseKind, "act");
  assert.equal(projectKpNormalMatrixProofCycleA(6_500).phaseKind, "settle");
  assert.equal(projectKpNormalMatrixProofCycleA(7_000).phaseKind, "inspect");
  assert.deepEqual(projectKpNormalMatrixProofCycleA(7_200), {
    timeMs: 7_200,
    active: false,
    checkpointId: "norm-equation",
    phaseProgress: 0,
    transmissions: [],
    equationProgress: 1,
    targetPaths: [],
    contextPaths: []
  });
});

test("row and column handoffs are staggered and complete before settlement", () => {
  const early = projectKpNormalMatrixProofCycleA(5_300);
  const middle = projectKpNormalMatrixProofCycleA(5_800);
  const settling = projectKpNormalMatrixProofCycleA(6_500);
  assert.ok(early.transmissions[0]!.progress > early.transmissions[1]!.progress);
  assert.ok(middle.transmissions[0]!.progress > 0);
  assert.ok(middle.transmissions[1]!.progress > 0);
  assert.ok(settling.transmissions.every(({ handoffComplete }) => handoffComplete));
  assert.ok(settling.equationProgress > 0);
});

test("cycle A direct seek reverse and interruption are order independent", () => {
  const samples = [4_800, 5_100, 5_800, 6_500, 7_050, 7_200];
  const expected = new Map(samples.map((timeMs) => [
    timeMs,
    projectKpNormalMatrixProofCycleA(timeMs)
  ]));
  for (const timeMs of [...samples].reverse()) {
    assert.deepEqual(projectKpNormalMatrixProofCycleA(timeMs), expected.get(timeMs));
  }
  for (const timeMs of [5_800, 4_800, 7_050, 5_100, 7_200, 6_500]) {
    assert.deepEqual(projectKpNormalMatrixProofCycleA(timeMs), expected.get(timeMs));
  }
});

test("moving contributions remain present until ownership handoff", () => {
  for (let timeMs = 4_800; timeMs < 6_432; timeMs += 17) {
    for (const transmission of projectKpNormalMatrixProofCycleA(timeMs).transmissions) {
      assert.equal(
        transmission.progress < 1 && transmission.handoffComplete,
        false,
        `${timeMs}:${transmission.id}`
      );
    }
  }
});
