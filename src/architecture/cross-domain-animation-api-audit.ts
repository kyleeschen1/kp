export type KpCrossDomainAnimationApiTier =
  | "stable-authoring-facade"
  | "internal-platform"
  | "domain-adapter"
  | "experimental-surface"
  | "compatibility-bridge"
  | "retirement-candidate";

export type KpCrossDomainAnimationApiDecision =
  | "retain"
  | "promote-shared-contract"
  | "retire-adjacent-facade"
  | "defer";

export type KpCrossDomainAnimationSourcePath = `src/${string}.ts`;

export interface KpCrossDomainAnimationApiAuditEntry {
  readonly id: string;
  readonly tier: KpCrossDomainAnimationApiTier;
  readonly decision: KpCrossDomainAnimationApiDecision;
  readonly ownerPaths: readonly KpCrossDomainAnimationSourcePath[];
  readonly callerPaths: readonly KpCrossDomainAnimationSourcePath[];
  readonly callerAnimationIds: readonly string[];
  readonly invariant: string;
  readonly preservationBoundary: string;
  readonly retirementCondition?: string | undefined;
}

/**
 * This ledger separates public-looking names from observed authority. The two
 * approved domain exemplars may promote a shared invariant, but visual
 * resemblance alone cannot turn domain truth or renderer composition into a
 * platform API.
 */
