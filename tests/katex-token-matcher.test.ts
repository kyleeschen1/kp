import { strict as assert } from "node:assert";
import test from "node:test";

import {
  findKatexTransformFixture,
  type KatexTransformFixtureToken
} from "../src/rendering/katex-transform-fixtures.ts";
import { createKatexTransitionPlan } from "../src/rendering/katex-token-matcher.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

function token(
  id: string,
  text: string,
  signature: string,
  left: number,
  top: number,
  row = 0
): KatexMotionToken {
  return {
    id,
    text,
    signature,
    rect: { left, top, width: 10, height: 12 },
    localRect: { left, top, width: 10, height: 12 },
    row
  };
}

test("createKatexTransitionPlan matches equivalent tokens in stable order", () => {
  const source = [
    token("s-x-0", "x", "mord", 10, 20),
    token("s-plus", "+", "mbin", 25, 20),
    token("s-x-1", "x", "mord", 40, 20)
  ];
  const target = [
    token("t-x-0", "x", "mord", 12, 80),
    token("t-x-1", "x", "mord", 28, 80),
    token("t-plus", "+", "mbin", 44, 80)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [
      ["s-x-0", "t-x-0"],
      ["s-plus", "t-plus"],
      ["s-x-1", "t-x-1"]
    ]
  );
  assert.equal(plan.sourceOnly.length, 0);
  assert.equal(plan.targetOnly.length, 0);
  assert.equal(plan.diagnostics.ambiguousGroupCount, 1);
});

test("createKatexTransitionPlan reports source-only and target-only tokens", () => {
  const source = [
    token("s-x", "x", "mord", 10, 20),
    token("s-minus", "-", "mbin", 25, 20)
  ];
  const target = [
    token("t-x", "x", "mord", 10, 20),
    token("t-one", "1", "mord", 25, 20)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [["s-x", "t-x"]]
  );
  assert.deepEqual(plan.sourceOnly.map((entry) => entry.source.id), ["s-minus"]);
  assert.deepEqual(plan.targetOnly.map((entry) => entry.target.id), ["t-one"]);
  assert.equal(plan.diagnostics.sourceTokenCount, 2);
  assert.equal(plan.diagnostics.targetTokenCount, 2);
  assert.equal(plan.diagnostics.matchedCount, 1);
});

test("createKatexTransitionPlan prefers tokens in the same row bucket", () => {
  const source = [
    token("s-num-x", "x", "mord", 10, 10, 0),
    token("s-den-x", "x", "mord", 10, 40, 1)
  ];
  const target = [
    token("t-den-x", "x", "mord", 100, 40, 1),
    token("t-num-x", "x", "mord", 100, 10, 0)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [
      ["s-num-x", "t-num-x"],
      ["s-den-x", "t-den-x"]
    ]
  );
});

test("createKatexTransitionPlan preserves stable order for equivalent repeated tokens", () => {
  const source = [
    token("s-left", "x", "mord", 90, 20),
    token("s-right", "x", "mord", 0, 20)
  ];
  const target = [
    token("t-left", "x", "mord", 0, 20),
    token("t-right", "x", "mord", 90, 20)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [
      ["s-left", "t-left"],
      ["s-right", "t-right"]
    ]
  );
});

test("createKatexTransitionPlan ignores empty-text tokens entirely", () => {
  const source = [
    token("s-empty", "", "mord", 0, 20),
    token("s-x", "x", "mord", 10, 20)
  ];
  const target = [
    token("t-x", "x", "mord", 10, 20),
    token("t-empty", "", "mord", 20, 20)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [["s-x", "t-x"]]
  );
  assert.equal(plan.sourceOnly.length, 0);
  assert.equal(plan.targetOnly.length, 0);
  assert.equal(plan.diagnostics.sourceTokenCount, 1);
  assert.equal(plan.diagnostics.targetTokenCount, 1);
  assert.equal(plan.diagnostics.matchedCount, 1);
  assert.equal(plan.diagnostics.sourceOnlyCount, 0);
  assert.equal(plan.diagnostics.targetOnlyCount, 0);
});

test("fraction transform fixtures expose artifact token matcher behavior", () => {
  const makeFixture = findKatexTransformFixture(
    "fraction.make.inline-to-stacked"
  );
  const makeFraction = createKatexTransitionPlan(
    fixtureTokens(makeFixture, "source"),
    fixtureTokens(makeFixture, "target")
  );
  assert.deepEqual(
    makeFraction.matched.map((match) => [match.source.text, match.target.text]),
    [
      ["x", "x"],
      ["3", "3"]
    ]
  );
  assert.deepEqual(
    makeFraction.sourceOnly.map((entry) => entry.source.text),
    ["/"]
  );
  assert.deepEqual(
    makeFraction.targetOnly.map((entry) => entry.target.text),
    ["structural:frac-line"]
  );

  const splitFixture = findKatexTransformFixture(
    "fraction.split.stacked-to-inline"
  );
  const splitFraction = createKatexTransitionPlan(
    fixtureTokens(splitFixture, "source"),
    fixtureTokens(splitFixture, "target")
  );
  assert.deepEqual(
    splitFraction.sourceOnly.map((entry) => entry.source.text),
    ["structural:frac-line"]
  );
  assert.deepEqual(
    splitFraction.targetOnly.map((entry) => entry.target.text),
    ["/"]
  );

  const combineFixture = findKatexTransformFixture(
    "fraction.combine.common-denominator"
  );
  const combineFractions = createKatexTransitionPlan(
    fixtureTokens(combineFixture, "source"),
    fixtureTokens(combineFixture, "target")
  );
  assert.deepEqual(
    combineFractions.sourceOnly.map((entry) => entry.source.text),
    ["structural:frac-line"]
  );
  assert.deepEqual(
    combineFractions.matched
      .filter((match) => match.source.text === "structural:frac-line")
      .map((match) => [match.source.text, match.target.text]),
    [["structural:frac-line", "structural:frac-line"]]
  );
});

function fixtureTokens(
  fixture: ReturnType<typeof findKatexTransformFixture>,
  side: "source" | "target"
): KatexMotionToken[] {
  return fixture[side].tokens.map((entry, index) =>
    fixtureToken(`${side}-${index}`, entry)
  );
}

function fixtureToken(
  id: string,
  entry: KatexTransformFixtureToken
): KatexMotionToken {
  const left = entry.column * 14;
  const top = entry.row * 18;

  return token(id, entry.text, entry.signature, left, top, entry.row);
}
