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
    "catalog separates executable routes from generic presentation labels",
    "Every catalog equation operation is inspected in forward and rewind; verified routes, explicit static checkpoints, and generic label-only gaps remain distinct, and only a fresh fully executable report can pass promotion."
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
    "sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis({",
    "removed",
    "s15",
    "The renderer now executes bounded opaque co-presence from the shared canonical sampler."
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

/**
 * This ledger makes the replacement boundary reviewable before the new
 * program types exist. A semantic label, a sampler call, and promotion
 * evidence are separate authority seams; conflating them is how a legal motif
 * name previously reached a generic runtime while still looking "ported".
 */
export const kpExecutableMotifMigrationLedger = Object.freeze([
  executableMotifMigration(
    "label.operation-evaluation-registry",
    "label-declaration",
    "src/animation/operation-evaluation-presentation-registry.ts",
    'motifKind: "successor-synthesis"',
    "replace-with-program",
    "s07",
    "The registry currently pins a shared motif label, not an executable program."
  ),
  executableMotifMigration(
    "label.fraction-material-plan",
    "label-declaration",
    "src/animation/operation-presentation-plan-types.ts",
    'readonly operation: "fission" | "fusion";',
    "replace-with-program",
    "s08",
    "Fraction role plans name fission or fusion without carrying executable phase authority."
  ),
  executableMotifMigration(
    "consumer.successor-core-sampler",
    "renderer-consumer",
    "src/animation/successor-synthesis.ts",
    "export function sampleKpSuccessorSynthesis(",
    "preserve-primitive",
    "preserve",
    "The pure successor sampler remains an internal primitive below executable program dispatch."
  ),
  executableMotifMigration(
    "consumer.reader-registry-compiler",
    "renderer-consumer",
    "src/reader/renderers/equation-render-plan.ts",
    "compileKpRegisteredSuccessorSynthesisPresentation({",
    "evolve-canonical-route",
    "s07",
    "The reader already resolves one registered successor presentation and will receive the program beside its role plan."
  ),
  executableMotifMigration(
    "consumer.canonical-native-successor",
    "renderer-consumer",
    "src/rendering/native-katex-successor-synthesis.ts",
    "sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis({",
    "evolve-canonical-route",
    "s15",
    "The canonical native renderer must consume only an exhaustively dispatched program projection."
  ),
  executableMotifMigration(
    "consumer.dev-reference-successor",
    "renderer-consumer",
    "src/editor/operation-evaluation-reference-comparison.dev.ts",
    "sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis({",
    "diagnostic-only",
    "preserve",
    "The development comparison projects the same pure sampler; it cannot independently author production behavior."
  ),
  executableMotifMigration(
    "consumer.compatibility-token-successor",
    "renderer-consumer",
    "src/rendering/equation-linear-rearrangement.ts",
    "sampleKpSuccessorSynthesis({",
    "compatibility-only",
    "s10",
    "The DOM-centric token renderer remains available to legacy callers but must never mint executable or ported evidence."
  ),
  executableMotifMigration(
    "consumer.reader-fraction-generic-routing",
    "renderer-consumer",
    "src/reader/renderers/equation-scene-compositor-adapter.ts",
    'case "fraction-material":',
    "replace-with-program",
    "s09",
    "Fraction material currently selects generic routing from a motif string rather than exhaustive fission/fusion execution."
  ),
  executableMotifMigration(
    "consumer.fission-fusion-core-sampler",
    "renderer-consumer",
    "src/animation/fission-fusion.ts",
    "export function sampleKpFissionFusion(",
    "preserve-primitive",
    "preserve",
    "The pure identity-transfer sampler remains reusable beneath the sealed program variants."
  ),
  executableMotifMigration(
    "consumer.exact-fraction-fission-fusion",
    "renderer-consumer",
    "src/rendering/exact-fraction-quantity-runtime.ts",
    "sampleKpFissionFusion({",
    "replace-with-program",
    "s20",
    "Exact fraction directly samples local fission/fusion plans and must adopt the shared program route."
  ),
  executableMotifMigration(
    "consumer.factoring-fission-fusion",
    "renderer-consumer",
    "src/rendering/native-katex-factoring-choreography.ts",
    "sampleKpFissionFusion({",
    "protected-existing-consumer",
    "preserve",
    "Approved factoring remains outside this bounded migration and keeps its established typed choreography."
  ),
  executableMotifMigration(
    "consumer.quadratic-fission-fusion",
    "renderer-consumer",
    "src/animation/quadratic-branch-choreography.ts",
    "sampleKpFissionFusion({",
    "protected-existing-consumer",
    "preserve",
    "Approved quadratic branch choreography remains outside this bounded migration."
  ),
  executableMotifMigration(
    "consumer.quadratic-runtime-fission-fusion",
    "renderer-consumer",
    "src/reader/app/quadratic-branching-runtime.ts",
    "sampleKpFissionFusion({",
    "protected-existing-consumer",
    "preserve",
    "The existing quadratic reader remains an explicitly protected direct consumer."
  ),
  executableMotifMigration(
    "fallback.registry-explicit-static",
    "generic-fallback",
    "src/animation/operation-evaluation-presentation-registry.ts",
    'status: "explicit-static"',
    "preserve-fail-closed",
    "s07",
    "Unsupported registry work must remain an inspectable static checkpoint."
  ),
  executableMotifMigration(
    "fallback.reader-explicit-static",
    "generic-fallback",
    "src/reader/renderers/equation-render-plan.ts",
    'successorStaticCheckpoint?.status === "explicit-static"',
    "preserve-fail-closed",
    "s08",
    "The reader must preserve explicit static output rather than substitute generic animation."
  ),
  executableMotifMigration(
    "fallback.token-continuity-derivation",
    "generic-fallback",
    "src/rendering/equation-linear-rearrangement.ts",
    "return sampleContinuityConstantDerivation(input);",
    "compatibility-only",
    "s10",
    "Legacy token continuity may render but cannot satisfy executable-program or promotion evidence."
  ),
  executableMotifMigration(
    "continuity.registry-zero-area",
    "zero-area-transfer",
    "src/animation/operation-evaluation-presentation-registry.ts",
    'transferTopology: "bounded-semantic-contact-co-presence"',
    "evolve-canonical-route",
    "s15",
    "The registry now carries the nominal program-compatible co-presence compiler instead of universal zero-area transfer."
  ),
  executableMotifMigration(
    "continuity.renderer-source-collapse",
    "zero-area-transfer",
    "src/animation/successor-synthesis.ts",
    "sources: Object.freeze(frame.sources.map(",
    "evolve-canonical-route",
    "s15",
    "The canonical sampler retires opaque source geometry only while result paint is co-present."
  ),
  executableMotifMigration(
    "continuity.renderer-target-opening",
    "zero-area-transfer",
    "src/animation/successor-synthesis.ts",
    "targets: Object.freeze(frame.targets.map(",
    "evolve-canonical-route",
    "s15",
    "The same canonical sampler establishes opaque target geometry before source retirement completes."
  ),
  executableMotifMigration(
    "endpoint.successor-owned-target-bypass",
    "endpoint-bypass",
    "src/rendering/native-katex-scene-compositor.ts",
    "A successor synthesis owns its target paint directly.",
    "route-through-endpoint-microscope",
    "s14",
    "Successor-owned target atoms currently bypass dense typography handoff inspection."
  ),
  executableMotifMigration(
    "promotion.operation-evaluation",
    "promotion-evidence",
    "src/editor/animation-library-display-catalog-builder.ts",
    '"animation.operation-evaluation.one-plus-two"',
    "gate-on-executable-evidence",
    "s10",
    "Operation evaluation stays partial until the active run mints exact program, route, continuity, endpoint, browser, and human-review evidence."
  ),
  executableMotifMigration(
    "promotion.exact-fraction",
    "promotion-evidence",
    "src/editor/animation-library-display-catalog-builder.ts",
    '"animation.exact-fraction-quantity.third-plus-sixth"',
    "gate-on-executable-evidence",
    "s10",
    "Exact fraction stays partial until shared executable-program adoption and complete evidence certification."
  )
] as const);

