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
import type { KpEconomicsDemandShiftLesson } from "./economics-demand-shift-lesson-compiler.ts";
import {
  findKpEconomicsMotionBlock
} from "./economics-demand-shift-motion-blocks.ts";

const asset = Object.freeze({
  kind: "animation-asset" as const,
  id: "asset.economics.supply-demand-equilibrium-shift",
  version: "1"
});

export function adaptKpEconomicsDemandShiftLessonDocument(
  lesson: KpEconomicsDemandShiftLesson
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
    for (const passage of section.passages) {
      passage.paragraphs.forEach((paragraph, index) => {
        blocks.push(createKpTutorialParagraphBlock({
          id: `${passage.id}-paragraph-${index + 1}`,
          sourceText: paragraph.sourceText
        }));
      });
      if (passage.motionBlockId === undefined) continue;
      const motion = findKpEconomicsMotionBlock(passage.motionBlockId)!;
      blocks.push(createKpTutorialAnimationStoryBlock({
        id: motion.id,
        asset,
        checkpoints: motion.checkpoints
      }));
    }
  }
  const document: KpLessonDocument = Object.freeze({
    kind: "lesson-document",
    id: "lesson.economics.demand-shift",
    version: "1.0.0",
    title: lesson.title,
    language: "en",
    blocks: Object.freeze(blocks),
    source: Object.freeze({
      kind: "lesson-source",
      id: "content.lessons.economics-demand-shift",
      version: "1.0.0"
    })
  });
  return createKpTutorialLessonPublicationDocument({
    document,
    metadata: { kicker: lesson.kicker, assumption: lesson.assumption }
  });
}
