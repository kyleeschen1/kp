import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticBranchSchedule,
  kpSequentialBranches,
  kpStaggeredBranches,
  kpSteppedBranches,
  kpTogetherBranches
} from "../src/animation/branch-schedule.ts";
import {
  createKpSemanticBranchOperation
} from "../src/semantic/branch-operation.ts";

const balancedOperation = createKpSemanticBranchOperation({
  id: "operation.solve-x.subtract-both-sides",
  authorityId: "kp.algebra.subtract-both-sides",
  branches: [
    { id: "lhs", entityIds: ["lhs.minus3"], dependsOnBranchIds: [] },
    { id: "rhs", entityIds: ["rhs.minus", "rhs.3"], dependsOnBranchIds: [] }
  ]
});

test("four presentation policies share one semantic branch operation", () => {
  const schedules = [
    createKpSemanticBranchSchedule({ id: "together", operation: balancedOperation, strategy: kpTogetherBranches() }),
    createKpSemanticBranchSchedule({ id: "sequential", operation: balancedOperation, strategy: kpSequentialBranches() }),
    createKpSemanticBranchSchedule({ id: "staggered", operation: balancedOperation, strategy: kpStaggeredBranches(0.5) }),
    createKpSemanticBranchSchedule({ id: "stepped", operation: balancedOperation, strategy: kpSteppedBranches() })
  ];
  assert.ok(schedules.every((schedule) => schedule.operation === balancedOperation));
  assert.deepEqual(schedules.map((schedule) => schedule.strategy.kind), [
    "together", "sequential", "staggered", "stepped"
  ]);
  assert.deepEqual(schedules[0]!.sample(0.5), { lhs: 0.5, rhs: 0.5 });
  assert.deepEqual(schedules[1]!.sample(0.25), { lhs: 0.5, rhs: 0 });
  assert.deepEqual(schedules[2]!.sample(0.5), { lhs: 0.84375, rhs: 0.15625 });
  assert.deepEqual(schedules[3]!.sample(0.5), { lhs: 1, rhs: 0 });
});

test("dependency ranks constrain every schedule without changing branch identity", () => {
  const operation = createKpSemanticBranchOperation({
    id: "operation.dependent",
    authorityId: "operation.dependent.authority",
    branches: [
      { id: "left", entityIds: ["left"], dependsOnBranchIds: [] },
      { id: "right", entityIds: ["right"], dependsOnBranchIds: [] },
      { id: "settle", entityIds: ["result"], dependsOnBranchIds: ["left", "right"] }
    ]
  });
  const together = createKpSemanticBranchSchedule({
    id: "dependent.together",
    operation,
    strategy: kpTogetherBranches()
  });
  assert.deepEqual(together.windows, [
    { branchId: "left", start: 0, end: 0.5 },
    { branchId: "right", start: 0, end: 0.5 },
    { branchId: "settle", start: 0.5, end: 1 }
  ]);
  const staggered = createKpSemanticBranchSchedule({
    id: "dependent.staggered",
    operation,
    strategy: kpStaggeredBranches(0.75)
  });
  const windows = new Map(staggered.windows.map((window) => [window.branchId, window]));
  assert.ok(windows.get("settle")!.start >= windows.get("left")!.end);
  assert.ok(windows.get("settle")!.start >= windows.get("right")!.end);
});

test("inverse sampling reconstructs the exact forward branch state", () => {
  for (const strategy of [
    kpTogetherBranches(),
    kpSequentialBranches(),
    kpStaggeredBranches(0.4),
    kpSteppedBranches()
  ]) {
    const schedule = createKpSemanticBranchSchedule({
      id: `inverse.${strategy.kind}`,
      operation: balancedOperation,
      strategy
    });
    for (let index = 0; index <= 100; index += 1) {
      const progress = index / 100;
      const forward = schedule.sample(progress);
      const inverse = schedule.sampleInverse(1 - progress);
      for (const branch of balancedOperation.branches) {
        assert.ok(Math.abs(forward[branch.id] + inverse[branch.id] - 1) < 1e-12);
      }
    }
  }
});

test("schedule windows and samples stay normalized at every boundary", () => {
  for (const strategy of [
    kpTogetherBranches(),
    kpSequentialBranches(),
    kpStaggeredBranches(0.4),
    kpSteppedBranches()
  ]) {
    const schedule = createKpSemanticBranchSchedule({
      id: `normalized.${strategy.kind}`,
      operation: balancedOperation,
      strategy
    });
    assert.ok(schedule.windows.every((window) =>
      window.start >= 0 && window.start < window.end && window.end <= 1
    ));
    assert.deepEqual(schedule.sample(-1), { lhs: 0, rhs: 0 });
    assert.deepEqual(schedule.sample(2), { lhs: 1, rhs: 1 });
    assert.throws(() => schedule.sample(Number.NaN), /progress must be finite/);
  }
});

test("staggered schedules reject unbounded overlap", () => {
  for (const overlap of [-0.01, 1, Number.POSITIVE_INFINITY]) {
    assert.throws(() => createKpSemanticBranchSchedule({
      id: "invalid.staggered",
      operation: balancedOperation,
      strategy: kpStaggeredBranches(overlap)
    }), /overlap must be at least zero and less than one/);
  }
});
