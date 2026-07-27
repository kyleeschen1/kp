import type {
  KpNativeKatexAtomLifecycle
} from "../rendering/native-katex-scene-compositor.ts";
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
  maximumProductionModules: 4,
  // The accepted paint-space handoff and resource lifecycle repairs stay in
  // the same four generic modules and vocabulary. This measured ceiling leaves
  // less than 1.1% headroom over the audited 128,628-byte implementation.
  maximumProductionSourceBytes: 130_000,
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
    policy.maximumProductionSourceBytes !== 130_000 ||
    policy.maximumExperimentRouteGzipGrowthBytes !== 12_000 ||
    policy.maximumReaderRouteRegressionRatio !== 0.05
  ) {
    issues.push("The accepted source or payload budgets changed.");
  }
  return Object.freeze(issues);
}
