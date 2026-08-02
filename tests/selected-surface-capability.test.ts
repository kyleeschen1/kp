import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

test("selected surface capabilities keep equation and SVG-label KaTeX explicit", () => {
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
  }), []);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.programming.add.execution-trace",
    slotKinds: ["programming"]
  }), []);
});

test("main owns only dynamic selected-math capability imports", async () => {
  const [mainSource, equationCapability, graphCapability] = await Promise.all([
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/equation-surface-capability.ts", "utf8"),
    readFile("src/editor/graph-svg-surface-capability.ts", "utf8")
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
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/equation-surface-capability\.ts"\s*\)/
  );
  assert.match(
    mainSource,
    /import\(\s*"\.\/editor\/graph-svg-surface-capability\.ts"\s*\)/
  );
  assert.match(equationCapability, /import "katex\/dist\/katex\.min\.css"/);
  assert.match(graphCapability, /import "katex\/dist\/katex\.min\.css"/);
});
