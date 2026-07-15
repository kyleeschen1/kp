import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

test("inequality animation visibly turns the relation under negative multiplication", () => {
  const animationId = "animation.inequality.sign-flip.basic";
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === animationId
  );
  const animation = catalog.find((candidate) => candidate.id === animationId);
  assert.ok(descriptor);
  assert.ok(animation);

  const frame = createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress: 0.5
    })
  });
  const motif = frame.motifs[0];

  assert.equal(frame.projection.transitions[0]?.source[0]?.latex, "x < 3");
  assert.equal(frame.projection.transitions[0]?.target[0]?.latex, "-2x > -6");
  assert.equal(motif?.kind, "relation-flip");
  assert.equal(motif?.source.rotateY, -45);
  assert.equal(motif?.target.rotateY, 45);
});
