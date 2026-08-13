import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../semantic/typescript-free-shipping-animation-asset.ts";
import { sampleKpTypeScriptRefactorScore } from
  "../semantic/typescript-refactor-score.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from
  "../animation/typescript-refactor-motion-frame.ts";
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
      const motion = sampleKpTypeScriptRefactorMotionFrame({
        score: exemplar.score,
        progress: state.progress,
        reducedMotion: frameMode(player) !== "animated"
      });
      let shell = sessions.get(player);
      if (shell === undefined) {
        slot.innerHTML = renderKpTypeScriptRefactorCodeHtml({
          semantics: exemplar.semantics,
          stageId: sample.stageId,
          narration: sample.narration,
          activeProjectionId: motion.accessibleProjectionId,
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
      syncShell(shell, motion);
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
  motion: ReturnType<typeof sampleKpTypeScriptRefactorMotionFrame>
): void {
  shell.dataset["kpTypeScriptRefactorStage"] = motion.stage.stageId;
  shell.dataset["kpTypescriptActiveProjection"] = motion.accessibleProjectionId;
  shell.dataset["kpTypescriptMotionMode"] = motion.reducedMotion ? "reduced" : "full";
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-projection-id]").forEach((node) => {
    const projection = motion.projections.find(
      ({ id }) => id === node.dataset["kpTypescriptProjectionId"]
    );
    if (projection === undefined) return;
    const current = projection.id === motion.accessibleProjectionId;
    node.dataset["kpTypescriptProjectionCurrent"] = String(current);
    node.dataset["kpTypescriptProjectionVisible"] = String(projection.opacity > 0);
    node.style.setProperty("--kp-typescript-revision-opacity", String(projection.opacity));
    node.style.setProperty("--kp-typescript-revision-scale", String(projection.scale));
    node.style.pointerEvents = current ? "auto" : "none";
    node.toggleAttribute("inert", !current);
    if (current) node.removeAttribute("aria-hidden");
    else node.setAttribute("aria-hidden", "true");
  });
  const focus = new Set(motion.stage.focusSelectorIds);
  shell.querySelectorAll<HTMLElement>("[data-kp-typescript-selector-id]").forEach((node) => {
    const focused = focus.has(node.dataset["kpTypescriptSelectorId"] ?? "");
    node.dataset["kpTypescriptFocus"] = String(focused);
    node.style.setProperty(
      "--kp-typescript-focus-strength",
      String(focused ? motion.focusStrength : 0)
    );
    node.style.setProperty(
      "--kp-typescript-focus-percent",
      `${focused ? motion.focusStrength * 100 : 0}%`
    );
    node.style.setProperty(
      "--kp-typescript-focus-shadow-alpha",
      String(focused ? motion.focusStrength * 0.18 : 0)
    );
  });
  shell.querySelector<HTMLElement>("[data-kp-typescript-narration]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(motion.stage.narration));
  const description = accessibleDescription(motion.stage.narration);
  shell.setAttribute("aria-label", description);
  shell.querySelector<HTMLElement>("[data-kp-typescript-accessible-state]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(description));
}

function frameMode(player: HTMLElement): "animated" | "reduced-motion" | "static" {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static" || mode === "reduced-motion" ? mode : "animated";
}

function accessibleDescription(narration: string): string {
  return `${exemplar.accessibility.title}. ${narration}`;
}
