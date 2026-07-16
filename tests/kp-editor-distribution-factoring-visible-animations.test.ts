import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

function transition(animationId: string) {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === animationId
  );
  const animation = catalog.find((candidate) => candidate.id === animationId);
  assert.ok(descriptor);
  assert.ok(animation);
  return createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress: 0.5
    })
  });
}

test("distribution and factoring visibly preserve their opposite semantic directions", () => {
  const distribution = transition("animation.generated.distribution.expand-a-sum");
  const factoring = transition("animation.generated.distribution.factor-common-a");

  assert.deepEqual([
    distribution.projection.transitions[0]?.source[0]?.latex,
    distribution.projection.transitions[0]?.target[0]?.latex,
    distribution.motifs[0]?.kind
  ], ["a(b + c)", "ab + ac", "copy-fan-out"]);
  assert.deepEqual([
    factoring.projection.transitions[0]?.source[0]?.latex,
    factoring.projection.transitions[0]?.target[0]?.latex,
    factoring.motifs[0]?.kind
  ], ["ab + ac", "a(b + c)", "merge-fan-in"]);
});
