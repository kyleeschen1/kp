import type {
  KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-inline-markdown.ts";
import type {
  KpEconomicsLessonDraftState
} from "./economics-demand-shift-lesson-draft.ts";

// Draft structure is intentionally independent of KaTeX. This compiler is
// loaded only after authoring begins so publication readers never pay for the
// browser-side Markdown/KaTeX preview path.
export function compileKpEconomicsLessonDraftPassages(
  draft: KpEconomicsLessonDraftState
): readonly KpEconomicsDemandShiftLessonPassage[] {
  return Object.freeze(draft.passages.map((passage) => Object.freeze({
    id: passage.id,
    role: passage.role,
    ...(passage.motionBlockId === undefined
      ? {}
      : { motionBlockId: passage.motionBlockId }),
    paragraphs: Object.freeze([Object.freeze({
      sourceText: passage.sourceText,
      html: renderKpEconomicsDemandShiftInlineMarkdown(passage.sourceText)
    })])
  })));
}
