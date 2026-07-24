import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createKpSampledFrameEnvelope,
  validateKpSampledFrameEnvelope
} from "../src/animation/sampled-frame-envelope.ts";
import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";

const baseEnvelope = {
  schemaVersion: "kp.sampled-frame-envelope.v1" as const,
  id: "envelope.animation.sample.forward.0.5000",
  kind: "sampled-frame-envelope" as const,
  source: {
    animationId: "animation.sample",
    planId: "plan.sample",
    timelineId: "timeline.sample"
  },
  clock: {
    direction: "forward" as const,
    progress: 0.5,
    durationMs: 2_000,
    elapsedMs: 1_000,
    beatCount: 40,
    beat: 20
  },
  activity: {
    phaseId: "phase.sample.1",
    phaseIndex: 1,
    semanticObjectIds: ["object.sample"],
    transformationIds: ["transform.sample"],
    annotationIds: ["focus.sample"],
    focusSelectorIds: ["selector.sample"],
    childFrameIds: []
  },
  diagnostics: []
};

test("constructs a frozen canonical frame envelope", () => {
  const envelope = createKpSampledFrameEnvelope(baseEnvelope);

  assert.deepEqual(envelope, baseEnvelope);
  assert.equal(Object.isFrozen(envelope), true);
  assert.equal(Object.isFrozen(envelope.clock), true);
  assert.equal(Object.isFrozen(envelope.activity.transformationIds), true);
  assert.deepEqual(validateKpSampledFrameEnvelope(envelope), []);
});

test("frame clock validation enforces one normalized authority", () => {
  const issues = validateKpSampledFrameEnvelope({
    ...baseEnvelope,
    clock: {
      ...baseEnvelope.clock,
      progress: 0.75,
      elapsedMs: 1_000,
      beat: 20
    }
  });

  assert.deepEqual(
    issues.map(({ path, code }) => [path, code]),
    [
      ["$.clock.elapsedMs", "envelope.clock"],
      ["$.clock.beat", "envelope.clock"]
    ]
  );
});

test("payload attachment requires typed domain and schema discriminants", () => {
  const invalid = validateKpSampledFrameEnvelope({
    ...baseEnvelope,
    payload: { data: "untyped" }
  });
  const typed = createKpSampledFrameEnvelope({
    ...baseEnvelope,
    payload: {
      domain: "test-domain",
      schemaVersion: "kp.test-frame.v1",
      stateId: "state.test"
    }
  });

  assert.deepEqual(invalid, [{
    path: "$.payload",
    code: "envelope.payload",
    message:
      "Frame payload attachments require typed domain and schemaVersion discriminants."
  }]);
  assert.equal(typed.payload?.stateId, "state.test");
});

test("runtime frames project shared activity and child clocks into envelopes", () => {
  const animation = createLinearSolveProgrammingComparisonAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    animation,
    childAnimations: createKpAnimationAssets(),
    progress: 0.5
  });

  assert.equal(frame.envelope.source.animationId, animation.id);
  assert.equal(
    frame.envelope.source.planId,
    animation.transformationTree.root.id
  );
  assert.equal(frame.envelope.clock.progress, frame.clock.progress);
  assert.deepEqual(
    frame.envelope.activity.transformationIds,
    frame.activeTransformationIds
  );
  assert.deepEqual(
    frame.envelope.activity.childFrameIds,
    frame.childFrames.map(({ frame: child }) => child.envelope.id)
  );
  assert.ok(frame.envelope.activity.childFrameIds.length > 0);
});

test("the canonical envelope contains no concrete renderer resources", () => {
  const path = fileURLToPath(new URL(
    "../src/animation/sampled-frame-envelope.ts",
    import.meta.url
  ));
  const source = readFileSync(path, "utf8");

  assert.doesNotMatch(
    source,
    /\b(?:HTMLElement|SVGElement|WebGL|Three|KaTeX|pixel|DOMRect)\b/
  );
});
