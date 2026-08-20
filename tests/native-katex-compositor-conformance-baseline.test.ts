import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyVerticalExcursion,
  nativeKatexCompositorConformanceBaseline
} from "./fixtures/native-katex-compositor-conformance-baseline.ts";

test("freezes the canonical digit as the clean compositor control", () => {
  const { canonicalDigitCarrier } =
    nativeKatexCompositorConformanceBaseline.controls;

  assert.equal(
    classifyVerticalExcursion(
      canonicalDigitCarrier.maximumObservedVerticalExcursionPx
    ),
    canonicalDigitCarrier.expectedClassification
  );
});

test("freezes the italic carrier drop as a known paint-handoff regression", () => {
  const { italicCarrier } =
    nativeKatexCompositorConformanceBaseline.regression;
  const sourceToMaterialPx = Math.abs(
    italicCarrier.materialInkTopPx - italicCarrier.sourceInkTopPx
  );
  const materialToTargetPx = Math.abs(
    italicCarrier.targetInkTopPx - italicCarrier.materialInkTopPx
  );

  assert.equal(italicCarrier.sourceInkTopPx, italicCarrier.targetInkTopPx);
  assert.equal(
    classifyVerticalExcursion(sourceToMaterialPx),
    italicCarrier.expectedClassification
  );
  assert.ok(
    sourceToMaterialPx >=
      nativeKatexCompositorConformanceBaseline.thresholds
        .minimumKnownRegressionPx
  );
  assert.equal(sourceToMaterialPx, materialToTargetPx);
});

test("keeps the equality context stationary while the carrier changes owner", () => {
  const { stationaryEqualityContext } =
    nativeKatexCompositorConformanceBaseline.controls;

  assert.equal(stationaryEqualityContext.expectedClassification, "stationary");
  assert.equal(stationaryEqualityContext.maximumObservedVerticalExcursionPx, 0);
  assert.deepEqual(
    stationaryEqualityContext.semanticIds,
    ["relation.equals", "value.four"]
  );
});
