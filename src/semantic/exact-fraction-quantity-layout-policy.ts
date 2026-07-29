/**
 * Cross-layer layout facts for the exact-quantity exemplar.
 *
 * Semantic projections, responsive runtime, DOM media queries, Review
 * telemetry, and the preservation manifest all consume this one value so a
 * breakpoint or required-view change cannot make them describe different
 * layouts.
 */
export const kpExactFractionQuantityLayoutPolicy = Object.freeze({
  viewObligations: Object.freeze([
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ] as const),
  wideMinWidthPx: 760,
  minimumMathFontPx: 18,
  widePolicy: "four-view-readable-grid",
  phonePolicy: "deterministic-active-view-focus",
  reviewViewports: Object.freeze([
    Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 1 }),
    Object.freeze({ width: 390, height: 844, deviceScaleFactor: 1 }),
    Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 2 }),
    Object.freeze({ width: 390, height: 844, deviceScaleFactor: 2 })
  ])
});
