import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

test("matrix-vector multiplication visibly resolves its exact result vector", () => {
  const animationId = "animation.generated.linear-algebra.matrix-vector.two-by-two";
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find((d) => d.animationId === animationId);
  const animation = catalog.find((a) => a.id === animationId);
  assert.ok(descriptor);
  assert.ok(animation);
  const frame = createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({ descriptor, animation, catalog, progress: 0.5 })
  });

  assert.match(frame.projection.transitions[0]?.source[0]?.latex ?? "", /2 & 1/);
  assert.match(frame.projection.transitions[0]?.target[0]?.latex ?? "", /13 \\\\ 15/);
  assert.equal(frame.motifs[0]?.kind, "matrix-row-compose");
  assert.equal(
    frame.matrixVectorComposition?.choreography.rendererPlan.kind,
    "matrix-vector-renderer-plan"
  );
  assert.deepEqual(
    frame.matrixVectorComposition?.choreography.rows.map((row) => row.result),
    [13, 15]
  );
});
