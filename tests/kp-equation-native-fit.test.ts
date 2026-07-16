import assert from "node:assert/strict";
import test from "node:test";

import {
  computeKpEquationNativeFitFont
} from "../src/editor/equation-native-fit.ts";

test("equation native fit reduces font size with safety clearance", () => {
  assert.deepEqual(computeKpEquationNativeFitFont({
    baselineFontPx: 20,
    availableWidth: 480,
    naturalWidth: 640
  }), {
    baselineFontPx: 20,
    fittedFontPx: 14.775,
    scale: 0.73875,
    constrained: false
  });
});

test("equation native fit preserves native size when content fits", () => {
  assert.deepEqual(computeKpEquationNativeFitFont({
    baselineFontPx: 18,
    availableWidth: 500,
    naturalWidth: 420
  }), {
    baselineFontPx: 18,
    fittedFontPx: 18,
    scale: 1,
    constrained: false
  });
});

test("equation native fit reports minimum readability constraints", () => {
  assert.deepEqual(computeKpEquationNativeFitFont({
    baselineFontPx: 16,
    availableWidth: 100,
    naturalWidth: 500,
    minimumFontPx: 10
  }), {
    baselineFontPx: 16,
    fittedFontPx: 10,
    scale: 0.625,
    constrained: true
  });
});

test("equation native fit rejects invalid geometry", () => {
  assert.throws(
    () => computeKpEquationNativeFitFont({
      baselineFontPx: 16,
      availableWidth: 0,
      naturalWidth: 200
    }),
    /available width/
  );
});
