import assert from "node:assert/strict";
import test from "node:test";

import { projectKpEigenvectorDiagramEndpoint } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-diagram.ts";
import {
  createKpEigenvectorTransitionPlan,
  kpEigenvectorClockId,
  sampleKpEigenvectorTransition
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-motion.ts";

test("all ordinary transitions use one clock and bounded durations", () => {
  const plan = createKpEigenvectorTransitionPlan(
    "most-vectors-turn",
    "watch-the-fan"
  );

  assert.equal(plan.clockId, kpEigenvectorClockId);
  assert.equal(plan.durationMs, 1400);
  assert.ok(plan.durationMs <= 1400);
});

test("motion begins and ends at the exact semantic endpoints", () => {
  const plan = createKpEigenvectorTransitionPlan(
    "most-vectors-turn",
    "watch-the-fan"
  );
  const start = sampleKpEigenvectorTransition({ plan, progress: 0 });
  const finish = sampleKpEigenvectorTransition({ plan, progress: 1 });

  assert.deepEqual(
    start.vectors.map(({ coordinates }) => coordinates),
    projectKpEigenvectorDiagramEndpoint("most-vectors-turn")
      .vectors.map(({ displayed }) => displayed)
  );
  assert.deepEqual(
    finish.vectors.map(({ coordinates }) => coordinates),
    projectKpEigenvectorDiagramEndpoint("watch-the-fan")
      .vectors.map(({ displayed }) => displayed)
  );
  assert.equal(finish.settled, true);
});

test("sampling is deterministic and reversible", () => {
  const forward = createKpEigenvectorTransitionPlan(
    "most-vectors-turn",
    "watch-the-fan"
  );
  const reverse = createKpEigenvectorTransitionPlan(
    "watch-the-fan",
    "most-vectors-turn"
  );
  const a = sampleKpEigenvectorTransition({ plan: forward, progress: 0.37 });
  const b = sampleKpEigenvectorTransition({ plan: forward, progress: 0.37 });
  const reversed = sampleKpEigenvectorTransition({
    plan: reverse,
    progress: 0.63
  });

  assert.deepEqual(a, b);
  assert.deepEqual(
    a.vectors.map(({ coordinates }) => coordinates),
    reversed.vectors.map(({ coordinates }) => coordinates)
  );
});

test("reduced motion settles immediately after navigation begins", () => {
  const plan = createKpEigenvectorTransitionPlan(
    "geometry-becomes-equation",
    "name-the-scale-factor"
  );
  const frame = sampleKpEigenvectorTransition({
    plan,
    progress: 0.01,
    reducedMotion: true
  });

  assert.equal(frame.rawProgress, 1);
  assert.equal(frame.settled, true);
  assert.equal(frame.equation.toPresence, 1);
});

test("nonadjacent restoration is an immediate seek, not hidden replay", () => {
  const plan = createKpEigenvectorTransitionPlan(
    "most-vectors-turn",
    "compressed-recall"
  );

  assert.equal(plan.durationMs, 0);
});
