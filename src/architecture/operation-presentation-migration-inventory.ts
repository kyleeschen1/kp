export const kpOperationPresentationReaderPlanSeams = Object.freeze([
  readerPlanSeam(
    "required-transition-plan",
    "presentationPlan: KpReaderEquationTransitionPresentationPlan",
    "src/reader/renderers/equation-render-plan.ts"
  )
] as const);

export const kpOperationPresentationRendererInputs = Object.freeze([
  rendererInput("factoring", "factoring"),
  rendererInput("operation-choreography", "operationChoreography"),
  rendererInput("successor-syntheses", "successorSyntheses"),
  rendererInput("structural-succession", "structuralSuccession"),
  rendererInput("fan-in-routing", "fanInRouting"),
  rendererInput("copy-fan-out-routing", "copyFanOutRouting"),
  rendererInput("reorder-routing", "reorderRouting")
] as const);

export const kpOperationPresentationCancellationAuthoringSites = Object.freeze([
  cancellationSite(
    "fraction-composition",
    "src/semantic/fraction-composition-equation-asset.ts",
    "cancel("
  ),
  cancellationSite(
    "fractional-linear",
    "src/semantic/fractional-linear-equation-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "linear-solve",
    "src/semantic/linear-solve-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "divide-both-sides",
    "src/semantic/divide-both-sides-equation-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "generated-algebra",
    "src/semantic/generated-algebra-tutorial-fixture.ts",
    "\"cancelation\""
  )
] as const);

export const kpOperationPresentationEvidenceGaps = Object.freeze([] as const);

export const kpOperationPresentationEvidenceClosures = Object.freeze([
  evidenceClosure(
    "enumerated-native-cancellation",
    "tests/fraction-composition-cancellation-choreography-conformance.test.ts",
    "every discovered cancellation obeys role-complete forward and rewind laws",
    "Every fraction-composition cancellation is automatically checked for bundle geometry, opacity, continuants, and exact rewind."
  ),
  evidenceClosure(
    "distribution-factoring-role-totality",
    "tests/distribution-factoring-presentation-plan.test.ts",
    "parallel foldable fan-outs retain both verified operation plans",
    "Generated and foldable fan-out/fusion operations carry total material, continuant, artifact, and extracted-result roles."
  ),
  evidenceClosure(
    "fraction-structure-and-succession-role-totality",
    "tests/fraction-structural-presentation-plan.test.ts",
    "fraction split and merge own total fission/fusion material plans",
    "Fraction structure rewrites and radical succession carry verified renderer-neutral material ownership while preserving their established compositor behavior."
  ),
  evidenceClosure(
    "exhaustive-reader-compositor-dispatch",
    "tests/semantic-reader-equation-scene-compositor-adapter.test.ts",
    "the canonical adapter exhaustively dispatches the closed reader plan union",
    "The reader-to-compositor boundary switches once over every branded plan variant and cannot reconstruct independently optional presentation evidence."
  ),
  evidenceClosure(
    "catalog-wide-directional-plan-coverage",
    "tests/equation-presentation-catalog-conformance.test.ts",
    "every catalog equation operation has directional presentation coverage",
    "Every catalog equation operation is planned in forward and rewind, explicit static gaps remain visible, and only a fully verified animated catalog can pass promotion."
  ),
  evidenceClosure(
    "bounded-cross-axis-property-coverage",
    "tests/operation-presentation-bounded-properties.test.ts",
    "every bounded case is direct-seek stable and exactly reversible",
    "A fixed-size matrix covers semantic shapes, notation structures, operation families, viewport classes, boundary seek points, rewind, and compiler-owned generated variations without random or unbounded sampling."
  ),
  evidenceClosure(
    "release-authoring-boundary",
    "docs/project/reviews/2026-07-29-role-complete-operation-presentation-plans-closeout.md",
    "LLM authoring stops at mathematical and semantic intent.",
    "The release record fixes the only supported authoring path from semantic intent through trusted role derivation, branded validation, exhaustive dispatch, and native paint."
  )
] as const);

