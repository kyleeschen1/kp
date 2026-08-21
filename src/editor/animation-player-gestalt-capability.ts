import type { KpChoreographyEnvelopePhaseId } from
  "../animation/choreography-plan.ts";
import {
  createKpElevatedFocusComparison,
  type KpFocusExperimentMode
} from "../animation/elevated-focus-experiment.ts";
import type { KpGestaltStyleRef } from "../animation/gestalt-style.ts";
import {
  decideKpEditorAnimationDiagnosticsCadence,
  type KpEditorAnimationDiagnosticsCadenceState
} from "./animation-diagnostics-cadence.ts";
import {
  createKpEditorAnimationGestaltInspection,
  parseKpEditorGestaltStyleRef
} from "./animation-gestalt-inspector.ts";
import type {
  KpEditorAnimationPlaybackSession
} from "./animation-playback-session.ts";
import { kpGestaltStyleKey } from "../animation/gestalt-base-styles.ts";

export type KpEditorAnimationGestaltTuningKind =
  | "gestalt-style"
  | "focus-experiment";

const gestaltStyles = new WeakMap<HTMLElement, KpGestaltStyleRef>();
const focusExperimentModes = new WeakMap<HTMLElement, KpFocusExperimentMode>();
const inspectionCadenceStates = new WeakMap<
  HTMLElement,
  KpEditorAnimationDiagnosticsCadenceState
>();

export function initializeKpEditorAnimationGestaltCapability(
  player: HTMLElement
): void {
  gestaltStyles.set(
    player,
    parseKpEditorGestaltStyleRef(
      player.dataset["kpEditorAnimationGestaltSelectedStyle"]
    )
  );
  focusExperimentModes.set(player, "flat");
  player.dataset["kpEditorAnimationDiagnosticsRevision"] = "0";
}

export function disposeKpEditorAnimationGestaltCapability(
  player: HTMLElement
): void {
  gestaltStyles.delete(player);
  focusExperimentModes.delete(player);
  inspectionCadenceStates.delete(player);
}

export function applyKpEditorAnimationGestaltTuning(input: {
  readonly player: HTMLElement;
  readonly kind: KpEditorAnimationGestaltTuningKind;
  readonly value: string;
}): boolean {
  if (input.kind === "gestalt-style") {
    const current = gestaltStyles.get(input.player);
    const next = parseKpEditorGestaltStyleRef(input.value);
    if (current !== undefined &&
      kpGestaltStyleKey(current) === kpGestaltStyleKey(next)) return false;
    gestaltStyles.set(input.player, next);
  } else {
    const mode: KpFocusExperimentMode =
      input.value === "elevated" || input.value === "no-depth"
        ? input.value
        : "flat";
    if (focusExperimentModes.get(input.player) === mode) return false;
    focusExperimentModes.set(input.player, mode);
    input.player.dataset["kpEditorAnimationFocusExperiment"] = mode;
  }
  invalidateKpEditorAnimationGestaltDiagnostics(input.player);
  return true;
}

export function invalidateKpEditorAnimationGestaltDiagnostics(
  player: HTMLElement
): void {
  const revision = Number(
    player.dataset["kpEditorAnimationDiagnosticsRevision"] ?? 0
  );
  player.dataset["kpEditorAnimationDiagnosticsRevision"] = String(
    Number.isFinite(revision) ? revision + 1 : 1
  );
}

export function syncKpEditorAnimationGestaltAtCadence(
  player: HTMLElement,
  session: KpEditorAnimationPlaybackSession
): void {
  const decision = decideKpEditorAnimationDiagnosticsCadence({
    state: session.player,
    nowMs: performance.now(),
    revisionKey: player.dataset["kpEditorAnimationDiagnosticsRevision"],
    previous: inspectionCadenceStates.get(player)
  });
  if (!decision.publish || decision.state === undefined) return;

  inspectionCadenceStates.set(player, decision.state);
  player.dataset["kpEditorAnimationInspectionPublishCount"] =
    String(decision.state.publishCount);
  player.dataset["kpEditorAnimationInspectionPublishReason"] = decision.reason;
  syncGestaltInspection(player, session);
}

