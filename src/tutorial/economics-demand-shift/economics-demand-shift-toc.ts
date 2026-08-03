import type {
  KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  kpEconomicsMotionBlocks
} from "./economics-demand-shift-motion-blocks.ts";
import type {
  KpTutorialTocDestination
} from "../kp-tutorial-toc.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
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
