import assert from "node:assert/strict";
import test from "node:test";

import "../src/animation/epistemic-branch-register.ts";
import {
  createProvisionalIncorrectSubstitutionAnimationAsset
} from "../src/animation/llm-animation-draft-examples.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from "../src/editor/equation-surface-adapter.ts";

test("editor stage exposes a non-settling provisional branch frame", () => {
  const animation = createProvisionalIncorrectSubstitutionAnimationAsset();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === animation.id
  );
  assert.ok(descriptor);
  const frame = createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog: [animation],
      progress: 1
    })
  });

  assert.equal(frame.epistemicBranch?.status, "provisional");
  assert.equal(frame.epistemicBranch?.settlesAsValid, false);
  assert.equal(frame.epistemicBranch?.trustedStateOpacity, 0.2);
  assert.equal(frame.epistemicBranch?.proposedStateOpacity, 0.86);
  assert.equal(frame.epistemicBranch?.cue?.tone, "provisional");
});
