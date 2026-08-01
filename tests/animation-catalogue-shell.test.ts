import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import type {
  KpAnimationCatalogueHealth
} from "../src/editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
} from "../src/editor/animation-catalogue-selection.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  renderKpAnimationCatalogueShell
} from "../src/editor/animation-catalogue-shell.ts";

const entry = createKpAnimationCatalogueProjection().entries.find(
  ({ animationId }) => animationId === KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
);
assert.ok(entry);
const catalog = createKpAnimationAssets();
const descriptor = createKpEditorAnimationLibrary().find(
  ({ id }) => id === entry.primaryDescriptorId
);
const animation = catalog.find(({ id }) => id === entry.animationId);
assert.ok(descriptor);
assert.ok(animation);
const player = createKpEditorAnimationPlayerState({
  descriptor,
  animation,
  catalog
});
const health: KpAnimationCatalogueHealth = {
  schemaVersion: "kp.animation-catalogue-health.v1",
  kind: "animation-catalogue-health",
  animationId: entry.animationId,
  status: "review",
  reasons: [{
    code: "host-not-observed",
    message: "The asset has not yet painted in the catalogue host."
  }]
};

test("solve-x shell has exactly three flat sibling regions", () => {
  const html = renderKpAnimationCatalogueShell({
    entry,
    health,
    descriptor,
    player
  });

  assert.equal(
    [...html.matchAll(/data-kp-animation-catalogue-region=/g)].length,
    3
  );
  assert.match(
    html,
    /data-kp-animation-catalogue-region="rail"[\s\S]*data-kp-animation-catalogue-region="stage"[\s\S]*data-kp-animation-catalogue-region="inspector"/
  );
  assert.equal(
    [...html.matchAll(/data-kp-animation-catalogue-row=/g)].length,
    1
  );
});

test("selected row is compact asset identity with derived health", () => {
  const html = renderKpAnimationCatalogueShell({
    entry,
    health,
    descriptor,
    player
  });

  assert.match(html, /Solve x \+ 3 = 7/);
  assert.match(html, /data-kp-animation-catalogue-health="review">Review/);
  assert.match(html, /<h3 id="kp-animation-catalogue-details-title">Details<\/h3>/);
  assert.match(html, /data-kp-animation-catalogue-stage-persistent="true"/);
  assert.match(html, /data-kp-editor-animation-player/);
  assert.match(html, /data-kp-editor-animation-surface-slot="equation"/);
  assert.doesNotMatch(
    html,
    /iframe|Animation Studio|Animation Workbench|representation picker|ontology/i
  );
});

test("shell rejects health attached to a different asset", () => {
  assert.throws(
    () => renderKpAnimationCatalogueShell({
      entry,
      health: { ...health, animationId: "animation.other" },
      descriptor,
      player
    }),
    /does not match health/
  );
});
