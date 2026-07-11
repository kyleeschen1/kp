import type {
  SourceFileObject,
  SourceRangeSelector
} from "../semantic/source-file.ts";

export interface KpTutorialProgrammingPanelTarget {
  readonly kind: "source-file";
  readonly id: string;
}

export interface KpTutorialProgrammingPanelContract {
  readonly id: string;
  readonly panelId: string;
  readonly role: "code";
  readonly sharedClockId: string;
  readonly target: KpTutorialProgrammingPanelTarget;
  readonly sourceFileId: string;
  readonly language: string;
  readonly lineCount: number;
  readonly selectorIds: readonly string[];
  readonly preserves: readonly string[];
  readonly summary?: string | undefined;
}

export interface CreateKpTutorialProgrammingPanelContractInput {
  readonly panelId: string;
  readonly sharedClockId: string;
  readonly sourceFile: SourceFileObject;
  readonly selectors: readonly SourceRangeSelector[];
  readonly summary?: string | undefined;
}

export function createKpTutorialProgrammingPanelContract(
  input: CreateKpTutorialProgrammingPanelContractInput
): KpTutorialProgrammingPanelContract {
  assertNonEmpty(input.panelId, "Programming panel id");
  assertNonEmpty(input.sharedClockId, `Programming panel ${input.panelId} clock`);

  for (const selector of input.selectors) {
    if (selector.sourceFileId !== input.sourceFile.id) {
      throw new Error(
        `Source range selector ${selector.id} targets ${selector.sourceFileId} but programming panel ${input.panelId} is bound to ${input.sourceFile.id}.`
      );
    }
  }

  return {
    id: `${input.panelId}.programming-panel`,
    panelId: input.panelId,
    role: "code",
    sharedClockId: input.sharedClockId,
    target: {
      kind: "source-file",
      id: input.sourceFile.id
    },
    sourceFileId: input.sourceFile.id,
    language: input.sourceFile.language,
    lineCount: input.sourceFile.lineCount,
    selectorIds: input.selectors.map((selector) => selector.id),
    preserves: [
      "source-file identity",
      "source-range selector identity",
      "shared playhead"
    ],
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
