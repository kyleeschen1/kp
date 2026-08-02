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
  }), []);
});

test("main owns only dynamic selected-surface capability imports", async () => {
  const [
    mainSource,
    equationCapability,
    graphCapability,
    graph3DCapability
  ] = await Promise.all([
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/equation-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-svg-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-3d-surface-capability.ts", "utf8")
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
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/equation-surface-capability\.ts"\s*\)/
  );
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/graph-svg-surface-capability\.ts"\s*\)/
  );
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/graph-3d-surface-capability\.ts"\s*\)/
  );
  assert.match(equationCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(graphCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(
    graph3DCapability,
    /from "\.\/graph-3d-surface-adapter\.ts"/
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
