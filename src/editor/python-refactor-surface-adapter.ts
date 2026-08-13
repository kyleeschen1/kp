import { createKpPythonFreeShippingAnimationAsset } from
  "../semantic/python-free-shipping-animation-asset.ts";
import { sampleKpPythonRefactorScore } from
  "../semantic/python-refactor-score.ts";
import { sampleKpPythonRefactorMotionFrame } from
  "../animation/python-refactor-motion-frame.ts";
import {
  createKpPythonRefactorTokenProgram,
  sampleKpPythonRefactorTokenTheater,
  type KpPythonTheaterToken
} from "../animation/python-refactor-token-theater.ts";
import { renderKpPythonRefactorCodeHtml } from
  "../rendering/python-refactor-code-html.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const exemplar = createKpPythonFreeShippingAnimationAsset();
const tokenProgram = createKpPythonRefactorTokenProgram(exemplar.semantics);
const sessions = new WeakMap<HTMLElement, HTMLElement>();

export const kpEditorPythonRefactorSurfaceAdapter:
  KpEditorAnimationSurfaceAdapter = {
    id: "adapter.programming.python-free-shipping-refactor",
    slotKind: "programming",
    priority: 111,
    supports(state) {
      return state.animationId === exemplar.animation.id &&
        state.surface.slotKinds.includes("programming");
    },
    render({ player, slot, state }) {
      const sample = sampleKpPythonRefactorScore(
        exemplar.score,
        state.progress * exemplar.score.durationMs
      );
      const motion = sampleKpPythonRefactorMotionFrame({
        score: exemplar.score,
        progress: state.progress,
        reducedMotion: frameMode(player) !== "animated"
      });
      const theater = sampleKpPythonRefactorTokenTheater({
        program: tokenProgram,
        plan: exemplar.motionPlan,
        score: exemplar.score,
        progress: state.progress,
        reducedMotion: motion.reducedMotion
      });
      let shell = sessions.get(player);
      if (shell === undefined) {
        slot.innerHTML = renderKpPythonRefactorCodeHtml({
          semantics: exemplar.semantics,
          stageId: sample.stageId,
          narration: sample.narration,
          activeProjectionId: motion.accessibleProjectionId,
          focusSelectorIds: sample.focusSelectorIds,
          accessibleDescription: accessibleDescription(sample.narration)
        });
        shell = slot.querySelector<HTMLElement>("[data-kp-python-refactor-stage]") ?? undefined;
        if (shell === undefined) return;
        sessions.set(player, shell);
        if (player.dataset["kpPythonRefactorDisposeBound"] !== "true") {
          player.dataset["kpPythonRefactorDisposeBound"] = "true";
          player.addEventListener(
            KP_EDITOR_ANIMATION_DISPOSE_EVENT,
            () => sessions.delete(player),
            { once: true }
          );
        }
      }
      syncShell(shell, motion, theater);
      slot.dataset["kpEditorProgrammingContract"] = "kp.python-refactor-score.v1";
    }
  };

export function registerKpEditorPythonRefactorSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorPythonRefactorSurfaceAdapter
  );
}

