import assert from "node:assert/strict";
import test from "node:test";

import {
  sameKpQuadraticEquationGraphSettlement,
  sampleKpQuadraticEquationGraphFrame
} from "../src/projections/quadratic-equation-graph-sync.ts";

const completingSquare = "method.quadratic.completing-square" as const;

test("equation and graph share one clock and exact root correspondences", () => {
  const frame = sampleKpQuadraticEquationGraphFrame({
    progress: 1,
    methodId: completingSquare
  });
  assert.equal(frame.sharedClockId, "timeline.quadratic.solution-branching.shared");
  assert.equal(frame.equation.progress, frame.progress);
  assert.equal(frame.graphLocalProgress, 1);
  assert.deepEqual(
    frame.correspondences.map(({ branchSign, solutionMemberId, graphSelectorId }) => ({
      branchSign,
      solutionMemberId,
      graphSelectorId
    })),
    [
      {
        branchSign: "minus",
        solutionMemberId: "root:2/1",
        graphSelectorId: "selector.quadratic.graph.root-two"
      },
      {
        branchSign: "plus",
        solutionMemberId: "root:3/1",
        graphSelectorId: "selector.quadratic.graph.root-three"
      }
    ]
  );
});

test("graph handoff follows presentation policy without an independent clock", () => {
  const before = sampleKpQuadraticEquationGraphFrame({
    progress: 0.899,
    methodId: completingSquare
  });
  const handoff = sampleKpQuadraticEquationGraphFrame({
    progress: 0.9,
    methodId: completingSquare
  });
  const after = sampleKpQuadraticEquationGraphFrame({
    progress: 0.95,
    methodId: completingSquare
  });
  assert.equal(before.graphLocalProgress, 0);
  assert.equal(handoff.graphLocalProgress, 0);
  assert.equal(after.graphLocalProgress, 0.5);
  assert.equal(after.equation.progress, 0.95);
});

test("direct seek and rewind settle identically at every shared playhead", () => {
  for (const progress of [0, 0.32, 0.68, 0.88, 0.9, 0.95, 1]) {
    const forward = sampleKpQuadraticEquationGraphFrame({
      progress,
      methodId: completingSquare,
      direction: "forward"
    });
    const rewind = sampleKpQuadraticEquationGraphFrame({
      progress,
      methodId: completingSquare,
      direction: "rewind"
    });
    assert.equal(
      sameKpQuadraticEquationGraphSettlement(forward, rewind),
      true,
      `settlement drifted at ${progress}`
    );
  }
});

test("method changes preserve graph roots while changing branch provenance", () => {
  const square = sampleKpQuadraticEquationGraphFrame({
    progress: 1,
    methodId: completingSquare
  });
  const formula = sampleKpQuadraticEquationGraphFrame({
    progress: 1,
    methodId: "method.quadratic.formula"
  });
  assert.deepEqual(
    square.correspondences.map(({ solutionMemberId }) => solutionMemberId),
    formula.correspondences.map(({ solutionMemberId }) => solutionMemberId)
  );
  assert.notDeepEqual(
    square.correspondences.map(({ branchId }) => branchId),
    formula.correspondences.map(({ branchId }) => branchId)
  );
});
