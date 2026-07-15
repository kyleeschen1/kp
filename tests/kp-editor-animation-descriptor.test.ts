import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationDescriptor,
  validateKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";

test("editor animation descriptor projects catalog and family identity without renderer state", () => {
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: "animation.linear-solve.solve-x",
    title: "Solve x + 3 = 7",
    summary: "Subtract, cancel, and simplify.",
    domain: "algebra",
    familyId: "family.algebra.both-sides",
    sampleId: "sample.animation.solve-x.both-sides",
    renderTargetKinds: ["equation", "equation"],
    durationMs: 3600,
    beatCount: 3,
    tags: ["equation", "equation"]
  });

  assert.deepEqual(descriptor, {
    id: "editor-animation.animation.linear-solve.solve-x",
    kind: "editor-animation-descriptor",
    animationId: "animation.linear-solve.solve-x",
    title: "Solve x + 3 = 7",
    summary: "Subtract, cancel, and simplify.",
    domain: "algebra",
    familyId: "family.algebra.both-sides",
    sampleId: "sample.animation.solve-x.both-sides",
    renderTargetKinds: ["equation"],
    controlKinds: ["playback", "step", "scrubber", "rewind"],
    durationMs: 3600,
    beatCount: 3,
    tags: ["equation"]
  });
  assert.deepEqual(validateKpEditorAnimationDescriptor(descriptor), []);
  assert.equal("asset" in descriptor, false);
  assert.equal("element" in descriptor, false);
});

test("editor animation descriptor validation rejects incomplete family and timing metadata", () => {
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: " ",
    title: " ",
    summary: " ",
    familyId: "family.algebra.broken",
    renderTargetKinds: [],
    durationMs: 0,
    beatCount: 0
  });

  assert.deepEqual(
    validateKpEditorAnimationDescriptor(descriptor).map((issue) => issue.path),
    [
      "animationId",
      "title",
      "summary",
      "renderTargetKinds",
      "sampleId",
      "durationMs",
      "beatCount"
    ]
  );
});
