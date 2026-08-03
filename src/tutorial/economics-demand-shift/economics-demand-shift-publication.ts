import {
  compileKpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  kpEconomicsMotionBlocks,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  kpEconomicsDemandShiftTutorialPath
} from "./economics-demand-shift-route.ts";
import {
  createKpEconomicsDemandShiftToc
} from "./economics-demand-shift-toc.ts";
import {
  renderKpEconomicsVerificationSurface
} from "./economics-demand-shift-verification-surface.ts";
import {
  renderKpTutorialScrubBar
} from "../kp-tutorial-scrub-bar-renderer.ts";
import { renderKpTutorialToc } from "../kp-tutorial-toc.ts";

export interface KpEconomicsDemandShiftPublication {
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly tocHtml: string;
  readonly motionScrubBarHtml: Readonly<Record<KpEconomicsMotionBlockId, string>>;
  readonly verificationSurfaceHtml: string;
}

/**
 * Expands the concise Markdown annotations and local motion metadata into the
 * complete static payload. Authors never maintain custom-element internals.
 */
export function compileKpEconomicsDemandShiftPublication(
  markdown: string
): KpEconomicsDemandShiftPublication {
  const lesson = compileKpEconomicsDemandShiftLesson(markdown);
  const motionScrubBarHtml = Object.fromEntries(kpEconomicsMotionBlocks.map(
    (block) => [block.id, renderKpTutorialScrubBar({
      blockId: block.id,
      checkpoints: block.checkpoints.map((checkpoint) => ({
        ...checkpoint,
        href: `${kpEconomicsDemandShiftTutorialPath}` +
          `#kp-checkpoint-${checkpoint.id}`
      }))
    })]
  )) as Record<KpEconomicsMotionBlockId, string>;

  return Object.freeze({
    lesson,
    tocHtml: renderKpTutorialToc(createKpEconomicsDemandShiftToc(lesson)),
    motionScrubBarHtml: Object.freeze(motionScrubBarHtml),
    verificationSurfaceHtml: renderKpEconomicsVerificationSurface()
  });
}
