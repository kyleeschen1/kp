import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createInitialEditorDocument, renderEditorDocument } from "../src/editor/editor.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "../src/editor/animation-player-shell.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  dispatchKpEditorAnimationSurface
} from "../src/editor/animation-surface-dispatch.ts";

test("editor animation player shell renders an accessible surface and declared controls", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);

  const html = renderKpEditorAnimationPlayerShell({
    descriptor,
    player: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress: 0.25,
      playbackStatus: "paused"
    })
  });

  assert.match(html, /data-kp-editor-animation-player/);
  assert.match(html, /data-kp-editor-animation-surface-slot="equation"/);
  assert.match(html, /data-action="play-editor-animation"/);
  assert.match(html, /data-action="pause-editor-animation"/);
  assert.match(html, /data-action="step-editor-animation"/);
  assert.match(html, /data-action="rewind-editor-animation"/);
  assert.match(html, /data-action="seek-editor-animation"/);
  assert.match(html, /value="0.25"/);
  assert.match(html, />25%<\/output>/);
  assert.match(html, /aria-live="polite">Paused · forward/);
  assert.match(html, /aria-keyshortcuts="Space ArrowLeft ArrowRight Home End R"/);
  assert.match(html, /data-kp-editor-animation-accessibility-control/);
  assert.match(html, /value="reduced-motion"/);
  assert.match(html, /data-kp-editor-animation-narration aria-live="polite"/);
  assert.match(html, /data-kp-editor-animation-authoring-controls/);
  for (const controlId of [
    "role-mode",
    "lineage-mode",
    "provenance-visibility",
    "salience-policy",
    "correctness-disclosure",
    "gap-policy",
    "spacing",
    "tempo",
    "path-preference"
  ]) {
    assert.match(html, new RegExp(`data-kp-animation-authoring-control="${controlId}"`));
  }
  assert.match(html, /Plan revision 0/);
});

test("editor document mounts the selected animation player shell", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => dispatchKpEditorAnimationSurface(candidate).kind === "graph"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(html, new RegExp(
    `data-kp-editor-animation-player[^>]+data-kp-editor-animation-id="${descriptor.animationId}"`
  ));
  assert.match(html, /data-kp-editor-animation-surface-slot="graph"/);
});
