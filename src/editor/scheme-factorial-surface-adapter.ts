import { sampleKpSchemeFactorialFullEvaluation } from
  "../animation/scheme-factorial-full-evaluation.ts";
import { createKpSchemeFactorialAnimationAsset } from
  "../semantic/scheme-factorial-animation-asset.ts";
import {
  kpSchemeFirstExpansionCss,
  renderKpSchemeFactorialFullEvaluationHtml
} from "../rendering/scheme-factorial-first-expansion-html.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const exemplar = createKpSchemeFactorialAnimationAsset();
const sessions = new WeakMap<HTMLElement, HTMLElement>();

export const kpEditorSchemeFactorialSurfaceAdapter:
  KpEditorAnimationSurfaceAdapter = {
    id: "adapter.programming.scheme-factorial-full-evaluation",
    slotKind: "programming",
    priority: 112,
    supports(state) {
      return state.animationId === exemplar.animation.id &&
        state.surface.slotKinds.includes("programming");
    },
    render({ player, slot, state }) {
      let host = sessions.get(player);
      if (host === undefined) {
        slot.innerHTML = `<style>${kpSchemeFirstExpansionCss}</style>` +
          `<div data-kp-editor-scheme-factorial-surface></div>`;
        host = slot.querySelector<HTMLElement>(
          "[data-kp-editor-scheme-factorial-surface]") ?? undefined;
        if (host === undefined) return;
        sessions.set(player, host);
        if (player.dataset["kpSchemeFactorialDisposeBound"] !== "true") {
          player.dataset["kpSchemeFactorialDisposeBound"] = "true";
          player.addEventListener(
            KP_EDITOR_ANIMATION_DISPOSE_EVENT,
            () => sessions.delete(player),
            { once: true }
          );
        }
      }
      const sample = sampleKpSchemeFactorialFullEvaluation(
        exemplar.evaluation,
        state.progress,
        { reducedMotion: frameMode(player) !== "animated" }
      );
      host.innerHTML = renderKpSchemeFactorialFullEvaluationHtml({
        evaluation: exemplar.evaluation,
        sample
      });
      host.dataset["kpSchemeFactorialCaption"] = sample.caption;
      slot.dataset["kpEditorProgrammingContract"] =
        "kp.scheme-factorial-full-evaluation.v1";
    }
  };

export function registerKpEditorSchemeFactorialSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorSchemeFactorialSurfaceAdapter
  );
}

function frameMode(player: HTMLElement): "animated" | "reduced-motion" | "static" {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static" || mode === "reduced-motion" ? mode : "animated";
}
