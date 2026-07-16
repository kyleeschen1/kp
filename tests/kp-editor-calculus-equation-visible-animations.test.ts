import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

function frame(animationId: string, progress = 0.5) {
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

test("generated calculus equations expose exact derivative and integral transitions", () => {
  const cases = [
    [
      "animation.generated.calculus.derivative.power-rule-x-cubed",
      "\\frac{d}{dx}x^{3}",
      "3x^{2}"
    ],
    [
      "animation.generated.calculus.integral.power-rule-quadratic",
      "\\int 6x^{2}\\,dx",
      "2x^{3} + C"
    ]
  ] as const;

  for (const [index, [animationId, source, target]] of cases.entries()) {
    const visible = frame(animationId);
    assert.equal(visible.projection.transitions[0]?.source[0]?.latex, source);
    assert.equal(visible.projection.transitions[0]?.target[0]?.latex, target);
    assert.equal(
      visible.motifs[0]?.kind,
      index === 0 ? "derivative-power" : "artifact-replace"
    );
  }

  const distributed = frame(
    "animation.generated.calculus.derivative.sum-rule-polynomial",
    0.25
  );
  assert.equal(
    distributed.projection.transitions[0]?.source[0]?.latex,
    "\\frac{d}{dx}(x^{3} + 2x)"
  );
  assert.equal(
    distributed.projection.transitions[0]?.target[0]?.latex,
    "\\frac{d}{dx}x^{3} + \\frac{d}{dx}2x"
  );
  assert.equal(distributed.motifs[0]?.kind, "copy-fan-out");

  const resolved = frame(
    "animation.generated.calculus.derivative.sum-rule-polynomial",
    0.75
  );
  assert.equal(
    resolved.projection.transitions[0]?.source[0]?.latex,
    "\\frac{d}{dx}x^{3} + \\frac{d}{dx}2x"
  );
  assert.equal(resolved.projection.transitions[0]?.target[0]?.latex, "3x^{2} + 2");
  assert.equal(resolved.motifs[0]?.kind, "merge-fan-in");
});

test("FTC equation animation expands its comparison into both visible theorem forms", () => {
  const visible = frame("animation.sample.fundamental-theorem-calculus", 1);
  assert.deepEqual(
    visible.projection.transitions[0]?.target.map((object) => object.id),
    ["formula-ftc-derivative", "formula-ftc-net-change"]
  );
});
