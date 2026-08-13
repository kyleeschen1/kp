import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";
import {
  createKpEditorSelectedSurfaceCapabilityHost,
  KpEditorSelectedSurfaceCapabilityLoadError
} from "../src/editor/selected-surface-capability-host.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";

test("selected surface capabilities keep rich renderers explicit", () => {
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.exact-fraction-quantity.third-plus-sixth",
    slotKinds: ["equation"]
  }), ["exact-fraction-quantity", "equation-katex"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.operation-evaluation.one-plus-two",
    slotKinds: ["equation"]
  }), ["operation-evaluation", "equation-katex"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.place-value-addition.278-plus-156",
    slotKinds: ["diagram"]
  }), ["place-value-addition"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.linear-solve.solve-x",
    slotKinds: ["equation"]
  }), ["equation-katex"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.dot-projection.basic",
    slotKinds: ["graph"]
  }), ["graph-svg-katex-labels"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.economics.supply-demand-equilibrium-shift",
    slotKinds: ["graph"]
  }), ["graph-svg-economics"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.graph.surface-mode.mesh-to-donut",
    slotKinds: ["graph"]
  }), ["graph-webgl-3d"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.programming.add.execution-trace",
    slotKinds: ["programming"]
  }), ["programming-trace"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.programming.typescript-free-shipping-refactor",
    slotKinds: ["programming"]
  }), ["programming-trace"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.comparison.linear-solve-programming",
    slotKinds: ["equation", "programming"]
  }), ["equation-katex", "programming-trace"]);
});

