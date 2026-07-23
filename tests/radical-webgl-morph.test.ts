import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("radical WebGL morph uses an exact native target and solid mask", async () => {
  const source = await readFile(
    new URL("../src/rendering/radical-webgl-morph.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from ["']three["']/);
  assert.doesNotMatch(source, /PixelFlow|particleCount|spatial-coherent/);
  assert.doesNotMatch(source, /32%|7%|0\.055/);
  assert.match(source, /createKatexArtifactSolidMaskMorphRenderer/);
  assert.match(source, /complete-native-radical-operator/);
  assert.match(source, /native-clipped-svg/);
  assert.match(source, /parseComputedColor/);
});
