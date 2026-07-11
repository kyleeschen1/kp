import {
  normalizeAnimationProgress,
  type KpAnimationSampler,
  type KpSampledAnimationFrame
} from "../animation/kernel.ts";
import {
  resolveSourceRangeSelector,
  sourceFileLines,
  type SourceFileObject,
  type SourcePosition,
  type SourceRangeSelector
} from "../semantic/source-file.ts";
import type { KpTutorialProgrammingPanelContract } from "./programming-panel.ts";

export interface KpTutorialSourceFileFrameAdapter
  extends KpAnimationSampler<KpTutorialSourceFileFrame> {
  readonly panelId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly selectorIds: readonly string[];
  sample(progress: number): KpTutorialSourceFileFrame;
}

export interface KpTutorialSourceFileFrame
  extends KpSampledAnimationFrame {
  readonly panelId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly language: string;
  readonly progress: number;
  readonly lineCount: number;
  readonly lines: readonly string[];
  readonly selectors: readonly KpTutorialSourceFileSelectorFrame[];
}

export interface KpTutorialSourceFileSelectorFrame {
  readonly selectorId: string;
  readonly summary?: string | undefined;
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface CreateKpTutorialSourceFileFrameAdapterInput {
  readonly panel: KpTutorialProgrammingPanelContract;
  readonly sourceFile: SourceFileObject;
  readonly selectors: readonly SourceRangeSelector[];
}

export function createKpTutorialSourceFileFrameAdapter(
  input: CreateKpTutorialSourceFileFrameAdapterInput
): KpTutorialSourceFileFrameAdapter {
  if (input.panel.sourceFileId !== input.sourceFile.id) {
    throw new Error(
      `Programming panel ${input.panel.panelId} targets ${input.panel.sourceFileId} but received SourceFile ${input.sourceFile.id}.`
    );
  }

  const selectorsById = new Map(
    input.selectors.map((selector) => [selector.id, selector])
  );
  const selectorFrames = input.panel.selectorIds.map((selectorId) => {
    const selector = selectorsById.get(selectorId);

    if (selector === undefined) {
      throw new Error(
        `Programming panel ${input.panel.panelId} is missing selector ${selectorId}.`
      );
    }

    const resolved = resolveSourceRangeSelector(input.sourceFile, selector);

    return {
      selectorId: selector.id,
      ...(selector.summary === undefined ? {} : { summary: selector.summary }),
      text: resolved.text,
      startOffset: resolved.startOffset,
      endOffset: resolved.endOffset,
      start: { ...selector.start },
      end: { ...selector.end }
    };
  });
  const lines = [...sourceFileLines(input.sourceFile)];

  return {
    panelId: input.panel.panelId,
    sourceFileId: input.sourceFile.id,
    sharedClockId: input.panel.sharedClockId,
    selectorIds: [...input.panel.selectorIds],
    sample(progress) {
      return {
        panelId: input.panel.panelId,
        sourceFileId: input.sourceFile.id,
        sharedClockId: input.panel.sharedClockId,
        language: input.sourceFile.language,
        progress: normalizeAnimationProgress(progress),
        lineCount: input.sourceFile.lineCount,
        lines: [...lines],
        selectors: selectorFrames.map((selectorFrame) => ({
          ...selectorFrame,
          start: { ...selectorFrame.start },
          end: { ...selectorFrame.end }
        }))
      };
    }
  };
}
