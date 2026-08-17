export {
  compileKpStaticLessonProse,
  type KpStaticAnimationStorySlot,
  type KpStaticLessonHtml,
  type KpStaticLessonProseOptions
} from "../reader/compiler/static-prose-compiler.ts";

export {
  compileKpStaticMathStates,
  type KpStaticMathBlock,
  type KpStaticMathProjection,
  type KpStaticMathProjectionInput,
  type KpStaticMathProjector,
  type KpStaticMathState
} from "../reader/compiler/static-math-compiler.ts";

export {
  emitKpReaderHydrationManifest,
  kpReaderHydrationManifestSchemaVersion,
  serializeKpReaderHydrationManifest,
  type KpReaderHydrationBlock,
  type KpReaderHydrationCheckpoint,
  type KpReaderHydrationManifest
} from "../reader/compiler/hydration-manifest.ts";
