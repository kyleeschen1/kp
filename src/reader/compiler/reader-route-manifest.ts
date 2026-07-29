import {
  compileKpDistributionAreaLesson,
  compileKpDivideBothSidesEquationLesson,
  compileKpFractionalLinearEquationLesson,
  compileKpFractionalTransferComparisonLesson,
  compileKpFractionCompositionEquationLesson,
  compileKpFoldableDistributionEquationLesson,
  compileKpNumeratorSplitMergeEquationLesson,
  compileKpQuadraticBranchingLesson,
  compileKpRadicalSuccessionEquationLesson,
  compileKpXPlusThreeLesson,
  compileKpXPlusThreeTeacherZeroLesson
} from "./public-api.ts";
import {
  defineKpReaderRoute,
  defineKpReaderRouteManifest
} from "./reader-route-descriptor.ts";

function equationConformance<const TInput extends {
  readonly documentId: string;
  readonly progressPermille: number;
  readonly beatId: string;
  readonly searchableText: string;
}>(input: TInput) {
  return {
    readerId: "semantic-document",
    documentId: input.documentId,
    version: "1",
    progressPermille: input.progressPermille,
    beatId: input.beatId,
    query: { kpLesson: input.documentId, kpVersion: "1" },
    stageSelector: "[data-kp-reader-equation-stage]",
    rendererAdapterId: "renderer.equation-dom",
    shareSelector: "[data-kp-reader-share]",
    fontReadyEvidence: "document-fonts",
    progressEvidence: {
      kind: "attribute",
      selector: "body",
      name: "data-kp-reader-progress"
    },
    searchableText: input.searchableText
  } as const;
}

function singleEquationReview<const TInput extends {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly progressPermille: number;
}>(input: TInput) {
  return {
    id: input.id,
    title: input.title,
    capture: "viewport",
    columns: 2,
    imageFit: "cover",
    checkpoints: [{
      id: "canonical",
      label: input.label,
      progressPermille: input.progressPermille,
      viewport: "desktop"
    }]
  } as const;
}

function routeBudget(
  compiledHtmlRawBytes: number,
  compiledHtmlGzipBytes: number,
  runtimeCodeGzipBytes: number
) {
  return { compiledHtmlRawBytes, compiledHtmlGzipBytes, runtimeCodeGzipBytes } as const;
}

// This is the measured post-cutover shared equation closure, not an estimate.
// The checker applies the repository-wide 5% growth allowance on top of it.
const sharedEquationRuntimeGzipBaseline = 138_095;

const sharedEquationPresentation = {
  kind: "shared-certified-runtime",
  certificationId: "certification.reader.equation-dom.promoted-v1",
  genericFallback: "forbidden",
  browserPhaseGates: ["reflow", "act", "native-settlement"]
} as const;

const splitMergeReviewMoments = [
  { id: "start", label: "Shared fraction · start", progressPermille: 0 },
  { id: "branch", label: "Denominator branches", progressPermille: 250 },
  { id: "split", label: "Two fractions · midpoint", progressPermille: 500 },
  { id: "converge", label: "Denominators converge", progressPermille: 750 },
  { id: "end", label: "Shared fraction · endpoint", progressPermille: 1_000 }
] as const;

const splitMergeReviewProfiles = [
  { id: "wide-full", label: "Wide · full motion", viewport: "desktop", motion: "full" },
  { id: "wide-reduced", label: "Wide · reduced motion", viewport: "desktop", motion: "reduced" },
  { id: "phone-full", label: "Phone · full motion", viewport: "phone", motion: "full" },
  { id: "phone-reduced", label: "Phone · reduced motion", viewport: "phone", motion: "reduced" }
] as const;

const radicalReviewProfiles = [
  {
    id: "wide-full",
    label: "Wide · full motion",
    viewport: "desktop",
    motion: "full",
    moments: [0, 250, 500, 750, 1_000]
  },
  {
    id: "wide-reduced",
    label: "Wide · reduced motion",
    viewport: "desktop",
    motion: "reduced",
    moments: [0, 1_000]
  },
  {
    id: "phone-full",
    label: "Phone · full motion",
    viewport: "phone",
    motion: "full",
    moments: [0, 250, 500, 750, 1_000]
  },
  {
    id: "phone-reduced",
    label: "Phone · reduced motion",
    viewport: "phone",
    motion: "reduced",
    moments: [0, 1_000]
  }
] as const;

