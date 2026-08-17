export {
  KpLessonAuthoringError,
  createKpLessonAnimationStory,
  createKpLessonBeat,
  createKpLessonHeading,
  createKpLessonParagraph,
  createKpLessonSemanticLink,
  createKpLessonText,
  defineKpLessonDocument,
  kpLesson,
  type KpLessonInlineInput
} from "../reader/document/authoring.ts";

export {
  kpLessonAttentionPhaseOrder,
  validateKpLessonDocument,
  type KpLessonAnimationStoryBlock,
  type KpLessonAttentionPhase,
  type KpLessonAttentionPhaseKind,
  type KpLessonAttentionPlan,
  type KpLessonBeat,
  type KpLessonBlock,
  type KpLessonBlockBase,
  type KpLessonCheckpoint,
  type KpLessonDocument,
  type KpLessonDocumentIssue,
  type KpLessonHeadingBlock,
  type KpLessonInline,
  type KpLessonParagraphBlock,
  type KpLessonSemanticLink,
  type KpLessonText
} from "../reader/document/lesson-document.ts";

export {
  createKpCompiledLessonArtifact,
  createKpReaderArtifactRef,
  type KpCompiledLessonArtifact,
  type KpLessonDocumentArtifact,
  type KpReaderArtifactRef,
  type KpReaderSourceLocation,
  type KpReaderSourcePosition
} from "../reader/document/artifacts.ts";
