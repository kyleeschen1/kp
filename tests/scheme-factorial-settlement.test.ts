import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialChoreography } from
  "../src/animation/scheme-factorial-canonical-choreography.ts";
import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import { projectKpSchemeFactorialMotion } from
  "../src/animation/scheme-factorial-motion-projection.ts";
import {
  mintKpSchemeReducedMotionSettlementException,
  sampleKpSchemeFactorialSettlement
} from "../src/animation/scheme-factorial-settlement.ts";
import { sampleKpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-timeline.ts";
import {
  assertKpCodeSettlementExceptionScope,
  resolveKpCodeSettlementExceptionPolicy
} from "../src/animation/code-motion-settlement-exceptions.ts";

function projection(progress: number) {
  return projectKpSchemeFactorialMotion({
    choreography: kpSchemeFactorialChoreography,
    timeline: sampleKpSchemeFactorialTimeline({
      timeline: kpSchemeFactorialTimeline,
      progress
    })
  });
}

test("every Scheme motif reports shared settlement without changing native ownership", () => {
  const seen = new Set<string>();
  for (let index = 0; index <= 1_000; index += 1) {
    const motion = projection(index / 1_000);
    if (motion.kind === "none") continue;
    seen.add(motion.kind);
    assert.equal(
      motion.settlement.sample.accessibleNativeOwnerId,
      "native.scheme.semantic-dom"
    );
    assert.equal(motion.settlement.motif, motion.kind);
    if (motion.settlement.sample.paintOwner === "transit") {
      assert.equal(
        motion.settlement.sample.paintOwnerId,
        `paint.scheme.${motion.kind}.transit`
      );
    }
  }
  assert.deepEqual([...seen].sort(), [
    "binding", "branch", "primitive", "return", "structural", "summary"
  ]);
});

test("Scheme settlement evidence is direct-seek and rewind stable", () => {
  const forward = Array.from({ length: 501 }, (_, index) =>
    projection(index / 500));
  const reverse = Array.from({ length: 501 }, (_, index) =>
    projection((500 - index) / 500)).reverse();
  assert.deepEqual(reverse, forward);
});

test("branch deletion and reduced motion require exact scoped capabilities", () => {
  const branch = Array.from({ length: 501 }, (_, index) =>
    projection(index / 500)).find((motion) => motion.kind === "branch");
  assert.ok(branch?.kind === "branch");
  assert.equal(branch.settlement.exception?.kind, "semantic-deletion");
  assert.deepEqual(branch.settlement.exception?.materialIds,
    [branch.motif.dormantExpressionId]);
  assert.deepEqual(
    resolveKpCodeSettlementExceptionPolicy(branch.settlement.exception!),
    { relaxedLaw: "native-target-settlement", requiredOutcome: "semantic-absence" }
  );

  const reduced = mintKpSchemeReducedMotionSettlementException({
    transitionId: "scheme-factorial.transition.test",
    materialIds: ["scheme-factorial.material.test"]
  });
  assert.doesNotThrow(() => assertKpCodeSettlementExceptionScope({
    exception: reduced,
    transitionId: "scheme-factorial.transition.test",
    materialIds: ["scheme-factorial.material.test"],
    reducedMotion: true
  }));
  assert.throws(() => assertKpCodeSettlementExceptionScope({
    exception: reduced,
    transitionId: "scheme-factorial.transition.test",
    materialIds: ["scheme-factorial.material.test"],
    reducedMotion: false
  }), /requires reduced motion/u);
});

test("unsupported Scheme deletion cannot be an empty generic fallback", () => {
  assert.throws(() => sampleKpSchemeFactorialSettlement({
    motif: "branch",
    transitionId: "scheme-factorial.transition.test",
    materialIds: [],
    progress: 0.5
  }), /cannot be empty/u);
});
