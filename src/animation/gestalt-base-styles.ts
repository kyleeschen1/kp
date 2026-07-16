import {
  createKpGestaltStyleCatalog,
  createKpGestaltStylePackage,
  type KpGestaltStylePackageInput,
  type KpGestaltStyleRef
} from "./gestalt-style.ts";

const sourceRef =
  "docs/superpowers/specs/2026-07-16-phase-ordered-choreography-and-gestalt-styles-design.md";

const sharedAccessibilityProjectionIds = [
  "projection.full",
  "projection.reduced",
  "projection.static",
  "projection.narrated",
  "projection.high-contrast",
  "projection.no-depth",
  "projection.keyboard",
  "projection.rewind"
] as const;

const sharedFixtureIds = [
  "fixture.function-wrap",
  "fixture.radical-rewrite",
  "fixture.linear-rearrangement",
  "fixture.dot-product-traversal"
] as const;

export const kpOrganicSubtleStyleRef = {
  id: "kp.organic-subtle",
  version: "1.0.0"
} as const satisfies KpGestaltStyleRef;

export const kpRestrainedEditorialStyleRef = {
  id: "kp.restrained-editorial",
  version: "1.0.0"
} as const satisfies KpGestaltStyleRef;

const organicSubtleInput: KpGestaltStylePackageInput = {
  ...kpOrganicSubtleStyleRef,
  title: "KP Organic Subtle",
  channels: {
    path: {
      curvature: 0.58,
      diagonalPreference: 0.72,
      oppositeCornerPreference: 0.86
    },
    propagation: { strength: 0.5, staggerStrength: 0.42 },
    microMotion: { function: "identity-sine", amplitude: 0.1 },
    deformation: { tokenCeiling: 0.08, fragmentCeiling: 0.24 },
    cohesion: { strength: 0.84 },
    acceleration: { character: "organic" },
    focus: { profile: "flat", strength: 0.55 },
    depth: { enabled: false, strength: 0 },
    context: { dimming: 0.08 },
    pacing: { tempo: 0.52, recognitionDwell: 0.64 },
    opacity: { continuantFloor: 0.98 }
  },
  adaptation: {
    numericBounds: [
      { path: "path.curvature", minimum: 0.42, maximum: 0.72 },
      { path: "path.diagonalPreference", minimum: 0.55, maximum: 0.88 },
      { path: "path.oppositeCornerPreference", minimum: 0.68, maximum: 1 },
      { path: "propagation.strength", minimum: 0.32, maximum: 0.68 },
      { path: "propagation.staggerStrength", minimum: 0.24, maximum: 0.55 },
      { path: "microMotion.amplitude", minimum: 0.04, maximum: 0.16 },
      { path: "deformation.tokenCeiling", minimum: 0.02, maximum: 0.1 },
      { path: "deformation.fragmentCeiling", minimum: 0.1, maximum: 0.28 },
      { path: "cohesion.strength", minimum: 0.72, maximum: 0.95 },
      { path: "focus.strength", minimum: 0.4, maximum: 0.7 },
      { path: "depth.strength", minimum: 0, maximum: 0.35 },
      { path: "context.dimming", minimum: 0.04, maximum: 0.16 },
      { path: "pacing.tempo", minimum: 0.42, maximum: 0.64 },
      { path: "pacing.recognitionDwell", minimum: 0.52, maximum: 0.76 },
      { path: "opacity.continuantFloor", minimum: 0.96, maximum: 1 }
    ],
    lockedChannelPaths: [
      "microMotion.function",
      "acceleration.character"
    ]
  },
  lawIds: [
    "style.organic-subtle.meaningful-curvature",
    "style.organic-subtle.bounded-token-phase-differences",
    "style.organic-subtle.nonuniform-cohesive-realization",
    "style.organic-subtle.shared-reconciliation",
    "style.organic-subtle.zero-endpoint-micro-motion",
    "style.organic-subtle.bounded-semantic-deformation",
    "style.organic-subtle.exact-calm-settlement"
  ],
  requiredCapabilities: [
    "motion.path.arc",
    "motion.seek.direct-sampling",
    "opacity.token"
  ],
  optionalCapabilities: ["focus.depth.css-2_5d"],
  trustedPrimitiveIds: [
    "kp.primitive.arc",
    "kp.primitive.diagonal",
    "kp.primitive.identity-micro-motion",
    "kp.primitive.group-cohesion",
    "kp.primitive.exact-settlement"
  ],
  accessibilityProjectionIds: sharedAccessibilityProjectionIds,
  conformance: {
    fixtureIds: sharedFixtureIds,
    resultIds: ["conformance.organic-subtle.v1"]
  },
  provenance: {
    author: "Kinetic Press",
    sourceRef,
    license: "internal"
  },
  integrity:
    "sha256:42d994f87b15e65be92f2558cbcb32f6f86acd3172a210c3f9efe29a312ac694"
};

