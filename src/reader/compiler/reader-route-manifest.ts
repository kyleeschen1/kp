import {
  compileKpDistributionAreaLesson,
  compileKpDivideBothSidesEquationLesson,
  compileKpFractionalLinearEquationLesson,
  compileKpFractionalTransferComparisonLesson,
  compileKpNumeratorSplitMergeEquationLesson,
  compileKpQuadraticBranchingLesson,
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
    budget: routeBudget(36_312, 4_503, 120_543)
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
    review: singleEquationReview({
      id: "teacher-zero",
      title: "Kinetic Press · explicit zero",
      label: "Make the zero visible",
      progressPermille: 500
    }),
    budget: routeBudget(35_935, 3_868, 120_543)
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
    review: singleEquationReview({
      id: "fractional-linear",
      title: "Kinetic Press · fractional linear equation",
      label: "Simplify the difference",
      progressPermille: 500
    }),
    budget: routeBudget(62_792, 5_029, 120_543)
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
    review: singleEquationReview({
      id: "divide-both-sides",
      title: "Kinetic Press · divide both sides",
      label: "Cancel the coefficient",
      progressPermille: 667
    }),
    budget: routeBudget(32_148, 3_670, 120_543)
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
    review: singleEquationReview({
      id: "split-merge-fractions",
      title: "Kinetic Press · split and merge fractions",
      label: "Give each term the denominator",
      progressPermille: 500
    }),
    budget: routeBudget(28_800, 3_448, 120_543)
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
    review: singleEquationReview({
      id: "fractional-transfer",
      title: "Kinetic Press · fractional transfer",
      label: "Expose the product",
      progressPermille: 667
    }),
    budget: routeBudget(37_889, 4_078, 120_543)
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
    budget: routeBudget(19_237, 3_003, 54_210)
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
    review: {
      id: "quadratic-branching",
      title: "Kinetic Press · quadratic branching",
      capture: "stage",
      columns: 3,
      imageFit: "contain",
      checkpoints: [
        { id: "source", label: "Read the equation", progressPermille: 0, viewport: "desktop" },
        { id: "method-square-start", label: "Move six · start", progressPermille: 120, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square", label: "Move six across the relation · symbolic motion", progressPermille: 150, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-end", label: "Move six · end", progressPermille: 195, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-add-both-sides", label: "Add twenty-five fourths to both sides", progressPermille: 244, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-common-denominator", label: "Rewrite negative six with denominator four", progressPermille: 340, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-square-evaluate-right", label: "Evaluate the right side", progressPermille: 436, viewport: "desktop", query: { kpMotion: "full" } },
        { id: "method-formula-start", label: "Simplify the radical · start", progressPermille: 370, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula", label: "Simplify the radical · symbolic motion", progressPermille: 400, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "method-formula-end", label: "Simplify the radical · end", progressPermille: 430, viewport: "desktop", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "branches", label: "Plus-minus branches", progressPermille: 680, viewport: "desktop" },
        { id: "reunion", label: "Complete solution set", progressPermille: 880, viewport: "desktop" },
        { id: "graph", label: "Roots meet the graph", progressPermille: 1_000, viewport: "desktop" },
        { id: "method-square-phone", label: "Move six · symbolic motion · phone", progressPermille: 150, viewport: "phone", query: { kpMotion: "full" } },
        { id: "method-formula-phone", label: "Simplify the radical · motion · phone", progressPermille: 400, viewport: "phone", query: { kpMethod: "formula", kpMotion: "full" } },
        { id: "branches-phone", label: "Branches · phone", progressPermille: 680, viewport: "phone" },
        { id: "graph-phone", label: "Roots meet the graph · phone", progressPermille: 1_000, viewport: "phone" }
      ]
    },
    budget: routeBudget(38_677, 5_796, 46_455)
  })
]);
