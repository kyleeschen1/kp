import {
  validateKpEconomicsDemandShiftProseMotionAuthoring,
  type KpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLessonCompileOptions
} from "./economics-demand-shift-lesson-compiler.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import {
  compileKpEconomicsDemandShiftArticle
} from "./economics-demand-shift-article-compiler.ts";
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

export function compileKpEconomicsDemandShiftArticlePublication(input: {
  readonly articleText: string;
  readonly importLock: KpArticleImportLock;
  readonly proseMotion?: KpEconomicsDemandShiftLessonCompileOptions["proseMotion"];
}): KpEconomicsDemandShiftPublication {
  const compiled = compileKpEconomicsDemandShiftArticle({
    text: input.articleText,
    lock: input.importLock
  });
  const proseMotion = validateKpEconomicsDemandShiftProseMotionAuthoring(
    input.proseMotion ?? [],
    compiled.lesson.sections
  );
  const lesson = Object.freeze({
    ...compiled.lesson,
    ...(proseMotion.length === 0 ? {} : { proseMotion })
  });
  return compilePublicationProjection({
    lesson,
    twoColumnParagraphs: compiled.twoColumnParagraphs
  });
}

function compilePublicationProjection(input: {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly twoColumnParagraphs: readonly KpEconomicsDemandShiftLesson["sections"][number]["passages"][number][];
  readonly semanticReference?: Readonly<{
    referenceId: string;
    passageId: string;
  }> | undefined;
}): KpEconomicsDemandShiftPublication {
  const { lesson, twoColumnParagraphs } = input;
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
    twoColumnParagraphs.map(({ id }) => id),
    input.semanticReference
  );
  validateTextReferenceMarkup(
    twoColumnParagraphs,
    semanticTransit
  );

  return Object.freeze({
    lesson,
    document,
    tocHtml: controls.tocHtml,
    motionScrubBarHtml: controls.motionScrubBarHtml,
    verificationSurfaceHtml: renderKpEconomicsVerificationSurface(),
    twoColumnParagraphs,
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
