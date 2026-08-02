import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import type {
  KpAnimationCatalogueHealth
} from "../src/editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueSelectedHostViewModel,
  reduceKpAnimationCatalogueHostView,
  type KpAnimationCatalogueHostCommand
} from "../src/editor/animation-catalogue-host-view-model.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
} from "../src/editor/animation-catalogue-selection.ts";
import {
  renderKpAnimationCatalogueShell
} from "../src/editor/animation-catalogue-shell.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";

const entries = createKpAnimationCatalogueProjection().entries;
const entry = requireDefined(entries.find(
  ({ animationId }) => animationId === KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
), "catalogue exemplar entry");
const descriptor = requireDefined(createKpEditorAnimationLibrary().find(
  ({ id }) => id === entry.primaryDescriptorId
), "catalogue exemplar descriptor");
const catalog = createKpAnimationAssets();
const animation = requireDefined(
  catalog.find(({ id }) => id === entry.animationId),
  "catalogue exemplar animation"
);
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
  reasons: []
};

function createView() {
  return createKpAnimationCatalogueSelectedHostViewModel({
    entry,
    health,
    entries,
    descriptor,
    player
  });
}

function requireDefined<T>(value: T | undefined, label: string): T {
  assert.ok(value, `Missing ${label}.`);
  return value;
}

test("selected host view keeps framework-neutral authority references", () => {
  const view = createView();

  assert.equal(view.schemaVersion, "kp.animation-catalogue-host-view.v1");
  assert.equal(view.kind, "animation-catalogue-selected-host-view");
  assert.equal(view.entry, entry);
  assert.equal(view.player, player);
  assert.deepEqual(view.chrome, {
    query: "",
    inspectorView: "details"
  });
  assert.equal(Object.isFrozen(view), true);
  assert.equal(Object.isFrozen(view.chrome), true);
});

test("chrome reducer is pure and projects into the existing shell", () => {
  const initial = createView();
  const filtered = reduceKpAnimationCatalogueHostView(initial, {
    kind: "filter",
    query: "vector projection"
  });
  const inspected = reduceKpAnimationCatalogueHostView(filtered, {
    kind: "select-inspector",
    view: "tuning"
  });
  const overlaid = reduceKpAnimationCatalogueHostView(inspected, {
    kind: "toggle-overlay",
    target: "inspector"
  });
  const html = renderKpAnimationCatalogueShell(overlaid);

  assert.equal(initial.chrome.query, "");
  assert.equal(overlaid.entry, initial.entry);
  assert.match(html, /value="vector projection"/);
  assert.match(html, /data-kp-animation-catalogue-overlay="inspector"/);
  assert.match(html, /data-kp-animation-catalogue-inspector-view="tuning"/);
  assert.match(html, /<option value="tuning" selected>/);
  assert.match(
    html,
    /data-kp-animation-catalogue-inspector-panel="details" hidden/
  );

  const closed = reduceKpAnimationCatalogueHostView(overlaid, {
    kind: "close-overlay"
  });
  assert.equal(closed.chrome.overlay, undefined);
});

test("host view rejects crossed selection and parallel parameter authority", () => {
  assert.throws(
    () => createKpAnimationCatalogueSelectedHostViewModel({
      entry,
      health: { ...health, animationId: "animation.other" },
      entries,
      descriptor,
      player
    }),
    /does not match health/
  );
  assert.throws(
    () => createKpAnimationCatalogueSelectedHostViewModel({
      entry,
      health,
      entries,
      descriptor,
      player,
      economicsParameters: {
        schemaVersion: "kp.economics-equilibrium-parameters.v1",
        demandInterceptAfter: 18
      },
      physicsParameters: {
        schemaVersion: "kp.constant-force-work-energy-parameters.v1",
        netForceNewtons: 3
      }
    }),
    /cannot expose economics and physics parameters together/
  );
  assert.throws(
    () => createKpAnimationCatalogueSelectedHostViewModel({
      entry,
      health,
      entries,
      descriptor,
      player,
      chrome: { inspectorView: "explanation" }
    }),
    /without a reader companion/
  );
});

test("host boundary types commands without absorbing their services", () => {
  const commands: readonly KpAnimationCatalogueHostCommand[] = [
    { kind: "select-artifact", animationId: entry.animationId, playhead: 0.5 },
    { kind: "replace-playhead", progress: 0.5 },
    {
      kind: "tune-presentation",
      tuning: "focus-experiment",
      value: "flat"
    },
    { kind: "set-economics-demand-intercept", value: 18 },
    { kind: "set-physics-net-force", value: 3 }
  ];

  assert.deepEqual(commands.map(({ kind }) => kind), [
    "select-artifact",
    "replace-playhead",
    "tune-presentation",
    "set-economics-demand-intercept",
    "set-physics-net-force"
  ]);

  const source = readFileSync(
    new URL("../src/editor/animation-catalogue-host-view-model.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /from "svelte|HTMLElement|window\.|document\./);
  assert.doesNotMatch(
    source,
    /loadKpAnimationAsset|sampleKpAnimationRuntimeFrame|hydrateKpEditorAnimation/
  );
  assert.equal(
    [...source.matchAll(/^import(?! type)/gm)].length,
    0,
    "host view model imports contracts only"
  );
});