test("capability failures are typed and remain retryable", async () => {
  let attempts = 0;
  const host = createKpEditorSelectedSurfaceCapabilityHost({
    registry: {
      list: () => [],
      resolve: () => undefined,
      register() {
        attempts += 1;
        throw new Error("synthetic registration failure");
      }
    }
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(
      host.load("exact-fraction-quantity"),
      (error: unknown) =>
        error instanceof KpEditorSelectedSurfaceCapabilityLoadError &&
        error.code === "capability-load-failed" &&
        error.capability === "exact-fraction-quantity"
    );
  }
  assert.equal(attempts, 2);
});

test("specialized surface capabilities register explicitly and idempotently", async () => {
  const registry = createKpEditorAnimationSurfaceAdapterRegistry();
  const host = createKpEditorSelectedSurfaceCapabilityHost({ registry });

  await host.loadAll([
    "exact-fraction-quantity",
    "operation-evaluation",
    "place-value-addition",
    "exact-fraction-quantity"
  ]);

  assert.deepEqual(registry.list().map(({ id }) => id).sort(), [
    "editor-animation-surface.exact-fraction-quantity.synchronized",
    "editor-animation-surface.operation-evaluation.canonical-native-katex",
    "editor-animation-surface.place-value-addition.synchronized"
  ]);
});

test("one capability host owns all dynamic selected-surface imports", async () => {
  const [
    mainSource,
    catalogueSource,
    capabilityHostSource,
    equationCapability,
    exactQuantityCapability,
    operationEvaluationCapability,
    placeValueCapability,
    economicsGraphCapability,
    graphCapability,
    graph3DCapability,
    programmingCapability,
    selectedCapabilitySource,
    graphSupportSource
  ] = await Promise.all([
    readFile("src/main.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/KpSvelteCatalogueExemplar.svelte",
      "utf8"
    ),
    readFile("src/editor/selected-surface-capability-host.ts", "utf8"),
    readFile("src/editor/equation-surface-capability.ts", "utf8"),
    readFile("src/editor/exact-fraction-quantity-surface-capability.ts", "utf8"),
    readFile("src/editor/operation-evaluation-surface-capability.ts", "utf8"),
    readFile("src/editor/place-value-addition-surface-capability.ts", "utf8"),
    readFile("src/editor/economics-graph-svg-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-svg-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-3d-surface-capability.ts", "utf8"),
    readFile("src/editor/programming-surface-capability.ts", "utf8"),
    readFile("src/editor/selected-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-svg-surface-support.ts", "utf8")
  ]);

  assert.doesNotMatch(mainSource, /^import "katex\/dist\/katex\.min\.css";/m);
  assert.doesNotMatch(
    mainSource,
    /^import .*equation-surface-adapter\.ts/m
  );
  assert.doesNotMatch(
    mainSource,
    /^import .*graph-svg-viewport\.ts/m
  );
  assert.doesNotMatch(
    mainSource,
    /^import .*graph-3d-surface-adapter\.ts/m
  );
  assert.doesNotMatch(mainSource, /import\(\s*"\.\/editor\/(?:equation|graph-svg|graph-3d|programming)-surface-capability\.ts"\s*\)/);
  assert.doesNotMatch(catalogueSource, /import\(\s*"\.\/(?:equation|graph-svg|graph-3d|programming)-surface-capability\.ts"\s*\)/);
  assert.match(capabilityHostSource, /import\("\.\/equation-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/exact-fraction-quantity-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/operation-evaluation-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/place-value-addition-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/economics-graph-svg-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/graph-svg-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/graph-3d-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/programming-surface-capability\.ts"\)/);
  assert.doesNotMatch(
    capabilityHostSource,
    /loadKpAnimationAsset|window\.|document\.|from "svelte/
  );
  assert.match(equationCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(exactQuantityCapability, /kpEditorExactFractionQuantitySurfaceAdapter/);
  assert.match(operationEvaluationCapability, /kpEditorOperationEvaluationSurfaceAdapter/);
  assert.match(placeValueCapability, /kpEditorPlaceValueAdditionSurfaceAdapter/);
  assert.doesNotMatch(economicsGraphCapability, /katex|three|matrix|physics/i);
  assert.match(
    economicsGraphCapability,
    /import\("\.\/graph-svg-viewport\.ts"\)/
  );
  assert.match(graphCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(
    graphCapability,
    /import\("\.\/graph-svg-domain-renderers\.ts"\)/
  );
  assert.match(
    graph3DCapability,
    /from "\.\/graph-3d-surface-adapter\.ts"/
  );
  assert.match(
    programmingCapability,
    /from "\.\/programming-surface-adapter\.ts"/
  );
  assert.doesNotMatch(programmingCapability, /katex|three|shiki|prism/i);
  assert.doesNotMatch(
    selectedCapabilitySource,
    /from "\.\/graph-svg-surface-support\.ts"/
  );
  assert.match(
    graphSupportSource,
    /from "\.\/selected-surface-capability\.ts"/
  );
});

test("optional editor inspectors and WebGL controls stay behind dynamic callers", async () => {
  const [mainSource, graphControllerSource, playerControllerSource] =
    await Promise.all([
      readFile("src/main.ts", "utf8"),
      readFile("src/editor/graph-3d-editor-controller.ts", "utf8"),
      readFile("src/editor/animation-player-controller.ts", "utf8")
    ]);

  assert.doesNotMatch(mainSource, /^import .*api-catalog\.ts/m);
  assert.doesNotMatch(mainSource, /^import .*animation-diagnostics\.ts/m);
  assert.doesNotMatch(mainSource, /^import .*graph-webgl-three\.ts/m);
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/api-catalog\.ts"\s*\)/
  );
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/animation-diagnostics-capability\.ts"\s*\)/
  );
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/graph-3d-editor-controller\.ts"\s*\)/
  );
  assert.match(
    graphControllerSource,
    /import\(\s*"\.\.\/rendering\/graph-webgl-three\.ts"\s*\)/
  );
  assert.match(
    playerControllerSource,
    /import\("\.\/animation-diagnostics-capability\.ts"\)/
  );
});

test("catalogue bootstrap selects the narrow Svelte entry boundary", async () => {
  const [bootstrapSource, catalogueSource, playerControllerSource] =
    await Promise.all([
      readFile("src/bootstrap.ts", "utf8"),
      readFile(
        "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
        "utf8"
      ),
      readFile("src/editor/animation-player-controller.ts", "utf8")
    ]);

  assert.match(
    bootstrapSource,
    /import\(\s*"\.\/editor\/svelte-catalogue\/svelte-catalogue-exemplar-entry\.ts"\s*\)/
  );
  assert.doesNotMatch(bootstrapSource, /animation-catalogue-application/);
  assert.match(bootstrapSource, /await import\("\.\/main\.ts"\)/);
  assert.doesNotMatch(catalogueSource, /from "\.\.\/main\.ts"/);
  assert.doesNotMatch(catalogueSource, /from "\.\/api-catalog\.ts"/);
  assert.doesNotMatch(
    catalogueSource,
    /from "\.\/animation-diagnostics(?:-capability)?\.ts"/
  );
  assert.doesNotMatch(
    catalogueSource,
    /from "\.\/animation-player-gestalt-capability\.ts"/
  );
  assert.match(
    playerControllerSource,
    /import\(\s*"\.\/animation-player-gestalt-capability\.ts"\s*\)/
  );
});
