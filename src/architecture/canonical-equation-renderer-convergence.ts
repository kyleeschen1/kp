import type {
  KpNativeKatexAtomLifecycle
} from "../rendering/native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexPaintKind
} from "../rendering/native-katex-rendered-scene.ts";

export const kpCanonicalEquationRendererConvergence = Object.freeze({
  schemaVersion: "kp.canonical-equation-renderer-convergence.v1",
  objective: "one-native-katex-scene-session",
  currentDefaultReaderRendererIds: Object.freeze([
    "renderer.equation-dom"
  ]),
  temporaryQueryRendererIds: Object.freeze([]),
  maximumDefaultReaderRenderers: 1,
  maximumTemporaryQueryRenderers: 0,
  targetTemporaryQueryRenderers: 0,
  paintKinds: Object.freeze([
    "glyph",
    "rule",
    "path",
    "delimiter",
    "accent"
  ] as const satisfies readonly KpNativeKatexPaintKind[]),
  atomLifecycles: Object.freeze([
    "persist",
    "merge",
    "split",
    "introduce",
    "eliminate",
    "unsupported"
  ] as const satisfies readonly KpNativeKatexAtomLifecycle[]),
  maximumPaintKinds: 5,
  maximumAtomLifecycles: 6,
  productionSourceFiles: Object.freeze([
    "src/rendering/native-katex-fragment-observer.ts",
    "src/rendering/native-katex-glyph-compositor.ts",
    "src/rendering/native-katex-rendered-scene.ts",
    "src/rendering/native-katex-scene-compositor.ts"
  ]),
  productionDirectDependencySourceFiles: Object.freeze([
    "src/animation/canonical-operation-lineage-adapter.ts",
    "src/animation/equation-shared-presentation-policy.ts",
    "src/animation/lineage-constrained-glyph-matcher.ts",
    "src/animation/structural-succession-presentation.ts",
    "src/rendering/computed-style-clone.ts",
    "src/rendering/equation-font-readiness.ts",
    "src/rendering/equation-material-layer-dom.ts",
    "src/rendering/equation-material-owner.ts",
    "src/rendering/native-katex-base-scene-plan.ts",
    "src/rendering/native-katex-endpoint-ownership.ts",
    "src/rendering/native-katex-paint-geometry.ts",
    "src/rendering/native-katex-scene-track-contract.ts",
    "src/rendering/native-katex-scene-track-sampling.ts",
    "src/rendering/native-katex-structural-succession-renderer.ts",
    "src/rendering/native-katex-successor-synthesis.ts"
  ]),
  productionScenePlanBoundarySourceFiles: Object.freeze([
    "src/animation/canonical-operation-lineage-adapter.ts",
    "src/animation/equation-shared-presentation-policy.ts",
    "src/animation/lineage-constrained-glyph-matcher.ts",
    "src/animation/structural-succession-presentation.ts",
    "src/animation/symbol-motion-contract.ts",
    "src/rendering/equation-layout-types.ts",
    "src/rendering/equation-linear-rearrangement-frame.ts",
    "src/rendering/equation-motion-path-planner.ts",
    "src/rendering/native-katex-base-scene-plan.ts",
    "src/rendering/native-katex-factoring-choreography.ts",
    "src/rendering/native-katex-fan-in-motion.ts",
    "src/rendering/native-katex-operation-choreography.ts",
    "src/rendering/native-katex-scene-contribution.ts",
    "src/rendering/native-katex-scene-assembly.ts",
    "src/rendering/native-katex-scene-track-contract.ts",
    "src/rendering/native-katex-successor-synthesis.ts",
    "src/rendering/native-katex-symbol-motion.ts",
    "src/rendering/native-katex-track-projection.ts"
  ]),
  productionRendererSupportSourceFiles: Object.freeze([
    "src/rendering/computed-style-clone.ts",
    "src/rendering/equation-font-readiness.ts",
    "src/rendering/equation-material-layer-dom.ts",
    "src/rendering/equation-material-owner.ts",
    "src/rendering/native-katex-endpoint-ownership.ts",
    "src/rendering/native-katex-paint-geometry.ts",
    "src/rendering/native-katex-scene-track-sampling.ts",
    "src/rendering/native-katex-structural-succession-renderer.ts"
  ]),
  maximumProductionModules: 4,
  // Hierarchical endpoint ownership adds generic routing at the one compositor
  // boundary instead of introducing an equation-specific renderer. Keep the
  // ratchet close enough that a parallel implementation still cannot hide.
  maximumProductionSourceBytes: 150_000,
  // Freeze direct dependencies so core reductions cannot hide in helpers.
  maximumProductionDirectDependencyModules: 15,
  maximumProductionDirectDependencySourceBytes: 295_000,
  // Planner source receives responsibilities still embedded in the current
  // compositor. The aggregate ceiling, not this migration envelope, prevents
  // source from disappearing while those functions move to their true owner.
  maximumProductionScenePlanBoundaryModules: 20,
  maximumProductionScenePlanBoundarySourceBytes: 315_000,
  // Endpoint ownership is an explicit eighth support owner. Its bounded module
  // and byte allocation makes the extraction visible instead of hiding it in
  // the compositor or an unmeasured helper closure.
  maximumProductionRendererSupportModules: 8,
  maximumProductionRendererSupportSourceBytes: 80_000,
  maximumProductionAggregateModules: 31,
  // The aggregate now counts the endpoint owner alongside the already bounded
  // plan-boundary extraction and remains tighter than the partition ceilings.
  // Approved canonical factoring composition amendment; measured 512,619 bytes.
  // Accepted bounded extension-participation allowance; other cohorts stay fixed.
  maximumProductionAggregateSourceBytes: 530_000,
  maximumExperimentRouteGzipGrowthBytes: 12_000,
  maximumReaderRouteRegressionRatio: 0.05,
  forbiddenProductionVocabulary: Object.freeze([
    "fraction",
    "radical",
    "exponent",
    "root-notation",
    "quadratic",
    "plus-minus",
    "crowded",
    "phone",
    "wide"
  ])
} as const);

