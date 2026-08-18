import type { KpAnimationAsset } from "../animation/asset.ts";
import { createKpAnimationAssets } from "../animation/catalog.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../domain-ir/public-api.ts";
import {
  createKpEquationSurfaceInventory,
  type KpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";

export type KpEquationSurfaceAuthorityCategory =
  | "clock"
  | "compiler"
  | "direct-sampler"
  | "fallback"
  | "local-timing"
  | "motif"
  | "registry"
  | "renderer-inference";

export type KpEquationSurfaceAuthorityPathClass =
  | "generic-semantic-equation"
  | "log-exponent-specialized"
  | "logarithm-change-of-base-specialized"
  | "log-quotient-specialized"
  | "log-product-specialized"
  | "operation-evaluation-specialized";

export interface KpEquationSurfaceAuthorityNode {
  readonly id: string;
  readonly category: KpEquationSurfaceAuthorityCategory;
  readonly authority: "canonical" | "compatibility" | "local" | "shared";
  readonly sourcePath: `src/${string}.ts`;
  readonly sourceNeedle: string;
  readonly summary: string;
}

export interface KpEquationSurfaceAuthorityRow {
  readonly schemaVersion: "kp.equation-surface-authority-row.v1";
  readonly animationId: string;
  readonly pathClass: KpEquationSurfaceAuthorityPathClass;
  readonly transformationTypes: readonly string[];
  readonly semanticCompilerCoverage: {
    readonly semantic: number;
    readonly nonSemantic: number;
  };
  readonly compilerNodeIds: readonly string[];
  readonly registryNodeIds: readonly string[];
  readonly motifNodeIds: readonly string[];
  readonly localTimingNodeIds: readonly string[];
  readonly rendererInferenceNodeIds: readonly string[];
  readonly sharedClockNodeId: string;
  readonly privateClockAuthority: "none";
  readonly cssAnimationAuthority: "none";
  readonly fallbackNodeIds: readonly string[];
  readonly directSamplerNodeIds: readonly string[];
}

export interface KpEquationSurfaceAuthorityGraph {
  readonly schemaVersion: "kp.equation-surface-authority-graph.v1";
  readonly kind: "equation-surface-authority-graph";
  readonly nodes: readonly KpEquationSurfaceAuthorityNode[];
  readonly rows: readonly KpEquationSurfaceAuthorityRow[];
}

export class KpEquationSurfaceAuthorityGraphError extends Error {
  override readonly name = "KpEquationSurfaceAuthorityGraphError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

export const kpEquationSurfaceAuthorityNodes = Object.freeze([
  node("registry.selected-capability", "registry", "canonical",
    "src/editor/selected-surface-capability.ts",
    "export function deriveKpEditorSelectedSurfaceCapabilities",
    "Selection maps an asset and its slots to lazy surface capabilities."),
  node("registry.priority-resolution", "registry", "canonical",
    "src/editor/animation-surface-adapter-registry.ts",
    "resolve(slotKind, state)",
    "The surface registry chooses the highest-priority supporting adapter."),
  node("clock.shared-editor-player", "clock", "shared",
    "src/editor/animation-player-controller.ts",
    "requestAnimationFrame((nowMs) =>",
    "One player requestAnimationFrame clock owns catalogue progress."),
  node("compiler.generic-semantic-transition", "compiler", "canonical",
    "src/domain-ir/semantic-equation-transition-compiler.ts",
    "export function compileKpSemanticEquationTransitionResult",
    "The generic path compiles transformations into equation transition IR."),
  node("compiler.semantic-motion-choreography", "compiler", "canonical",
    "src/domain-ir/semantic-motion-compiler.ts",
    "export function compileKpSemanticMotion",
    "The semantic-motion front door validates and resolves one executable choreography."),
  node("compiler.operation-evaluation-render-plan", "compiler", "canonical",
    "src/reader/renderers/equation-render-plan.ts",
    "export function projectKpReaderEquationRenderPlan",
    "Operation evaluation compiles through the branded reader render plan."),
  node("compiler.log-exponent-operations", "compiler", "local",
    "src/semantic/log-exponent-transformation-compiler.ts",
    "export function compileKpApplyNaturalLogBothSides",
    "Log-exponent operations use their dedicated typed semantic compiler."),
  node("compiler.logarithm-change-of-base-operation", "compiler", "local",
    "src/semantic/logarithm-change-of-base.ts",
    "export function verifyKpLogarithmChangeOfBase",
    "Change of base enters rendering only through verifier-minted mathematical authority."),
  node("compiler.log-quotient-operation", "compiler", "local",
    "src/semantic/log-quotient-transformation-compiler.ts",
    "export function compileKpLogQuotientOperation",
    "Log quotient uses its dedicated typed semantic compiler."),
  node("compiler.log-product-operation", "compiler", "local",
    "src/semantic/log-product-transformation-compiler.ts",
    "export function compileKpLogProductOperation",
    "Log product uses its dedicated typed semantic compiler."),
  node("motif.generic-transition", "motif", "compatibility",
    "src/editor/equation-transition-motifs.ts",
    "export function createKpEditorEquationTransitionMotifFrame",
    "The generic adapter still resolves broad motif labels per transition."),
  node("motif.operation-evaluation-material", "motif", "canonical",
    "src/reader/renderers/equation-material-plan.ts",
    "export function compileKpReaderEquationMaterialPlan",
    "Operation evaluation derives one role-complete material plan."),
  node("motif.log-exponent-symbol-motion", "motif", "local",
    "src/animation/log-exponent-symbol-motion.ts",
    "export function compileKpLogExponentSymbolMotionPlans",
    "Log-exponent symbols use a caller-local compiled motion contract."),
  node("motif.logarithm-change-of-base-composition", "motif", "local",
    "src/animation/logarithm-change-of-base-presentation-plan.ts",
    "export function compileKpLogarithmChangeOfBasePresentationPlan",
    "The exemplar composes canonical function-wrap and fraction-material authorities without adding a renderer primitive."),
  node("motif.log-quotient-homomorphic-fusion", "motif", "local",
    "src/animation/log-quotient-homomorphic-fusion.ts",
    "export function createKpCanonicalLogQuotientHomomorphicFusionChoreography",
    "Log quotient owns its current homomorphic fusion choreography locally."),
  node("motif.log-product-semantic-projection", "motif", "shared",
    "src/rendering/native-katex-semantic-motion-track-projection.ts",
    "export function createKpNativeKatexSemanticMotionTrackProjection",
    "Log product projects compiled semantic tracks without a family switch."),
  node("timing.generic-phase-easing", "local-timing", "local",
    "src/editor/equation-stage-frame.ts",
    "const easedProgress = localProgress * localProgress",
    "The generic surface currently owns phase-local easing."),
  node("timing.operation-endpoint-dwell", "local-timing", "local",
    "src/rendering/native-katex-scene-compositor.ts",
    "export function sampleKpNativeKatexEndpointDwellProgress",
    "The native compositor currently owns operation endpoint dwell."),
  node("timing.log-exponent-sequence", "local-timing", "local",
    "src/animation/log-exponent-timeline.ts",
    "export function sampleKpLogExponentSequenceFrame",
    "The log-exponent timeline maps shared progress to operation-local time."),
  node("timing.logarithm-change-of-base-exemplar", "local-timing", "local",
    "src/rendering/logarithm-change-of-base-transit-session.ts",
    "export const kpLogarithmChangeOfBaseExemplarTiming",
    "The unpromoted exemplar owns one reversible timing profile pending visual review."),
  node("timing.copy-fan-out-presentation-profile", "local-timing", "canonical",
    "src/animation/copy-fan-out-motion-profile.ts",
    "export const kpCanonicalNativeKatexCopyFanOutMotionProfile",
    "The shared native copy/fan-out sampler owns reviewed optical pacing without importing a symbolic family."),
  node("timing.cancellation-counter-orbit", "local-timing", "local",
    "src/animation/counter-orbit-cancellation-timing.ts",
    "export const kpCounterOrbitCancellationTiming",
    "Cancellation retains reviewed contact and retirement timing after semantic compilation."),
  node("timing.semantic-motion-recipe-schedule", "local-timing", "canonical",
    "src/domain-ir/semantic-motion-choreography-compiler.ts",
    "function schedulePolicy(",
    "The compiler lowers semantic precedence into recipe-owned nominal windows."),
  node("renderer.generic-dom-measurement", "renderer-inference", "compatibility",
    "src/editor/equation-surface-adapter.ts",
    "measureKpEquationTransitionGeometry({",
    "The generic path infers motion geometry from rendered KaTeX DOM."),
  node("renderer.operation-measured-compositor", "renderer-inference", "canonical",
    "src/reader/renderers/equation-scene-compositor-adapter.ts",
    "export function createKpReaderEquationSceneCompositorSession",
    "Operation evaluation executes through the measured native compositor."),
  node("renderer.log-exponent-transit", "renderer-inference", "local",
    "src/rendering/log-exponent-transit-session.ts",
    "export function createKpLogExponentTransitSession",
    "Log exponent owns a dedicated native endpoint transit session."),
  node("renderer.logarithm-change-of-base-transit", "renderer-inference", "local",
    "src/rendering/logarithm-change-of-base-transit-session.ts",
    "export function createKpLogarithmChangeOfBaseTransitSession",
    "Change of base composes the canonical native KaTeX scene session at a lazy caller boundary."),
  node("renderer.log-quotient-transit", "renderer-inference", "local",
    "src/rendering/log-quotient-transit-session.ts",
    "export function createKpLogQuotientTransitSession",
    "Log quotient owns a dedicated native endpoint transit session."),
  node("renderer.log-product-transit", "renderer-inference", "local",
    "src/rendering/log-product-transit-session.ts",
    "export function createKpLogProductTransitSession",
    "Log product owns a dedicated native endpoint transit session."),
  node("fallback.generic-whole-equation", "fallback", "compatibility",
    "src/editor/equation-surface-adapter.ts",
    "function applyLayerMotion(",
    "Failed semantic motion falls back to whole-equation layer motion."),
  node("fallback.operation-failed-stage", "fallback", "canonical",
    "src/editor/operation-evaluation-surface-adapter.ts",
    "} catch (error) {",
    "Operation preparation fails closed instead of inventing a motif."),
  node("fallback.log-exponent-failed-stage", "fallback", "canonical",
    "src/editor/log-exponent-surface-adapter.ts",
    "session.stage.dataset[\"kpLogExponentStage\"] = \"failed\"",
    "Log-exponent preparation records an explicit failed stage."),
  node("fallback.logarithm-change-of-base-failed-stage", "fallback", "canonical",
    "src/editor/logarithm-change-of-base-surface-adapter.ts",
    "session.stage.dataset[\"kpLogarithmChangeOfBaseStage\"] = \"failed\"",
    "Change-of-base preparation fails closed to its readable source endpoint."),
  node("fallback.log-quotient-failed-stage", "fallback", "canonical",
    "src/editor/log-quotient-surface-adapter.ts",
    "session.stage.dataset[\"kpLogQuotientStage\"] = \"failed\"",
    "Log-quotient preparation records an explicit failed stage."),
  node("fallback.log-product-failed-stage", "fallback", "canonical",
    "src/editor/log-product-surface-adapter.ts",
    "session.stage.dataset[\"kpLogProductStage\"] = \"failed\"",
    "Log-product preparation records an explicit failed stage."),
  node("sampler.generic-semantic-token", "direct-sampler", "compatibility",
    "src/editor/semantic-equation-player-adapter.ts",
    "export function createKpEditorSemanticEquationTokenFrame",
    "The generic adapter directly samples and applies its token frame."),
  node("sampler.operation-native-scene", "direct-sampler", "canonical",
    "src/rendering/native-katex-scene-compositor.ts",
    "export function sampleKpNativeKatexSceneTracks(",
    "The operation compositor samples its compiled native scene tracks."),
  node("sampler.log-exponent-sequence", "direct-sampler", "local",
    "src/animation/log-exponent-timeline.ts",
    "export function sampleKpLogExponentSequenceFrame",
    "The log-exponent adapter directly samples its local sequence."),
  node("sampler.semantic-motion-choreography", "direct-sampler", "canonical",
    "src/domain-ir/semantic-motion-choreography-compiler.ts",
    "export function sampleKpSemanticMotionChoreography",
    "The compiler samples all admitted semantic choreography from shared progress."),
  node("sampler.function-wrap", "direct-sampler", "local",
    "src/animation/function-wrap-choreography.ts",
    "export function sampleKpFunctionWrapChoreography",
    "Function wrapping has a direct local choreography sampler."),
  node("sampler.radical-succession", "direct-sampler", "local",
    "src/animation/radical-succession-choreography.ts",
    "export function sampleKpRadicalSuccessionChoreography",
    "Radical succession has a direct local choreography sampler."),
  node("sampler.linear-rearrangement", "direct-sampler", "local",
    "src/animation/linear-rearrangement-choreography.ts",
    "export function sampleKpLinearRearrangementChoreography",
    "Linear rearrangement has a direct local choreography sampler."),
  node("sampler.witnessed-annihilation", "direct-sampler", "local",
    "src/rendering/equation-witnessed-annihilation-runtime.ts",
    "export function kpEquationWitnessedAnnihilationRuntime",
    "Cancellation can enter a renderer-registered annihilation runtime."),
  node("sampler.dot-product-traversal", "direct-sampler", "local",
    "src/animation/dot-product-traversal-choreography.ts",
    "export function sampleKpDotProductTraversalChoreography",
    "Dot product traversal has a direct local choreography sampler."),
  node("sampler.matrix-vector-composition", "direct-sampler", "local",
    "src/animation/matrix-vector-composition-choreography.ts",
    "export function sampleKpMatrixVectorCompositionChoreography",
    "Matrix-vector composition has a direct local choreography sampler."),
  node("sampler.matrix-matrix-composition", "direct-sampler", "local",
    "src/animation/matrix-matrix-composition-choreography.ts",
    "export function sampleKpMatrixMatrixCompositionChoreography",
    "Matrix-matrix composition has a direct local choreography sampler."),
  node("sampler.derivative-power", "direct-sampler", "local",
    "src/animation/derivative-power-choreography.ts",
    "export function sampleKpDerivativePowerChoreography",
    "The derivative power rule has a direct local choreography sampler."),
  node("sampler.distribution", "direct-sampler", "local",
    "src/animation/distribution-choreography.ts",
    "export function sampleKpDistributionChoreography",
    "Distribution enters its capability-provided local sampler."),
  node("sampler.factoring", "direct-sampler", "local",
    "src/animation/factoring-choreography.ts",
    "export function sampleKpFactoringChoreography",
    "Factoring enters its local fusion sampler."),
  node("sampler.fraction", "direct-sampler", "local",
    "src/animation/fraction-choreography.ts",
    "export function sampleKpFractionChoreography",
    "Fraction structure changes enter a local sampler."),
  node("sampler.exponent-law", "direct-sampler", "local",
    "src/animation/exponent-law-choreography.ts",
    "export function sampleKpExponentLawChoreography",
    "Exponent-law changes enter a local sampler."),
  node("sampler.identity-absorption", "direct-sampler", "local",
    "src/animation/identity-absorption-choreography.ts",
    "export function sampleKpIdentityAbsorptionChoreography",
    "Identity absorption enters a local sampler."),
  node("sampler.inequality-pivot", "direct-sampler", "local",
    "src/animation/inequality-pivot-choreography.ts",
    "export function sampleKpInequalityPivotChoreography",
    "Inequality reversal enters a local pivot sampler.")
] as const satisfies readonly KpEquationSurfaceAuthorityNode[]);

const directSamplerRules = Object.freeze([
  rule(["wrapFunction"], ["sampler.function-wrap"]),
  rule(["rewritePowerAsRoot"], ["sampler.radical-succession"]),
  rule([
    "subtractBothSides",
    "cancelAdditiveInverses",
    "simplifyConstantDifference"
  ], ["sampler.linear-rearrangement"]),
  rule([
    "cancelAdditiveInverses",
    "cancelMultiplicativeInverses"
  ], ["sampler.witnessed-annihilation"]),
  rule(["computeDotProduct"], ["sampler.dot-product-traversal"]),
  rule(["multiplyMatrixVector"], ["sampler.matrix-vector-composition"]),
  rule(["multiplyMatrices"], ["sampler.matrix-matrix-composition"]),
  rule(["applyDerivativePowerRule"], ["sampler.derivative-power"]),
  rule(["distributeMultiplication"], ["sampler.distribution"]),
  rule(["factorCommonTerm"], ["sampler.factoring"]),
  rule([
    "splitFractionFactors",
    "mergeFractionCommonFactor",
    "simplifyUnitFractionFactor"
  ], ["sampler.fraction"]),
  rule(["lowerExponent", "unwrapUnitExponent"], ["sampler.exponent-law"]),
  rule(["simplify-additive-identity"], ["sampler.identity-absorption"]),
  rule(["multiplyNegativeBothSidesInequality"], ["sampler.inequality-pivot"])
]);

export function createKpEquationSurfaceAuthorityGraph():
KpEquationSurfaceAuthorityGraph {
  return compileKpEquationSurfaceAuthorityGraph({
    inventory: createKpEquationSurfaceInventory(),
    assets: createKpAnimationAssets(),
    nodes: kpEquationSurfaceAuthorityNodes
  });
}

export function compileKpEquationSurfaceAuthorityGraph(input: {
  readonly inventory: KpEquationSurfaceInventory;
  readonly assets: readonly KpAnimationAsset[];
  readonly nodes?: readonly KpEquationSurfaceAuthorityNode[] | undefined;
}): KpEquationSurfaceAuthorityGraph {
  const nodes = input.nodes ?? kpEquationSurfaceAuthorityNodes;
  const diagnostics: string[] = [];
  const nodeIds = uniqueIds(nodes, "authority node", diagnostics);
  const assetsById = uniqueIds(input.assets, "animation asset", diagnostics);
  const rows = input.inventory.entries.flatMap((entry) => {
    const asset = assetsById.get(entry.animationId);
    if (asset === undefined) {
      diagnostics.push(`Missing authority asset ${entry.animationId}.`);
      return [];
    }
    const row = authorityRow(asset);
    for (const authorityId of authorityIds(row)) {
      if (!nodeIds.has(authorityId)) {
        diagnostics.push(
          `Equation ${entry.animationId} references unknown authority ` +
          `${authorityId}.`
        );
      }
    }
    return [row];
  });
  if (rows.length !== input.inventory.entries.length) {
    diagnostics.push(
      `Authority graph covers ${rows.length} of ` +
      `${input.inventory.entries.length} equation surfaces.`
    );
  }
  if (diagnostics.length > 0) {
    throw new KpEquationSurfaceAuthorityGraphError(
      Object.freeze(diagnostics)
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-surface-authority-graph.v1" as const,
    kind: "equation-surface-authority-graph" as const,
    nodes: Object.freeze([...nodes]),
    rows: Object.freeze(rows)
  });
}

function authorityRow(asset: KpAnimationAsset):
KpEquationSurfaceAuthorityRow {
  const pathClass = authorityPathClass(asset.id);
  const transformationTypes = Object.freeze([
    ...new Set(asset.transformations.map(({ transformType }) => transformType))
  ]);
  if (pathClass === "operation-evaluation-specialized") {
    return row(asset.id, pathClass, transformationTypes, {
      semantic: asset.transformations.length,
      nonSemantic: 0
    }, {
      compiler: ["compiler.operation-evaluation-render-plan"],
      motif: ["motif.operation-evaluation-material"],
      timing: ["timing.operation-endpoint-dwell"],
      renderer: ["renderer.operation-measured-compositor"],
      fallback: ["fallback.operation-failed-stage"],
      samplers: ["sampler.operation-native-scene"]
    });
  }
  if (pathClass === "log-exponent-specialized") {
    return row(asset.id, pathClass, transformationTypes, {
      semantic: asset.transformations.length,
      nonSemantic: 0
    }, {
      compiler: ["compiler.log-exponent-operations"],
      motif: ["motif.log-exponent-symbol-motion"],
      timing: ["timing.log-exponent-sequence"],
      renderer: ["renderer.log-exponent-transit"],
      fallback: ["fallback.log-exponent-failed-stage"],
      samplers: ["sampler.log-exponent-sequence"]
    });
  }
  if (pathClass === "logarithm-change-of-base-specialized") {
    return row(asset.id, pathClass, transformationTypes, {
      semantic: asset.transformations.length,
      nonSemantic: 0
    }, {
      compiler: ["compiler.logarithm-change-of-base-operation"],
      motif: ["motif.logarithm-change-of-base-composition"],
      timing: ["timing.logarithm-change-of-base-exemplar"],
      renderer: ["renderer.logarithm-change-of-base-transit"],
      fallback: ["fallback.logarithm-change-of-base-failed-stage"],
      samplers: ["sampler.operation-native-scene"]
    });
  }
  if (pathClass === "log-quotient-specialized") {
    return row(asset.id, pathClass, transformationTypes, {
      semantic: asset.transformations.length,
      nonSemantic: 0
    }, {
      compiler: [
        "compiler.log-quotient-operation",
        "compiler.semantic-motion-choreography"
      ],
      motif: ["motif.log-quotient-homomorphic-fusion"],
      timing: ["timing.semantic-motion-recipe-schedule"],
      renderer: ["renderer.log-quotient-transit"],
      fallback: ["fallback.log-quotient-failed-stage"],
      samplers: ["sampler.semantic-motion-choreography"]
    });
  }
  if (pathClass === "log-product-specialized") {
    return row(asset.id, pathClass, transformationTypes, {
      semantic: asset.transformations.length,
      nonSemantic: 0
    }, {
      compiler: [
        "compiler.log-product-operation",
        "compiler.semantic-motion-choreography"
      ],
      motif: ["motif.log-product-semantic-projection"],
      timing: ["timing.semantic-motion-recipe-schedule"],
      renderer: ["renderer.log-product-transit"],
      fallback: ["fallback.log-product-failed-stage"],
      samplers: ["sampler.semantic-motion-choreography"]
    });
  }

  let semantic = 0;
  for (const transformation of asset.transformations) {
    if (compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: asset.bundle
    }).status === "semantic") semantic += 1;
  }
  const specialSamplers = directSamplerRules.flatMap((candidate) =>
    candidate.transformationTypes.some((type) =>
      transformationTypes.includes(type)
    ) ? candidate.nodeIds : []
  );
  const isDistributionPressure =
    asset.id === "animation.generated.distribution.expand-a-sum";
  const isCancellationPressure =
    asset.id === "animation.generated.cancellation.additive-inverses";
  const usesCanonicalSemanticMotion =
    isDistributionPressure || isCancellationPressure;
  return row(asset.id, pathClass, transformationTypes, {
    semantic,
    nonSemantic: asset.transformations.length - semantic
  }, {
    compiler: [
      "compiler.generic-semantic-transition",
      ...(usesCanonicalSemanticMotion
        ? ["compiler.semantic-motion-choreography"]
        : [])
    ],
    motif: ["motif.generic-transition"],
    timing: [
      "timing.generic-phase-easing",
      ...(isDistributionPressure
        ? [
            "timing.semantic-motion-recipe-schedule",
            "timing.copy-fan-out-presentation-profile"
          ]
        : []),
      ...(isCancellationPressure
        ? [
            "timing.semantic-motion-recipe-schedule",
            "timing.cancellation-counter-orbit"
          ]
        : [])
    ],
    renderer: ["renderer.generic-dom-measurement"],
    fallback: ["fallback.generic-whole-equation"],
    samplers: unique([
      "sampler.generic-semantic-token",
      ...specialSamplers,
      ...(usesCanonicalSemanticMotion
        ? ["sampler.semantic-motion-choreography"]
        : [])
    ])
  });
}

