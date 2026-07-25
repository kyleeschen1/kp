import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAsset,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  createKpAnimationPresentationConstraintsV1,
  validateKpAnimationPresentationConstraintsV1,
  type KpAnimationPresentationConstraintsV1
} from "../src/animation/presentation-constraints.ts";

test("animation asset carries renderer-independent presentation constraints", () => {
  const source = createLinearSolveAnimationAsset();
  const constraints = createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: [
      "accessibility",
      "annotation",
      "direct-seek",
      "hover",
      "responsive",
      "rewind"
    ]
  });
  const animation = createKpAnimationAsset({
    id: source.id,
    title: source.title,
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: source.transformationTree,
    ...(source.timeline === undefined ? {} : { timeline: source.timeline }),
    ...(source.layout === undefined ? {} : { layout: source.layout }),
    renderTargets: source.renderTargets,
    checks: source.checks,
    exportTargets: source.exportTargets,
    ...(source.dashboard === undefined ? {} : { dashboard: source.dashboard }),
    ...(source.presentationProfile === undefined
      ? {}
      : { presentationProfile: source.presentationProfile }),
    presentationConstraints: constraints,
    ...(source.metadata === undefined ? {} : { metadata: source.metadata })
  });

  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.deepEqual(animation.presentationConstraints, constraints);
  assert.notEqual(animation.presentationConstraints, constraints);
  assert.equal(Object.isFrozen(animation.presentationConstraints), true);
  assert.equal(
    Object.isFrozen(animation.presentationConstraints?.requiredCapabilities),
    true
  );
});

test("legacy animation assets remain valid without presentation constraints", () => {
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  assert.equal(animation.presentationConstraints, undefined);
  assert.deepEqual(validateKpAnimationAsset(animation), []);
});

test("serialized constraints contain no measured glyph or backend plan state", () => {
  const constraints = createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: ["accessibility", "direct-seek", "rewind"]
  });
  const serialized = JSON.stringify(constraints);
  assert.doesNotMatch(
    serialized,
    /backendPlan|domHandle|glyphRect|keyframe|measuredGlyph|pixelRect/
  );
  assert.deepEqual(JSON.parse(serialized), constraints);
});

test("constraint validation rejects backend state and semantic ambiguity", () => {
  const valid = createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: ["accessibility", "direct-seek", "rewind"]
  });
  const forged = {
    ...valid,
    glyphMatching: "visual-equality",
    allowOperationSpecificScheduler: true,
    backendPlan: { glyphRects: [] }
  } as unknown as KpAnimationPresentationConstraintsV1;
  assert.deepEqual(validateKpAnimationPresentationConstraintsV1(forged), [
    "Presentation constraints contain unsupported field backendPlan.",
    "Glyph matching must remain inside semantic lineage.",
    "Operation-specific schedulers are forbidden."
  ]);
});

test("backend capability mismatch must preserve, lower, or reject explicitly", () => {
  const constraints = createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: [
      "accessibility",
      "branching",
      "cloze",
      "direct-seek",
      "rewind"
    ],
    maxPlannerOperations: 4_096
  });
  assert.deepEqual(constraints.backendPolicy, {
    primary: "static-js",
    capabilityMismatch: "preserve-lower-or-reject",
    runtimeDependencies: "none"
  });
  assert.equal(constraints.maxPlannerOperations, 4_096);
});
