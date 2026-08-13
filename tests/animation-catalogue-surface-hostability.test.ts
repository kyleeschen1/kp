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
  kpEditorGraph3DSurfaceAdapter
} from "../src/editor/graph-3d-surface-adapter.ts";
import {
  createKpEditorGraphSvgDomainAdapter as
    createKpEditorGraphSvgViewportAdapter
} from "../src/editor/graph-svg-domain-renderers.ts";
import {
  kpEditorGraphSvgAnimationIds
} from "../src/editor/selected-surface-capability.ts";
import {
  kpEditorOperationEvaluationSurfaceAdapter
} from "../src/editor/operation-evaluation-surface-adapter.ts";
import {
  kpEditorLispMaterialSurfaceAdapter
} from "../src/editor/lisp-material-surface-adapter.ts";
import {
  kpEditorPlaceValueAdditionSurfaceAdapter
} from "../src/editor/place-value-addition-surface-adapter.ts";
import {
  kpEditorProgrammingSurfaceAdapter
} from "../src/editor/programming-surface-adapter.ts";
import {
  kpEditorTypeScriptRefactorSurfaceAdapter
} from "../src/editor/typescript-refactor-surface-adapter.ts";

const graphSvgViewportAdapter = createKpEditorGraphSvgViewportAdapter(
  kpEditorGraphSvgAnimationIds
);

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
    kpEditorGraph3DSurfaceAdapter,
    graphSvgViewportAdapter,
    kpEditorOperationEvaluationSurfaceAdapter,
    kpEditorExactFractionQuantitySurfaceAdapter,
    kpEditorPlaceValueAdditionSurfaceAdapter,
    kpEditorProgrammingSurfaceAdapter,
    kpEditorLispMaterialSurfaceAdapter,
    kpEditorTypeScriptRefactorSurfaceAdapter
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

  assert.equal(hostability.length, 38);
  assert.deepEqual(
    Object.fromEntries(
      ["ready", "missing-adapter", "unsupported-surface"].map((status) => [
        status,
        hostability.filter((entry) => entry.status === status).length
      ])
    ),
    {
      ready: 38,
      "missing-adapter": 0,
      "unsupported-surface": 0
    }
  );
  assert.deepEqual(
    hostability
      .filter(({ status }) => status === "missing-adapter")
      .map(({ animationId }) => animationId)
      .sort(),
    []
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
    [{
      slotKind: "graph",
      status: "ready",
      adapterId: "editor-animation-surface.graph.webgl-3d"
    }]
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
      {
        slotKind: "programming",
        status: "ready",
        adapterId: "editor-animation-surface.programming.trace"
      }
    ]
  );
  assert.deepEqual(
    byId.get("animation.programming.add.execution-trace")?.slots,
    [{
      slotKind: "programming",
      status: "ready",
      adapterId: "editor-animation-surface.programming.trace"
    }]
  );
  assert.deepEqual(
    byId.get("animation.programming.lisp-lambda-application")?.slots,
    [{
      slotKind: "programming",
      status: "ready",
      adapterId: "editor-animation-surface.programming.lisp-material"
    }]
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