function syncShell(
  shell: HTMLElement,
  motion: ReturnType<typeof sampleKpPythonRefactorMotionFrame>,
  theater: ReturnType<typeof sampleKpPythonRefactorTokenTheater>
): void {
  shell.dataset["kpPythonRefactorStage"] = motion.stage.stageId;
  shell.dataset["kpPythonActiveProjection"] = motion.accessibleProjectionId;
  shell.dataset["kpPythonMotionMode"] = motion.reducedMotion ? "reduced" : "full";
  shell.dataset["kpPythonTokenTheaterActive"] = String(theater.active);
  if (theater.activeTrackId === undefined) delete shell.dataset["kpPythonMotionTrack"];
  else shell.dataset["kpPythonMotionTrack"] = theater.activeTrackId;

  shell.querySelectorAll<HTMLElement>("[data-kp-python-projection-id]").forEach((node) => {
    const projection = motion.projections.find(
      ({ id }) => id === node.dataset["kpPythonProjectionId"]
    );
    if (projection === undefined) return;
    const current = projection.id === motion.accessibleProjectionId;
    node.dataset["kpPythonProjectionCurrent"] = String(current);
    node.dataset["kpPythonProjectionVisible"] = String(projection.opacity > 0);
    node.style.setProperty(
      "--kp-python-revision-opacity",
      String(theater.active ? 0 : projection.opacity)
    );
    node.style.setProperty("--kp-python-revision-scale", String(projection.scale));
    node.style.pointerEvents = current ? "auto" : "none";
    node.toggleAttribute("inert", !current);
    if (current) node.removeAttribute("aria-hidden");
    else node.setAttribute("aria-hidden", "true");
  });
  syncTokenTheater(shell, theater);
  const focus = new Set(motion.stage.focusSelectorIds);
  shell.querySelectorAll<HTMLElement>("[data-kp-python-selector-id]").forEach((node) => {
    const focused = focus.has(node.dataset["kpPythonSelectorId"] ?? "");
    node.dataset["kpPythonFocus"] = String(focused);
    node.style.setProperty("--kp-python-focus-strength", String(focused ? motion.focusStrength : 0));
    node.style.setProperty(
      "--kp-python-focus-shadow-alpha",
      String(focused ? motion.focusStrength * 0.18 : 0)
    );
  });
  shell.querySelector<HTMLElement>("[data-kp-python-narration]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(motion.stage.narration));
  const description = accessibleDescription(motion.stage.narration);
  shell.setAttribute("aria-label", description);
  shell.querySelector<HTMLElement>("[data-kp-python-accessible-state]")
    ?.replaceChildren(shell.ownerDocument.createTextNode(description));
}

function syncTokenTheater(
  shell: HTMLElement,
  theater: ReturnType<typeof sampleKpPythonRefactorTokenTheater>
): void {
  const layer = shell.querySelector<HTMLElement>("[data-kp-python-token-theater]");
  if (layer === null) return;
  layer.dataset["kpPythonTokenTheaterActive"] = String(theater.active);
  layer.style.setProperty("--kp-python-theater-lines", String(theater.maxLineCount));
  if (!theater.active) {
    layer.replaceChildren();
    return;
  }
  const nodes = new Map(
    [...layer.querySelectorAll<HTMLElement>("[data-kp-python-token-id]")]
      .map((node) => [node.dataset["kpPythonTokenId"] ?? "", node] as const)
  );
  const retained = new Set<string>();
  theater.tokens.forEach((token) => {
    let node = nodes.get(token.id);
    if (node === undefined) {
      node = createTokenNode(layer.ownerDocument, token);
      layer.append(node);
    }
    retained.add(token.id);
    syncTokenNode(node, token);
  });
  nodes.forEach((node, id) => {
    if (!retained.has(id)) node.remove();
  });
}

function createTokenNode(document: Document, token: KpPythonTheaterToken): HTMLElement {
  const node = document.createElement("span");
  node.dataset["kpPythonTokenId"] = token.id;
  node.textContent = token.text;
  return node;
}

function syncTokenNode(node: HTMLElement, token: KpPythonTheaterToken): void {
  node.dataset["kpPythonTokenKind"] = token.kind;
  node.dataset["kpPythonTokenRole"] = token.role;
  node.dataset["kpPythonTokenEntityId"] = token.entityId;
  node.style.setProperty("--kp-python-token-x", `${token.xCh}ch`);
  node.style.setProperty("--kp-python-token-y", `${token.yLine * 1.75}em`);
  node.style.setProperty("--kp-python-token-opacity", String(token.opacity));
  node.style.setProperty("--kp-python-token-scale", String(token.scale));
}

function frameMode(player: HTMLElement): "animated" | "reduced-motion" | "static" {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static" || mode === "reduced-motion" ? mode : "animated";
}

function accessibleDescription(narration: string): string {
  return `${exemplar.accessibility.title}. ${narration}`;
}
