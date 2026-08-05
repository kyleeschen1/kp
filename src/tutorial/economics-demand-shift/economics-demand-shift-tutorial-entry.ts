import "../../styles.css";
import "katex/dist/katex.min.css";
import "../kp-tutorial-scrub-bar.css";
import "./economics-demand-shift-tutorial.css";

import { mount, unmount } from "svelte";

import {
  createKpAnimationCatalogueSelectionPreparationService
} from "../../editor/animation-catalogue-selection-preparation.ts";
import KpEconomicsDemandShiftTutorial from
  "./KpEconomicsDemandShiftTutorial.svelte";
import {
  createKpEconomicsDemandShiftAnimationCapability
} from "./economics-demand-shift-animation-capability.ts";
import {
  readKpEconomicsDemandShiftCompiledPublication
} from "./economics-demand-shift-compiled-publication.ts";
import {
  resolveKpEconomicsDemandShiftInitialDestination
} from "./economics-demand-shift-deep-link.ts";
import {
  readKpEconomicsDemandShiftPresentationLayout,
  readKpEconomicsScrollScrubStrategy,
  readKpEconomicsTwoColumnParagraphGapVh,
  readKpEconomicsTwoColumnTextSide
} from "./economics-demand-shift-layout.ts";
import {
  readKpEconomicsDemandShiftTheme
} from "./economics-demand-shift-theme.ts";
import {
  readKpEconomicsGraphStrokeScale
} from "./economics-demand-shift-graph-style.ts";
import { defineKpGraphStyleTuner } from "../kp-graph-style-tuner.ts";
import { defineKpTutorialScrubBar } from "../kp-tutorial-scrub-bar.ts";
import { defineKpTutorialToc } from "../kp-tutorial-toc-element.ts";
import { createKpTutorialReviewHost } from "../kp-tutorial-review-host.ts";

export async function mountKpEconomicsDemandShiftTutorial(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
}): Promise<() => void> {
  const initialTheme = readKpEconomicsDemandShiftTheme(input.search);
  const previousDocumentTheme = document.documentElement.dataset[
    "kpLessonTheme"
  ];
  document.documentElement.dataset["kpLessonTheme"] = initialTheme;
  // Typography is lesson geometry: resolve the one local prose face before
  // scroll and attention observers can sample fallback-font dimensions.
  await document.fonts.load('400 1rem "Source Serif 4 Variable"');
  defineKpGraphStyleTuner();
  defineKpTutorialScrubBar();
  defineKpTutorialToc();
  const { descriptors, entry } =
    createKpEconomicsDemandShiftAnimationCapability();
  const publication = readKpEconomicsDemandShiftCompiledPublication();
  const scrubStrategy = readKpEconomicsScrollScrubStrategy(input.search);
  const initialDestination = resolveKpEconomicsDemandShiftInitialDestination({
    lesson: publication.lesson,
    hash: input.hash
  });
  const prepared = await createKpAnimationCatalogueSelectionPreparationService({
    descriptors
  }).prepare({
    entry,
    search: input.search,
    playhead: initialDestination.motion.demandShiftProgress
  });
  const component = mount(KpEconomicsDemandShiftTutorial, {
    target: input.root,
    props: {
      entry,
      descriptor: prepared.descriptor,
      player: prepared.player,
      animation: prepared.animation,
      hostability: prepared.hostability,
      lesson: publication.lesson,
      motionBridgeHtml: scrubStrategy === "motion-bridge"
        ? publication.motionBridgeHtml
        : undefined,
      semanticTransit: scrubStrategy === "motion-bridge"
        ? publication.semanticTransit
        : undefined,
      tocHtml: publication.tocHtml,
      motionScrubBarHtml: publication.motionScrubBarHtml,
      verificationSurfaceHtml: publication.verificationSurfaceHtml,
      twoColumnParagraphs: publication.twoColumnParagraphs,
      initialDestination,
      presentationLayout: readKpEconomicsDemandShiftPresentationLayout(
        input.search
      ),
      scrubStrategy,
      initialTwoColumnTextSide: readKpEconomicsTwoColumnTextSide(input.search),
      initialTwoColumnParagraphGapVh:
        readKpEconomicsTwoColumnParagraphGapVh(input.search),
      initialGraphStrokeScale: readKpEconomicsGraphStrokeScale(input.search),
      initialTheme,
      initialDemandIntercept:
        prepared.economicsParameters?.demandInterceptAfter ?? 18
    }
  });
  const reviewHost = createKpTutorialReviewHost();
  input.root.dataset["kpEconomicsDemandShiftTutorialMounted"] = "true";
  void reviewHost.mount();

  return () => {
    reviewHost.dispose();
    delete input.root.dataset["kpEconomicsDemandShiftTutorialMounted"];
    if (previousDocumentTheme === undefined) {
      delete document.documentElement.dataset["kpLessonTheme"];
    } else {
      document.documentElement.dataset["kpLessonTheme"] = previousDocumentTheme;
    }
    void unmount(component);
  };
}
