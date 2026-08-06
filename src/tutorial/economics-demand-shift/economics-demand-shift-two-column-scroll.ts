import sourceJson from "../../../content/lessons/economics-demand-shift-two-column.json" with { type: "json" };

import type {
  KpEconomicsDemandShiftLessonPassage,
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-inline-markdown.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  parseKpEconomicsTwoColumnSource,
  type KpEconomicsTwoColumnSource
} from "./economics-demand-shift-two-column-source.ts";

export const kpEconomicsTwoColumnParagraphs:
  readonly KpEconomicsDemandShiftLessonPassage[] =
    compileKpEconomicsTwoColumnParagraphs(
      parseKpEconomicsTwoColumnSource(sourceJson)
    );

export function compileKpEconomicsTwoColumnParagraphs(
  source: KpEconomicsTwoColumnSource
): readonly KpEconomicsDemandShiftLessonPassage[] {
  return Object.freeze(source.passages.map(card));
}

function card(input: {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly sourceText: string;
}): KpEconomicsDemandShiftLessonPassage {
  return Object.freeze({
    id: input.id,
    role: input.role,
    ...(input.motionBlockId === undefined
      ? {}
      : { motionBlockId: input.motionBlockId }),
    paragraphs: Object.freeze([Object.freeze({
      sourceText: input.sourceText,
      html: renderKpEconomicsDemandShiftInlineMarkdown(input.sourceText)
    })])
  });
}
