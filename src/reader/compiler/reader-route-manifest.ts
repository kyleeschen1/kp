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

/**
 * Build-time source of truth for reader paths, Markdown inputs, and compilers.
 * Browser entries intentionally do not import this manifest or its compiler graph.
 */
export const kpReaderRouteManifest = defineKpReaderRouteManifest([
  defineKpReaderRoute({
    route: "/reader/solve-x/",
    sourcePath: "content/lessons/solve-x.md",
    compile: compileKpXPlusThreeLesson
  }),
  defineKpReaderRoute({
    route: "/reader/solve-x/teacher-zero/",
    sourcePath: "content/lessons/solve-x-teacher-zero.md",
    compile: compileKpXPlusThreeTeacherZeroLesson
  }),
  defineKpReaderRoute({
    route: "/reader/solve-fractional-linear/",
    sourcePath: "content/lessons/solve-fractional-linear.md",
    compile: compileKpFractionalLinearEquationLesson
  }),
  defineKpReaderRoute({
    route: "/reader/divide-both-sides/",
    sourcePath: "content/lessons/divide-both-sides.md",
    compile: compileKpDivideBothSidesEquationLesson
  }),
  defineKpReaderRoute({
    route: "/reader/split-merge-fractions/",
    sourcePath: "content/lessons/numerator-split-merge.md",
    compile: compileKpNumeratorSplitMergeEquationLesson
  }),
  defineKpReaderRoute({
    route: "/reader/fractional-transfer/",
    sourcePath: "content/lessons/fractional-transfer-comparison.md",
    compile: compileKpFractionalTransferComparisonLesson
  }),
  defineKpReaderRoute({
    route: "/reader/distribution-area/",
    sourcePath: "content/lessons/distribution-area.md",
    compile: compileKpDistributionAreaLesson
  })
]);
