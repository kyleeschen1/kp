import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  sampleDotProjectionRuntimeFrame
} from "../src/animation/dot-projection-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import type {
  KpAnimationCatalogueHealth
} from "../src/editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  renderKpAnimationCatalogueShell
} from "../src/editor/animation-catalogue-shell.ts";
import {
  createKpAnimationCatalogueSelectedHostViewModel
} from "../src/editor/animation-catalogue-host-view-model.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability
} from "../src/editor/animation-catalogue-surface-hostability.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import {
  createKpEditorGraphSvgViewportModel,
  kpEditorGraphSvgViewportAdapter
} from "../src/editor/graph-svg-viewport.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";
import {
  renderKpVectorDotProjectionRuntimeContent
} from "../src/rendering/vector-dot-projection-svg.ts";

const animationId = "animation.dot-projection.basic";

test("vector exemplar has one exact lazy graph registration and one native host", async () => {
  const registry = createKpAnimationCatalogueLoadableRegistry();
  const projection = createKpAnimationCatalogueProjection();
  const registration = registry.filter((entry) =>
    entry.animationId === animationId
  );
  const rows = projection.entries.filter((entry) =>
    entry.animationId === animationId
  );

  assert.deepEqual(registration, [{
    schemaVersion: "kp.animation-catalogue-loadable-registry-entry.v1",
    kind: "loadable-animation-asset",
    animationId,
    primaryDescriptorId: "editor-animation.animation.dot-projection.basic",
    packId: "graph"
  }]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0]?.renderTargetKinds, ["graph"]);
  assert.equal(rows[0]?.humanDisposition, "keep");

  const loaded = await loadKpAnimationAsset(animationId);
  assert.equal(loaded.packId, "graph");
  assert.equal(loaded.animation.id, animationId);
  assert.equal(
    loaded.catalog.filter(({ id }) => id === animationId).length,
    1
  );
});

test("vector catalogue shell exposes only compact transport by default", () => {
  const entries = createKpAnimationCatalogueProjection().entries;
  const entry = entries.find((candidate) =>
    candidate.animationId === animationId
  );
  const descriptor = createKpEditorAnimationLibrary().find((candidate) =>
    candidate.id === entry?.primaryDescriptorId
  );
  const catalog = createKpAnimationAssets();
  const animation = catalog.find(({ id }) => id === animationId);
  assert.ok(entry);
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
    animationId,
    status: "review",
    reasons: [{
      code: "host-not-observed",
      message: "Awaiting the focused visual checkpoint."
    }]
  };
  const html = renderKpAnimationCatalogueShell(
    createKpAnimationCatalogueSelectedHostViewModel({
      entry,
      health,
      entries,
      descriptor,
      player
    })
  );

  assert.equal([...html.matchAll(/data-action="toggle-editor-animation"/g)].length, 1);
  assert.equal([...html.matchAll(/data-action="seek-editor-animation"/g)].length, 1);
  assert.doesNotMatch(
    html,
    /data-action="(?:step|rewind|reset)-editor-animation"/
  );
  assert.doesNotMatch(
    html,
    /data-kp-editor-animation-(?:accessibility|explanation-profile|quality|gestalt-style|focus-experiment)-control/
  );
  assert.match(
    html,
    /data-kp-animation-catalogue-inspector-panel="parameters" hidden[\s\S]*no exposed semantic parameters/
  );
  assert.match(
    html,
    /data-kp-animation-catalogue-inspector-panel="tuning" hidden/
  );
  assert.doesNotMatch(html, /iframe|Animation Studio|ontology/i);

  assert.deepEqual(
    inspectKpAnimationCatalogueSurfaceHostability({
      state: player,
      registry: createKpEditorAnimationSurfaceAdapterRegistry([
        kpEditorGraphSvgViewportAdapter
      ])
    }).slots,
    [{
      slotKind: "graph",
      status: "ready",
      adapterId: "editor-animation-surface.graph.svg"
    }]
  );
});

test("shareable settled checkpoint retains exact static graph truth", () => {
  const animation = createKpAnimationAssets().find(({ id }) =>
    id === animationId
  );
  assert.ok(animation);
  const frame = sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 1
    })
  });
  const html = renderKpVectorDotProjectionRuntimeContent({
    frame,
    viewport: createKpEditorGraphSvgViewportModel(animation)
  });

  assert.match(html, /data-kp-vector-dot-projection-beat="native-settlement"/);
  assert.match(html, /data-kp-editor-graph-drop-point="3,3"/);
  assert.match(html, /data-kp-vector-right-angle/);
  assert.match(html, /data-kp-vector-nonvisual-summary/);
  assert.doesNotMatch(html, /<text(?:\s|>)/);
});

test("vector registration keeps the graph pack lazy and Three isolated", () => {
  const loaderSource = readFileSync(
    new URL("../src/animation/catalog-loader.ts", import.meta.url),
    "utf8"
  );

  assert.match(loaderSource, /import\("\.\/catalog-packs\/graph\.ts"\)/);
  assert.doesNotMatch(loaderSource, /from ["']three["']/);
  assert.doesNotMatch(loaderSource, /import\(["']three["']\)/);
});
