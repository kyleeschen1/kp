import {
  applyKpEditorAnimationPresentationTuning
} from "./animation-player-controller.ts";
import type {
  KpAnimationCatalogueInspectorView
} from "./animation-catalogue-host-view-model.ts";

const inspectorViews = new Set<KpAnimationCatalogueInspectorView>([
  "details",
  "parameters",
  "tuning",
  "explanation"
]);

export function selectKpAnimationCatalogueInspector(
  select: HTMLSelectElement
): KpAnimationCatalogueInspectorView | undefined {
  if (!isInspectorView(select.value)) return undefined;
  const view = select.closest<HTMLElement>(
    "[data-kp-animation-catalogue-inspector-view]"
  );
  if (view === null) return undefined;
  view.dataset["kpAnimationCatalogueInspectorView"] = select.value;
  view.querySelectorAll<HTMLElement>(
    "[data-kp-animation-catalogue-inspector-panel]"
  ).forEach((panel) => {
    panel.hidden = panel.dataset["kpAnimationCatalogueInspectorPanel"] !==
      select.value;
  });
  return select.value;
}

export function tuneKpAnimationCataloguePresentation(
  shell: ParentNode,
  select: HTMLSelectElement
): void {
  const kind = select.dataset["kpAnimationCatalogueTuning"];
  if (kind !== "gestalt-style" && kind !== "focus-experiment") return;
  const player = shell.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  // Tuning remains a command to the existing player capability; the shell
  // never mirrors presentation state or resamples the animation itself.
  if (player !== null) {
    applyKpEditorAnimationPresentationTuning(player, kind, select.value);
  }
}

function isInspectorView(
  value: string
): value is KpAnimationCatalogueInspectorView {
  return inspectorViews.has(value as KpAnimationCatalogueInspectorView);
}
