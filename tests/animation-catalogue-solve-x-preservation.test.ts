import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkKpAnimationRuntimeRewindClockLaw
} from "../src/animation/runtime-laws.ts";
import {
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
} from "../src/editor/animation-catalogue-selection.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability
} from "../src/editor/animation-catalogue-surface-hostability.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";
import {
  createKpEditorEquationStageFrame,
  kpEditorEquationSurfaceAdapter
} from "../src/editor/equation-surface-adapter.ts";

const progressSamples = [0, 0.25, 0.5, 0.75, 1] as const;

async function loadSolveXBoundary() {
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId }) => animationId === KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
  );
  assert.ok(entry);
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === entry.primaryDescriptorId
  );
  assert.ok(descriptor);
  const loaded = await loadKpAnimationAsset(entry.animationId);
  return { entry, descriptor, loaded };
}

test("solve-x catalogue identity is the established lazy asset and primary descriptor", async () => {
  const { entry, descriptor, loaded } = await loadSolveXBoundary();

  assert.equal(entry.animationId, "animation.linear-solve.solve-x");
  assert.equal(
    entry.primaryDescriptorId,
    "editor-animation.animation.linear-solve.solve-x"
  );
  assert.equal(entry.packId, "algebra");
  assert.equal(loaded.animation.id, entry.animationId);
  assert.equal(loaded.packId, entry.packId);
  assert.equal(descriptor.animationId, loaded.animation.id);
});

test("solve-x catalogue player samples the established runtime clock exactly", async () => {
  const { descriptor, loaded } = await loadSolveXBoundary();

  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of progressSamples) {
      const player = createKpEditorAnimationPlayerState({
        descriptor,
        animation: loaded.animation,
        catalog: loaded.catalog,
        direction,
        progress
      });
      const direct = sampleKpAnimationRuntimeFrame({
        id: `runtime.editor.${loaded.animation.id}`,
        animation: loaded.animation,
        childAnimations: loaded.catalog,
        direction,
        progress
      });

      assert.deepEqual(player.runtimeFrame, direct);
      assert.equal(player.progress, direct.clock.progress);
      assert.equal(player.direction, direct.clock.direction);
    }
  }
});

test("solve-x catalogue preserves reverse law and native equation ownership", async () => {
  const { descriptor, loaded } = await loadSolveXBoundary();
  const player = createKpEditorAnimationPlayerState({
    descriptor,
    animation: loaded.animation,
    catalog: loaded.catalog,
    progress: 0.5
  });
  const registry = createKpEditorAnimationSurfaceAdapterRegistry([
    kpEditorEquationSurfaceAdapter
  ]);
  const hostability = inspectKpAnimationCatalogueSurfaceHostability({
    state: player,
    registry
  });
  const equation = createKpEditorEquationStageFrame({
    animation: loaded.animation,
    state: player,
    mathLayout: "inline"
  });

  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({
      animation: loaded.animation,
      childAnimations: loaded.catalog,
      progressSamples
    }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );
  assert.equal(player.surface.kind, "equation");
  assert.deepEqual(player.surface.slotKinds, ["equation"]);
  assert.equal(hostability.status, "ready");
  assert.equal(
    hostability.slots[0]?.adapterId,
    "editor-animation-surface.equation.katex"
  );
  assert.equal(equation.stageIdentityKey, loaded.animation.id);
  assert.equal(equation.mathLayout, "inline");
});

test("catalogue shell remains a host projection without runtime or renderer ownership", () => {
  const shellSource = readFileSync(
    new URL("../src/editor/animation-catalogue-shell.ts", import.meta.url),
    "utf8"
  );
  const selectionSource = readFileSync(
    new URL("../src/editor/animation-catalogue-selection.ts", import.meta.url),
    "utf8"
  );

  for (const forbiddenImport of [
    "runtime-sampler",
    "equation-surface-adapter",
    "linear-solve-adapter",
    "rendering/",
    "catalog-packs/"
  ]) {
    assert.equal(
      shellSource.includes(forbiddenImport),
      false,
      `catalogue shell must not own ${forbiddenImport}`
    );
    assert.equal(
      selectionSource.includes(forbiddenImport),
      false,
      `catalogue selection must not own ${forbiddenImport}`
    );
  }
  assert.match(shellSource, /renderKpEditorAnimationPlayerShell/);
});
