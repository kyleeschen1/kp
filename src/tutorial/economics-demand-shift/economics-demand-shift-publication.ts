import {
  compileKpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  kpEconomicsMotionBlocks,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  kpEconomicsDemandShiftTutorialPath
} from "./economics-demand-shift-route.ts";
import {
  renderKpEconomicsVerificationSurface
} from "./economics-demand-shift-verification-surface.ts";
import {
  compileKpTutorialPublicationControls
} from "../kp-tutorial-publication-controls.ts";
import {
  adaptKpEconomicsDemandShiftLessonDocument
} from "./economics-demand-shift-document.ts";
import type {
  KpTutorialLessonPublicationDocument
} from "../kp-tutorial-lesson-document.ts";

export interface KpEconomicsDemandShiftPublication {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly document: KpTutorialLessonPublicationDocument;
  readonly tocHtml: string;
  readonly motionScrubBarHtml: Readonly<Record<KpEconomicsMotionBlockId, string>>;
  readonly verificationSurfaceHtml: string;
}

/**
 * Expands the concise Markdown annotations and local motion metadata into the
 * complete static payload. Authors never maintain custom-element internals.
 */
export function compileKpEconomicsDemandShiftPublication(
  markdown: string
): KpEconomicsDemandShiftPublication {
  const lesson = compileKpEconomicsDemandShiftLesson(markdown);
  const document = adaptKpEconomicsDemandShiftLessonDocument(lesson);
  const controls = compileKpTutorialPublicationControls({
    publication: document,
    path: kpEconomicsDemandShiftTutorialPath,
    motionBlockLabels: Object.fromEntries(kpEconomicsMotionBlocks.map(
      ({ id, label }) => [id, label]
    )) as Record<KpEconomicsMotionBlockId, string>
  });

  return Object.freeze({
    lesson,
    document,
    tocHtml: controls.tocHtml,
    motionScrubBarHtml: controls.motionScrubBarHtml,
    verificationSurfaceHtml: renderKpEconomicsVerificationSurface()
  });
}