export type KpExecutableMotifMigrationCategory =
  | "label-declaration"
  | "renderer-consumer"
  | "generic-fallback"
  | "zero-area-transfer"
  | "endpoint-bypass"
  | "promotion-evidence";

export type KpExecutableMotifMigrationState =
  | "replace-with-program"
  | "remove-compatibility"
  | "preserve-primitive"
  | "evolve-canonical-route"
  | "diagnostic-only"
  | "compatibility-only"
  | "protected-existing-consumer"
  | "preserve-fail-closed"
  | "replace-with-program-compatible-continuity"
  | "route-through-endpoint-microscope"
  | "gate-on-executable-evidence";

export interface KpExecutableMotifMigrationEntry {
  readonly id: string;
  readonly category: KpExecutableMotifMigrationCategory;
  readonly sourcePath: string;
  readonly sourceNeedle: string;
  readonly state: KpExecutableMotifMigrationState;
  readonly owningSlice: `s${number}` | "preserve";
  readonly summary: string;
}

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

function executableMotifMigration(
  id: string,
  category: KpExecutableMotifMigrationCategory,
  sourcePath: string,
  sourceNeedle: string,
  state: KpExecutableMotifMigrationState,
  owningSlice: KpExecutableMotifMigrationEntry["owningSlice"],
  summary: string
): KpExecutableMotifMigrationEntry {
  return Object.freeze({
    id: `executable-motif.${id}`,
    category,
    sourcePath,
    sourceNeedle,
    state,
    owningSlice,
    summary
  });
}
