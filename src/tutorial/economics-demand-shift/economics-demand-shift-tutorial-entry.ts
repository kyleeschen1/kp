import "../../styles.css";
import "katex/dist/katex.min.css";
import "../kp-tutorial-scrub-bar.css";
import "./economics-demand-shift-tutorial.css";

import lessonMarkdown from
  "../../../content/lessons/economics-demand-shift.md?raw";

import { mount, unmount } from "svelte";

import {
  economicsEquilibriumAnimationId
} from "../../animation/economics-equilibrium-adapter.ts";
import {
  createKpAnimationCatalogueProjection
} from "../../editor/animation-catalogue-projection.ts";
import {
  createKpAnimationCatalogueSelectionPreparationService
} from "../../editor/animation-catalogue-selection-preparation.ts";
import { createKpEditorAnimationLibrary } from "../../editor/animation-library.ts";
import KpEconomicsDemandShiftTutorial from
  "./KpEconomicsDemandShiftTutorial.svelte";
import {
  compileKpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";
import {
  resolveKpEconomicsDemandShiftInitialDestination
} from "./economics-demand-shift-deep-link.ts";
import { defineKpTutorialScrubBar } from "../kp-tutorial-scrub-bar.ts";
import { defineKpTutorialToc } from "../kp-tutorial-toc-element.ts";
import { createKpTutorialReviewHost } from "../kp-tutorial-review-host.ts";

export async function mountKpEconomicsDemandShiftTutorial(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
}): Promise<() => void> {
  defineKpTutorialScrubBar();
  defineKpTutorialToc();
  const descriptors = createKpEditorAnimationLibrary();
  const projection = createKpAnimationCatalogueProjection({ descriptors });
  const entry = projection.entries.find(
    ({ animationId }) => animationId === economicsEquilibriumAnimationId
  );
  if (entry === undefined) {
    throw new Error("Economics demand-shift tutorial asset is not catalogued.");
  }
  const publication = compileKpEconomicsDemandShiftPublication(lessonMarkdown);
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
      tocHtml: publication.tocHtml,
      motionScrubBarHtml: publication.motionScrubBarHtml,
      verificationSurfaceHtml: publication.verificationSurfaceHtml,
      initialDestination,
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
    void unmount(component);
  };
}
