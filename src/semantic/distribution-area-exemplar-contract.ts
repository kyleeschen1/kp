const dimensions = Object.freeze({
  height: Object.freeze({ id: "factor.3", latex: "3" }),
  widths: Object.freeze([
    Object.freeze({ id: "term.x", latex: "x" }),
    Object.freeze({ id: "term.2", latex: "2" })
  ])
});

const regions = Object.freeze([
  Object.freeze({ id: "region.3x", heightId: "factor.3", widthId: "term.x", areaLatex: "3x" }),
  Object.freeze({ id: "region.6", heightId: "factor.3", widthId: "term.2", areaLatex: "6" })
]);

/** The first area model is an exemplar contract, not a promoted family API. */
export const kpDistributionAreaExemplarContract = Object.freeze({
  id: "exemplar.distribution-area.3-times-x-plus-2",
  algebra: Object.freeze({
    factoredLatex: "3(x+2)",
    expandedLatex: "3x+6",
    forwardOperationId: "kp.algebra.distribute-multiplication",
    reverseOperationId: "kp.algebra.factor-common-term"
  }),
  geometry: Object.freeze({
    kind: "partitioned-rectangle" as const,
    dimensions,
    regions
  }),
  surfaces: Object.freeze(["katex-algebra", "svg-area"] as const),
  promotion: Object.freeze({
    scope: "exact-exemplar-only" as const,
    requiresHumanVisualApproval: true
  })
});
