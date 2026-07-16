import type { KpChoreographyEnvelopePhaseId } from "./choreography-plan.ts";

export type KpFocusProfileKind = "flat" | "elevated";
export type KpFocusAccessibilityMode =
  | "full"
  | "reduced"
  | "high-contrast"
  | "no-depth";

export interface KpFocusProfileIntent {
  readonly id: string;
  readonly groupId: string;
  readonly semanticEntityIds: readonly string[];
  readonly fragmentIds: readonly string[];
  readonly profile: KpFocusProfileKind;
  readonly strength: number;
  readonly contextDimming: number;
  readonly accessibilityMode: KpFocusAccessibilityMode;
}

export interface KpFocusProfilePlan {
  readonly id: string;
  readonly kind: "kp-focus-profile-plan";
  readonly groupId: string;
  readonly semanticEntityIds: readonly string[];
  readonly foregroundPlane: "baseline" | "attention-foreground";
  readonly groupTreatment: {
    readonly profile: KpFocusProfileKind;
    readonly elevationPx: number;
    readonly scale: number;
    readonly outlineStrength: number;
  };
  readonly sharedShadow: {
    readonly id: string;
    readonly fragmentIds: readonly string[];
    readonly offsetYPx: number;
    readonly blurPx: number;
    readonly opacity: number;
  };
  readonly contextProfile: {
    readonly id: string;
    readonly dimming: number;
  };
  readonly layoutParticipation: false;
}

export interface KpFocusProfileFrame {
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly attentionProgress: number;
  readonly translateX: 0;
  readonly translateY: 0;
  readonly translateZ: number;
  readonly scale: number;
  readonly outlineStrength: number;
  readonly shadowOpacity: number;
  readonly contextDimming: number;
  readonly layoutParticipation: false;
}

export interface KpFocusCssBinding {
  readonly className: "kp-focus-group";
  readonly attributes: Readonly<Record<string, string>>;
  readonly variables: Readonly<Record<string, string>>;
}

export function compileKpFocusProfile(
  intent: KpFocusProfileIntent
): KpFocusProfilePlan {
  requireIds(intent.semanticEntityIds, "semanticEntityIds");
  unit(intent.strength, "strength");
  unit(intent.contextDimming, "contextDimming");
  const depthDisabled =
    intent.profile === "flat" ||
    intent.accessibilityMode === "reduced" ||
    intent.accessibilityMode === "no-depth" ||
    intent.accessibilityMode === "high-contrast";
  const elevated = depthDisabled ? 0 : round(8 + intent.strength * 6);
  const scale = depthDisabled ? 1 : round(1.01 + intent.strength * 0.015);
  const shadowOpacity = depthDisabled ? 0 : round(0.08 + intent.strength * 0.1);
  return {
    id: intent.id,
    kind: "kp-focus-profile-plan",
    groupId: intent.groupId,
    semanticEntityIds: [...intent.semanticEntityIds],
    foregroundPlane: depthDisabled ? "baseline" : "attention-foreground",
    groupTreatment: {
      profile: depthDisabled ? "flat" : "elevated",
      elevationPx: elevated,
      scale,
      outlineStrength:
        intent.accessibilityMode === "high-contrast"
          ? 1
          : round(0.3 + intent.strength * 0.5)
    },
    sharedShadow: {
      id: `${intent.id}.shared-shadow`,
      fragmentIds: [...intent.fragmentIds],
      offsetYPx: depthDisabled ? 0 : round(3 + intent.strength * 3),
      blurPx: depthDisabled ? 0 : round(12 + intent.strength * 12),
      opacity: shadowOpacity
    },
    contextProfile: {
      id: `${intent.id}.context`,
      dimming: round(intent.contextDimming)
    },
    layoutParticipation: false
  };
}

export function sampleKpFocusProfile(input: {
  readonly plan: KpFocusProfilePlan;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly phaseProgress: number;
}): KpFocusProfileFrame {
  const progress = unit(input.phaseProgress, "phaseProgress");
  const attentionProgress = (() => {
    switch (input.phaseId) {
      case "orient": return smooth(progress);
      case "reflow":
      case "act":
      case "settle": return 1;
      case "release": return 1 - smooth(progress);
    }
  })();
  return {
    phaseId: input.phaseId,
    attentionProgress: round(attentionProgress),
    translateX: 0,
    translateY: 0,
    translateZ: round(
      input.plan.groupTreatment.elevationPx * attentionProgress
    ),
    scale: round(
      1 + (input.plan.groupTreatment.scale - 1) * attentionProgress
    ),
    outlineStrength: round(
      input.plan.groupTreatment.outlineStrength * attentionProgress
    ),
    shadowOpacity: round(
      input.plan.sharedShadow.opacity * attentionProgress
    ),
    contextDimming: round(
      input.plan.contextProfile.dimming * attentionProgress
    ),
    layoutParticipation: false
  };
}

export function bindKpFocusFrameToCss(
  plan: KpFocusProfilePlan,
  frame: KpFocusProfileFrame
): KpFocusCssBinding {
  return {
    className: "kp-focus-group",
    attributes: {
      "data-kp-focus-group": plan.groupId,
      "data-kp-focus-profile": plan.groupTreatment.profile,
      "data-kp-focus-phase": frame.phaseId,
      "data-kp-focus-layout-participation": "false",
      "data-kp-focus-shadow-field": plan.sharedShadow.id
    },
    variables: {
      "--kp-focus-z": `${frame.translateZ}px`,
      "--kp-focus-scale": String(frame.scale),
      "--kp-focus-outline-strength": String(frame.outlineStrength),
      "--kp-focus-shadow-y": `${plan.sharedShadow.offsetYPx}px`,
      "--kp-focus-shadow-blur": `${plan.sharedShadow.blurPx}px`,
      "--kp-focus-shadow-opacity": String(frame.shadowOpacity),
      "--kp-focus-context-dimming": String(frame.contextDimming)
    }
  };
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function unit(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be normalized between 0 and 1.`);
  }
  return value;
}

function requireIds(values: readonly string[], label: string): void {
  if (values.length === 0 || values.some((value) => value.trim().length === 0)) {
    throw new Error(`${label} must identify a complete semantic group.`);
  }
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
