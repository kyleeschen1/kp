import type { KpGestaltStyleChannels } from "./gestalt-style.ts";
import type { KpResolvedGestaltStyle } from "./gestalt-style-resolution.ts";

export const kpGestaltAccessibilityProjectionKinds = [
  "full",
  "reduced",
  "static",
  "narrated",
  "high-contrast",
  "no-depth",
  "keyboard",
  "rewind"
] as const;

export type KpGestaltAccessibilityProjectionKind =
  (typeof kpGestaltAccessibilityProjectionKinds)[number];

export interface KpGestaltAccessibilityProjection {
  readonly id: string;
  readonly kind: KpGestaltAccessibilityProjectionKind;
  readonly channels: KpGestaltStyleChannels;
  readonly sampling: "continuous" | "semantic-checkpoints";
  readonly automaticPlayback: boolean;
  readonly narration: boolean;
  readonly keyboardEnabled: boolean;
  readonly directions: readonly ("forward" | "rewind")[];
  readonly preservesPhaseIds: readonly string[];
  readonly preservesTraversalRankIds: readonly string[];
}

export interface KpGestaltAccessibilityFamily {
  readonly kind: "gestalt-accessibility-family";
  readonly styleFingerprint: string;
  readonly projections: readonly KpGestaltAccessibilityProjection[];
}

export interface KpGestaltAccessibilityIssue {
  readonly path: string;
  readonly message: string;
}

export function compileKpGestaltAccessibilityFamily(input: {
  readonly style: KpResolvedGestaltStyle;
  readonly phaseIds: readonly string[];
  readonly traversalRankIds: readonly string[];
}): KpGestaltAccessibilityFamily {
  const shared = {
    preservesPhaseIds: [...input.phaseIds],
    preservesTraversalRankIds: [...input.traversalRankIds]
  };
  const projection = (
    kind: KpGestaltAccessibilityProjectionKind,
    channels: KpGestaltStyleChannels,
    options: Partial<
      Pick<
        KpGestaltAccessibilityProjection,
        | "sampling"
        | "automaticPlayback"
        | "narration"
        | "keyboardEnabled"
        | "directions"
      >
    > = {}
  ): KpGestaltAccessibilityProjection => ({
    id: `projection.${kind}`,
    kind,
    channels,
    sampling: options.sampling ?? "continuous",
    automaticPlayback: options.automaticPlayback ?? true,
    narration: options.narration ?? false,
    keyboardEnabled: options.keyboardEnabled ?? true,
    directions: options.directions ?? ["forward", "rewind"],
    ...shared
  });
  const base = structuredClone(input.style.channels);
  return {
    kind: "gestalt-accessibility-family",
    styleFingerprint: input.style.fingerprint,
    projections: [
      projection("full", base),
      projection("reduced", merge(base, reducedChannels()), {
        sampling: "semantic-checkpoints"
      }),
      projection("static", merge(base, staticChannels()), {
        sampling: "semantic-checkpoints",
        automaticPlayback: false
      }),
      projection("narrated", base, { narration: true }),
      projection("high-contrast", merge(base, {
        focus: { profile: "flat", strength: 1 },
        context: { dimming: 0.45 },
        depth: { enabled: false, strength: 0 }
      })),
      projection("no-depth", merge(base, {
        focus: { profile: "flat", strength: base.focus?.strength ?? 0.5 },
        depth: { enabled: false, strength: 0 }
      })),
      projection("keyboard", base, {
        automaticPlayback: false,
        keyboardEnabled: true
      }),
      projection("rewind", base, {
        directions: ["forward", "rewind"]
      })
    ]
  };
}

export function validateKpGestaltAccessibilityFamily(
  family: KpGestaltAccessibilityFamily
): readonly KpGestaltAccessibilityIssue[] {
  const issues: KpGestaltAccessibilityIssue[] = [];
  kpGestaltAccessibilityProjectionKinds.forEach((kind) => {
    if (!family.projections.some((projection) => projection.kind === kind)) {
      issues.push({
        path: "projections",
        message: `Accessibility family is missing ${kind} projection.`
      });
    }
  });
  const reference = family.projections.find((projection) => projection.kind === "full");
  family.projections.forEach((projection, index) => {
    const path = `projections[${index}]`;
    if (
      JSON.stringify(projection.preservesPhaseIds) !==
      JSON.stringify(reference?.preservesPhaseIds)
    ) {
      issues.push({ path, message: `${projection.kind} projection changed causal phase order.` });
    }
    if (
      JSON.stringify(projection.preservesTraversalRankIds) !==
      JSON.stringify(reference?.preservesTraversalRankIds)
    ) {
      issues.push({ path, message: `${projection.kind} projection changed semantic traversal.` });
    }
    if (
      (projection.kind === "reduced" || projection.kind === "static") &&
      (
        projection.sampling !== "semantic-checkpoints" ||
        projection.channels.microMotion?.amplitude !== 0 ||
        projection.channels.deformation?.tokenCeiling !== 0
      )
    ) {
      issues.push({ path, message: `${projection.kind} projection must retain checkpoints while removing organic expressiveness.` });
    }
    if (
      projection.kind === "no-depth" &&
      (projection.channels.depth?.enabled !== false ||
        projection.channels.depth.strength !== 0)
    ) {
      issues.push({ path, message: "No-depth projection must disable depth and shadow strength." });
    }
    if (projection.kind === "keyboard" && !projection.keyboardEnabled) {
      issues.push({ path, message: "Keyboard projection must enable keyboard transport." });
    }
    if (
      projection.kind === "rewind" &&
      !projection.directions.includes("rewind")
    ) {
      issues.push({ path, message: "Rewind projection must preserve reverse playback." });
    }
  });
  return issues;
}

function reducedChannels(): KpGestaltStyleChannels {
  return {
    microMotion: { function: "none", amplitude: 0 },
    deformation: { tokenCeiling: 0, fragmentCeiling: 0 },
    depth: { enabled: false, strength: 0 },
    propagation: { strength: 0, staggerStrength: 0 }
  };
}

function staticChannels(): KpGestaltStyleChannels {
  return {
    ...reducedChannels(),
    path: {
      curvature: 0,
      diagonalPreference: 0,
      oppositeCornerPreference: 0
    },
    pacing: { tempo: 0, recognitionDwell: 1 }
  };
}

function merge(
  base: KpGestaltStyleChannels,
  override: KpGestaltStyleChannels
): KpGestaltStyleChannels {
  const result = structuredClone(base) as Record<string, unknown>;
  Object.entries(override).forEach(([key, value]) => {
    const prior =
      typeof result[key] === "object" && result[key] !== null
        ? result[key] as Record<string, unknown>
        : {};
    result[key] = { ...prior, ...structuredClone(value) };
  });
  return result as KpGestaltStyleChannels;
}
