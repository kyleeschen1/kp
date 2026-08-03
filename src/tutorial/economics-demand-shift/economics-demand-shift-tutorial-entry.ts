import "../../styles.css";
import "katex/dist/katex.min.css";
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
  createKpAnimationCatalogueReviewHost
} from "../../editor/animation-catalogue-review-host.ts";
import {
  createKpAnimationCatalogueSelectionPreparationService
} from "../../editor/animation-catalogue-selection-preparation.ts";
import { createKpEditorAnimationLibrary } from "../../editor/animation-library.ts";
import KpEconomicsDemandShiftTutorial from
  "./KpEconomicsDemandShiftTutorial.svelte";
import {
  compileKpEconomicsDemandShiftLesson
} from "./economics-demand-shift-lesson-compiler.ts";

export async function mountKpEconomicsDemandShiftTutorial(input: {
  readonly root: HTMLElement;
  readonly search: string;
}): Promise<() => void> {
  const descriptors = createKpEditorAnimationLibrary();
  const projection = createKpAnimationCatalogueProjection({ descriptors });
  const entry = projection.entries.find(
    ({ animationId }) => animationId === economicsEquilibriumAnimationId
  );
  if (entry === undefined) {
    throw new Error("Economics demand-shift tutorial asset is not catalogued.");
  }
  const prepared = await createKpAnimationCatalogueSelectionPreparationService({
    descriptors
  }).prepare({
    entry,
    search: input.search,
    playhead: 0
  });
  const component = mount(KpEconomicsDemandShiftTutorial, {
    target: input.root,
    props: {
      entry,
      descriptor: prepared.descriptor,
      player: prepared.player,
      animation: prepared.animation,
      hostability: prepared.hostability,
      lesson: compileKpEconomicsDemandShiftLesson(lessonMarkdown),
      initialDemandIntercept:
        prepared.economicsParameters?.demandInterceptAfter ?? 18
    }
  });
  const reviewHost = createKpAnimationCatalogueReviewHost();
  input.root.dataset["kpEconomicsDemandShiftTutorialMounted"] = "true";
  void reviewHost.mount();

  return () => {
    reviewHost.dispose();
    delete input.root.dataset["kpEconomicsDemandShiftTutorialMounted"];
    void unmount(component);
  };
}
