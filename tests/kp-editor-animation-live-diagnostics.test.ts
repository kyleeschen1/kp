import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationLiveDiagnostics
} from "../src/editor/animation-live-diagnostics.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";

test("live editor diagnostics project the selected runtime frame", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);

  const diagnostics = createKpEditorAnimationLiveDiagnostics(
    createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      playbackStatus: "paused",
      direction: "rewind",
      progress: 0.5
    })
  );

  assert.equal(diagnostics.playbackStatus, "paused");
  assert.equal(diagnostics.direction, "rewind");
  assert.equal(diagnostics.progress, 0.5);
  assert.match(diagnostics.phaseId, /\.rewind\./);
  assert.equal(diagnostics.activeTransformationCount, 1);
  assert.equal(diagnostics.activeRenderTargetCount, 1);
  assert.equal(diagnostics.activeSelectorCount, 12);
  assert.ok(diagnostics.runtimeDiagnosticCount > 0);
});
