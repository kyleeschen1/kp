import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorEquationTransitionMotifFrame
} from "../src/editor/equation-transition-motifs.ts";
import { projectKpEditorEquationRuntimeFrame } from "../src/editor/equation-runtime-frame-projection.ts";

test("equation transition motifs map semantic transform types to reusable motion", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === "animation.linear-solve.solve-x"
  );
  assert.ok(animation);

  const projection = projectKpEditorEquationRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 })
  });
  const transition = projection.transitions[0];
  assert.ok(transition);

  const frame = createKpEditorEquationTransitionMotifFrame({
    transition,
    progress: 0.5
  });

  assert.equal(frame.kind, "cancelation");
  assert.equal(frame.source.opacity, 0.5);
  assert.equal(frame.target.opacity, 0.5);
  assert.ok(frame.source.scale < 1);
  assert.ok(frame.source.blurPx > 0);
  assert.deepEqual(frame.focusLabels, ["+3", "-3"]);
});

test("equation transition motifs use artifact replacement as an honest generic fallback", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === "animation.inequality.sign-flip.basic"
  );
  assert.ok(animation);
  const transition = projectKpEditorEquationRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 })
  }).transitions[0];
  assert.ok(transition);

  assert.equal(
    createKpEditorEquationTransitionMotifFrame({ transition, progress: 0.5 }).kind,
    "artifact-replace"
  );
});
