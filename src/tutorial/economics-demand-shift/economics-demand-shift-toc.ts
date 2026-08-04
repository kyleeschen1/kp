import type {
  KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpTutorialTocDestination
} from "../kp-tutorial-toc.ts";
export function resolveKpEconomicsDemandShiftTocDestination(input: {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly passageId: string;
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
  return { kind: "block", id: passage.motionBlockId };
}
