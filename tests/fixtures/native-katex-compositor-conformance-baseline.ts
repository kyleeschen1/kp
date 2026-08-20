export const NATIVE_KATEX_COMPOSITOR_BASELINE_SCHEMA_VERSION =
  "kp.native-katex-compositor-conformance-baseline.v1" as const;

const CONTINUITY_TOLERANCE_PX = 0.5;
const MINIMUM_KNOWN_REGRESSION_PX = 10;

export const nativeKatexCompositorConformanceBaseline = Object.freeze({
  schemaVersion: NATIVE_KATEX_COMPOSITOR_BASELINE_SCHEMA_VERSION,
  provenance: Object.freeze({
    checkpoint: "run-contract.kp.carrier-preserving-simplification-v4/cps21",
    capturedAt: "2026-08-19",
    purpose:
      "Pre-repair evidence for the native-to-material realized-paint handoff.",
    measurement: "browser-realized ink rectangles in viewport CSS pixels"
  }),
  thresholds: Object.freeze({
    continuityTolerancePx: CONTINUITY_TOLERANCE_PX,
    minimumKnownRegressionPx: MINIMUM_KNOWN_REGRESSION_PX
  }),
  controls: Object.freeze({
    canonicalDigitCarrier: Object.freeze({
      semanticId: "carrier.factor.two",
      shapeLabel: "2",
      maximumObservedVerticalExcursionPx: 0.28125,
      expectedClassification: "continuous"
    }),
    stationaryEqualityContext: Object.freeze({
      semanticIds: Object.freeze(["relation.equals", "value.four"]),
      shapeLabel: "= 4",
      maximumObservedVerticalExcursionPx: 0,
      expectedClassification: "stationary"
    })
  }),
  regression: Object.freeze({
    italicCarrier: Object.freeze({
      semanticId: "carrier.variable.x",
      shapeLabel: "x",
      sourceInkTopPx: 266.640625,
      materialInkTopPx: 280.46875,
      targetInkTopPx: 266.640625,
      expectedClassification: "known-regression"
    })
  })
});

export function classifyVerticalExcursion(
  excursionPx: number
): "continuous" | "known-regression" {
  return excursionPx <= CONTINUITY_TOLERANCE_PX
    ? "continuous"
    : "known-regression";
}
