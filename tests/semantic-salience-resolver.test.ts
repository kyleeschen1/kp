import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveKpSemanticSalience,
  type KpSalienceSignal
} from "../src/animation/semantic-salience-resolver.ts";

const base = {
  baseLevel: "normal",
  identityFamily: "blue",
  presence: 1
} as const;

test("salience precedence is selected focused ghost contextual then base", () => {
  assert.equal(resolveKpSemanticSalience({
    ...base,
    signals: ["contextual"]
  }).state.level, "context");
  assert.equal(resolveKpSemanticSalience({
    ...base,
    signals: ["contextual", "ghost"]
  }).state.level, "ghost");
  assert.equal(resolveKpSemanticSalience({
    ...base,
    signals: ["contextual", "ghost", "focused"]
  }).state.level, "focus");
  assert.equal(resolveKpSemanticSalience({
    ...base,
    signals: ["contextual", "ghost", "selected"]
  }).state.level, "focus");
});

test("signal order cannot change direct resolution", () => {
  const signals: readonly KpSalienceSignal[] = [
    "contextual", "ghost", "focused", "entering"
  ];
  const expected = resolveKpSemanticSalience({ ...base, signals });
  for (const permutation of permutations(signals)) {
    assert.deepEqual(
      resolveKpSemanticSalience({ ...base, signals: permutation }),
      expected
    );
  }
  assert.deepEqual(resolveKpSemanticSalience({ ...base, signals }), expected);
});

test("presence phases remain separate and fail closed", () => {
  assert.equal(resolveKpSemanticSalience({
    ...base,
    presence: 0.4,
    signals: ["entering"]
  }).presencePhase, "entering");
  assert.equal(resolveKpSemanticSalience({
    ...base,
    presence: 0.4,
    signals: ["withdrawing"]
  }).presencePhase, "withdrawing");
  const absent = resolveKpSemanticSalience({
    ...base,
    presence: -1,
    signals: ["selected"]
  });
  assert.equal(absent.state.level, "absent");
  assert.equal(absent.presencePhase, "absent");
  assert.throws(() => resolveKpSemanticSalience({
    ...base,
    signals: ["entering", "withdrawing"]
  }), /cannot enter and withdraw simultaneously/);
  assert.throws(() => resolveKpSemanticSalience({
    ...base,
    signals: ["sparkle"]
  } as never), /Unknown salience signal sparkle/);
});

function permutations<T>(items: readonly T[]): readonly (readonly T[])[] {
  if (items.length < 2) return [items];
  return items.flatMap((item, index) => permutations([
    ...items.slice(0, index),
    ...items.slice(index + 1)
  ]).map((rest) => [item, ...rest]));
}
