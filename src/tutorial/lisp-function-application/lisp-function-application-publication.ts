import { renderKpTutorialScrubBar } from "../kp-tutorial-scrub-bar-renderer.ts";
import {
  renderKpTutorialToc,
  type KpTutorialTocItem,
  type KpTutorialTocModel
} from "../kp-tutorial-toc.ts";
import { serializeKpTutorialDestinationHref } from "../kp-tutorial-url.ts";
import {
  compileKpLispFunctionApplicationLesson,
  type KpLispFunctionApplicationLesson
} from "./lisp-function-application-lesson-compiler.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";
import { kpLispFunctionApplicationTutorialPath } from "./lisp-function-application-route.ts";
import {
  adaptKpLispFunctionApplicationLessonDocument
} from "./lisp-function-application-document.ts";
import type {
  KpTutorialLessonPublicationDocument
} from "../kp-tutorial-lesson-document.ts";

export interface KpLispFunctionApplicationPublication {
  readonly lesson: KpLispFunctionApplicationLesson;
  readonly document: KpTutorialLessonPublicationDocument;
  readonly tocHtml: string;
  readonly motionScrubBarHtml: Readonly<Record<KpLispLessonMotionBlockId, string>>;
}

export function compileKpLispFunctionApplicationPublication(
  markdown: string
): KpLispFunctionApplicationPublication {
  const lesson = compileKpLispFunctionApplicationLesson(markdown);
  const scrubbers = Object.fromEntries(kpLispLessonMotionBlocks.map((block) => [
    block.id,
    renderKpTutorialScrubBar({
      blockId: block.id,
      checkpoints: block.checkpoints.map((checkpoint) => ({
        ...checkpoint,
        href: href("checkpoint", checkpoint.id)
      }))
    })
  ])) as Record<KpLispLessonMotionBlockId, string>;
  return Object.freeze({
    lesson,
    document: adaptKpLispFunctionApplicationLessonDocument(lesson),
    tocHtml: renderKpTutorialToc(toc(lesson)),
    motionScrubBarHtml: Object.freeze(scrubbers)
  });
}

function toc(lesson: KpLispFunctionApplicationLesson): KpTutorialTocModel {
  return Object.freeze({
    label: "In this lesson",
    items: Object.freeze(lesson.sections.map((section) => item({
      kind: "section",
      id: section.id,
      label: section.heading,
      href: href("section", section.id),
      children: section.blocks.flatMap((lessonBlock) => {
        if (lessonBlock.kind !== "motion") return [];
        const block = kpLispLessonMotionBlocks.find(({ id }) => id === lessonBlock.id)!;
        return [item({
          kind: "block",
          id: block.id,
          label: block.label,
          href: href("block", block.id),
          children: block.checkpoints.map((checkpoint) => item({
            kind: "checkpoint",
            id: checkpoint.id,
            label: checkpoint.label,
            href: href("checkpoint", checkpoint.id),
            children: []
          }))
        })];
      })
    })))
  });
}

function item(value: KpTutorialTocItem): KpTutorialTocItem {
  return Object.freeze({ ...value, children: Object.freeze([...value.children]) });
}

function href(
  kind: "section" | "block" | "checkpoint",
  id: string
): string {
  return serializeKpTutorialDestinationHref(
    kpLispFunctionApplicationTutorialPath,
    { kind, id }
  );
}