function syncGestaltInspection(
  player: HTMLElement,
  session: KpEditorAnimationPlaybackSession
): void {
  const selectedStyle = gestaltStyles.get(player) ??
    parseKpEditorGestaltStyleRef(undefined);
  const inspection = createKpEditorAnimationGestaltInspection({
    animation: session.animation,
    state: session.player,
    selectedStyle
  });
  player.dataset["kpEditorAnimationGestaltPinnedStyle"] =
    inspection.pinnedStyleKey;
  player.dataset["kpEditorAnimationGestaltSelectedStyle"] =
    inspection.selectedStyleKey;
  player.dataset["kpEditorAnimationGestaltStatus"] = inspection.status;
  player.dataset["kpEditorAnimationGestaltFingerprint"] =
    inspection.resolvedStyle.fingerprint;
  player.dataset["kpEditorAnimationGestaltEnvelopePhase"] =
    inspection.envelopePhaseLabel;
  player.dataset["kpEditorAnimationDesignIssueCodes"] =
    inspection.designDiagnosis?.issues.map((issue) => issue.code).join(" ") ??
    "";
  if (inspection.choreographyPlanId === undefined) {
    delete player.dataset["kpEditorAnimationChoreographyPlanId"];
  } else {
    player.dataset["kpEditorAnimationChoreographyPlanId"] =
      inspection.choreographyPlanId;
  }
  const styleControl = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-gestalt-style-control]"
  );
  if (styleControl !== null) styleControl.value = inspection.selectedStyleKey;
  player.style.setProperty(
    "--kp-editor-gestalt-micro-motion",
    String(inspection.channels.microMotion?.amplitude ?? 0)
  );
  player.style.setProperty(
    "--kp-editor-gestalt-focus-strength",
    String(inspection.channels.focus?.strength ?? 0)
  );
  player.style.setProperty(
    "--kp-editor-gestalt-context-dimming",
    String(inspection.channels.context?.dimming ?? 0)
  );
  replaceText(player, "[data-kp-editor-gestalt-status]", inspection.status);
  replaceText(
    player,
    "[data-kp-editor-gestalt-pinned-style]",
    inspection.pinnedStyleKey
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-selected-style]",
    inspection.selectedStyleKey
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-resolved-chain]",
    inspection.resolvedChainLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-envelope-phase]",
    inspection.envelopePhaseLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-focus-group]",
    inspection.focusGroupLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-salience]",
    inspection.salienceLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-traversal]",
    inspection.traversalLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-capabilities]",
    inspection.capabilityLabel
  );
  replaceText(
    player,
    "[data-kp-editor-design-strategy]",
    inspection.designStrategyLabel
  );
  replaceText(
    player,
    "[data-kp-editor-design-issues]",
    inspection.designIssueLabel
  );
  const warnings = player.querySelector<HTMLElement>(
    "[data-kp-editor-gestalt-warnings]"
  );
  warnings?.replaceChildren(
    ...inspection.warnings.map((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      return item;
    })
  );
  syncFocusExperiment(player, inspection);
}

function syncFocusExperiment(
  player: HTMLElement,
  inspection: ReturnType<typeof createKpEditorAnimationGestaltInspection>
): void {
  const mode = focusExperimentModes.get(player) ?? "flat";
  const [phaseText, progressText] = inspection.envelopePhaseLabel.split(" · ");
  const phaseId = isEnvelopePhase(phaseText) ? phaseText : "orient";
  const phaseProgress = Math.min(
    1,
    Math.max(0, Number.parseFloat(progressText ?? "0") / 100)
  );
  const comparison = createKpElevatedFocusComparison({
    id: `focus-experiment.${inspection.choreographyPlanId ?? "unmigrated"}`,
    groupId: inspection.focusGroupLabel,
    semanticEntityIds: [inspection.focusGroupLabel],
    strength: inspection.channels.focus?.strength ?? 0.55,
    contextDimming: inspection.channels.context?.dimming ?? 0.08,
    phaseId,
    phaseProgress
  });
  player.dataset["kpEditorAnimationFocusExperiment"] = mode;
  player.dataset["kpEditorAnimationFocusXyInvariant"] =
    String(comparison.invariance.passed);
  const control = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-focus-experiment-control]"
  );
  if (control !== null) control.value = mode;
  replaceText(player, "[data-kp-editor-focus-experiment]", mode);
  replaceText(
    player,
    "[data-kp-editor-focus-invariance]",
    comparison.invariance.passed ? "pass · same x/y path" : "fail"
  );
}

function isEnvelopePhase(
  value: string | undefined
): value is KpChoreographyEnvelopePhaseId {
  return value === "orient" || value === "reflow" || value === "act" ||
    value === "settle" || value === "release";
}

function replaceText(
  root: ParentNode,
  selector: string,
  value: string
): void {
  root.querySelector<HTMLElement>(selector)
    ?.replaceChildren(document.createTextNode(value));
}
