import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpCallerProvenEquationPresentationPolicy,
  kpEquationPolicyCallerIds,
  kpEquationSettlementTolerancePx,
  resolveKpEquationMotionAccessibility
} from "../src/animation/equation-shared-presentation-policy.ts";
import {
  resolveKpSemanticVisualTreatment
} from "../src/animation/semantic-visual-treatment.ts";
import {
  createKpReaderClockSample
} from "../src/reader/runtime/playback-clock.ts";

test("shared equation policy is evidenced by three contrasting callers", () => {
  assert.deepEqual(kpEquationPolicyCallerIds, [
    "log-quotient",
    "distribution",
    "cancellation"
  ]);
  assert.equal(
    kpCallerProvenEquationPresentationPolicy.measurement.geometryTolerancePx,
    kpEquationSettlementTolerancePx
  );
  assert.equal(
    kpCallerProvenEquationPresentationPolicy.measurement
      .settlementConsecutiveFrames,
    2
  );
  assert.ok(
    kpCallerProvenEquationPresentationPolicy.measurement
      .settlementFrameBudget > 2
  );
  assert.equal(
    kpCallerProvenEquationPresentationPolicy.clock.rendererScheduling,
    "forbidden"
  );
  assert.equal(Object.isFrozen(kpCallerProvenEquationPresentationPolicy), true);
});

test("policy reuses canonical typography without absorbing caller geometry", () => {
  const css = readFileSync(
    new URL("../src/rendering/canonical-equation-stage.css", import.meta.url),
    "utf8"
  );
  const policy = kpCallerProvenEquationPresentationPolicy;
  assert.match(css, new RegExp(`\\.${policy.typography.stageClass}\\s*\\{`));
  assert.match(css, new RegExp(policy.typography.typeSizeProperty));
  assert.deepEqual(Object.keys(policy).sort(), [
    "accessibility",
    "callers",
    "clock",
    "measurement",
    "schemaVersion",
    "semanticStyleRoles",
    "typography"
  ]);
  assert.doesNotMatch(JSON.stringify(policy), /path|arc|easing|duration|offset/i);
});

test("dark and light equation endpoints use the shared semantic role vocabulary", () => {
  for (const role of kpCallerProvenEquationPresentationPolicy.semanticStyleRoles) {
    const dark = resolveKpSemanticVisualTreatment({
      theme: "dark",
      role,
      state: { level: "normal", identityFamily: "cyan", presence: 1 }
    });
    const light = resolveKpSemanticVisualTreatment({
      theme: "light",
      role,
      state: { level: "normal", identityFamily: "cyan", presence: 1 }
    });
    assert.equal(dark.rendered, true);
    assert.equal(light.rendered, true);
    assert.equal(dark.opacity, 1);
    assert.equal(light.opacity, 1);
    assert.notEqual(dark.color, "");
    assert.notEqual(light.color, "");
  }
});

test("accessibility projection preserves reviewed full and reduced behavior", () => {
  assert.equal(resolveKpEquationMotionAccessibility("full-motion"), "full");
  assert.equal(resolveKpEquationMotionAccessibility("narrated"), "full");
  assert.equal(resolveKpEquationMotionAccessibility("reduced-motion"), "reduced");
  assert.equal(resolveKpEquationMotionAccessibility("static"), "no-depth");
});

test("one normalized clock sample remains exact at endpoints and mid-flight", () => {
  for (const progress of [0, 0.375, 1]) {
    const sample = createKpReaderClockSample({ source: "controls", progress });
    assert.equal(sample.progress, progress);
    assert.equal(sample.progressPermille, Math.round(progress * 1_000));
  }
});
