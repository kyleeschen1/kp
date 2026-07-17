import {
  KP_EDITOR_ANIMATION_FRAME_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import {
  decideKpEditorAnimationDiagnosticsCadence,
  type KpEditorAnimationDiagnosticsCadenceState
} from "./animation-diagnostics-cadence.ts";

const cadenceStates = new WeakMap<
  HTMLElement,
  KpEditorAnimationDiagnosticsCadenceState
>();

export interface KpEditorAnimationLiveDiagnostics {
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly playbackStatus: KpEditorAnimationPlayerState["playbackStatus"];
  readonly direction: KpEditorAnimationPlayerState["direction"];
  readonly progress: number;
  readonly activeTransformationCount: number;
  readonly activeRenderTargetCount: number;
  readonly activeSelectorCount: number;
  readonly runtimeDiagnosticCount: number;
}

export function createKpEditorAnimationLiveDiagnostics(
  state: KpEditorAnimationPlayerState
): KpEditorAnimationLiveDiagnostics {
  const runtimeFrame = state.runtimeFrame;
  return {
    runtimeFrameId: runtimeFrame.id,
    phaseId: runtimeFrame.phase.phaseId,
    playbackStatus: state.playbackStatus,
    direction: state.direction,
    progress: state.progress,
    activeTransformationCount: runtimeFrame.activeTransformationIds.length,
    activeRenderTargetCount: runtimeFrame.activeRenderTargets.length,
    activeSelectorCount: runtimeFrame.selectorFrames.length,
    runtimeDiagnosticCount:
      runtimeFrame.phaseDiagnostics.length +
      runtimeFrame.selectorDiagnostics.length +
      runtimeFrame.childDiagnostics.length +
      runtimeFrame.diagnostics.length
  };
}

export function hydrateKpEditorAnimationLiveDiagnostics(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      if (player.dataset["kpEditorAnimationDiagnosticsHydrated"] === "true") return;

      player.dataset["kpEditorAnimationDiagnosticsHydrated"] = "true";
      player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, (event) => {
        if (!(event instanceof CustomEvent)) return;
        const decision = decideKpEditorAnimationDiagnosticsCadence({
          state: event.detail,
          nowMs: performance.now(),
          revisionKey: diagnosticsRevisionKey(player),
          previous: cadenceStates.get(player)
        });
        if (!decision.publish || decision.state === undefined) return;
        cadenceStates.set(player, decision.state);
        player.dataset["kpEditorAnimationDiagnosticsPublishCount"] =
          String(decision.state.publishCount);
        player.dataset["kpEditorAnimationDiagnosticsPublishReason"] =
          decision.reason;
        syncLiveDiagnostics(player, createKpEditorAnimationLiveDiagnostics(event.detail));
      });
    });
}

function diagnosticsRevisionKey(player: HTMLElement): string {
  return [
    player.dataset["kpEditorAnimationDiagnosticsRevision"] ?? "0",
    player.dataset["kpEditorAnimationAccessibilityMode"] ?? "unknown",
    player.dataset["kpEditorAnimationGestaltSelectedStyle"] ?? "unknown",
    player.dataset["kpEditorAnimationFocusExperiment"] ?? "unknown"
  ].join(":");
}

function syncLiveDiagnostics(
  player: HTMLElement,
  diagnostics: KpEditorAnimationLiveDiagnostics
): void {
  const panel = player.closest("[data-kp-editor-animation-library]")
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics]");
  if (panel === null || panel === undefined) return;

  panel.dataset["kpEditorAnimationRuntimeFrameId"] = diagnostics.runtimeFrameId;
  panel.dataset["kpEditorAnimationRuntimePhaseId"] = diagnostics.phaseId;
  panel.dataset["kpEditorAnimationPlaybackStatus"] = diagnostics.playbackStatus;
  panel.dataset["kpEditorAnimationDirection"] = diagnostics.direction;
  panel.dataset["kpEditorAnimationProgress"] = String(diagnostics.progress);

  replaceText(panel, "[data-kp-editor-animation-diagnostics-phase]", diagnostics.phaseId);
  replaceText(
    panel,
    "[data-kp-editor-animation-diagnostics-progress]",
    `${Math.round(diagnostics.progress * 100)}%`
  );
  replaceText(panel, "[data-kp-editor-animation-diagnostics-direction]", diagnostics.direction);
  replaceText(
    panel,
    "[data-kp-editor-animation-diagnostics-active-transformations]",
    String(diagnostics.activeTransformationCount)
  );
  replaceText(
    panel,
    "[data-kp-editor-animation-diagnostics-active-targets]",
    String(diagnostics.activeRenderTargetCount)
  );
  replaceText(
    panel,
    "[data-kp-editor-animation-diagnostics-active-selectors]",
    String(diagnostics.activeSelectorCount)
  );
}

function replaceText(root: ParentNode, selector: string, value: string): void {
  root.querySelector<HTMLElement>(selector)
    ?.replaceChildren(document.createTextNode(value));
}
