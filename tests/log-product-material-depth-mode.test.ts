import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  projectKpLogProductMaterialPresentationMode
} from "../src/animation/log-product-material-depth-mode.ts";

test("only elevated focus activates the local material treatment", () => {
  assert.deepEqual(projectKpLogProductMaterialPresentationMode("elevated"), {
    depthMode: "material",
    typography: "inline",
    active: true
  });
  assert.deepEqual(projectKpLogProductMaterialPresentationMode("flat"), {
    depthMode: "flat",
    typography: "display",
    active: false
  });
  assert.deepEqual(projectKpLogProductMaterialPresentationMode("no-depth"), {
    depthMode: "no-depth",
    typography: "display",
    active: false
  });
  assert.deepEqual(projectKpLogProductMaterialPresentationMode(undefined),
    projectKpLogProductMaterialPresentationMode("flat"));
});

test("the log-product surface projects presentation mode without a new clock", () => {
  const source = readFileSync(new URL(
    "../src/editor/log-product-surface-adapter.ts",
    import.meta.url
  ), "utf8");
  assert.match(source, /kpEditorAnimationFocusExperiment/u);
  assert.match(source, /kpLogProductMaterialDepthMode/u);
  assert.match(source, /kpLogProductTypography/u);
  assert.doesNotMatch(source, /requestAnimationFrame/u);
  assert.doesNotMatch(source, /setInterval/u);
});
