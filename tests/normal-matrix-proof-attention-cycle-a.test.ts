import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAnimationSaliencePlan,
  type KpAnimationSaliencePlan
} from "../src/animation/salience-plan.ts";
import {
  checkKpNormalMatrixProofAttentionCycleA,
  kpNormalMatrixProofAttentionCycleA,
  projectKpNormalMatrixProofAttentionCycleAPhase
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-attention-cycle-a.ts";

test("cycle A preserves the orient act settle inspect attention grammar", () => {
  assert.deepEqual(checkKpNormalMatrixProofAttentionCycleA(), []);
  assert.deepEqual(
    kpNormalMatrixProofAttentionCycleA.phases.map(({ kind }) => kind),
    ["orient", "act", "settle", "inspect"]
  );
  assert.deepEqual(
    kpNormalMatrixProofAttentionCycleA.salience.intents.map(({ kind }) => kind),
    [
      "notice",
      "notice",
      "transmit",
      "transmit",
      "compare",
      "notice",
      "supporting-context"
    ]
  );
});

test("cycle A projects only authored semantic intents and transformations", () => {
  const act = projectKpNormalMatrixProofAttentionCycleAPhase("act");
  assert.deepEqual(
    act.intents.map(({ id }) => id),
    ["transmit-first-row", "transmit-first-column", "hold-governing-context"]
  );
  assert.deepEqual(act.phase.transformationPaths, [
    "interpret-left-first-entry",
    "interpret-right-first-entry"
  ]);
  const first = projectKpNormalMatrixProofAttentionCycleAPhase("inspect");
  const second = projectKpNormalMatrixProofAttentionCycleAPhase("inspect");
  assert.deepEqual(first, second);
  assert.equal(first.phase, second.phase);
});

test("cycle A carries no renderer, geometry, style, or timing authority", () => {
  const keys = allKeys(kpNormalMatrixProofAttentionCycleA);
  for (const forbidden of [
    "durationMs",
    "delayMs",
    "startMs",
    "endMs",
    "x",
    "y",
    "coordinates",
    "path",
    "keyframes",
    "trajectory",
    "svg",
    "dom",
    "color",
    "opacity",
    "easing"
  ]) {
    assert.equal(keys.has(forbidden), false, forbidden);
  }
});

test("shared validation rejects low-level instructions added to cycle A", () => {
  const invalid = {
    ...kpNormalMatrixProofAttentionCycleA.salience,
    intents: [{
      ...kpNormalMatrixProofAttentionCycleA.salience.intents[2],
      durationMs: 800,
      keyframes: [{ x: 1, y: 2 }],
      path: "arc"
    }]
  } as unknown as KpAnimationSaliencePlan;
  const messages = validateKpAnimationSaliencePlan(invalid, []).map(
    ({ message }) => message
  );
  assert.ok(messages.includes("Low-level salience instruction durationMs is not allowed."));
  assert.ok(messages.includes("Low-level salience instruction keyframes is not allowed."));
  assert.ok(messages.includes("Low-level salience instruction path is not allowed."));
});

function allKeys(value: unknown, keys = new Set<string>()): ReadonlySet<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => allKeys(item, keys));
    return keys;
  }
  if (typeof value !== "object" || value === null) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    allKeys(child, keys);
  }
  return keys;
}
