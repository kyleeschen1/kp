import assert from "node:assert/strict";
import test from "node:test";

import { createKpQuadraticCausalDrillDownBundle } from "../src/animation/quadratic-causal-drilldown.ts";

test("both quadratic methods expand the identical compressed operation trace", () => {
  for (const methodId of [
    "method.quadratic.completing-square",
    "method.quadratic.formula"
  ] as const) {
    const bundle = createKpQuadraticCausalDrillDownBundle({
      methodId,
      parentProgress: 0.375
    });
    assert.equal(bundle.compressed.presentation, "compressed-context");
    assert.equal(bundle.full.presentation, "full-detail");
    assert.deepEqual(
      bundle.compressed.actions.map(({ id }) => id),
      bundle.full.actions.map(({ id }) => id)
    );
    assert.deepEqual(
      bundle.compressed.segments.map(({ actionId }) => actionId),
      bundle.full.segments.map(({ actionId }) => actionId)
    );
    assert.equal(bundle.drillDown.parentClock.paused, true);
    assert.equal(bundle.drillDown.childClock.nested, true);
    assert.deepEqual(bundle.drillDown.restore, {
      exact: true,
      elapsedMs: bundle.drillDown.parentClock.elapsedMs,
      progress: bundle.drillDown.parentClock.progress
    });
  }
});

test("quadratic drill-down rejects an invalid parent clock position", () => {
  assert.throws(
    () => createKpQuadraticCausalDrillDownBundle({
      methodId: "method.quadratic.formula",
      parentProgress: 1.01
    }),
    /normalized/
  );
});
