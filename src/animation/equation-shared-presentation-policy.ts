import type {
  KpSemanticVisualRole
} from "./semantic-visual-role.ts";

export const kpEquationPolicyCallerIds = Object.freeze([
  "log-quotient",
  "distribution",
  "cancellation"
] as const);

export type KpEquationPolicyCallerId =
  typeof kpEquationPolicyCallerIds[number];

export type KpEquationAccessibilityMode =
  | "full-motion"
  | "reduced-motion"
  | "static"
  | "narrated";

export type KpEquationMotionAccessibilityProjection =
  | "full"
  | "reduced"
  | "no-depth";

export const kpEquationSettlementTolerancePx = 0.25;
export const kpEquationSettlementConsecutiveFrameCount = 2;
export const kpEquationSettlementFrameBudget = 4;

export interface KpCallerProvenEquationPresentationPolicy {
  readonly schemaVersion: "kp.caller-proven-equation-policy.v1";
  readonly callers: readonly KpEquationPolicyCallerId[];
  readonly typography: {
    readonly stageClass: "kp-canonical-equation-stage";
    readonly contentClass: "kp-canonical-equation-content";
    readonly typeSizeProperty: "--kp-canonical-equation-type-size";
    readonly foregroundProperty: "--kp-equation-foreground";
    readonly endpointAuthority: "native-katex";
  };
  readonly semanticStyleRoles: readonly KpSemanticVisualRole[];
  readonly measurement: {
    readonly fontGate: "document-fonts-ready";
    readonly invalidationReasons: readonly ["ready", "loading-done"];
    readonly settlementConsecutiveFrames: 2;
    readonly settlementFrameBudget: number;
    readonly geometryTolerancePx: number;
  };
  readonly accessibility: {
    readonly reducedMotion: "preserve-semantic-progress-with-reduced-depth";
    readonly static: "direct-semantic-endpoints";
  };
  readonly clock: {
    readonly authority: "one-normalized-external-clock";
    readonly progressRange: readonly [0, 1];
    readonly rendererScheduling: "forbidden";
  };
}

/**
 * This policy records only behavior already shared by the quotient,
 * distribution, and cancellation callers. Operation-specific geometry and
 * timing remain recipe-local until a second caller proves the same need.
 */
export const kpCallerProvenEquationPresentationPolicy = Object.freeze({
  schemaVersion: "kp.caller-proven-equation-policy.v1",
  callers: kpEquationPolicyCallerIds,
  typography: Object.freeze({
    stageClass: "kp-canonical-equation-stage",
    contentClass: "kp-canonical-equation-content",
    typeSizeProperty: "--kp-canonical-equation-type-size",
    foregroundProperty: "--kp-equation-foreground",
    endpointAuthority: "native-katex"
  }),
  semanticStyleRoles: Object.freeze([
    "ink",
    "structure",
    "relation",
    "focus"
  ] satisfies readonly KpSemanticVisualRole[]),
  measurement: Object.freeze({
    fontGate: "document-fonts-ready",
    invalidationReasons: Object.freeze(["ready", "loading-done"] as const),
    // WebKit can settle a native fraction rule one frame later than its
    // glyphs. Require the same consecutive-frame proof while permitting a
    // small bounded sampling window; never weaken the geometry tolerance.
    settlementConsecutiveFrames: kpEquationSettlementConsecutiveFrameCount,
    settlementFrameBudget: kpEquationSettlementFrameBudget,
    geometryTolerancePx: kpEquationSettlementTolerancePx
  }),
  accessibility: Object.freeze({
    reducedMotion: "preserve-semantic-progress-with-reduced-depth",
    static: "direct-semantic-endpoints"
  }),
  clock: Object.freeze({
    authority: "one-normalized-external-clock",
    progressRange: Object.freeze([0, 1] as const),
    rendererScheduling: "forbidden"
  })
} satisfies KpCallerProvenEquationPresentationPolicy);

export function resolveKpEquationMotionAccessibility(
  mode: KpEquationAccessibilityMode
): KpEquationMotionAccessibilityProjection {
  switch (mode) {
    case "reduced-motion":
      return "reduced";
    case "static":
      return "no-depth";
    case "full-motion":
    case "narrated":
      return "full";
  }
}
