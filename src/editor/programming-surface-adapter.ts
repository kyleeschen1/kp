import {
  createKpProgrammingAdditionStaticFrame,
  sampleKpProgrammingAdditionRuntimeFrame,
  type KpProgrammingAdditionFrameMode,
  type KpProgrammingAdditionRuntimeFrame
} from "../animation/programming-addition-runtime-frame.ts";
import {
  kpProgrammingAdditionExemplarContract
} from "../animation/programming-addition-exemplar-contract.ts";
import {
  renderKpProgrammingAdditionTraceHtml
} from "../rendering/programming-addition-trace-html.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT,
  getKpEditorAnimationPlaybackSession
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlaybackSession
} from "./animation-playback-session.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpProgrammingSurfaceSession {
  shell: HTMLElement;
  stepId: string;
}

const sessions = new WeakMap<HTMLElement, KpProgrammingSurfaceSession>();

export const kpEditorProgrammingSurfaceAdapter:
  KpEditorAnimationSurfaceAdapter = {
    id: kpProgrammingAdditionExemplarContract.host.adapterId,
    slotKind: "programming",
    priority: 100,
    supports(state) {
      return state.surface.slotKinds.includes("programming") &&
        kpProgrammingAdditionExemplarContract.host.coveredAnimationIds.some(
          (animationId) => animationId === state.animationId
        );
    },
    render({ player, slot, state }) {
      const playback = getKpEditorAnimationPlaybackSession(player);
      if (playback === undefined) return;
      const frame = projectProgrammingFrame({ player, playback, state });
      let session = sessions.get(player);

      // Semantic state changes only at four verified thresholds. Retaining the
      // shell between them avoids rebuilding source DOM on every clock tick.
      if (session === undefined || session.stepId !== frame.stepId) {
        slot.innerHTML = renderKpProgrammingAdditionTraceHtml(frame);
        const shell = slot.querySelector<HTMLElement>(
          "[data-kp-editor-programming-trace]"
        );
        if (shell === null) return;
        session = { shell, stepId: frame.stepId };
        sessions.set(player, session);
        if (player.dataset["kpEditorProgrammingDisposeBound"] !== "true") {
          player.dataset["kpEditorProgrammingDisposeBound"] = "true";
          player.addEventListener(
            KP_EDITOR_ANIMATION_DISPOSE_EVENT,
            () => sessions.delete(player),
            { once: true }
          );
        }
      }

      syncProgrammingShell(session.shell, frame);
      slot.dataset["kpEditorProgrammingContract"] =
        kpProgrammingAdditionExemplarContract.schemaVersion;
    }
  };

export function registerKpEditorProgrammingSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorProgrammingSurfaceAdapter
  );
}

function projectProgrammingFrame(input: {
  readonly player: HTMLElement;
  readonly playback: KpEditorAnimationPlaybackSession;
  readonly state: KpEditorAnimationPlayerState;
}): KpProgrammingAdditionRuntimeFrame {
  const animation = input.playback.catalog.find(
    ({ id }) => id === kpProgrammingAdditionExemplarContract.animationId
  ) ?? (input.playback.animation.id ===
      kpProgrammingAdditionExemplarContract.animationId
    ? input.playback.animation
    : undefined);
  if (animation === undefined) {
    throw new Error("The programming host could not resolve the addition asset.");
  }
  const mode = frameMode(input.player);
  if (mode === "static") {
    return createKpProgrammingAdditionStaticFrame(animation);
  }
  const runtimeFrame = input.state.animationId === animation.id
    ? input.state.runtimeFrame
    : input.state.runtimeFrame.childFrames.find(
        ({ animationId }) => animationId === animation.id
      )?.frame;
  if (runtimeFrame === undefined) {
    throw new Error(
      `Animation ${input.state.animationId} lacks the contracted addition child frame.`
    );
  }
  return sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame,
    playbackStatus: input.state.playbackStatus,
    mode
  });
}

function frameMode(player: HTMLElement): KpProgrammingAdditionFrameMode {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static" || mode === "reduced-motion"
    ? mode
    : "animated";
}

function syncProgrammingShell(
  shell: HTMLElement,
  frame: KpProgrammingAdditionRuntimeFrame
): void {
  shell.dataset["kpEditorProgrammingSemanticProgress"] =
    String(frame.semanticProgress);
  shell.dataset["kpEditorProgrammingStepProgress"] = String(frame.stepProgress);
  shell.dataset["kpEditorProgrammingMode"] = frame.control.mode;
  shell.style.setProperty(
    "--kp-programming-emphasis-opacity",
    String(0.3 + 0.52 * frame.emphasisProgress)
  );
  shell.setAttribute("aria-label", frame.accessibleDescription);
  shell.querySelector<HTMLElement>(
    "[data-kp-editor-programming-accessible-state]"
  )?.replaceChildren(
    shell.ownerDocument.createTextNode(frame.accessibleDescription)
  );
}
