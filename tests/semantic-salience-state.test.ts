import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpSemanticSalienceState,
  createKpSemanticSalienceTransition,
  kpSalienceIdentityFamilies,
  kpSalienceLevels
} from "../src/animation/semantic-salience-state.ts";

test("semantic salience vocabulary matches the canonical handoff", () => {
  assert.deepEqual(kpSalienceLevels, [
    "focus", "normal", "context", "dim", "ghost", "absent"
  ]);
  assert.deepEqual(kpSalienceIdentityFamilies, [
    "neutral", "cyan", "blue", "violet", "rose", "amber", "green"
  ]);
});

test("semantic salience state rejects renderer and timing authority", () => {
  const forbidden = [
    "color", "opacity", "strokeWidth", "x", "duration", "easing"
  ] as const;
  for (const key of forbidden) {
    assert.throws(() => createKpSemanticSalienceState({
      level: "focus",
      identityFamily: "blue",
      presence: 1,
      [key]: key === "color" ? "#fff" : 1
    } as never), /renderer-owned fields/);
  }
  assert.throws(() => createKpSemanticSalienceState({
    level: "focus",
    identityFamily: "blue",
    presence: 1.01
  }), /between 0 and 1/);
});

test("every semantic endpoint supports idempotence direct seek and reversal", () => {
  for (const from of kpSalienceLevels) {
    for (const to of kpSalienceLevels) {
      const forward = createKpSemanticSalienceTransition({
        from: { level: from, identityFamily: "cyan", presence: 1 },
        to: { level: to, identityFamily: "rose", presence: to === "absent" ? 0 : 1 }
      });
      const reverse = createKpSemanticSalienceTransition({
        from: forward.to,
        to: forward.from
      });
      assert.equal(forward.from.level, from);
      assert.equal(forward.to.level, to);
      assert.deepEqual(reverse.to, forward.from);
    }
  }
});
