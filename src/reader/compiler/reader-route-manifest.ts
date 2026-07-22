import {
  compileKpDistributionAreaLesson,
  compileKpDivideBothSidesEquationLesson,
  compileKpFractionalLinearEquationLesson,
  compileKpFractionalTransferComparisonLesson,
  compileKpNumeratorSplitMergeEquationLesson,
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    }
  })
]);
