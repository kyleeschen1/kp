/**
 * Observable acceptance boundary for adopting the existing radical animation
 * into the equation reader. It freezes semantics and product behavior without
 * prescribing compositor geometry or creating a second animation artifact.
 */
export const kpRadicalSuccessionPreservationManifest = Object.freeze({
  route: "/reader/radical-succession/",
  lessonVariant: "radical-succession",
  document: Object.freeze({
    id: "lesson.exponents.radical-succession",
    version: "1",
    title: "From a half power to a square root",
    searchableText: "A half power and a square root name the same value"
  }),
  animation: Object.freeze({
    id: "animation.generated.radical.square-root-as-power",
    stateIds: Object.freeze([
      "expression.generated.radical.square-root-as-power.power",
      "expression.generated.radical.square-root-as-power.radical"
    ]),
    latex: Object.freeze([
      "x^{\\frac{1}{2}}",
      "\\sqrt{x}"
    ]),
    transformationIds: Object.freeze([
      "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
    ]),
    definitionIds: Object.freeze([
      "definition.generated.radical.rewrite-power-as-root"
    ]),
    strictLawIds: Object.freeze([
      "law.arithmetic.rational-exponent-as-root"
    ]),
    lineageRelations: Object.freeze([
      "role-change",
      "removal",
      "role-change",
      "role-change"
    ]),
    timelineId: "timeline.generated.radical.square-root-as-power.shared",
    durationMs: 2_400,
    beatCount: 50,
    presentationProfileId: "kp.equation-presentation.continuity.v1"
  }),
  checkpoints: Object.freeze([
    Object.freeze({ beatId: "beat.power", progressPermille: 0 }),
    Object.freeze({ beatId: "beat.rewrite", progressPermille: 500 }),
    Object.freeze({ beatId: "beat.radical", progressPermille: 1_000 })
  ]),
  focusSelectorIds: Object.freeze([
    "expression.generated.radical.square-root-as-power.power.base",
    "expression.generated.radical.square-root-as-power.power.exponent-numerator",
    "expression.generated.radical.square-root-as-power.power.exponent-fraction-line",
    "expression.generated.radical.square-root-as-power.power.exponent-denominator",
    "expression.generated.radical.square-root-as-power.radical.radical-hook",
    "expression.generated.radical.square-root-as-power.radical.radical-overbar",
    "expression.generated.radical.square-root-as-power.radical.radicand"
  ]),
  learningArtifacts: Object.freeze({
    existingCardId:
      "card.generated.radical.square-root-as-power.explain-radical-power",
    exportTargetId:
      "export.generated.radical.square-root-as-power.frames",
    readerClozePolicy: "preserve-existing-generated-card"
  }),
  presentation: Object.freeze({
    layoutId: "layout.generated.radical.square-root-as-power.animation",
    layoutKind: "single",
    nativeEndpointAuthority: "native-katex",
    canonicalPaintPolicy: "exclusive-when-active",
    compatibilityPaintPolicy: "empty-when-canonical-active",
    fullMotionSamplesPermille: Object.freeze([0, 250, 500, 750, 1_000]),
    reducedMotionEndpointsPermille: Object.freeze([0, 1_000]),
    reviewViewports: Object.freeze([
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 1 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 1 }),
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 2 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 2 })
    ])
  }),
  interaction: Object.freeze({
    semanticFocus: true,
    hover: true,
    directSeek: true,
    rewind: true,
    canonicalUrl: true,
    compactTranscriptAvailable: false
  }),
  accessibility: Object.freeze({
    nativeMathml: true,
    searchableWithoutJavaScript: true,
    semanticDomOwner: "reader",
    movingPaintAriaHidden: true,
    movingPaintInert: true
  }),
  compatibility: Object.freeze({
    preservedEditorRepresentationId:
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    preservedResidualDecision:
      "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md",
    existingReaderBudgetsMayIncrease: false
  })
} as const);
