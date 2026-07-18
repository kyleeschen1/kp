import type { KpArtifactPromotionFacet } from "../animation/artifact-promotion.ts";
import type { KpTutorialClaimGraph } from "../tutorial/claim-scene-graphs.ts";
import type { KpCrossViewCorrespondenceMap } from "../tutorial/cross-view-correspondence.ts";
import type { KpTutorialEpistemicNarration } from "../tutorial/epistemic-narration.ts";
import {
  diffKpTutorialExplorationState,
  type KpTutorialExplorationState,
  type KpTutorialStateDiff
} from "../tutorial/exploration-state.ts";
import type { KpHermeneuticTutorialModule } from "../tutorial/hermeneutic-module.ts";
import type { KpInterpretiveCycle } from "../tutorial/interpretive-cycle.ts";

export interface KpHermeneuticTutorialInspectorModel {
  readonly moduleId: string;
  readonly title: string;
  readonly clockId: string;
  readonly claimIds: readonly string[];
  readonly cycleIds: readonly string[];
  readonly stateDiffs: readonly KpTutorialStateDiff[];
  readonly correspondenceIds: readonly string[];
  readonly narrationIds: readonly string[];
  readonly promotion: KpArtifactPromotionFacet;
}

export function inspectKpHermeneuticTutorial(input: {
  readonly module: KpHermeneuticTutorialModule;
  readonly claimGraph: KpTutorialClaimGraph;
  readonly cycles: readonly KpInterpretiveCycle[];
  readonly explorationState: KpTutorialExplorationState;
  readonly correspondenceMap: KpCrossViewCorrespondenceMap;
  readonly narrations: readonly KpTutorialEpistemicNarration[];
  readonly promotion: KpArtifactPromotionFacet;
}): KpHermeneuticTutorialInspectorModel {
  return {
    moduleId: input.module.id,
    title: input.module.title,
    clockId: input.module.clockId,
    claimIds: input.claimGraph.nodes.map(({ id }) => id),
    cycleIds: input.cycles.map(({ id }) => id),
    stateDiffs: diffKpTutorialExplorationState(input.explorationState),
    correspondenceIds: input.correspondenceMap.correspondences.map(({ id }) => id),
    narrationIds: input.narrations.map(({ id }) => id),
    promotion: { ...input.promotion }
  };
}

export function renderKpHermeneuticTutorialInspector(
  model: KpHermeneuticTutorialInspectorModel
): string {
  return `<aside data-kp-tutorial-inspector="${escapeHtml(model.moduleId)}" data-kp-tutorial-clock="${escapeHtml(model.clockId)}" data-kp-artifact-maturity="${model.promotion.maturity}" data-kp-artifact-novelty="${model.promotion.novelty}">
  <h2>${escapeHtml(model.title)}</h2>
  ${list("Claims", "claim", model.claimIds)}
  ${list("Interpretive cycles", "cycle", model.cycleIds)}
  ${list("Correspondences", "correspondence", model.correspondenceIds)}
  ${list("Narration", "narration", model.narrationIds)}
  <section data-kp-tutorial-inspector-section="state"><h3>Live state diff</h3><ul>${
    model.stateDiffs.length === 0
      ? "<li data-kp-tutorial-state-diff=\"none\">Reference and live state agree</li>"
      : model.stateDiffs
          .map(
            (diff) =>
              `<li data-kp-tutorial-state-diff="${escapeHtml(diff.parameterId)}">${escapeHtml(diff.parameterId)}: ${escapeHtml(String(diff.referenceValue))} → ${escapeHtml(String(diff.liveValue))}</li>`
          )
          .join("")
  }</ul></section>
</aside>`;
}

function list(label: string, kind: string, ids: readonly string[]): string {
  return `<section data-kp-tutorial-inspector-section="${kind}"><h3>${label}</h3><ul>${ids
    .map((id) => `<li data-kp-tutorial-${kind}="${escapeHtml(id)}">${escapeHtml(id)}</li>`)
    .join("")}</ul></section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
