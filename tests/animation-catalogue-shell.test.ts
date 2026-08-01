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
  renderKpAnimationCatalogueDetails,
  renderKpAnimationCatalogueInspector,
  renderKpAnimationCatalogueShell
} from "../src/editor/animation-catalogue-shell.ts";

const entry = createKpAnimationCatalogueProjection().entries.find(
  ({ animationId }) => animationId === KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
);
assert.ok(entry);
const entries = createKpAnimationCatalogueProjection().entries;
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
    entries,
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
    33
  );
  assert.equal(
    new Set([...html.matchAll(
      /data-kp-animation-catalogue-row="([^"]+)"/g
    )].map((match) => match[1])).size,
    33
  );
});

test("selected row is compact asset identity with derived health", () => {
  const html = renderKpAnimationCatalogueShell({
    entry,
    health,
    entries,
    descriptor,
    player
  });

  assert.match(html, /Solve x \+ 3 = 7/);
  assert.match(html, /data-action="filter-animation-catalogue"/);
  assert.match(html, /placeholder="Search artifacts"/);
  assert.match(
    html,
    /data-kp-animation-catalogue-health="review"[^>]*>Review/
  );
  assert.match(html, /<h3 id="kp-animation-catalogue-details-title">Details<\/h3>/);
  assert.match(html, /data-kp-animation-catalogue-stage-persistent="true"/);
  assert.match(html, /data-kp-editor-animation-player/);
  assert.match(html, /data-kp-editor-animation-math-layout="inline"/);
  assert.match(html, /data-kp-editor-animation-surface-slot="equation"/);
  assert.match(html, /data-action="toggle-editor-animation"/);
  assert.match(html, /data-action="seek-editor-animation"/);
  assert.doesNotMatch(
    html,
    /data-action="(?:step|rewind|reset)-editor-animation"/
  );
  assert.doesNotMatch(
    html,
    /data-kp-editor-animation-(?:accessibility|quality|gestalt-style|focus-experiment)-control/
  );
  assert.doesNotMatch(html, /data-kp-editor-animation-authoring-controls/);
  assert.doesNotMatch(html, /<h2(?:\s|>)/);
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
      entries,
      descriptor,
      player
    }),
    /does not match health/
  );
});

test("Details is one linear projection in stable evidence order", () => {
  const html = renderKpAnimationCatalogueDetails({ entry, health });
  const sections = [...html.matchAll(
    /data-kp-animation-catalogue-details-section="([^"]+)"/g
  )].map((match) => match[1]);

  assert.deepEqual(sections, [
    "identity",
    "semantics",
    "playback",
    "capabilities",
    "health",
    "related-contexts"
  ]);
  assert.match(html, /family\.algebra\.both-sides/);
  assert.match(html, /sample\.animation\.solve-x\.both-sides/);
  assert.match(html, /<dt>Duration<\/dt><dd>2\.4 s<\/dd>/);
  assert.match(html, /<dt>Beats<\/dt><dd>50<\/dd>/);
  assert.match(html, /Render targets/);
  assert.equal([...html.matchAll(/<a href=/g)].length, 7);
  assert.match(html, /view=editor/);
  assert.match(html, /The asset has not yet painted in the catalogue host/);
  assert.doesNotMatch(html, /searchTerms|role="tab"|<button/);
  assert.doesNotMatch(html, /<h2(?:\s|>)/);
});

test("Details omits empty optional sections instead of showing machinery", () => {
  const {
    durationMs: _durationMs,
    beatCount: _beatCount,
    ...requiredEntry
  } = entry;
  const html = renderKpAnimationCatalogueDetails({
    entry: {
      ...requiredEntry,
      familyIds: [],
      sampleIds: [],
      renderTargetKinds: [],
      controlKinds: [],
      tags: [],
      relatedContexts: []
    },
    health: { ...health, reasons: [] }
  });

  assert.deepEqual(
    [...html.matchAll(
      /data-kp-animation-catalogue-details-section="([^"]+)"/g
    )].map((match) => match[1]),
    ["identity", "health"]
  );
  assert.doesNotMatch(html, /Semantics|Playback|Capabilities|Related contexts/);
});

test("inspector keeps absent Parameters separate from review-only Tuning", () => {
  const html = renderKpAnimationCatalogueInspector({ entry, health });

  assert.match(html, /data-kp-animation-catalogue-inspector-view="details"/);
  assert.match(html, /data-action="select-animation-catalogue-inspector"/);
  assert.match(html, /data-kp-animation-catalogue-inspector-panel="details"/);
  assert.match(
    html,
    /data-kp-animation-catalogue-inspector-panel="parameters" hidden/
  );
  assert.match(
    html,
    /data-kp-animation-catalogue-inspector-panel="tuning" hidden/
  );
  assert.match(html, /no exposed semantic parameters/);
  assert.equal([...html.matchAll(
    /data-action="tune-animation-catalogue"/g
  )].length, 2);
  assert.match(html, /data-kp-animation-catalogue-tuning="gestalt-style"/);
  assert.match(html, /data-kp-animation-catalogue-tuning="focus-experiment"/);
  assert.doesNotMatch(html, /role="tab"|data-kp-animation-authoring-control/);
});