function row(
  animationId: string,
  pathClass: KpEquationSurfaceAuthorityPathClass,
  transformationTypes: readonly string[],
  coverage: KpEquationSurfaceAuthorityRow["semanticCompilerCoverage"],
  paths: {
    readonly compiler: readonly string[];
    readonly motif: readonly string[];
    readonly timing: readonly string[];
    readonly renderer: readonly string[];
    readonly fallback: readonly string[];
    readonly samplers: readonly string[];
  }
): KpEquationSurfaceAuthorityRow {
  return Object.freeze({
    schemaVersion: "kp.equation-surface-authority-row.v1" as const,
    animationId,
    pathClass,
    transformationTypes,
    semanticCompilerCoverage: Object.freeze(coverage),
    compilerNodeIds: Object.freeze(paths.compiler),
    registryNodeIds: Object.freeze([
      "registry.selected-capability",
      "registry.priority-resolution"
    ]),
    motifNodeIds: Object.freeze(paths.motif),
    localTimingNodeIds: Object.freeze(paths.timing),
    rendererInferenceNodeIds: Object.freeze(paths.renderer),
    sharedClockNodeId: "clock.shared-editor-player",
    privateClockAuthority: "none" as const,
    cssAnimationAuthority: "none" as const,
    fallbackNodeIds: Object.freeze(paths.fallback),
    directSamplerNodeIds: Object.freeze(paths.samplers)
  });
}

