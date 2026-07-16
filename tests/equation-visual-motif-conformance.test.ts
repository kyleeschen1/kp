import assert from "node:assert/strict";
import test from "node:test";

import { createDistributionExpansionAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import {
  checkKpAnimationAgainstEquationMotifFixture,
  checkKpEquationVisualMotifFixture,
  kpEquationVisualMotifConformanceFixture,
  kpEquationVisualMotifConformanceFixtures
} from "../src/rendering/equation-visual-motif-conformance.ts";

test("curated wrap and distribution fixtures define semantic, rewind, and accessible phase equivalence", () => {
  assert.equal(kpEquationVisualMotifConformanceFixtures.length, 2);
  kpEquationVisualMotifConformanceFixtures.forEach((fixture) => {
    assert.deepEqual(checkKpEquationVisualMotifFixture(fixture), { passed: true, failures: [] });
    assert.deepEqual(fixture.checkpoints, [
      { direction: "forward", progress: 0 },
      { direction: "forward", progress: 0.5 },
      { direction: "forward", progress: 1 },
      { direction: "rewind", progress: 0.5 }
    ]);
    assert.ok(fixture.approvedExemplarId.startsWith("curated.equation."));
  });
});

test("current generated wrap conforms to curated semantic identity and motif provenance", () => {
  const animation = createFunctionWrapAnimationAsset();
  assert.deepEqual(checkKpAnimationAgainstEquationMotifFixture({
    animation,
    fixture: kpEquationVisualMotifConformanceFixture(animation.id)
  }), { passed: true, failures: [] });
});

test("current generated distribution conforms semantically before choreography replacement", () => {
  const animation = createDistributionExpansionAnimationAsset();
  assert.deepEqual(checkKpAnimationAgainstEquationMotifFixture({
    animation,
    fixture: kpEquationVisualMotifConformanceFixture(animation.id)
  }), { passed: true, failures: [] });
});