export const kpCrossDomainAnimationApiAudit = Object.freeze([
  entry({
    id: "api.animation.catalog-loader",
    tier: "internal-platform",
    decision: "retain",
    ownerPaths: ["src/animation/catalog-loader.ts"],
    callerPaths: [
      "src/editor/animation-catalogue-loadable-registry.ts",
      "src/main.ts"
    ],
    callerAnimationIds: [],
    invariant: "One selected animation id resolves through one lazy capability pack.",
    preservationBoundary: "Pack isolation, load errors, and concrete asset identity remain unchanged."
  }),
  entry({
    id: "api.animation.runtime-frame",
    tier: "internal-platform",
    decision: "retain",
    ownerPaths: [
      "src/animation/asset.ts",
      "src/animation/runtime-sampler.ts"
    ],
    callerPaths: [
      "src/animation/economics-equilibrium-runtime-frame.ts",
      "src/animation/constant-force-work-energy-runtime-frame.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Every presenter samples one renderer-neutral asset on one normalized clock.",
    preservationBoundary: "Semantic refs, timeline identity, direction, seek, and rewind remain runtime authority."
  }),
  entry({
    id: "api.editor.playback-session",
    tier: "internal-platform",
    decision: "retain",
    ownerPaths: ["src/editor/animation-playback-session.ts"],
    callerPaths: [
      "src/editor/animation-player-controller.ts",
      "src/main.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Asset replacement preserves the selected playhead and playback direction.",
    preservationBoundary: "The catalogue keeps one player session rather than domain-specific clocks."
  }),
  entry({
    id: "api.editor.surface-adapter-registry",
    tier: "internal-platform",
    decision: "retain",
    ownerPaths: ["src/editor/animation-surface-adapter-registry.ts"],
    callerPaths: [
      "src/editor/equation-surface-adapter.ts",
      "src/editor/graph-svg-viewport.ts",
      "src/editor/diagram-svg-adapter.ts"
    ],
    callerAnimationIds: [],
    invariant: "Surface capability dispatch remains separate from semantic asset construction.",
    preservationBoundary: "Equation, graph, diagram, composite, and missing programming behavior remain explicit."
  }),
  entry({
    id: "api.graph.svg-viewport",
    tier: "internal-platform",
    decision: "retain",
    ownerPaths: ["src/editor/graph-svg-viewport.ts"],
    callerPaths: ["src/editor/animation-surface-adapter-registry.ts"],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "One SVG viewport owns graph hosting while domain presenters own their content.",
    preservationBoundary: "Do not replace the bounded dispatch with a universal renderer or scene graph."
  }),
  entry({
    id: "api.domain.economics-equilibrium",
    tier: "domain-adapter",
    decision: "retain",
    ownerPaths: [
      "src/animation/economics-equilibrium-adapter.ts",
      "src/animation/economics-equilibrium-synchronized-view.ts",
      "src/rendering/economics-equilibrium-svg.ts"
    ],
    callerPaths: ["src/editor/graph-svg-viewport.ts"],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift"
    ],
    invariant: "Economics owns supply, demand, equilibrium, and comparative-statics truth.",
    preservationBoundary: "No shared API may solve economics or author its narrative."
  }),
  entry({
    id: "api.domain.physics-work-energy",
    tier: "domain-adapter",
    decision: "retain",
    ownerPaths: [
      "src/animation/constant-force-work-energy-adapter.ts",
      "src/animation/constant-force-work-energy-synchronized-view.ts",
      "src/rendering/constant-force-work-energy-svg.ts"
    ],
    callerPaths: ["src/editor/graph-svg-viewport.ts"],
    callerAnimationIds: [
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Physics owns force, displacement, work, energy, SI units, and theorem truth.",
    preservationBoundary: "No shared API may solve mechanics or author its narrative."
  }),
  entry({
    id: "promotion.synchronized-model-projection-clock",
    tier: "internal-platform",
    decision: "promote-shared-contract",
    ownerPaths: ["src/animation/synchronized-model-projection.ts"],
    callerPaths: [
      "src/animation/economics-equilibrium-runtime-frame.ts",
      "src/animation/constant-force-work-energy-runtime-frame.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Forward and reverse clocks quantize one presentation progress before domain choreography samples exact model progress.",
    preservationBoundary: "Stage names, timing thresholds, opacity, emphasis, and semantic-frame sampling stay domain-owned."
  }),
  entry({
    id: "promotion.dimensional-continuity-graph-profile",
    tier: "stable-authoring-facade",
    decision: "promote-shared-contract",
    ownerPaths: ["src/rendering/dimensional-continuity-graph-profile.ts"],
    callerPaths: [
      "src/rendering/economics-equilibrium-svg.ts",
      "src/rendering/constant-force-work-energy-svg.ts",
      "src/editor/graph-svg-viewport.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Orthographic SVG graphs share KaTeX typography and stable, changing, focal, construction, and plane roles.",
    preservationBoundary: "Geometry, labels, responsive composition, and domain-specific class names remain caller-owned."
  }),
  entry({
    id: "promotion.dynamic-exact-display-policy",
    tier: "internal-platform",
    decision: "promote-shared-contract",
    ownerPaths: [
      "src/animation/dimensional-continuity-dynamic-display.ts"
    ],
    callerPaths: [
      "src/animation/economics-equilibrium-synchronized-view.ts",
      "src/animation/constant-force-work-energy-synchronized-view.ts",
      "src/rendering/economics-equilibrium-svg.ts",
      "src/rendering/constant-force-work-energy-svg.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "Moving readouts use two fixed decimals and approximation notation while exact rationals remain semantic authority.",
    preservationBoundary: "Static ticks, prose, exact LaTeX, DOM evidence, and accessible values are not rounded by the helper."
  }),
  entry({
    id: "promotion.bounded-integer-query-codec",
    tier: "internal-platform",
    decision: "promote-shared-contract",
    ownerPaths: ["src/editor/bounded-integer-query-parameter.ts"],
    callerPaths: [
      "src/editor/economics-equilibrium-parameters.ts",
      "src/editor/constant-force-work-energy-parameters.ts"
    ],
    callerAnimationIds: [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ],
    invariant: "One bounded integer query value omits its default and preserves unrelated URL state.",
    preservationBoundary: "Parameter identity, labels, domain model construction, and asset replacement remain domain-owned; this is not a universal parameter schema."
  }),
  entry({
    id: "api.animation.motif-public-api",
    tier: "stable-authoring-facade",
    decision: "retain",
    ownerPaths: ["src/animation/motifs/public-api.ts"],
    callerPaths: [
      "src/animation/motifs/equation-visual-motif-defaults.ts",
      "src/animation/motifs/executable-motif-grammar.ts"
    ],
    callerAnimationIds: [],
    invariant: "Renderer-neutral equation motif vocabulary is owned by the animation domain.",
    preservationBoundary: "Graph presentation profiles do not become equation motion motifs."
  }),
  entry({
    id: "compatibility.rendering-motif-facades",
    tier: "compatibility-bridge",
    decision: "retire-adjacent-facade",
    ownerPaths: ["src/architecture/semantic-animation-compatibility-ledger.ts"],
    callerPaths: [],
    callerAnimationIds: [],
    invariant: "The facades only re-export the canonical animation motif modules and have no production caller.",
    preservationBoundary: "Canonical animation motif exports and neutral renderer-boundary tests remain.",
    retirementCondition: "Satisfied: removed facade paths are recorded and source imports are ratcheted to the canonical motif owner."
  }),
  entry({
    id: "surface.editor-api-catalog",
    tier: "experimental-surface",
    decision: "defer",
    ownerPaths: ["src/editor/api-catalog.ts"],
    callerPaths: [
      "src/editor/editor.ts",
      "src/project-dashboard/render.ts"
    ],
    callerAnimationIds: [],
    invariant: "The API catalogue is an editorial/diagnostic projection, not executable authoring authority.",
    preservationBoundary: "Broad dashboard deletion remains outside this run."
  }),
  entry({
    id: "compatibility.catalogue-document-navigation",
    tier: "compatibility-bridge",
    decision: "retain",
    ownerPaths: ["src/editor/animation-catalogue-navigation.ts"],
    callerPaths: ["src/main.ts"],
    callerAnimationIds: [],
    invariant: "Full document navigation remains the progressive fallback for unsafe or unavailable in-shell selection.",
    preservationBoundary: "Ordinary catalogue selection remains in-shell and history-aware."
  }),
  entry({
    id: "candidate.jacobian-hessian-presentation",
    tier: "retirement-candidate",
    decision: "defer",
    ownerPaths: ["src/animation/comparison-layout-adapter.ts"],
    callerPaths: [
      "src/animation/catalog-packs/comparison.ts",
      "src/editor/editor.ts"
    ],
    callerAnimationIds: ["animation.comparison.jacobian-hessian"],
    invariant: "The current comparison is a diagnostic presentation with unique semantic and conformance evidence.",
    preservationBoundary: "Do not delete the semantic fixture, transformations, or tests while its presentation disposition is unresolved.",
    retirementCondition: "A reviewed replacement preserves its derivative-structure contract or a human explicitly retires that unique contract."
  })
] as const satisfies readonly KpCrossDomainAnimationApiAuditEntry[]);

function entry(
  value: KpCrossDomainAnimationApiAuditEntry
): KpCrossDomainAnimationApiAuditEntry {
  return Object.freeze({
    ...value,
    ownerPaths: Object.freeze([...value.ownerPaths]),
    callerPaths: Object.freeze([...value.callerPaths]),
    callerAnimationIds: Object.freeze([...value.callerAnimationIds])
  });
}