function authorityPathClass(
  animationId: string
): KpEquationSurfaceAuthorityPathClass {
  if (animationId.startsWith("animation.operation-evaluation.")) {
    return "operation-evaluation-specialized";
  }
  if (animationId === "animation.algebra.log-exponent.solve-two-power-x") {
    return "log-exponent-specialized";
  }
  if (animationId === "animation.equation.logarithm-change-of-base.v1") {
    return "logarithm-change-of-base-specialized";
  }
  if (
    animationId ===
      "animation.algebra.log-quotient.difference-to-quotient"
  ) return "log-quotient-specialized";
  if (animationId.startsWith("animation.algebra.log-product.")) {
    return "log-product-specialized";
  }
  return "generic-semantic-equation";
}

function authorityIds(row: KpEquationSurfaceAuthorityRow): readonly string[] {
  return [
    ...row.compilerNodeIds,
    ...row.registryNodeIds,
    ...row.motifNodeIds,
    ...row.localTimingNodeIds,
    ...row.rendererInferenceNodeIds,
    row.sharedClockNodeId,
    ...row.fallbackNodeIds,
    ...row.directSamplerNodeIds
  ];
}

function node(
  id: string,
  category: KpEquationSurfaceAuthorityCategory,
  authority: KpEquationSurfaceAuthorityNode["authority"],
  sourcePath: `src/${string}.ts`,
  sourceNeedle: string,
  summary: string
): KpEquationSurfaceAuthorityNode {
  return Object.freeze({
    id,
    category,
    authority,
    sourcePath,
    sourceNeedle,
    summary
  });
}

function rule(
  transformationTypes: readonly string[],
  nodeIds: readonly string[]
): {
  readonly transformationTypes: readonly string[];
  readonly nodeIds: readonly string[];
} {
  return Object.freeze({
    transformationTypes: Object.freeze(transformationTypes),
    nodeIds: Object.freeze(nodeIds)
  });
}

function uniqueIds<T extends { readonly id: string }>(
  values: readonly T[],
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.id)) {
      diagnostics.push(`Duplicate ${label} id ${value.id}.`);
      continue;
    }
    byId.set(value.id, value);
  }
  return byId;
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
