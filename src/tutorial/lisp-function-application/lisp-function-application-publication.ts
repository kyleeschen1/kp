import { compileKpTutorialPublicationControls } from "../kp-tutorial-publication-controls.ts";
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
  const document = adaptKpLispFunctionApplicationLessonDocument(lesson);
  const controls = compileKpTutorialPublicationControls({
    publication: document,
    path: kpLispFunctionApplicationTutorialPath,
    motionBlockLabels: Object.fromEntries(kpLispLessonMotionBlocks.map(
      ({ id, label }) => [id, label]
    )) as Record<KpLispLessonMotionBlockId, string>
  });
  return Object.freeze({
    lesson,
    document,
    tocHtml: controls.tocHtml,
    motionScrubBarHtml: controls.motionScrubBarHtml
  });
}
