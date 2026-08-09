import "katex/dist/katex.min.css";
import "../kp-tutorial-progress-rail.css";
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
  applyKpEconomicsDemandShiftRouteHandoff,
  resolveKpEconomicsDemandShiftInitialDestination
} from "./economics-demand-shift-deep-link.ts";
import type { KpEconomicsDemandShiftRouteHandoff } from
  "./economics-demand-shift-route-handoff.ts";
import {
  readKpEconomicsDemandShiftPresentationLayout,
  readKpEconomicsMotionBridgeDwellProfile,
  readKpEconomicsScrollScrubStrategy,
  readKpEconomicsTwoColumnTextSide
} from "./economics-demand-shift-layout.ts";
import {
  readKpEconomicsDemandShiftTheme
} from "./economics-demand-shift-theme.ts";
import {
  loadKpEconomicsDemandShiftPresenterCapability
} from "./economics-demand-shift-presenter-capability.ts";
import { defineKpTutorialScrubBar } from "../kp-tutorial-scrub-bar.ts";
import { defineKpTutorialProgressRail } from
  "../kp-tutorial-progress-rail.ts";
import { defineKpTutorialToc } from "../kp-tutorial-toc-element.ts";

export async function mountKpEconomicsDemandShiftTutorial(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
  readonly handoff?: KpEconomicsDemandShiftRouteHandoff | undefined;
}): Promise<() => void> {
  // The optional presenter owns its complete tree. Remove the published
  // document before Svelte appends so hidden duplicate IDs, TOCs, and graph
  // labels cannot leak into page semantics during a capability transition.
  input.root.querySelector("[data-kp-economics-static-publication]")?.remove();
  input.root.querySelector(
    "[data-kp-economics-static-publication-styles]"
  )?.remove();
  const initialTheme = readKpEconomicsDemandShiftTheme(input.search);
  const presentationLayout = readKpEconomicsDemandShiftPresentationLayout(
    input.search
  );
  const previousDocumentTheme = document.documentElement.dataset[
    "kpLessonTheme"
  ];
  document.documentElement.dataset["kpLessonTheme"] = initialTheme;
  // Typography is lesson geometry: resolve the one local prose face before
  // scroll and attention observers can sample fallback-font dimensions.
  await Promise.all([
    document.fonts.load('300 1rem "Source Serif 4"'),
    loadKpEconomicsDemandShiftPresenterCapability(presentationLayout)
  ]);
  defineKpTutorialScrubBar();
  defineKpTutorialProgressRail();
  defineKpTutorialToc();
  const { descriptors, entry } =
    createKpEconomicsDemandShiftAnimationCapability();
  const publication = readKpEconomicsDemandShiftCompiledPublication();
  const scrubStrategy = readKpEconomicsScrollScrubStrategy(input.search);
  const resolvedInitialDestination = resolveKpEconomicsDemandShiftInitialDestination({
    lesson: publication.lesson,
    hash: input.hash
  });
  const initialDestination = input.handoff === undefined
    ? resolvedInitialDestination
    : applyKpEconomicsDemandShiftRouteHandoff({
      initial: resolvedInitialDestination,
      ...input.handoff
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
      presentationLayout,
      scrubStrategy,
      motionBridgeDwellProfile:
        readKpEconomicsMotionBridgeDwellProfile(input.search),
      initialTwoColumnTextSide: readKpEconomicsTwoColumnTextSide(input.search),
      initialTheme,
      initialDemandIntercept:
        prepared.economicsParameters?.demandInterceptAfter ?? 18
    }
  });
  input.root.dataset["kpEconomicsDemandShiftTutorialMounted"] = "true";

  return () => {
    delete input.root.dataset["kpEconomicsDemandShiftTutorialMounted"];
    if (previousDocumentTheme === undefined) {
      delete document.documentElement.dataset["kpLessonTheme"];
    } else {
      document.documentElement.dataset["kpLessonTheme"] = previousDocumentTheme;
    }
    void unmount(component);
  };
}
