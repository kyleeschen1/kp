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
  assert.match(html, /data-kp-editor-animation-math-layout="display"/);
  assert.match(html, /data-kp-editor-animation-surface-slot="equation"/);
  assert.match(
    html,
    /data-action="toggle-editor-animation" aria-label="Play animation" disabled>Play/
  );
  assert.doesNotMatch(html, /data-action="play-editor-animation"/);
  assert.doesNotMatch(html, /data-action="pause-editor-animation"/);
  assert.match(html, /data-action="step-editor-animation"/);
  assert.match(html, /data-action="rewind-editor-animation"/);
  assert.match(html, /data-action="seek-editor-animation"/);
  assert.match(
    html,
    /data-action="seek-editor-animation" aria-label="Scrub animation progress" disabled/
  );
  assert.match(html, /value="0.25"/);
  assert.match(html, />25%<\/output>/);
  assert.match(html, /aria-live="polite">Paused · forward/);
  assert.match(html, /aria-keyshortcuts="Space ArrowLeft ArrowRight Home End R"/);
  assert.match(html, /data-kp-editor-animation-accessibility-control/);
  assert.match(html, /data-kp-editor-animation-explanation-profile-control/);
  assert.match(html, /value="reduced-motion"/);
  assert.match(html, /value="system" selected/);
  assert.match(html, /data-kp-editor-animation-quality-control/);
  assert.match(html, /data-kp-editor-animation-quality-status/);
  assert.match(html, /value="auto"/);
  assert.match(html, /value="balanced"/);
  assert.match(html, /value="efficient"/);
  assert.match(html, /data-kp-editor-animation-gestalt-style-control/);
  assert.match(html, /value="kp\.organic-subtle@1\.0\.0"/);
  assert.match(html, /value="kp\.restrained-editorial@1\.0\.0"/);
  assert.match(html, /data-kp-editor-animation-focus-experiment-control/);
  assert.match(html, /value="elevated"/);
  assert.match(html, /value="no-depth"/);
  assert.match(html, /data-kp-editor-animation-gestalt-diagnostics/);
  assert.match(html, /data-kp-editor-gestalt-envelope-phase/);
  assert.match(html, /data-kp-editor-gestalt-salience/);
  assert.match(html, /data-kp-editor-gestalt-traversal/);
  assert.match(html, /data-kp-editor-gestalt-capabilities/);
  assert.match(html, /data-kp-editor-focus-invariance/);
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

test("catalogue chrome renders only universal transport while retaining keyboard laws", () => {
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
      catalog
    }),
    chrome: "catalogue"
  });

  assert.match(html, /data-action="toggle-editor-animation"/);
  assert.match(html, /data-kp-editor-animation-math-layout="inline"/);
  assert.match(html, /data-action="seek-editor-animation"/);
  assert.doesNotMatch(
    html,
    /data-action="(?:step|rewind|reset)-editor-animation"/
  );
  assert.doesNotMatch(html, /data-kp-editor-animation-authoring-controls/);
  assert.doesNotMatch(html, /data-kp-editor-animation-gestalt-diagnostics/);
  assert.match(
    html,
    /aria-keyshortcuts="Space ArrowLeft ArrowRight Home End R"/
  );
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
