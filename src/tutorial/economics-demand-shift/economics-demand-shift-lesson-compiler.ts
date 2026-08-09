import type {
  KpTutorialProseMotionAuthoring
} from "../kp-tutorial-motion-bridge-authoring.ts";
import {
  findKpEconomicsMotionBlock,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export {
  renderKpEconomicsDemandShiftInlineMarkdown
} from "./economics-demand-shift-inline-markdown.ts";

export interface KpEconomicsDemandShiftLessonParagraph {
  readonly html: string;
  readonly sourceText: string;
}

export type KpEconomicsDemandShiftPassageRole =
  | "regular"
  | "transition"
  | "interpretation"
  | "reflection";

export interface KpEconomicsDemandShiftLessonPassage {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly paragraphs: readonly KpEconomicsDemandShiftLessonParagraph[];
}

export interface KpEconomicsDemandShiftLessonSection {
  readonly id: string;
  readonly heading: string;
  readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
}

export interface KpEconomicsDemandShiftLesson {
  readonly title: string;
  readonly kicker: string;
  readonly assumption: string;
  readonly sections: readonly KpEconomicsDemandShiftLessonSection[];
  readonly proseMotion?: readonly KpTutorialProseMotionAuthoring[] | undefined;
}

export interface KpEconomicsDemandShiftLessonCompileOptions {
  readonly proseMotion?: readonly KpTutorialProseMotionAuthoring[] | undefined;
}

export function validateKpEconomicsDemandShiftProseMotionAuthoring(
  authoring: readonly KpTutorialProseMotionAuthoring[],
  sections: readonly KpEconomicsDemandShiftLessonSection[]
): readonly KpTutorialProseMotionAuthoring[] {
  const ids = new Set<string>();
  const claims = new Set<string>();
  const passages = new Map(sections.flatMap((section, sectionIndex) =>
    section.passages.map((passage, passageIndex) => [passage.id, {
      passage,
      sectionIndex,
      passageIndex
    }] as const)
  ));

  for (const record of authoring) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate prose motion id: ${record.id}`);
    }
    ids.add(record.id);
    if (record.kind === "ordinary-beat") {
      const location = passages.get(record.passageId);
      if (location === undefined) {
        throw new Error(`Unknown ordinary beat passage: ${record.passageId}`);
      }
      if (location.passage.paragraphs[record.paragraphIndex] === undefined) {
        throw new Error(
          `Unknown paragraph ${record.paragraphIndex} in passage ${record.passageId}.`
        );
      }
      claim(`${record.passageId}:${record.paragraphIndex}`, claims);
      validateSemanticEndpoint(record.settleAt);
      continue;
    }

    const before = passages.get(record.beforePassageId);
    const after = passages.get(record.afterPassageId);
    if (before === undefined || after === undefined) {
      throw new Error(`Motion bridge ${record.id} references unknown prose.`);
    }
    if (
      before.sectionIndex !== after.sectionIndex ||
      after.passageIndex !== before.passageIndex + 1
    ) {
      throw new Error(
        `Motion bridge ${record.id} passages must be adjacent in one section.`
      );
    }
    if (
      before.passage.paragraphs.length !== 1 ||
      after.passage.paragraphs.length !== 1
    ) {
      throw new Error(
        `Motion bridge ${record.id} requires one statement on each side.`
      );
    }
    const block = findKpEconomicsMotionBlock(record.motionBlockId);
    if (
      block === undefined ||
      block.passageId !== record.beforePassageId ||
      before.passage.motionBlockId !== block.id
    ) {
      throw new Error(
        `Motion bridge ${record.id} must begin at its annotated motion passage.`
      );
    }
    const fromIndex = block.checkpoints.findIndex(
      ({ id }) => id === record.fromCheckpointId
    );
    const toIndex = block.checkpoints.findIndex(
      ({ id }) => id === record.toCheckpointId
    );
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= toIndex) {
      throw new Error(
        `Motion bridge ${record.id} endpoints must follow checkpoint order.`
      );
    }
    claim(`${record.beforePassageId}:0`, claims);
    claim(`${record.afterPassageId}:0`, claims);
  }

  return Object.freeze([...authoring]);
}

function validateSemanticEndpoint(input: {
  readonly motionBlockId: string;
  readonly checkpointId: string;
}): void {
  const block = findKpEconomicsMotionBlock(input.motionBlockId);
  if (
    block === undefined ||
    !block.checkpoints.some(({ id }) => id === input.checkpointId)
  ) {
    throw new Error(
      `Unknown semantic checkpoint ${input.motionBlockId}:${input.checkpointId}.`
    );
  }
}

function claim(key: string, claims: Set<string>): void {
  if (claims.has(key)) {
    throw new Error(`Prose motion authoring overlaps at ${key}.`);
  }
  claims.add(key);
}
