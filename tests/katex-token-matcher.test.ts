import { strict as assert } from "node:assert";
import test from "node:test";

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
