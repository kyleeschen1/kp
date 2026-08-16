import type { KpAnimationSampler } from "../animation/kernel.ts";
import { createAdditionProgrammingSourceFixture } from
  "../domain-ir/programming-addition-source-fixture.ts";
import type {
  SourceFileObject,
  SourceRangeSelector
} from "../semantic/source-file.ts";
import { renderKpTutorialSourceFilePanelHtml } from "./card-html-shell.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml
} from "./generated-html-escaping.ts";
import {
  createKpTutorialProgrammingPanelContract,
  type KpTutorialProgrammingPanelContract
} from "./programming-panel.ts";
import {
  createKpTutorialSourceFileFrameAdapter,
  type KpTutorialSourceFileFrame,
  type KpTutorialSourceFileFrameAdapter
} from "./source-file-frame-adapter.ts";

export interface ProgrammingTutorialCardSample
  extends KpAnimationSampler<ProgrammingTutorialCardSampleFrame> {
  readonly id: "tutorial.programming.add.card.live-sample";
  readonly manifestId: "tutorial.programming.add.card";
  readonly title: string;
  readonly sourceFile: SourceFileObject;
  readonly selectors: readonly SourceRangeSelector[];
  readonly panel: KpTutorialProgrammingPanelContract;
  readonly sourceAdapter: KpTutorialSourceFileFrameAdapter;
  readonly diagnostics: readonly string[];
}

export interface ProgrammingTutorialCardSampleFrame {
  readonly progress: number;
  readonly sourceFrame: KpTutorialSourceFileFrame;
  readonly diagnostics: readonly string[];
}

export function createAdditionProgrammingTutorialCardSample(): ProgrammingTutorialCardSample {
  const { sourceFile, selectors, sharedClockId } =
    createAdditionProgrammingSourceFixture();
  const panel = createKpTutorialProgrammingPanelContract({
    panelId: "panel.programming.add.code",
    sharedClockId,
    sourceFile,
    selectors,
    summary: "Code panel for a small addition function."
  });
  const sourceAdapter = createKpTutorialSourceFileFrameAdapter({
    panel,
    sourceFile,
    selectors
  });
  const diagnostics: readonly string[] = [];

  return {
    id: "tutorial.programming.add.card.live-sample",
    manifestId: "tutorial.programming.add.card",
    title: "Trace add(a, b)",
    sourceFile,
    selectors,
    panel,
    sourceAdapter,
    diagnostics,
    sample(progress) {
      const sourceFrame = sourceAdapter.sample(progress);

      return {
        progress: sourceFrame.progress,
        sourceFrame,
        diagnostics
      };
    }
  };
}

export function renderKpProgrammingTutorialCardHtmlShell(
  sample: ProgrammingTutorialCardSample,
  frame: ProgrammingTutorialCardSampleFrame
): string {
  return [
    `<section class="kp-tutorial-card" data-kp-tutorial-card="${escapeAttr(sample.id)}" data-kp-tutorial-manifest="${escapeAttr(sample.manifestId)}" data-kp-tutorial-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-clock="${escapeAttr(frame.sourceFrame.sharedClockId)}" data-kp-tutorial-diagnostics="${frame.diagnostics.length}">`,
    `  <header class="kp-tutorial-card__header">`,
    `    <h2>${escapeHtml(sample.title)}</h2>`,
    `  </header>`,
    `  <div class="kp-tutorial-card__layout" data-kp-tutorial-layout="layout.programming.add.code-only">`,
    `    ${renderKpTutorialSourceFilePanelHtml(frame.sourceFrame)}`,
    `  </div>`,
    `</section>`
  ].join("\n");
}
