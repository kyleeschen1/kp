import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpElevatedFocusComparison
} from "../src/animation/elevated-focus-experiment.ts";

test("flat, elevated, and no-depth focus share one x/y choreography", () => {
  const comparison = createKpElevatedFocusComparison({
    id: "focus-experiment.function-wrap",
    groupId: "function-wrap.argument",
    semanticEntityIds: ["argument.x"],
    fragmentIds: ["argument.x.glyph"],
    strength: 0.7,
    contextDimming: 0.12,
    phaseId: "act",
    phaseProgress: 0.5
  });

  assert.deepEqual(comparison.invariance, {
    sameTranslateX: true,
    sameTranslateY: true,
    sameLayoutParticipation: true,
    samePhase: true,
    passed: true
  });
  assert.equal(comparison.flat.frame.translateZ, 0);
  assert.ok(comparison.elevated.frame.translateZ >= 8);
  assert.ok(comparison.elevated.frame.translateZ <= 14);
  assert.ok(comparison.elevated.frame.scale >= 1.01);
  assert.ok(comparison.elevated.frame.scale <= 1.025);
  assert.ok(comparison.elevated.frame.shadowOpacity > 0);
  assert.equal(comparison.noDepth.frame.translateZ, 0);
  assert.equal(comparison.noDepth.frame.scale, 1);
  assert.equal(comparison.noDepth.frame.shadowOpacity, 0);
});

test("elevated focus lifts, holds, and releases exactly on the shared phase clock", () => {
  const sample = (phaseId: "orient" | "act" | "settle" | "release", phaseProgress: number) =>
    createKpElevatedFocusComparison({
      id: "focus-experiment.clock",
      groupId: "group.focus",
      semanticEntityIds: ["entity.focus"],
      strength: 0.6,
      contextDimming: 0.1,
      phaseId,
      phaseProgress
    }).elevated.frame;

  assert.equal(sample("orient", 0).translateZ, 0);
  assert.ok(sample("orient", 0.5).translateZ > 0);
  assert.equal(sample("act", 0.5).translateZ, sample("settle", 0.5).translateZ);
  assert.ok(sample("release", 0.5).translateZ > 0);
  assert.deepEqual(sample("release", 1), {
    phaseId: "release",
    attentionProgress: 0,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    scale: 1,
    outlineStrength: 0,
    shadowOpacity: 0,
    contextDimming: 0,
    layoutParticipation: false
  });
});
