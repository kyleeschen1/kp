import {
  kpEconomicsDemandShiftTutorialPath
} from "./economics-demand-shift-route.ts";
import type {
  KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  kpEconomicsMotionBlocks
} from "./economics-demand-shift-motion-blocks.ts";
import type {
  KpTutorialTocItem,
  KpTutorialTocModel
} from "../kp-tutorial-toc.ts";

export function createKpEconomicsDemandShiftToc(
  lesson: KpEconomicsDemandShiftLesson
): KpTutorialTocModel {
  const items = lesson.sections.map((section): KpTutorialTocItem => {
    const passageIds = new Set(section.passages.map(({ id }) => id));
    const blocks = kpEconomicsMotionBlocks.filter(({ passageId }) =>
      passageIds.has(passageId)
    );
    return item({
      kind: "section",
      id: section.id,
      label: section.heading,
      href: href("section", section.id),
      children: blocks.map((block) => item({
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
      }))
    });
  });

  return Object.freeze({
    label: "In this lesson",
    items: Object.freeze(items)
  });
}

function href(kind: "section" | "block" | "checkpoint", id: string): string {
  return `${kpEconomicsDemandShiftTutorialPath}#kp-${kind}-${id}`;
}

function item(input: KpTutorialTocItem): KpTutorialTocItem {
  return Object.freeze({
    ...input,
    children: Object.freeze([...input.children])
  });
}
