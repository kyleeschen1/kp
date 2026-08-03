import type {
  KpLessonBlock,
  KpLessonDocument,
  KpLessonInline
} from "../../reader/document/lesson-document.ts";
import {
  createKpTutorialAnimationStoryBlock,
  createKpTutorialLessonPublicationDocument,
  createKpTutorialParagraphBlock,
  type KpTutorialLessonPublicationDocument
} from "../kp-tutorial-lesson-document.ts";
import type {
  KpLispFunctionApplicationLesson
} from "./lisp-function-application-lesson-compiler.ts";
import {
  kpLispLessonMotionBlocks
} from "./lisp-function-application-motion-blocks.ts";

const asset = Object.freeze({
  kind: "animation-asset" as const,
  id: "animation.programming.lisp-lambda-application",
  version: "1"
});

export function adaptKpLispFunctionApplicationLessonDocument(
  lesson: KpLispFunctionApplicationLesson
): KpTutorialLessonPublicationDocument {
  const blocks: KpLessonBlock[] = [];
  for (const section of lesson.sections) {
    blocks.push(Object.freeze({
      kind: "heading",
      id: section.id,
      level: 3,
      content: Object.freeze<KpLessonInline[]>([
        Object.freeze({ kind: "text", value: section.heading })
      ])
    }));
    for (const lessonBlock of section.blocks) {
      if (lessonBlock.kind === "passage") {
        lessonBlock.paragraphs.forEach((paragraph, index) => {
          blocks.push(createKpTutorialParagraphBlock({
            id: `${lessonBlock.id}-paragraph-${index + 1}`,
            sourceText: paragraph.sourceText
          }));
        });
        continue;
      }
      const motion = kpLispLessonMotionBlocks.find(
        ({ id }) => id === lessonBlock.id
      )!;
      blocks.push(createKpTutorialAnimationStoryBlock({
        id: motion.id,
        asset,
        checkpoints: motion.checkpoints
      }));
    }
  }
  const document: KpLessonDocument = Object.freeze({
    kind: "lesson-document",
    id: "lesson.programming.lisp-function-application",
    version: "1.0.0",
    title: lesson.title,
    language: "en",
    blocks: Object.freeze(blocks),
    source: Object.freeze({
      kind: "lesson-source",
      id: "content.lessons.programming-lisp-function-application",
      version: "1.0.0"
    })
  });
  return createKpTutorialLessonPublicationDocument({
    document,
    metadata: { kicker: lesson.kicker, assumption: lesson.assumption }
  });
}
