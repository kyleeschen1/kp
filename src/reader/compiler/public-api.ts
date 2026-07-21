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
  type KpStaticLessonHtml
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
  compileKpFractionalLinearEquationLessonModel
} from "./fractional-linear-equation-lesson-model.ts";
