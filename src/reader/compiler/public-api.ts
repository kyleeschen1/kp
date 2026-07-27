export { kpMarkdownAstParserSelection } from "./markdown-ast-parser.ts";
export {
  KpLessonMarkdownError,
  parseKpLessonMarkdown,
  type KpLessonMarkdownInput
} from "./lesson-markdown-parser.ts";
export {
  KpLessonReferenceError,
  defineKpReaderAssetCatalog,
  resolveKpLessonReferences,
  type KpLessonReferenceIssue,
  type KpReaderAssetCatalog,
  type KpReaderAssetCatalogEntry,
  type KpResolvedAssetReference,
  type KpResolvedFocusReference,
  type KpResolvedLessonReferences
} from "./reference-resolver.ts";
export {
  compileKpStaticLessonProse,
  type KpStaticAnimationStorySlot,
  type KpStaticLessonHtml,
  type KpStaticLessonProseOptions
} from "./static-prose-compiler.ts";
export {
  compileKpStaticMathStates,
  type KpStaticMathBlock,
  type KpStaticMathProjection,
  type KpStaticMathProjectionInput,
  type KpStaticMathProjector,
  type KpStaticMathState
} from "./static-math-compiler.ts";
export {
  emitKpReaderHydrationManifest,
  kpReaderHydrationManifestSchemaVersion,
  serializeKpReaderHydrationManifest,
  type KpReaderHydrationBlock,
  type KpReaderHydrationCheckpoint,
  type KpReaderHydrationManifest
} from "./hydration-manifest.ts";
export {
  compileKpXPlusThreeLesson,
  compileKpXPlusThreeTeacherZeroLesson
} from "./x-plus-three-lesson.ts";

export {
  compileKpFractionalLinearEquationLesson
} from "./fractional-linear-equation-lesson.ts";
export {
  compileKpFractionalLinearStressCase,
  type KpCompiledFractionalLinearStressCase,
  type KpFractionalLinearStressState
} from "./fractional-linear-stress-case.ts";
export {
  compileKpFractionalLinearEquationLessonModel
} from "./fractional-linear-equation-lesson-model.ts";
export {
  compileKpDivideBothSidesEquationLesson
} from "./divide-both-sides-equation-lesson.ts";
export {
  compileKpDivideBothSidesEquationLessonModel
} from "./divide-both-sides-equation-lesson-model.ts";
export {
  compileKpNumeratorSplitMergeEquationLesson
} from "./numerator-split-merge-equation-lesson.ts";
export {
  compileKpNumeratorSplitMergeEquationLessonModel
} from "./numerator-split-merge-equation-lesson-model.ts";
export {
  compileKpRadicalSuccessionEquationLessonModel
} from "./radical-succession-equation-lesson-model.ts";
export {
  compileKpRadicalSuccessionEquationLesson
} from "./radical-succession-equation-lesson.ts";
export {
  compileKpCanonicalEquationLessonPromotion,
  type KpCanonicalEquationLessonPromotionInput
} from "./canonical-equation-lesson-promotion-kit.ts";

export {
  kpNumeratorSplitMergePreservationManifest
} from "./numerator-split-merge-preservation-manifest.ts";
export {
  kpRadicalSuccessionPreservationManifest
} from "./radical-succession-preservation-manifest.ts";
export {
  compileKpFractionalTransferComparisonLesson
} from "./fractional-transfer-comparison-lesson.ts";
export {
  compileKpFractionalTransferComparisonLessonModel
} from "./fractional-transfer-comparison-lesson-model.ts";
export {
  compileKpDistributionAreaLesson
} from "./distribution-area-lesson.ts";
export {
  compileKpQuadraticBranchingLesson
} from "./quadratic-branching-lesson.ts";
export {
  defineKpReaderRoute,
  defineKpReaderRouteManifest,
  kpReaderRouteEntryName,
  kpReaderRouteHtmlPath,
  type KpReaderLessonSourcePath,
  type KpReaderRouteConformanceProfile,
  type KpReaderRouteDescriptor,
  type KpReaderRouteBudgetProfile,
  type KpReaderRouteVisualReviewProfile,
  type KpReaderVisualReviewCheckpoint,
  type KpReaderVisualReviewViewport,
  type KpReaderRoutePath
} from "./reader-route-descriptor.ts";
export {
  compileKpReaderPageShell,
  kpReaderHtmlAttribute,
  type KpReaderHtmlAttribute,
  type KpReaderPageShellInput,
  type KpReaderShellLink
} from "./reader-page-shell.ts";
