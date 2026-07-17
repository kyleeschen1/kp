import {
  createKpEpistemicAnnotation,
  type KpEpistemicAnnotation
} from "./epistemic-status.ts";

export type KpEpistemicBranchStatus =
  | "provisional"
  | "committed"
  | "marked-invalid"
  | "retracted"
  | "historical-invalid";

export interface KpEpistemicBranch {
  readonly kind: "epistemic-branch";
  readonly id: string;
  readonly origin: "student-prompt" | "uploaded-material";
  readonly mode: "provisional-validation" | "historical-replay";
  readonly trustedStateId: string;
  readonly proposedStateId: string;
  readonly transitionId: string;
  readonly status: KpEpistemicBranchStatus;
  readonly annotation: KpEpistemicAnnotation;
  readonly validationEvidenceIds: readonly string[];
  readonly cue?: {
    readonly tone: "provisional" | "invalid" | "retracted";
    readonly label: string;
    readonly explanation: string;
  } | undefined;
}

export interface KpEpistemicBranchFrame {
  readonly kind: "epistemic-branch-frame";
  readonly branchId: string;
  readonly status: KpEpistemicBranchStatus;
  readonly progress: number;
  readonly trustedStateOpacity: number;
  readonly proposedStateOpacity: number;
  readonly targetSettlementProgress: number;
  readonly settlesAsValid: boolean;
  readonly cueVisible: boolean;
  readonly cueStrength: number;
}

export function createKpEpistemicBranch(input: {
  readonly id: string;
  readonly origin: KpEpistemicBranch["origin"];
  readonly trustedStateId: string;
  readonly proposedStateId: string;
  readonly transitionId: string;
  readonly annotation: KpEpistemicAnnotation;
  readonly historicalReplayRequested?: boolean | undefined;
}): KpEpistemicBranch {
  requireId(input.id, "Branch id");
  requireId(input.trustedStateId, "Trusted state id");
  requireId(input.proposedStateId, "Proposed state id");
  requireId(input.transitionId, "Transition id");
  if (input.trustedStateId === input.proposedStateId) {
    throw new Error("An epistemic branch must leave the last trusted state.");
  }
  if (input.annotation.subject.kind !== "state" ||
      input.annotation.subject.id !== input.proposedStateId) {
    throw new Error("Epistemic branch annotation must describe the proposed state.");
  }
  if (input.origin === "uploaded-material") {
    if (input.historicalReplayRequested !== true) {
      throw new Error("Uploaded incorrect material requires explicit historical replay.");
    }
    if (!incorrect(input.annotation)) {
      throw new Error("Historical replay requires an explicitly incorrect epistemic status.");
    }
    return {
      kind: "epistemic-branch",
      id: input.id,
      origin: input.origin,
      mode: "historical-replay",
      trustedStateId: input.trustedStateId,
      proposedStateId: input.proposedStateId,
      transitionId: input.transitionId,
      status: "historical-invalid",
      annotation: input.annotation,
      validationEvidenceIds: [],
      cue: {
        tone: "invalid",
        label: "Historical incorrect step",
        explanation: input.annotation.rationale
      }
    };
  }
  return {
    kind: "epistemic-branch",
    id: input.id,
    origin: input.origin,
    mode: "provisional-validation",
    trustedStateId: input.trustedStateId,
    proposedStateId: input.proposedStateId,
    transitionId: input.transitionId,
    status: "provisional",
    annotation: input.annotation,
    validationEvidenceIds: [],
    cue: {
      tone: "provisional",
      label: "Provisional step",
      explanation: "Awaiting semantic validation from the last trusted state."
    }
  };
}

export function resolveKpEpistemicBranch(input: {
  readonly branch: KpEpistemicBranch;
  readonly resolution:
    | {
        readonly kind: "accept";
        readonly annotation: KpEpistemicAnnotation;
        readonly evidenceIds: readonly string[];
      }
    | {
        readonly kind: "reject";
        readonly rationale: string;
        readonly evidenceIds: readonly string[];
      }
    | { readonly kind: "retract"; readonly rationale: string };
}): KpEpistemicBranch {
  if (input.branch.mode !== "provisional-validation" ||
      input.branch.status !== "provisional") {
    throw new Error("Only a provisional validation branch can be resolved.");
  }
  if (input.resolution.kind === "accept") {
    if (input.resolution.annotation.status !== "valid" ||
        input.resolution.annotation.subject.id !== input.branch.proposedStateId ||
        input.resolution.evidenceIds.length === 0) {
      throw new Error("Committing a branch requires valid target evidence.");
    }
    return {
      ...input.branch,
      status: "committed",
      annotation: input.resolution.annotation,
      validationEvidenceIds: [...input.resolution.evidenceIds],
      cue: undefined
    };
  }
  requireId(input.resolution.rationale, "Branch resolution rationale");
  if (input.resolution.kind === "retract") {
    return {
      ...input.branch,
      status: "retracted",
      cue: {
        tone: "retracted",
        label: "Step retracted",
        explanation: input.resolution.rationale
      }
    };
  }
  if (input.resolution.evidenceIds.length === 0) {
    throw new Error("Rejecting a branch requires validation evidence.");
  }
  return {
    ...input.branch,
    status: "marked-invalid",
    annotation: createKpEpistemicAnnotation({
      subject: { kind: "state", id: input.branch.proposedStateId },
      status: "invalid",
      rationale: input.resolution.rationale,
      evidenceIds: input.resolution.evidenceIds,
      disclosure: { trigger: { kind: "immediate" }, announce: true }
    }),
    validationEvidenceIds: [...input.resolution.evidenceIds],
    cue: {
      tone: "invalid",
      label: "Step not valid",
      explanation: input.resolution.rationale
    }
  };
}

export function sampleKpEpistemicBranch(input: {
  readonly branch: KpEpistemicBranch;
  readonly progress: number;
}): KpEpistemicBranchFrame {
  const progress = smooth(clamp(input.progress));
  const status = input.branch.status;
  if (status === "committed") {
    return frame(input.branch, progress, 1 - progress, progress, progress, true, 0);
  }
  if (status === "retracted") {
    return frame(input.branch, progress, 1, 1 - progress, 0, false, progress);
  }
  const historical = status === "historical-invalid";
  const invalid = status === "marked-invalid" || historical;
  const targetCap = invalid ? 0.76 : 0.86;
  const trustedFloor = invalid ? 0.28 : 0.2;
  return frame(
    input.branch,
    progress,
    1 - (1 - trustedFloor) * progress,
    targetCap * progress,
    targetCap * progress,
    false,
    invalid ? Math.max(0.35, progress) : Math.max(0.18, progress * 0.72)
  );
}

function frame(
  branch: KpEpistemicBranch,
  progress: number,
  trustedStateOpacity: number,
  proposedStateOpacity: number,
  targetSettlementProgress: number,
  settlesAsValid: boolean,
  cueStrength: number
): KpEpistemicBranchFrame {
  return {
    kind: "epistemic-branch-frame",
    branchId: branch.id,
    status: branch.status,
    progress,
    trustedStateOpacity: round(trustedStateOpacity),
    proposedStateOpacity: round(proposedStateOpacity),
    targetSettlementProgress: round(targetSettlementProgress),
    settlesAsValid,
    cueVisible: branch.cue !== undefined,
    cueStrength: round(cueStrength)
  };
}

function incorrect(annotation: KpEpistemicAnnotation): boolean {
  return annotation.status === "invalid" ||
    annotation.status === "misconception" ||
    annotation.status === "counterexample";
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Branch progress must be finite.");
  return Math.max(0, Math.min(1, value));
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function requireId(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
