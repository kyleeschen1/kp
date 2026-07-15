import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

test("function wrapping visibly moves an argument into its wrapper", () => {
  const animationId = "animation.generated.function-wrap.apply-f";
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

  assert.equal(frame.projection.transitions[0]?.source[0]?.latex, "x");
  assert.equal(frame.projection.transitions[0]?.target[0]?.latex, "f(x)");
  assert.equal(frame.motifs[0]?.kind, "wrap");
  assert.ok((frame.motifs[0]?.source.translateX ?? 0) < 0);
  assert.ok((frame.motifs[0]?.target.translateX ?? 0) > 0);
});