export function validateKpCanonicalEquationRendererConvergence(
  policy: typeof kpCanonicalEquationRendererConvergence
): readonly string[] {
  const issues: string[] = [];
  if (policy.objective !== "one-native-katex-scene-session") {
    issues.push("Canonical equation rendering must converge on one scene session.");
  }
  if (
    policy.currentDefaultReaderRendererIds.length >
      policy.maximumDefaultReaderRenderers ||
    new Set(policy.currentDefaultReaderRendererIds).size !==
      policy.currentDefaultReaderRendererIds.length
  ) {
    issues.push("The reader has more than one default equation renderer.");
  }
  if (
    policy.temporaryQueryRendererIds.length >
      policy.maximumTemporaryQueryRenderers ||
    new Set(policy.temporaryQueryRendererIds).size !==
      policy.temporaryQueryRendererIds.length
  ) {
    issues.push("The reader has more than one temporary query renderer.");
  }
  if (policy.targetTemporaryQueryRenderers !== 0) {
    issues.push("The canonical target cannot retain a query-selected renderer.");
  }
  if (
    policy.paintKinds.length !== policy.maximumPaintKinds ||
    new Set(policy.paintKinds).size !== policy.paintKinds.length
  ) {
    issues.push("The five-kind native paint vocabulary changed.");
  }
  if (
    policy.atomLifecycles.length !== policy.maximumAtomLifecycles ||
    new Set(policy.atomLifecycles).size !== policy.atomLifecycles.length
  ) {
    issues.push("The six-lifecycle native scene vocabulary changed.");
  }
  if (
    policy.productionSourceFiles.length >
      policy.maximumProductionModules ||
    new Set(policy.productionSourceFiles).size !==
      policy.productionSourceFiles.length
  ) {
    issues.push("The native scene core exceeds its production-module ceiling.");
  }
  if (
    policy.productionDirectDependencySourceFiles.length >
      policy.maximumProductionDirectDependencyModules ||
    new Set(policy.productionDirectDependencySourceFiles).size !==
      policy.productionDirectDependencySourceFiles.length
  ) {
    issues.push("The native scene core has an unbounded direct dependency closure.");
  }
  if (
    policy.maximumProductionSourceBytes !== 150_000 ||
    policy.maximumProductionDirectDependencyModules !== 15 ||
    policy.maximumProductionDirectDependencySourceBytes !== 295_000 ||
    policy.maximumProductionScenePlanBoundaryModules !== 20 ||
    policy.maximumProductionScenePlanBoundarySourceBytes !== 315_000 ||
    policy.maximumProductionRendererSupportModules !== 8 ||
    policy.maximumProductionRendererSupportSourceBytes !== 80_000 ||
    policy.maximumProductionAggregateModules !== 31 ||
    policy.maximumProductionAggregateSourceBytes !== 530_000 ||
    policy.maximumExperimentRouteGzipGrowthBytes !== 12_000 ||
    policy.maximumReaderRouteRegressionRatio !== 0.05
  ) {
    issues.push("The accepted source or payload budgets changed.");
  }
  return Object.freeze(issues);
}
