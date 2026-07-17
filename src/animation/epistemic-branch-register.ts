import {
  registerKpEpistemicBranchRuntime,
  type KpEpistemicBranchRuntimeFrame
} from "./epistemic-branch-runtime.ts";
import {
  createKpEpistemicBranch,
  sampleKpEpistemicBranch
} from "../semantic/epistemic-branch.ts";
import {
  createKpEpistemicAnnotation,
  kpEpistemicStatuses,
  type KpEpistemicStatus
} from "../semantic/epistemic-status.ts";

registerKpEpistemicBranchRuntime({
  sample: ({ animation, progress }) => {
    const metadata = animation.metadata;
    const branchId = metadata?.["epistemicBranchId"];
    if (typeof branchId !== "string") return undefined;
    const origin = requiredString(metadata, "epistemicBranchOrigin");
    const status = requiredString(metadata, "epistemicStatus");
    if (origin !== "student-prompt" && origin !== "uploaded-material") {
      throw new Error(`Unknown epistemic branch origin ${origin}.`);
    }
    if (!kpEpistemicStatuses.includes(status as KpEpistemicStatus)) {
      throw new Error(`Unknown epistemic status ${status}.`);
    }
    const transitionId = requiredString(metadata, "epistemicTransitionId");
    const annotation = createKpEpistemicAnnotation({
      subject: {
        kind: "state",
        id: requiredString(metadata, "epistemicProposedStateId")
      },
      status: status as KpEpistemicStatus,
      rationale: requiredString(metadata, "epistemicRationale"),
      disclosure: { trigger: { kind: "immediate" }, announce: true }
    });
    const branch = createKpEpistemicBranch({
      id: branchId,
      origin,
      trustedStateId: requiredString(metadata, "epistemicTrustedStateId"),
      proposedStateId: annotation.subject.id,
      transitionId,
      annotation,
      ...(origin === "uploaded-material" ? { historicalReplayRequested: true } : {})
    });
    const frame = sampleKpEpistemicBranch({ branch, progress });
    return {
      branchId,
      transitionId,
      status: branch.status,
      trustedStateOpacity: frame.trustedStateOpacity,
      proposedStateOpacity: frame.proposedStateOpacity,
      targetSettlementProgress: frame.targetSettlementProgress,
      settlesAsValid: frame.settlesAsValid,
      cueStrength: frame.cueStrength,
      ...(branch.cue === undefined ? {} : { cue: branch.cue })
    };
  },
  apply: applyEpistemicBranchFrame
});

function applyEpistemicBranchFrame(input: {
  readonly transitionElement: HTMLElement;
  readonly transitionId: string;
  readonly frame: KpEpistemicBranchRuntimeFrame | undefined;
}): void {
  const cueSelector = "[data-kp-editor-epistemic-branch-cue]";
  if (input.frame === undefined || input.frame.transitionId !== input.transitionId) {
    delete input.transitionElement.dataset["kpEditorEpistemicBranchId"];
    delete input.transitionElement.dataset["kpEditorEpistemicBranchStatus"];
    delete input.transitionElement.dataset["kpEditorEpistemicSettlement"];
    input.transitionElement.querySelector(cueSelector)?.remove();
    return;
  }
  input.transitionElement.dataset["kpEditorEpistemicBranchId"] =
    input.frame.branchId;
  input.transitionElement.dataset["kpEditorEpistemicBranchStatus"] =
    input.frame.status;
  input.transitionElement.dataset["kpEditorEpistemicSettlement"] =
    input.frame.settlesAsValid ? "accepted" : "held-provisional";
  input.transitionElement.style.setProperty(
    "--kp-epistemic-cue-strength",
    String(input.frame.cueStrength)
  );
  input.transitionElement.querySelectorAll<HTMLElement>(
    "[data-kp-editor-equation-source] [data-kp-motion-id]"
  ).forEach((token) => {
    token.style.opacity = String(Math.max(
      inlineOpacity(token, 1),
      input.frame!.trustedStateOpacity
    ));
  });
  input.transitionElement.querySelectorAll<HTMLElement>(
    "[data-kp-editor-equation-target] [data-kp-motion-id]"
  ).forEach((token) => {
    token.style.opacity = String(Math.min(
      inlineOpacity(token, 1),
      input.frame!.proposedStateOpacity
    ));
  });
  if (input.frame.cue === undefined) {
    input.transitionElement.querySelector(cueSelector)?.remove();
    return;
  }
  let cue = input.transitionElement.querySelector<HTMLOutputElement>(cueSelector);
  if (cue === null) {
    cue = document.createElement("output");
    cue.className = "editor-equation-stage__epistemic-branch-cue";
    cue.dataset["kpEditorEpistemicBranchCue"] = input.frame.cue.tone;
    cue.setAttribute("role", "status");
    cue.setAttribute("aria-live", "polite");
    input.transitionElement.append(cue);
  }
  cue.dataset["kpEditorEpistemicBranchCue"] = input.frame.cue.tone;
  const message = `${input.frame.cue.label}: ${input.frame.cue.explanation}`;
  if (cue.textContent !== message) cue.replaceChildren(document.createTextNode(message));
}

function inlineOpacity(element: HTMLElement, fallback: number): number {
  const value = Number.parseFloat(element.style.opacity);
  return Number.isFinite(value) ? value : fallback;
}

function requiredString(
  metadata: Readonly<Record<string, string | number | boolean>> | undefined,
  key: string
): string {
  const value = metadata?.[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Epistemic branch metadata requires ${key}.`);
  }
  return value;
}