export const kpOperationEvaluationContinuityMigrationInventory = Object.freeze([
  continuityMigration(
    "raw-binding-paint-policy",
    "tests/contract-fixtures/paint-continuity-plan-types.ts",
    "A binary paint swap is not a legal ownership topology.",
    "removed",
    "s09",
    "Raw successor bindings no longer expose paint or handoff policy."
  ),
  continuityMigration(
    "renderer-binary-handoff",
    "src/rendering/native-katex-successor-synthesis.ts",
    "sharedJunctionSourcePose({",
    "removed",
    "s09",
    "The renderer now executes geometry-continuous shared-junction transfer."
  ),
  continuityMigration(
    "exact-fraction-local-motif",
    "src/rendering/exact-fraction-quantity-symbolic-projection.ts",
    'readonly motif: "successor-synthesis" | "operation-evaluation";',
    "must-remove",
    "s16",
    "The exemplar labels its own motif instead of resolving the registry."
  ),
  continuityMigration(
    "exact-fraction-local-path",
    "src/rendering/exact-fraction-quantity-symbolic-projection.ts",
    'materialPathFamily: "arc-below"',
    "must-remove",
    "s17",
    "The exemplar chooses a route that belongs to measured collision planning."
  ),
  continuityMigration(
    "reader-registry-compiler",
    "src/reader/renderers/equation-render-plan.ts",
    "compileKpRegisteredSuccessorSynthesisPresentation({",
    "canonical-route",
    "s07",
    "The canonical reader already resolves registered operation evaluation."
  ),
  continuityMigration(
    "matrix-vector-duration",
    "src/animation/matrix-vector-semantic-duration.ts",
    "planKpSemanticDuration({",
    "existing-shared-consumer",
    "s18",
    "Matrix-vector work already consumes the shared semantic duration planner."
  ),
  continuityMigration(
    "matrix-matrix-duration",
    "src/animation/matrix-matrix-semantic-duration.ts",
    "planKpSemanticDuration({",
    "existing-shared-consumer",
    "s18",
    "Matrix-matrix work already consumes the shared semantic duration planner."
  ),
  continuityMigration(
    "exact-fraction-duration",
    "src/animation/exact-fraction-quantity-adapter.ts",
    "durationMs: 7_500",
    "adoption-gap",
    "s18",
    "Exact fraction hard-codes one total instead of honoring action minima."
  )
] as const);

export type KpOperationEvaluationContinuityMigrationState =
  | "must-remove"
  | "removed"
  | "canonical-route"
  | "existing-shared-consumer"
  | "adoption-gap";

export interface KpOperationEvaluationContinuityMigrationEntry {
  readonly id: string;
  readonly sourcePath: string;
  readonly sourceNeedle: string;
  readonly state: KpOperationEvaluationContinuityMigrationState;
  readonly owningSlice: `s${number}`;
  readonly summary: string;
}

export type KpOperationPresentationMigrationState =
  | "internal-projection-primitive"
  | "verified-plan";

export interface KpOperationPresentationMigrationInventoryEntry {
  readonly id: string;
  readonly sourcePath: string;
  readonly sourceNeedle: string;
  readonly state: KpOperationPresentationMigrationState;
  readonly summary: string;
}

function readerPlanSeam(
  id: string,
  sourceNeedle: string,
  sourcePath: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `reader-plan-seam.${id}`,
    sourcePath,
    sourceNeedle,
    state: "verified-plan" as const,
    summary:
      "Every reader transition crosses one branded required presentation plan."
  });
}

function rendererInput(
  id: string,
  sourceNeedle: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `renderer-input.${id}`,
    sourcePath: "src/rendering/native-katex-scene-compositor.ts",
    sourceNeedle,
    state: "internal-projection-primitive" as const,
    summary:
      "Only the exhaustive reader adapter may project a verified plan into this internal compositor primitive."
  });
}

function cancellationSite(
  id: string,
  sourcePath: string,
  sourceNeedle: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `cancellation-authoring.${id}`,
    sourcePath,
    sourceNeedle,
    state: "verified-plan" as const,
    summary:
      "Semantic cancellation remains renderer-neutral; a trusted compiler derives and validates complete presentation roles before rendering."
  });
}

function evidenceClosure(
  id: string,
  sourcePath: string,
  sourceNeedle: string,
  summary: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `evidence-closure.${id}`,
    sourcePath,
    sourceNeedle,
    state: "verified-plan" as const,
    summary
  });
}

function continuityMigration(
  id: string,
  sourcePath: string,
  sourceNeedle: string,
  state: KpOperationEvaluationContinuityMigrationState,
  owningSlice: `s${number}`,
  summary: string
): KpOperationEvaluationContinuityMigrationEntry {
  return Object.freeze({
    id: `operation-continuity.${id}`,
    sourcePath,
    sourceNeedle,
    state,
    owningSlice,
    summary
  });
}
