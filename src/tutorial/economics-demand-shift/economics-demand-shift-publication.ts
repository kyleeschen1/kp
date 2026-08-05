import {
  compileKpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLessonCompileOptions
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
import {
  kpEconomicsTwoColumnParagraphs
} from "./economics-demand-shift-two-column-scroll.ts";
import type {
  KpTutorialLessonPublicationDocument
} from "../kp-tutorial-lesson-document.ts";
import {
  renderKpTutorialMotionBridgeStatic
} from "../kp-tutorial-motion-bridge-static.ts";
import type {
  KpTutorialSemanticTransitAuthoringBundle
} from "../kp-tutorial-semantic-transit-authoring.ts";
import {
  compileKpEconomicsDemandShiftSemanticTransitExemplar
} from "./economics-demand-shift-semantic-transit-exemplar.ts";

export interface KpEconomicsDemandShiftPublication {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly document: KpTutorialLessonPublicationDocument;
  readonly tocHtml: string;
  readonly motionScrubBarHtml: Readonly<Record<KpEconomicsMotionBlockId, string>>;
  readonly verificationSurfaceHtml: string;
  readonly twoColumnParagraphs:
    readonly KpEconomicsDemandShiftLesson["sections"][number]["passages"][number][];
  readonly motionBridgeHtml?: Readonly<Record<string, string>> | undefined;
  readonly semanticTransit: KpTutorialSemanticTransitAuthoringBundle;
}

/**
 * Expands the concise Markdown annotations and local motion metadata into the
 * complete static payload. Authors never maintain custom-element internals.
 */
export function compileKpEconomicsDemandShiftPublication(
  markdown: string,
  options: KpEconomicsDemandShiftLessonCompileOptions = {}
): KpEconomicsDemandShiftPublication {
  const lesson = compileKpEconomicsDemandShiftLesson(markdown, options);
  const document = adaptKpEconomicsDemandShiftLessonDocument(lesson);
  const controls = compileKpTutorialPublicationControls({
    publication: document,
    path: kpEconomicsDemandShiftTutorialPath,
    motionBlockLabels: Object.fromEntries(kpEconomicsMotionBlocks.map(
      ({ id, label }) => [id, label]
    )) as Record<KpEconomicsMotionBlockId, string>
  });

  const motionBridgeHtml = Object.freeze(Object.fromEntries(
    (lesson.proseMotion ?? []).flatMap((record) => {
      if (record.kind !== "motion-bridge") return [];
      const before = findPassage(lesson, record.beforePassageId);
      const after = findPassage(lesson, record.afterPassageId);
      return [[record.id, renderKpTutorialMotionBridgeStatic({
        bridge: record,
        beforeHtml: before.paragraphs[0]!.html,
        afterHtml: after.paragraphs[0]!.html
      })] as const];
    })
  ));
  const semanticTransit = compileKpEconomicsDemandShiftSemanticTransitExemplar(
    kpEconomicsTwoColumnParagraphs.map(({ id }) => id)
  );
  validateTextReferenceMarkup(
    kpEconomicsTwoColumnParagraphs,
    semanticTransit
  );

  return Object.freeze({
    lesson,
    document,
    tocHtml: controls.tocHtml,
    motionScrubBarHtml: controls.motionScrubBarHtml,
    verificationSurfaceHtml: renderKpEconomicsVerificationSurface(),
    twoColumnParagraphs: kpEconomicsTwoColumnParagraphs,
    semanticTransit,
    ...(Object.keys(motionBridgeHtml).length === 0
      ? {}
      : { motionBridgeHtml })
  });
}

function validateTextReferenceMarkup(
  passages: readonly KpEconomicsDemandShiftLesson["sections"][number]["passages"][number][],
  authoring: KpTutorialSemanticTransitAuthoringBundle
): void {
  for (const reference of authoring.textReferences) {
    const passage = passages.find(({ id }) => id === reference.passageId);
    const marker = `data-kp-tutorial-text-reference="${reference.id}"`;
    const count = passage?.paragraphs.reduce(
      (total, paragraph) => total + paragraph.html.split(marker).length - 1,
      0
    ) ?? 0;
    if (count !== 1) {
      throw new Error(
        `Text reference ${reference.id} must compile exactly once in ` +
        `${reference.passageId}.`
      );
    }
  }
}

function findPassage(
  lesson: KpEconomicsDemandShiftLesson,
  passageId: string
): KpEconomicsDemandShiftLesson["sections"][number]["passages"][number] {
  const passage = lesson.sections.flatMap(({ passages }) => passages).find(
    ({ id }) => id === passageId
  );
  if (passage === undefined) {
    throw new Error(`Unknown compiled motion bridge passage: ${passageId}`);
  }
  return passage;
}
