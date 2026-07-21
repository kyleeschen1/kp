export type KpTheseusLoopMode = "iteration" | "long";
export type KpTheseusLoopRisk = "low" | "medium" | "high";
export type KpVisualReviewScope = "none" | "exemplar" | "generalization";

export interface KpTheseusLoopSignals {
  readonly estimatedSlices: number;
  readonly estimatedMinutes: number;
  readonly subsystems: readonly string[];
  readonly risk: KpTheseusLoopRisk;
  readonly migration: boolean;
  readonly visualScope: KpVisualReviewScope;
  readonly override?: KpTheseusLoopMode;
  readonly approvedMode?: KpTheseusLoopMode;
}

export interface KpTheseusLoopEnvelope {
  readonly maxSlices: number;
  readonly maxMinutes: number;
  readonly maxSubsystems: number;
  readonly maxRisk: KpTheseusLoopRisk;
  readonly allowsMigration: boolean;
  readonly allowsVisualGeneralization: boolean;
}

export interface KpTheseusLoopSelection {
  readonly recommendedMode: KpTheseusLoopMode;
  readonly selectedMode: KpTheseusLoopMode;
  readonly overrideApplied: boolean;
  readonly approvalRequired: boolean;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly envelope: KpTheseusLoopEnvelope;
}

export interface KpTheseusLoopEnvelopeEvaluation {
  readonly status: "within-envelope" | "approval-required";
  readonly selectedMode: KpTheseusLoopMode;
  readonly proposedMode?: KpTheseusLoopMode;
  readonly reasons: readonly string[];
}

const iterationEnvelope: KpTheseusLoopEnvelope = {
  maxSlices: 3,
  maxMinutes: 45,
  maxSubsystems: 1,
  maxRisk: "medium",
  allowsMigration: false,
  allowsVisualGeneralization: false
};

const longEnvelope: KpTheseusLoopEnvelope = {
  maxSlices: 30,
  maxMinutes: 8 * 60,
  maxSubsystems: 6,
  maxRisk: "high",
  allowsMigration: true,
  allowsVisualGeneralization: true
};

/**
 * The recommendation is policy, not authority. A selected mode still requires
 * matching user approval, and a narrow override narrows executable scope too.
 */
export function selectKpTheseusLoopMode(
  signals: KpTheseusLoopSignals
): KpTheseusLoopSelection {
  validateSignals(signals);
  const reasons = recommendationReasons(signals);
  const recommendedMode: KpTheseusLoopMode = reasons.length === 0 ? "iteration" : "long";
  const selectedMode = signals.override ?? recommendedMode;
  const overrideApplied = signals.override !== undefined && signals.override !== recommendedMode;
  const warnings: string[] = [];
  if (overrideApplied && selectedMode === "iteration") {
    warnings.push(
      "Iteration override is honored only inside the iteration envelope; excluded scope requires renewed long-mode approval."
    );
  }
  if (overrideApplied && selectedMode === "long") {
    warnings.push("Long override intentionally chooses the broader verification and commit cadence.");
  }
  return {
    recommendedMode,
    selectedMode,
    overrideApplied,
    approvalRequired: signals.approvedMode !== selectedMode,
    reasons: reasons.length === 0
      ? ["The work fits one subsystem, at most three slices, 45 minutes, medium risk, and no migration or visual generalization."]
      : reasons,
    warnings,
    envelope: selectedMode === "iteration" ? iterationEnvelope : longEnvelope
  };
}

export function evaluateKpTheseusLoopEnvelope(
  selection: KpTheseusLoopSelection,
  observed: Omit<KpTheseusLoopSignals, "override" | "approvedMode">
): KpTheseusLoopEnvelopeEvaluation {
  validateSignals(observed);
  const violations = envelopeViolations(selection.envelope, observed);
  if (violations.length === 0) {
    return {
      status: "within-envelope",
      selectedMode: selection.selectedMode,
      reasons: ["Observed work remains inside the approved loop envelope."]
    };
  }
  return {
    status: "approval-required",
    selectedMode: selection.selectedMode,
    ...(selection.selectedMode === "iteration" ? { proposedMode: "long" as const } : {}),
    reasons: violations
  };
}

function recommendationReasons(signals: KpTheseusLoopSignals): string[] {
  const reasons: string[] = [];
  if (signals.estimatedSlices > iterationEnvelope.maxSlices) {
    reasons.push(`${signals.estimatedSlices} estimated slices exceed the three-slice iteration envelope.`);
  }
  if (signals.estimatedMinutes > iterationEnvelope.maxMinutes) {
    reasons.push(`${signals.estimatedMinutes} estimated minutes exceed the 45-minute iteration envelope.`);
  }
  if (uniqueSubsystems(signals).length > iterationEnvelope.maxSubsystems) {
    reasons.push("The work crosses more than one subsystem boundary.");
  }
  if (riskRank(signals.risk) > riskRank(iterationEnvelope.maxRisk)) {
    reasons.push("High-risk work requires long-mode verification and stop conditions.");
  }
  if (signals.migration) reasons.push("Migration work requires replay, compatibility, and rollback evidence.");
  if (signals.visualScope === "generalization") {
    reasons.push("Visual generalization must follow an approved exemplar checkpoint.");
  }
  return reasons;
}

function envelopeViolations(
  envelope: KpTheseusLoopEnvelope,
  signals: Omit<KpTheseusLoopSignals, "override" | "approvedMode">
): string[] {
  const violations: string[] = [];
  if (signals.estimatedSlices > envelope.maxSlices) violations.push("Observed slice count exceeds the approved maximum.");
  if (signals.estimatedMinutes > envelope.maxMinutes) violations.push("Observed duration exceeds the approved maximum.");
  if (uniqueSubsystems(signals).length > envelope.maxSubsystems) violations.push("Observed subsystem breadth exceeds the approved maximum.");
  if (riskRank(signals.risk) > riskRank(envelope.maxRisk)) violations.push("Observed risk exceeds the approved maximum.");
  if (signals.migration && !envelope.allowsMigration) violations.push("Migration work entered an envelope that excludes migrations.");
  if (signals.visualScope === "generalization" && !envelope.allowsVisualGeneralization) {
    violations.push("Visual generalization entered an exemplar-only envelope.");
  }
  return violations;
}

function validateSignals(signals: Omit<KpTheseusLoopSignals, "override" | "approvedMode">): void {
  if (!Number.isInteger(signals.estimatedSlices) || signals.estimatedSlices < 1) {
    throw new RangeError("estimatedSlices must be a positive integer");
  }
  if (!Number.isFinite(signals.estimatedMinutes) || signals.estimatedMinutes <= 0) {
    throw new RangeError("estimatedMinutes must be positive");
  }
  if (uniqueSubsystems(signals).length === 0) {
    throw new RangeError("At least one subsystem is required");
  }
}

function uniqueSubsystems(signals: Pick<KpTheseusLoopSignals, "subsystems">): readonly string[] {
  return [...new Set(signals.subsystems.map((subsystem) => subsystem.trim()).filter(Boolean))];
}

function riskRank(risk: KpTheseusLoopRisk): number {
  return { low: 0, medium: 1, high: 2 }[risk];
}

