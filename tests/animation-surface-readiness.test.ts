import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveKpEditorAnimationLoadOutcome
} from "../src/editor/animation-surface-readiness.ts";

test("surface preparation keeps the player load lifecycle pending", () => {
  assert.deepEqual(
    deriveKpEditorAnimationLoadOutcome({ readiness: "preparing" }),
    { status: "loading" }
  );
});

test("surface readiness and failure become exact terminal load outcomes", () => {
  assert.deepEqual(
    deriveKpEditorAnimationLoadOutcome({ readiness: "ready" }),
    { status: "ready" }
  );
  assert.deepEqual(
    deriveKpEditorAnimationLoadOutcome({
      readiness: "failed",
      error: "Native equation geometry failed to settle."
    }),
    {
      status: "failed",
      message: "Native equation geometry failed to settle."
    }
  );
});
