import assert from "node:assert/strict";
import test from "node:test";
import { addKpRationals, createKpRational, divideKpRationals, equalKpRationals } from "../domains/math/exact-rational.ts";
import { createKpFocusDeckCheckpointMap } from "../src/tutorial/focus-deck-beat-navigation.ts";

test("Bayes baseline uses exact stipulated joint masses, not independent assumptions", () => {
  const masses = [16n, 4n, 8n, 72n].map(n => createKpRational(n, 100n));
  assert.ok(equalKpRationals(masses.reduce(addKpRationals), createKpRational(1n)));
  const flagged = addKpRationals(masses[0]!, masses[2]!);
  assert.ok(equalKpRationals(divideKpRationals(masses[0]!, flagged), createKpRational(2n, 3n)));
});

test("Bayes baseline reuses unequal semantic stops without a clock or input fork", () => {
  const values = [0, .1, .28, .44, .62, .8, 1];
  const map = createKpFocusDeckCheckpointMap(values);
  values.forEach((value, index) => {
    assert.equal(map.progressAt(index), value);
    assert.equal(map.positionAt(value), index);
  });
  assert.ok(Math.abs(map.positionAt(map.progressAt(3.7)) - 3.7) < 1e-12);
});
