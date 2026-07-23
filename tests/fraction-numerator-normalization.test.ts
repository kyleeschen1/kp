import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionNumeratorNormalizationPlan
} from "../src/semantic/fraction-numerator-normalization.ts";

test("fraction numerator normalization moves each addend under its quotient bar", () => {
  const plan = createKpFractionNumeratorNormalizationPlan();

  assert.deepEqual(plan.branches.map(({ id, target }) => [id, target.root]), [
    ["term.x", {
      id: "fraction-normalization.target.x",
      kind: "quotient",
      numerator: {
        id: "fraction-normalization.target.x.numerator",
        kind: "product",
        factors: [
          { id: "fraction-normalization.target.x.factor", kind: "number", value: 2 },
          { id: "fraction-normalization.target.x.addend", kind: "symbol", name: "x" }
        ]
      },
      denominator: {
        id: "fraction-normalization.target.x.denominator",
        kind: "number",
        value: 3
      }
    }],
    ["term.6", {
      id: "fraction-normalization.target.6",
      kind: "quotient",
      numerator: {
        id: "fraction-normalization.target.6.numerator",
        kind: "product",
        factors: [
          { id: "fraction-normalization.target.6.factor", kind: "number", value: 2 },
          { id: "fraction-normalization.target.6.addend", kind: "number", value: 6 }
        ]
      },
      denominator: {
        id: "fraction-normalization.target.6.denominator",
        kind: "number",
        value: 3
      }
    }]
  ]);
});

test("parallel and sequential schedules share one verified semantic outcome", () => {
  const plan = createKpFractionNumeratorNormalizationPlan();
  const semanticOutcome = plan.branches.map(({ target }) => target);

  assert.deepEqual(plan.schedules.parallel.ids, plan.schedules.sequential.ids);
  assert.deepEqual(plan.schedules.parallel.sample(0.25), {
    "term.x": 0.15625,
    "term.6": 0.15625
  });
  assert.deepEqual(plan.schedules.sequential.sample(0.25), {
    "term.x": 0.5,
    "term.6": 0
  });
  assert.deepEqual(plan.schedules.parallel.sample(1), plan.schedules.sequential.sample(1));
  assert.deepEqual(plan.branches.map(({ target }) => target), semanticOutcome);
});

test("fraction numerator normalization rejects denominator drift", () => {
  assert.throws(
    () => createKpFractionNumeratorNormalizationPlan({ secondTargetDenominator: 4 }),
    /term\.6 must preserve its denominator/
  );
});
