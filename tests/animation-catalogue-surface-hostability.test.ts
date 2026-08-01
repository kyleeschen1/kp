import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability
} from "../src/editor/animation-catalogue-surface-hostability.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";
import { kpEditorDiagramSvgAdapter } from "../src/editor/diagram-svg-adapter.ts";
import {
  kpEditorEquationSurfaceAdapter
} from "../src/editor/equation-surface-adapter.ts";
import {
  kpEditorExactFractionQuantitySurfaceAdapter
} from "../src/editor/exact-fraction-quantity-surface-adapter.ts";
import {
  kpEditorGraphSvgViewportAdapter
} from "../src/editor/graph-svg-viewport.ts";
import {
  kpEditorOperationEvaluationSurfaceAdapter
} from "../src/editor/operation-evaluation-surface-adapter.ts";
import {
  kpEditorPlaceValueAdditionSurfaceAdapter
} from "../src/editor/place-value-addition-surface-adapter.ts";

function currentHostability() {
  const catalog = createKpAnimationAssets();
  const descriptors = new Map(
    createKpEditorAnimationLibrary().map((descriptor) => [
      descriptor.id,
      descriptor
    ])
  );
  const assets = new Map(catalog.map((asset) => [asset.id, asset]));
  const registry = createKpEditorAnimationSurfaceAdapterRegistry([
    kpEditorEquationSurfaceAdapter,
    kpEditorDiagramSvgAdapter,
    kpEditorGraphSvgViewportAdapter,
    kpEditorOperationEvaluationSurfaceAdapter,
    kpEditorExactFractionQuantitySurfaceAdapter,
    kpEditorPlaceValueAdditionSurfaceAdapter
  ]);

  return createKpAnimationCatalogueLoadableRegistry().map((entry) => {
    const descriptor = descriptors.get(entry.primaryDescriptorId);
    const animation = assets.get(entry.animationId);
    assert.ok(descriptor);
    assert.ok(animation);
    return inspectKpAnimationCatalogueSurfaceHostability({
      state: createKpEditorAnimationPlayerState({
        descriptor,
        animation,
        catalog
      }),
      registry
    });
  });
}

test("hostability requires every concrete asset slot to resolve an adapter", () => {
  const hostability = currentHostability();

  assert.equal(hostability.length, 35);
  assert.deepEqual(
    Object.fromEntries(
      ["ready", "missing-adapter", "unsupported-surface"].map((status) => [
        status,
        hostability.filter((entry) => entry.status === status).length
      ])
    ),
    {
      ready: 32,
      "missing-adapter": 3,
      "unsupported-surface": 0
    }
  );
  assert.deepEqual(
    hostability
      .filter(({ status }) => status === "missing-adapter")
      .map(({ animationId }) => animationId)
      .sort(),
    [
      "animation.comparison.linear-solve-programming",
      "animation.graph.surface-mode.mesh-to-donut",
      "animation.programming.add.execution-trace"
    ]
  );
});

test("hostability records exact generic and specialized adapter ownership", () => {
  const hostability = currentHostability();
  const byId = new Map(
    hostability.map((entry) => [entry.animationId, entry])
  );

  assert.deepEqual(
    byId.get("animation.linear-solve.solve-x")?.slots,
    [{
      slotKind: "equation",
      status: "ready",
      adapterId: "editor-animation-surface.equation.katex"
    }]
  );
  assert.deepEqual(
    byId.get("animation.operation-evaluation.one-plus-two")?.slots,
    [{
      slotKind: "equation",
      status: "ready",
      adapterId:
        "editor-animation-surface.operation-evaluation.canonical-native-katex"
    }]
  );
  assert.deepEqual(
    byId.get(
      "animation.economics.supply-demand-equilibrium-shift"
    )?.slots,
    [{
      slotKind: "graph",
      status: "ready",
      adapterId: "editor-animation-surface.graph.svg"
    }]
  );
  assert.deepEqual(
    byId.get("animation.graph.surface-mode.mesh-to-donut")?.slots,
    [{ slotKind: "graph", status: "missing-adapter" }]
  );
  assert.deepEqual(
    byId.get("animation.physics.constant-force-work-energy")?.slots,
    [{
      slotKind: "graph",
      status: "ready",
      adapterId: "editor-animation-surface.graph.svg"
    }]
  );
  assert.deepEqual(
    byId.get("animation.comparison.linear-solve-programming")?.slots,
    [
      {
        slotKind: "equation",
        status: "ready",
        adapterId: "editor-animation-surface.equation.katex"
      },
      { slotKind: "programming", status: "missing-adapter" }
    ]
  );
});

test("recognized dispatch cannot hide unsupported or absent host surfaces", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ animationId }) => animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    ({ id }) => id === "animation.linear-solve.solve-x"
  );
  assert.ok(descriptor);
  assert.ok(animation);
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog
  });
  const registry = createKpEditorAnimationSurfaceAdapterRegistry([
    kpEditorEquationSurfaceAdapter
  ]);

  assert.equal(
    inspectKpAnimationCatalogueSurfaceHostability({
      state: {
        ...state,
        surface: {
          ...state.surface,
          kind: "unsupported",
          unsupportedTargetKinds: ["custom"]
        }
      },
      registry
    }).status,
    "unsupported-surface"
  );
  assert.equal(
    inspectKpAnimationCatalogueSurfaceHostability({
      state,
      registry: createKpEditorAnimationSurfaceAdapterRegistry()
    }).status,
    "missing-adapter"
  );
});