const restrainedEditorialInput: KpGestaltStylePackageInput = {
  ...kpRestrainedEditorialStyleRef,
  title: "KP Restrained Editorial",
  channels: {
    path: {
      curvature: 0.24,
      diagonalPreference: 0.32,
      oppositeCornerPreference: 0.28
    },
    propagation: { strength: 0.2, staggerStrength: 0.16 },
    microMotion: { function: "none", amplitude: 0 },
    deformation: { tokenCeiling: 0.01, fragmentCeiling: 0.04 },
    cohesion: { strength: 0.94 },
    acceleration: { character: "editorial" },
    focus: { profile: "flat", strength: 0.48 },
    depth: { enabled: false, strength: 0 },
    context: { dimming: 0.07 },
    pacing: { tempo: 0.46, recognitionDwell: 0.7 },
    opacity: { continuantFloor: 1 }
  },
  adaptation: {
    numericBounds: [
      { path: "path.curvature", minimum: 0.08, maximum: 0.38 },
      { path: "path.diagonalPreference", minimum: 0.15, maximum: 0.5 },
      { path: "path.oppositeCornerPreference", minimum: 0.1, maximum: 0.48 },
      { path: "propagation.strength", minimum: 0.08, maximum: 0.35 },
      { path: "propagation.staggerStrength", minimum: 0.05, maximum: 0.28 },
      { path: "microMotion.amplitude", minimum: 0, maximum: 0.04 },
      { path: "deformation.tokenCeiling", minimum: 0, maximum: 0.03 },
      { path: "deformation.fragmentCeiling", minimum: 0, maximum: 0.08 },
      { path: "cohesion.strength", minimum: 0.85, maximum: 1 },
      { path: "focus.strength", minimum: 0.35, maximum: 0.62 },
      { path: "depth.strength", minimum: 0, maximum: 0.18 },
      { path: "context.dimming", minimum: 0.03, maximum: 0.14 },
      { path: "pacing.tempo", minimum: 0.36, maximum: 0.58 },
      { path: "pacing.recognitionDwell", minimum: 0.58, maximum: 0.82 },
      { path: "opacity.continuantFloor", minimum: 0.98, maximum: 1 }
    ],
    lockedChannelPaths: [
      "microMotion.function",
      "acceleration.character"
    ]
  },
  lawIds: [
    "style.restrained-editorial.directness-with-motif-deference",
    "style.restrained-editorial.tight-token-phase-differences",
    "style.restrained-editorial.minimal-deformation",
    "style.restrained-editorial.continuant-opacity",
    "style.restrained-editorial.deliberate-recognition-dwell",
    "style.restrained-editorial.exact-calm-settlement"
  ],
  requiredCapabilities: [
    "motion.path.direct",
    "motion.seek.direct-sampling",
    "opacity.token"
  ],
  optionalCapabilities: [
    "motion.path.arc",
    "focus.depth.css-2_5d"
  ],
  trustedPrimitiveIds: [
    "kp.primitive.direct",
    "kp.primitive.arc",
    "kp.primitive.group-cohesion",
    "kp.primitive.exact-settlement"
  ],
  accessibilityProjectionIds: sharedAccessibilityProjectionIds,
  conformance: {
    fixtureIds: sharedFixtureIds,
    resultIds: ["conformance.restrained-editorial.v1"]
  },
  provenance: {
    author: "Kinetic Press",
    sourceRef,
    license: "internal"
  },
  integrity:
    "sha256:b0aef00dd1ae10484a25ed725e5475b4e917d070c083d39b0c176332e49b42d3"
};

export const kpOrganicSubtleStyle =
  createKpGestaltStylePackage(organicSubtleInput);

export const kpRestrainedEditorialStyle =
  createKpGestaltStylePackage(restrainedEditorialInput);

export const kpBaseGestaltStyleCatalog = createKpGestaltStyleCatalog([
  kpOrganicSubtleStyle,
  kpRestrainedEditorialStyle
]);

export interface KpGestaltProjectStyleDefaults {
  readonly kind: "gestalt-project-style-defaults";
  readonly projectId: string;
  readonly generatedAnimationStyle: KpGestaltStyleRef;
  readonly compatibleViewerSubstitutions: readonly KpGestaltStyleRef[];
  readonly defaultFocusProfile: "flat";
}

export const kpGeneratedAnimationGestaltDefaults: KpGestaltProjectStyleDefaults = {
  kind: "gestalt-project-style-defaults",
  projectId: "kp.generated-animation",
  generatedAnimationStyle: kpOrganicSubtleStyleRef,
  compatibleViewerSubstitutions: [
    kpOrganicSubtleStyleRef,
    kpRestrainedEditorialStyleRef
  ],
  defaultFocusProfile: "flat"
};

export function kpGestaltStyleKey(ref: KpGestaltStyleRef): string {
  return `${ref.id}@${ref.version}`;
}
