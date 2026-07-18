import {
  inspectKpHermeneuticTutorial,
  renderKpHermeneuticTutorialInspector
} from "./hermeneutic-tutorial-inspector.ts";
import { createKpTutorialExplorationState, updateKpTutorialLiveState } from "../tutorial/exploration-state.ts";
import { renderKpFtcTutorialSurface } from "../tutorial/ftc-surface.ts";
import { createKpFtcTutorialDefinition } from "../tutorial/ftc-tutorial-module.ts";

export function renderKpFtcTutorialEditorSurface(): string {
  const definition = createKpFtcTutorialDefinition();
  const reference = createKpTutorialExplorationState({
    id: "state.ftc.editor",
    values: { upperBound: 2, deltaX: 0.5, lens: "quadratic" }
  });
  const inspector = inspectKpHermeneuticTutorial({
    module: definition.module,
    claimGraph: definition.graphs.claimGraph,
    cycles: definition.cycles,
    explorationState: updateKpTutorialLiveState(reference, {}),
    correspondenceMap: definition.correspondence,
    narrations: definition.narrations,
    promotion: definition.promotion
  });

  return `<section class="kp-ftc-editor-surface" data-kp-ftc-editor-surface aria-labelledby="kp-ftc-editor-title">
    <header><p class="eyebrow">Reviewable tutorial exemplar</p><h2 id="kp-ftc-editor-title">Fundamental Theorem of Calculus</h2><p>Inspect the authored claims and play the same learner surface from the editor.</p><button type="button" data-action="show-ftc-tutorial">Open learner view</button></header>
    ${renderKpFtcTutorialSurface()}
    ${renderKpHermeneuticTutorialInspector(inspector)}
  </section>`;
}
