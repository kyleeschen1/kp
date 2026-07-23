import assert from "node:assert/strict";
import test from "node:test";

import {
  kpFuzzyQueryMatches,
  scoreKpFuzzyQuery
} from "../src/search/fuzzy-query.ts";

test("shared fuzzy query preserves dashboard substring and typo behavior", () => {
  assert.equal(
    kpFuzzyQueryMatches(["Power to radical"], "radical"),
    true
  );
  assert.equal(
    kpFuzzyQueryMatches(["radical"], "radicl"),
    true
  );
  assert.equal(
    kpFuzzyQueryMatches(["Power to radical"], "vector"),
    false
  );
});

test("shared fuzzy query scores exact and weighted fields deterministically", () => {
  const exact = scoreKpFuzzyQuery(
    [{ value: "radical", weight: 4 }],
    "radical"
  );
  const fuzzy = scoreKpFuzzyQuery(
    [{ value: "radical", weight: 4 }],
    "radicl"
  );

  assert.equal((exact?.score ?? 0) > (fuzzy?.score ?? 0), true);
  assert.deepEqual(exact?.matchedValues, ["radical"]);
});
