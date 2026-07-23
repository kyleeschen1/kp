import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("radical WebGL morph stays on the raw KaTeX pixel-flow boundary", async () => {
  const source = await readFile(
    new URL("../src/rendering/radical-webgl-morph.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from ["']three["']/);
  assert.match(source, /createKatexArtifactPixelFlowRenderer/);
  assert.match(source, /complete-native-radical-operator/);
  assert.match(source, /pairing: "spatial-coherent"/);
  assert.match(source, /red: 15 \/ 255/);
});
