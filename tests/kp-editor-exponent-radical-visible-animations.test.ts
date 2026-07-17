import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

function frame(animationId: string, progress: number) {
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
      progress
    })
  });
}

test("exponent expansion visibly lowers then unwraps the unit exponent", () => {
  const lower = frame("animation.generated.exponent.square-as-product", 0.25);
  const unwrap = frame("animation.generated.exponent.square-as-product", 0.75);

  assert.deepEqual([
    lower.projection.transitions[0]?.source[0]?.latex,
    lower.projection.transitions[0]?.target[0]?.latex,
    lower.motifs[0]?.kind
  ], ["x^{2}", "x \\cdot x^{1}", "append-after-shift"]);
  assert.deepEqual([
    unwrap.projection.transitions[0]?.source[0]?.latex,
    unwrap.projection.transitions[0]?.target[0]?.latex,
    unwrap.motifs[0]?.kind
  ], ["x \\cdot x^{1}", "x \\cdot x", "unwrap"]);
});

test("radical rewrite visibly replaces the rational exponent with a root", () => {
  const radical = frame("animation.generated.radical.square-root-as-power", 0.5);
  assert.deepEqual([
    radical.projection.transitions[0]?.source[0]?.latex,
    radical.projection.transitions[0]?.target[0]?.latex,
    radical.motifs[0]?.kind
  ], ["x^{\\frac{1}{2}}", "\\sqrt{x}", "radical-corner-transfer"]);
});
