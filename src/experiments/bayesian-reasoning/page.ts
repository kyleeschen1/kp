import { createFlaggedTicketSource } from "../../../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence } from "./evidence.ts";
import { createBayesScore } from "./score.ts";
import { compileBayesNotation, annotateBayesQuotient } from "./notation.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { createBayesTreePlan } from "./tree-frame.ts";
import { renderBayesTreeSvg } from "./tree-svg.ts";

export function buildBayesPage() {
  const evidence = bindBayesEvidence(createFlaggedTicketSource()), beats = createBayesScore(evidence.trace);
  const notation = compileBayesNotation(evidence.trace);
  return `<h1>Change the question. Keep the facts.</h1><p>A fictional collection of 100 tickets: 20 urgent, 24 flagged, 16 both. Select one ticket uniformly.</p>
    ${renderKpFocusDeckScaffold({ id: "bayesian-reasoning", ariaLabel: "Building and reordering a probability tree", activeBeatSlug: beats[0]!.slug,
      rootAttributes: { "data-bayes-card": true }, viewportAttributes: { "data-kp-focus-deck-snap-disabled": "true" },
      headerTrailingHtml: '<span data-bayes-count>1 / 7</span>', replayHidden: false, beats,
      stageHtml: `<figure class="kp-focus-deck__stage bayes-stage"><div class="bayes-tree-panel"><p class="bayes-legend">A = urgent · B = flagged · ¬ = not · Ω = all</p><p data-bayes-population-label>Reference: whole population</p><div data-bayes-tree-host>${renderBayesTreeSvg(createBayesTreePlan(evidence.trace))}</div></div>
        <div class="bayes-notation" data-bayes-notation-phase="question"><p data-bayes-question>Among flagged tickets,<br>how many are urgent?</p><span data-bayes-formula-label></span><div data-bayes-native-host aria-hidden="true"></div></div></figure>` })}
    <p class="review-help">Swipe across the figure or passage; release to settle. Arrows animate one semantic step. Seven stops, one shared playhead.</p>
    <details><summary>Exact model and scope</summary><p>The four joint masses are 16/100, 4/100, 8/100 and 72/100. This is stipulated data, not a claim about a real classifier. Reordering a probability tree is not reversing causation.</p></details>
    <p data-bayes-error role="alert" hidden></p>${compileKpEquationExemplarTemplate(notation.animation, annotateBayesQuotient)}`;
}
