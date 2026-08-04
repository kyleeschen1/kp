import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  deriveKpAnimationCatalogueHealth,
  type KpAnimationCatalogueHealthDiagnostic
} from "../src/editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability,
  type KpAnimationCatalogueSurfaceHostability
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
  createKpEditorGraphSvgViewportAdapter
} from "../src/editor/graph-svg-viewport.ts";
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

const graphSvgViewportAdapter = createKpEditorGraphSvgViewportAdapter(
  kpEditorGraphSvgAnimationIds
);

function currentHostability(): readonly KpAnimationCatalogueSurfaceHostability[] {
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
    kpEditorLispMaterialSurfaceAdapter
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

function hostability(
  status: KpAnimationCatalogueSurfaceHostability["status"] = "ready"
): KpAnimationCatalogueSurfaceHostability {
  return {
    schemaVersion: "kp.animation-catalogue-surface-hostability.v1",
    kind: "animation-catalogue-surface-hostability",
    descriptorId: "editor-animation.animation.test",
    animationId: "animation.test",
    surfaceKind: status === "unsupported-surface" ? "unsupported" : "equation",
    status,
    slots: status === "missing-adapter"
      ? [{ slotKind: "equation", status: "missing-adapter" }]
      : [{
          slotKind: "equation",
          status: "ready",
          adapterId: "adapter.test"
        }],
    unsupportedTargetKinds: status === "unsupported-surface"
      ? ["custom"]
      : []
  };
}

test("current unobserved catalogue health is honest about review and breakage", () => {
  const health = currentHostability().map((entry) =>
    deriveKpAnimationCatalogueHealth({
      hostability: entry,
      hostObservation: { status: "not-observed" }
    })
  );

  assert.deepEqual(
    Object.fromEntries(
      ["ready", "review", "broken"].map((status) => [
        status,
        health.filter((entry) => entry.status === status).length
      ])
    ),
    { ready: 0, review: 37, broken: 0 }
  );
  assert.deepEqual(
    health
      .filter(({ status }) => status === "broken")
      .map(({ animationId }) => animationId)
      .sort(),
    []
  );
});

test("clean observed paint is ready while pending evidence remains review", () => {
  assert.deepEqual(
    deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "painted" }
    }),
    {
      schemaVersion: "kp.animation-catalogue-health.v1",
      kind: "animation-catalogue-health",
      animationId: "animation.test",
      status: "ready",
      reasons: []
    }
  );
  assert.equal(
    deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "not-observed" }
    }).status,
    "review"
  );
  assert.equal(
    deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "painted" },
      reviewRequested: true
    }).status,
    "review"
  );
});

test("broken evidence takes precedence over review evidence", () => {
  const diagnostics: readonly KpAnimationCatalogueHealthDiagnostic[] = [
    { severity: "info", code: "info", message: "Informational." },
    { severity: "warning", code: "warning", message: "Needs attention." },
    { severity: "error", code: "error", message: "Cannot render." }
  ];
  const cases = [
    deriveKpAnimationCatalogueHealth({
      hostability: hostability("missing-adapter"),
      hostObservation: { status: "not-observed" }
    }),
    deriveKpAnimationCatalogueHealth({
      hostability: hostability("unsupported-surface"),
      hostObservation: { status: "not-observed" }
    }),
    deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "failed", message: "Paint threw." }
    }),
    deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "painted" },
      diagnostics,
      reviewRequested: true
    })
  ];

  assert.deepEqual(cases.map(({ status }) => status), [
    "broken",
    "broken",
    "broken",
    "broken"
  ]);
  assert.deepEqual(cases[3]?.reasons, [{
    code: "diagnostic-error",
    diagnosticCode: "error",
    message: "Cannot render."
  }]);
});

test("health stays independent from promotion and human disposition", async () => {
  const source = await readFile(
    new URL("../src/editor/animation-catalogue-health.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /presentation-promotion|workbench|theseus/i);
  assert.deepEqual(
    Object.keys(deriveKpAnimationCatalogueHealth({
      hostability: hostability(),
      hostObservation: { status: "painted" }
    })),
    ["schemaVersion", "kind", "animationId", "status", "reasons"]
  );
});
