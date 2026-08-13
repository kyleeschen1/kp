import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../semantic/typescript-free-shipping-animation-asset.ts";
import { sampleKpTypeScriptRefactorScore } from
  "../semantic/typescript-refactor-score.ts";
import { renderKpTypeScriptRefactorCodeHtml } from
  "../rendering/typescript-refactor-code-html.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
const sessions = new WeakMap<HTMLElement, HTMLElement>();

export const kpEditorTypeScriptRefactorSurfaceAdapter:
  KpEditorAnimationSurfaceAdapter = {
    id: "adapter.programming.typescript-free-shipping-refactor",
    slotKind: "programming",
    priority: 110,
    supports(state) {
      return state.animationId === exemplar.animation.id &&
        state.surface.slotKinds.includes("programming");
    },
    render({ player, slot, state }) {
      const sample = sampleKpTypeScriptRefactorScore(
        exemplar.score,
        state.progress * exemplar.score.durationMs
      );
      let shell = sessions.get(player);
      if (shell === undefined) {
        slot.innerHTML = renderKpTypeScriptRefactorCodeHtml({
          semantics: exemplar.semantics,
          stageId: sample.stageId,
          narration: sample.narration,
          activeRevision: activeRevision(sample.stageId),
          focusSelectorIds: sample.focusSelectorIds,
          accessibleDescription: accessibleDescription(sample.narration)
        });
        shell = slot.querySelector<HTMLElement>("[data-kp-typescript-refactor-stage]") ?? undefined;
        if (shell === undefined) return;
        sessions.set(player, shell);
        if (player.dataset["kpTypeScriptRefactorDisposeBound"] !== "true") {
          player.dataset["kpTypeScriptRefactorDisposeBound"] = "true";
          player.addEventListener(
            KP_EDITOR_ANIMATION_DISPOSE_EVENT,
            () => sessions.delete(player),
            { once: true }
          );
        }
      }
      syncShell(shell, sample.stageId, sample.narration, sample.focusSelectorIds);
      slot.dataset["kpEditorProgrammingContract"] = "kp.typescript-refactor-score.v1";
    }
  };

export function registerKpEditorTypeScriptRefactorSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorTypeScriptRefactorSurfaceAdapter
  );
}

function syncShell(
  shell: HTMLElement,
  stageId: string,
  narration: string,
  focusSelectorIds: readonly string[]
): void {
  const revision = activeRevision(stageId);
  shell.dataset["kpTypeScriptRefactorStage"] = stageId;
  shell.dataset["kpTypescriptActiveRevision"] = revision;
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-revision]").forEach((node) => {
    const current = node.dataset["kpTypescriptRevision"] === revision;
    node.dataset["kpTypescriptRevisionCurrent"] = String(current);
    node.toggleAttribute("inert", !current);
    if (current) node.removeAttribute("aria-hidden");
    else node.setAttribute("aria-hidden", "true");
  });
  const focus = new Set(focusSelectorIds);
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-selector-id]").forEach((node) => {
    node.dataset["kpTypescriptFocus"] = String(
      focus.has(node.dataset["kpTypescriptSelectorId"] ?? "")
    );
  });
  shell.querySelector<HTMLElement>("[data-kp-typescript-narration]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(narration));
  const description = accessibleDescription(narration);
  shell.setAttribute("aria-label", description);
  shell.querySelector<HTMLElement>("[data-kp-typescript-accessible-state]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(description));
}

function activeRevision(stageId: string): "before" | "after" {
  return stageId === "stage.orient" || stageId === "stage.compare-duplicates"
    ? "before"
    : "after";
}

function accessibleDescription(narration: string): string {
  return `${exemplar.accessibility.title}. ${narration}`;
}
