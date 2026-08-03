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
  KpTutorialTocDestination,
  KpTutorialTocItem,
  KpTutorialTocModel
} from "../kp-tutorial-toc.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  serializeKpTutorialDestinationHref
} from "../kp-tutorial-url.ts";

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

export function resolveKpEconomicsDemandShiftTocDestination(input: {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly passageId: string;
  readonly demandShiftProgress: number;
  readonly supplyMovementProgress: number;
}): KpTutorialTocDestination {
  const section = input.lesson.sections.find(({ passages }) =>
    passages.some(({ id }) => id === input.passageId)
  );
  if (section === undefined) {
    return { kind: "section", id: input.lesson.sections[0]!.id };
  }
  const passage = section.passages.find(({ id }) => id === input.passageId);
  if (passage?.motionBlockId === undefined) {
    return { kind: "section", id: section.id };
  }
  const block = kpEconomicsMotionBlocks.find(
    ({ id }) => id === passage.motionBlockId
  )!;
  const progress = motionProgress(passage.motionBlockId, input);
  const checkpoint = [...block.checkpoints].reverse().find(
    (candidate) => progress + 0.001 >= candidate.progress
  ) ?? block.checkpoints[0]!;
  return { kind: "checkpoint", id: checkpoint.id };
}

function href(kind: "section" | "block" | "checkpoint", id: string): string {
  return serializeKpTutorialDestinationHref(
    kpEconomicsDemandShiftTutorialPath,
    { kind, id }
  );
}

function motionProgress(
  blockId: KpEconomicsMotionBlockId,
  input: {
    readonly demandShiftProgress: number;
    readonly supplyMovementProgress: number;
  }
): number {
  return blockId === "supply-movement"
    ? input.supplyMovementProgress
    : input.demandShiftProgress;
}

function item(input: KpTutorialTocItem): KpTutorialTocItem {
  return Object.freeze({
    ...input,
    children: Object.freeze([...input.children])
  });
}