const foldableDistributionReviewMoments = [
  { id: "factored", label: "Factored groups", progressPermille: 0 },
  { id: "distributed", label: "Distributed products", progressPermille: 281 },
  {
    id: "products-evaluated",
    label: "Products evaluated",
    progressPermille: 563
  },
  { id: "grouped", label: "Like terms gathered", progressPermille: 781 },
  { id: "collected", label: "Result collected", progressPermille: 1_000 }
] as const;

const foldableDistributionReviewProfiles = [
  { id: "wide-full", label: "Wide · full motion", viewport: "desktop", motion: "full" },
  { id: "wide-reduced", label: "Wide · reduced motion", viewport: "desktop", motion: "reduced" },
  { id: "phone-full", label: "Phone · full motion", viewport: "phone", motion: "full" },
  { id: "phone-reduced", label: "Phone · reduced motion", viewport: "phone", motion: "reduced" }
] as const;

const distributionVisualProgress = [0, 360, 500, 650, 820, 1_000] as const;
const distributionReviewViewports = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "phone", label: "Phone" }
] as const;

/**
 * Build-time source of truth for reader paths, Markdown inputs, and compilers.
 * Browser entries intentionally do not import this manifest or its compiler graph.
 */
export const kpReaderRouteManifest = defineKpReaderRouteManifest([
  defineKpReaderRoute({
    route: "/reader/solve-x/",
    sourcePath: "content/lessons/solve-x.md",
    compile: compileKpXPlusThreeLesson,
    conformance: equationConformance({
      documentId: "lesson.solve-x.x-plus-3",
      progressPermille: 517,
      beatId: "beat.cancel",
      searchableText: "x+3=7"
    }),
    presentation: sharedEquationPresentation,
    review: {
      id: "solve-x",
      title: "Kinetic Press · solve x",
      capture: "viewport",
      columns: 2,
      imageFit: "cover",
      checkpoints: [
        {
          id: "read-equality",
          label: "Read equality",
          progressPermille: 0,
          viewport: "desktop"
        },
        {
          id: "subtract-motion",
          label: "Balanced entry in motion",
          progressPermille: 200,
          viewport: "desktop"
        },
        {
          id: "subtract-settled",
          label: "Subtract settled",
          progressPermille: 333,
          viewport: "desktop"
        },
        {
          id: "cancel-motion",
          label: "Cancellation in motion",
          progressPermille: 500,
          viewport: "desktop"
        },
        {
          id: "cancel-settled",
          label: "Cancellation settled",
          progressPermille: 667,
          viewport: "desktop"
        },
        {
          id: "solution-settled",
          label: "Solution settled",
          progressPermille: 1_000,
          viewport: "desktop"
        },
        {
          id: "subtract-motion-phone",
          label: "Balanced entry · phone",
          progressPermille: 200,
          viewport: "phone"
        },
        {
          id: "cancel-motion-phone",
          label: "Cancellation · phone",
          progressPermille: 500,
          viewport: "phone"
        }
      ]
    },
    budget: routeBudget(37_968, 4_978, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/solve-x/teacher-zero/",
    sourcePath: "content/lessons/solve-x-teacher-zero.md",
    compile: compileKpXPlusThreeTeacherZeroLesson,
    conformance: equationConformance({
      documentId: "lesson.solve-x.x-plus-3.teacher-zero",
      progressPermille: 500,
      beatId: "beat.make-zero",
      searchableText: "plus three and minus three make zero"
    }),
    presentation: sharedEquationPresentation,
    review: singleEquationReview({
      id: "teacher-zero",
      title: "Kinetic Press · explicit zero",
      label: "Make the zero visible",
      progressPermille: 500
    }),
    budget: routeBudget(37_489, 4_352, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/solve-fractional-linear/",
    sourcePath: "content/lessons/solve-fractional-linear.md",
    compile: compileKpFractionalLinearEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.solve-x.fractional-linear",
      progressPermille: 500,
      beatId: "beat.simplify-difference",
      searchableText: "The fraction is not a detour"
    }),
    presentation: sharedEquationPresentation,
    review: singleEquationReview({
      id: "fractional-linear",
      title: "Kinetic Press · fractional linear equation",
      label: "Simplify the difference",
      progressPermille: 500
    }),
    budget: routeBudget(64_003, 5_510, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/divide-both-sides/",
    sourcePath: "content/lessons/divide-both-sides.md",
    compile: compileKpDivideBothSidesEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.solve-x.divide-both-sides",
      progressPermille: 667,
      beatId: "beat.cancel",
      searchableText: "Three copies of x equal twelve"
    }),
    presentation: sharedEquationPresentation,
    review: singleEquationReview({
      id: "divide-both-sides",
      title: "Kinetic Press · divide both sides",
      label: "Cancel the coefficient",
      progressPermille: 667
    }),
    budget: routeBudget(33_781, 4_162, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/split-merge-fractions/",
    sourcePath: "content/lessons/numerator-split-merge.md",
    compile: compileKpNumeratorSplitMergeEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.fractions.numerator-split-merge",
      progressPermille: 500,
      beatId: "beat.split",
      searchableText: "One denominator can govern every term"
    }),
    presentation: sharedEquationPresentation,
    review: {
      id: "split-merge-fractions",
      title: "Kinetic Press · split and merge fractions",
      capture: "stage",
      columns: 4,
      imageFit: "contain",
      checkpoints: splitMergeReviewProfiles.flatMap((profile) =>
        splitMergeReviewMoments.map((moment) => ({
          id: `${profile.id}-${moment.id}`,
          label: `${moment.label} · ${profile.label}`,
          progressPermille: moment.progressPermille,
          viewport: profile.viewport,
          query: { kpMotion: profile.motion }
        }))
      )
    },
    // The typed factoring/contact proof is intentionally a separate preload;
    // this release baseline preserves that boundary instead of hiding it by
    // folding operation authority back into the generic renderer chunk.
    budget: routeBudget(30_526, 3_938, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/radical-succession/",
    sourcePath: "content/lessons/radical-succession.md",
    compile: compileKpRadicalSuccessionEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.exponents.radical-succession",
      progressPermille: 500,
      beatId: "beat.rewrite",
      searchableText: "A half power and a square root name the same value"
    }),
    presentation: sharedEquationPresentation,
    review: {
      id: "radical-succession",
      title: "Kinetic Press · half power to square root",
      capture: "stage",
      columns: 5,
      imageFit: "contain",
      checkpoints: radicalReviewProfiles.flatMap((profile) =>
        profile.moments.map((progressPermille) => ({
          id: `${profile.id}-${progressPermille}`,
          label: `${profile.label} · ${progressPermille / 10}%`,
          progressPermille,
          viewport: profile.viewport,
          query: { kpMotion: profile.motion }
        }))
      )
    },
    budget: routeBudget(22_307, 4_164, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/fraction-composition/",
    sourcePath: "content/lessons/fraction-composition.md",
    compile: compileKpFractionCompositionEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.algebra.fraction-composition",
      progressPermille: 538,
      beatId: "beat.fraction-composition.difference-simplified",
      searchableText:
        "Distribute two thirds, normalize the numerators, and solve the equation"
    }),
    presentation: sharedEquationPresentation,
    review: {
      id: "fraction-composition",
      title: "Kinetic Press · distribute and solve with a fraction",
      capture: "stage",
      columns: 3,
      imageFit: "contain",
      checkpoints: [
        {
          id: "factored",
          label: "Factored fraction",
          progressPermille: 0,
          viewport: "desktop"
        },
        {
          id: "normalized",
          label: "Normalized fractions",
          progressPermille: 154,
          viewport: "desktop"
        },
        {
          id: "isolated",
          label: "Variable fraction isolated",
          progressPermille: 538,
          viewport: "desktop"
        },
        {
          id: "solved",
          label: "Solution",
          progressPermille: 1_000,
          viewport: "desktop"
        }
      ]
    },
    budget: routeBudget(122_705, 7_664, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/foldable-distribution/",
    sourcePath: "content/lessons/foldable-distribution.md",
    compile: compileKpFoldableDistributionEquationLesson,
    conformance: equationConformance({
      documentId: "lesson.algebra.foldable-distribution",
      progressPermille: 563,
      beatId: "beat.grouped",
      searchableText:
        "Distribute each factor, gather like terms, and collect the result"
    }),
    presentation: sharedEquationPresentation,
    review: {
      id: "foldable-distribution",
      title: "Kinetic Press · distribute and collect like terms",
      capture: "stage",
      columns: 5,
      imageFit: "contain",
      checkpoints: foldableDistributionReviewProfiles.flatMap((profile) =>
        foldableDistributionReviewMoments.map((moment) => ({
          id: `${profile.id}-${moment.id}`,
          label: `${moment.label} · ${profile.label}`,
          progressPermille: moment.progressPermille,
          viewport: profile.viewport,
          query: {
            kpMotion: profile.motion,
            kpFoldMode: "automatic"
          }
        }))
      )
    },
    budget: routeBudget(67_474, 6_451, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/fractional-transfer/",
    sourcePath: "content/lessons/fractional-transfer-comparison.md",
    compile: compileKpFractionalTransferComparisonLesson,
    conformance: equationConformance({
      documentId: "lesson.solve-x.fractional-transfer-comparison",
      progressPermille: 667,
      beatId: "beat.expose-product",
      searchableText: "The same algebra can be shown at different levels of fluency"
    }),
    presentation: sharedEquationPresentation,
    review: singleEquationReview({
      id: "fractional-transfer",
      title: "Kinetic Press · fractional transfer",
      label: "Expose the product",
      progressPermille: 667
    }),
    budget: routeBudget(39_414, 4_549, sharedEquationRuntimeGzipBaseline)
  }),
  defineKpReaderRoute({
    route: "/reader/distribution-area/",
    sourcePath: "content/lessons/distribution-area.md",
    compile: compileKpDistributionAreaLesson,
    conformance: {
      readerId: "distribution-area",
      documentId: "lesson.algebra.distribution-area",
      version: "1",
      progressPermille: 720,
      beatId: "beat.distribute",
      query: { kpDirection: "forward" },
      stageSelector: "[data-kp-distribution-stage]",
      rendererAdapterId: "renderer.distribution-composite",
      shareSelector: "[data-kp-distribution-share]",
      fontReadyEvidence: "body-attribute",
      progressEvidence: {
        kind: "value",
        selector: "[data-kp-distribution-scrubber]"
      },
      searchableText: "3(x+2)"
    },
    presentation: {
      kind: "certified-custom-renderer",
      certificationId: "certification.reader.distribution-composite.accepted-v1",
      operationCertificateIds: [
        "certificate.reader.distribution-area.promoted-v1"
      ],
      genericFallback: "forbidden",
      browserPhaseGates: [
        "factor-fan-out",
        "area-partition",
        "native-settlement"
      ]
    },
    review: {
      id: "distribution-area",
      title: "Kinetic Press · distribution and area",
      capture: "stage",
      columns: 3,
      imageFit: "contain",
      checkpoints: distributionReviewViewports.flatMap(({ id, label }) =>
        (["forward", "inverse"] as const).flatMap((direction) =>
          distributionVisualProgress.map((visualProgressPermille) => ({
            id: `${id}-${direction}-${String(visualProgressPermille).padStart(4, "0")}`,
            label: `${label} · ${direction === "forward" ? "Distribute" : "Factor"}`,
            progressPermille: direction === "forward"
              ? visualProgressPermille
              : 1_000 - visualProgressPermille,
            visualProgressPermille,
            direction,
            viewport: id,
            query: { kpDirection: direction }
          }))
        )
      )
    },
    budget: routeBudget(18_729, 2_868, 14_823)
  }),
  defineKpReaderRoute({
    route: "/reader/quadratic-branching/",
    sourcePath: "content/lessons/quadratic-branching.md",
    compile: compileKpQuadraticBranchingLesson,
    conformance: {
      readerId: "quadratic-branching",
      documentId: "lesson.algebra.quadratic-branching",
      version: "1",
      progressPermille: 680,
      beatId: "beat.split-branches",
      query: { kpMethod: "completing-square" },
      stageSelector: "[data-kp-quadratic-stage]",
      rendererAdapterId: "renderer.quadratic-native-katex",
      shareSelector: "[data-kp-quadratic-share]",
      fontReadyEvidence: "body-attribute",
      progressEvidence: {
        kind: "attribute",
        selector: "body",
        name: "data-kp-reader-progress"
      },
      searchableText: "complete solution set x ∈ {2, 3}"
    },
    presentation: {
      kind: "certified-custom-renderer",
      certificationId: "certification.reader.quadratic-native-katex.v1",
      operationCertificateIds: [
        "certificate.reader.quadratic.completing-square",
        "certificate.reader.quadratic.formula"
      ],
      genericFallback: "forbidden",
      browserPhaseGates: [
        "reflow",
        "act",
        "native-settlement",
        "branch-split",
        "branch-to-graph"
      ]
    },
    review: {
      id: "quadratic-branching",
      title: "Kinetic Press · quadratic branching",
      capture: "stage",
      columns: 3,
      imageFit: "contain",
      checkpoints: [
        { id: "source", label: "Read the equation", progressPermille: 0, viewport: "desktop" },
        { id: "method-square-start", label: "Move six · start", progressPermille: 108, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square", label: "Move six across the relation · symbolic motion", progressPermille: 124, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-end", label: "Move six · end", progressPermille: 140, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-add-both-sides", label: "Add twenty-five fourths to both sides", progressPermille: 172, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-common-denominator", label: "Rewrite negative six with denominator four", progressPermille: 220, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-evaluate-right", label: "Evaluate the right side", progressPermille: 268, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-factor-pattern", label: "Expose the perfect-square pattern", progressPermille: 316, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-factor-collapse", label: "Factor the perfect square", progressPermille: 364, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-take-roots", label: "Take square roots and introduce plus-minus", progressPermille: 412, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-evaluate-root", label: "Evaluate the square root", progressPermille: 460, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-isolate", label: "Isolate the signed candidates", progressPermille: 508, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-normalize-candidates", label: "Write the candidate numerator", progressPermille: 556, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-branch-origin", label: "Hold the shared plus-minus origin", progressPermille: 600, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-branch-candidates", label: "Split into signed candidates", progressPermille: 670, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-formula-substitution", label: "Substitute signed coefficients", progressPermille: 145, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-power", label: "Evaluate negative five squared", progressPermille: 203, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-product", label: "Evaluate four times one times six", progressPermille: 263, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-subtract", label: "Subtract the discriminant terms", progressPermille: 323, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-denominator", label: "Prepare the denominator", progressPermille: 383, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-start", label: "Simplify the radical · start", progressPermille: 410, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula", label: "Simplify the radical · symbolic motion", progressPermille: 430, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-end", label: "Simplify the radical · end", progressPermille: 450, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-numerators", label: "Evaluate signed numerators", progressPermille: 500, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-divide", label: "Divide the candidate numerators", progressPermille: 560, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-drilldown", label: "Formula exact-step drill-down", progressPermille: 430, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full", kpSteps: "full", kpStepProgress: "900" } },
        { id: "branches", label: "Plus-minus branches", progressPermille: 680, viewport: "desktop" },
        { id: "branch-graph-handoff", label: "Signed branches hand into exact graph roots", progressPermille: 930, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "graph", label: "Roots meet the graph", progressPermille: 1_000, viewport: "desktop" },
        { id: "method-square-phone", label: "Move six · symbolic motion · phone", progressPermille: 124, viewport: "phone", query: { kpMotion: "full" } },
        { id: "method-formula-phone", label: "Simplify the radical · motion · phone", progressPermille: 430, viewport: "phone", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "branches-phone", label: "Branches · phone", progressPermille: 680, viewport: "phone" },
        { id: "graph-phone", label: "Roots meet the graph · phone", progressPermille: 1_000, viewport: "phone" }
      ]
    },
    budget: routeBudget(84_569, 7_475, 14_776)
  })
]);
