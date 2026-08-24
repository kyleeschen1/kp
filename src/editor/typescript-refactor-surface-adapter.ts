import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../semantic/typescript-free-shipping-animation-asset.ts";
import { sampleKpTypeScriptRefactorScore } from
  "../semantic/typescript-refactor-score.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from
  "../animation/typescript-refactor-motion-frame.ts";
import {
  createKpTypeScriptRefactorTokenProgram,
  sampleKpTypeScriptRefactorTokenTheater
} from "../animation/typescript-refactor-token-theater.ts";
import { renderKpTypeScriptRefactorCodeHtml } from
  "../rendering/typescript-refactor-code-html.ts";
import { renderKpTypeScriptRefactorDomFrame } from
  "../rendering/typescript-refactor-dom-session.ts";
import {
  applyKpTypeScriptRefactorOpticalEndpoint,
  resolveKpTypeScriptRefactorOpticalEndpoint
} from "../rendering/typescript-refactor-optical-theme.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
const tokenProgram = createKpTypeScriptRefactorTokenProgram(exemplar.semantics);
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
      const endpoint = resolveKpTypeScriptRefactorOpticalEndpoint(
        catalogueTheme(player)
      );
      applyKpTypeScriptRefactorOpticalEndpoint({ root: slot, endpoint });
      const sample = sampleKpTypeScriptRefactorScore(
        exemplar.score,
        state.progress * exemplar.score.durationMs
      );
      const motion = sampleKpTypeScriptRefactorMotionFrame({
        score: exemplar.score,
        progress: state.progress,
        reducedMotion: frameMode(player) !== "animated"
      });
      const theater = sampleKpTypeScriptRefactorTokenTheater({
        program: tokenProgram,
        plan: exemplar.motionPlan,
        score: exemplar.score,
        progress: state.progress,
        reducedMotion: motion.reducedMotion
      });
      let shell = sessions.get(player);
      if (shell === undefined) {
        slot.innerHTML = renderKpTypeScriptRefactorCodeHtml({
          semantics: exemplar.semantics,
          stageId: sample.stageId,
          narration: sample.narration,
          activeProjectionId: motion.accessibleProjectionId,
          focusSelectorIds: sample.focusSelectorIds,
          theme: endpoint.id,
          accessibleDescription:
            `${exemplar.accessibility.title}. ${sample.narration}`
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
      applyKpTypeScriptRefactorOpticalEndpoint({ root: shell, endpoint });
      renderKpTypeScriptRefactorDomFrame(shell, { motion, theater },
        exemplar.accessibility.title);
      slot.dataset["kpEditorProgrammingContract"] = "kp.typescript-refactor-score.v1";
    }
  };

export function registerKpEditorTypeScriptRefactorSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorTypeScriptRefactorSurfaceAdapter
  );
}

function frameMode(player: HTMLElement): "animated" | "reduced-motion" | "static" {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static" || mode === "reduced-motion" ? mode : "animated";
}

function catalogueTheme(player: HTMLElement): string | undefined {
  return player.closest<HTMLElement>("[data-kp-animation-catalogue-theme]")
    ?.dataset["kpAnimationCatalogueTheme"];
}
