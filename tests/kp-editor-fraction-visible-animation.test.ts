import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

test("fraction simplification projects each semantic phase into the visible equation stage", () => {
  const animationId = "animation.generated.fraction-expression.two-fourths";
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === animationId
  );
  const animation = catalog.find((candidate) => candidate.id === animationId);
  assert.ok(descriptor);
  assert.ok(animation);

  const frames = [1 / 6, 0.5, 5 / 6].map((progress) =>
    createKpEditorEquationStageFrame({
      animation,
      state: createKpEditorAnimationPlayerState({
        descriptor,
        animation,
        catalog,
        progress
      })
    })
  );

  assert.deepEqual(
    frames.map((frame) => frame.projection.transitions[0]?.source[0]?.latex),
    ["\\frac{2}{4}", "\\frac{1 \\cdot 2}{2 \\cdot 2}", "\\frac{1}{2} \\cdot \\frac{2}{2}"]
  );
  assert.deepEqual(
    frames.map((frame) => frame.projection.transitions[0]?.target[0]?.latex),
    ["\\frac{1 \\cdot 2}{2 \\cdot 2}", "\\frac{1}{2} \\cdot \\frac{2}{2}", "\\frac{1}{2}"]
  );
  assert.deepEqual(frames.map((frame) => frame.motifs[0]?.kind), [
    "artifact-replace",
    "artifact-replace",
    "simplify-into"
  ]);
});
