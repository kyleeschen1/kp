import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

test("selected surface capabilities keep rich renderers explicit", () => {
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.linear-solve.solve-x",
    slotKinds: ["equation"]
  }), ["equation-katex"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.dot-projection.basic",
    slotKinds: ["graph"]
  }), ["graph-svg-katex-labels"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.graph.surface-mode.mesh-to-donut",
    slotKinds: ["graph"]
  }), ["graph-webgl-3d"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.programming.add.execution-trace",
    slotKinds: ["programming"]
  }), ["programming-trace"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.comparison.linear-solve-programming",
    slotKinds: ["equation", "programming"]
  }), ["equation-katex", "programming-trace"]);
});

test("one capability host owns all dynamic selected-surface imports", async () => {
  const [
    mainSource,
    catalogueSource,
    capabilityHostSource,
    equationCapability,
    graphCapability,
    graph3DCapability,
    programmingCapability,
    selectedCapabilitySource,
    graphSupportSource
  ] = await Promise.all([
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/animation-catalogue-application.ts", "utf8"),
    readFile("src/editor/selected-surface-capability-host.ts", "utf8"),
    readFile("src/editor/equation-surface-capability.ts", "utf8"),
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
  assert.match(capabilityHostSource, /import\("\.\/graph-svg-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/graph-3d-surface-capability\.ts"\)/);
  assert.match(capabilityHostSource, /import\("\.\/programming-surface-capability\.ts"\)/);
  assert.doesNotMatch(
    capabilityHostSource,
    /loadKpAnimationAsset|window\.|document\.|from "svelte/
  );
  assert.match(equationCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(graphCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(
    graphCapability,
    /import\("\.\/graph-svg-viewport\.ts"\)/
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

test("catalogue bootstrap selects the narrow application boundary", async () => {
  const [bootstrapSource, catalogueSource, playerControllerSource] =
    await Promise.all([
      readFile("src/bootstrap.ts", "utf8"),
      readFile("src/editor/animation-catalogue-application.ts", "utf8"),
      readFile("src/editor/animation-player-controller.ts", "utf8")
    ]);

  assert.match(
    bootstrapSource,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
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
