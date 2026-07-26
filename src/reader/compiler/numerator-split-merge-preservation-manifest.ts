/**
 * The migration acceptance boundary for the fraction exemplar. These values
 * describe observable product and semantic behavior; they do not prescribe
 * how the canonical renderer paints it.
 */
export const kpNumeratorSplitMergePreservationManifest = Object.freeze({
  route: "/reader/split-merge-fractions/",
  document: Object.freeze({
    id: "lesson.fractions.numerator-split-merge",
    version: "1",
    title: "Split and merge a fraction",
    searchableText: "One denominator can govern every term"
  }),
  animation: Object.freeze({
    id: "animation.numerator-split-merge.round-trip",
    stateIds: Object.freeze([
      "equation.numerator-split-merge.combined",
      "equation.numerator-split-merge.split"
    ]),
    latex: Object.freeze([
      "\\frac{2x + 6}{2}",
      "\\frac{2x}{2} + \\frac{6}{2}"
    ]),
    transformationIds: Object.freeze([
      "transform.numerator-split-merge.split-sum",
      "transform.numerator-split-merge.merge-sum"
    ]),
    definitionIds: Object.freeze([
      "definition.symbolic.algebra.split-fraction-sum",
      "definition.symbolic.algebra.merge-fractions"
    ]),
    lineageRelations: Object.freeze([
      "identity", "identity", "role-change", "identity", "fan-out", "fan-out",
      "identity", "identity", "role-change", "identity", "fan-in", "fan-in"
    ]),
    timelineId: "timeline.numerator-split-merge.round-trip",
    durationMs: 2_700,
    beatCount: 54,
    presentationProfileId: "kp.equation-presentation.continuity.v1"
  }),
  checkpoints: Object.freeze([
    Object.freeze({ beatId: "beat.combined", progressPermille: 0 }),
    Object.freeze({ beatId: "beat.split", progressPermille: 500 }),
    Object.freeze({ beatId: "beat.merge", progressPermille: 1_000 })
  ]),
  focusSelectorIds: Object.freeze([
    "equation.numerator-split-merge.combined.fraction.numerator.plus",
    "equation.numerator-split-merge.combined.fraction.rule",
    "equation.numerator-split-merge.combined.fraction.denominator.2",
    "equation.numerator-split-merge.split.between.plus",
    "equation.numerator-split-merge.split.left.fraction.rule",
    "equation.numerator-split-merge.split.left.fraction.denominator.2",
    "equation.numerator-split-merge.split.right.fraction.rule",
    "equation.numerator-split-merge.split.right.fraction.denominator.2"
  ]),
  cloze: Object.freeze([
    Object.freeze({
      cardId: "card.numerator-split-merge.shared-denominator",
      hiddenSelectorIds: Object.freeze([
        "equation.numerator-split-merge.combined.fraction.denominator.2"
      ])
    }),
    Object.freeze({
      cardId: "card.numerator-split-merge.copied-denominator",
      hiddenSelectorIds: Object.freeze([
        "equation.numerator-split-merge.split.left.fraction.denominator.2",
        "equation.numerator-split-merge.split.right.fraction.denominator.2"
      ])
    })
  ]),
  presentation: Object.freeze({
    layoutId: "layout.numerator-split-merge.animation",
    layoutKind: "single",
    nativeEndpointAuthority: "native-katex",
    fullMotionSamplesPermille: Object.freeze([0, 250, 500, 750, 1_000]),
    reducedMotionEndpointsPermille: Object.freeze([0, 1_000]),
    reviewViewports: Object.freeze([
      Object.freeze({ width: 1_100, height: 800 }),
      Object.freeze({ width: 360, height: 640 })
    ])
  }),
  accessibility: Object.freeze({
    staticMathCount: 3,
    nativeMathml: true,
    searchableWithoutJavaScript: true,
    semanticDomOwner: "reader"
  }),
  payload: Object.freeze({
    adapterId: "renderer.equation-dom",
    presentation: "scroll-scrub",
    routeJsBytes: 28_800,
    routeCssBytes: 3_448,
    sharedJsBytes: 120_543
  })
} as const);
