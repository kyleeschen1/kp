export type KpCanonicalAnimationApiBoundaryKind =
  | "supported-public"
  | "separate-public"
  | "canonical-vocabulary"
  | "subsystem-internal";

export interface KpCanonicalAnimationApiBoundary {
  readonly id: string;
  readonly path: `src/${string}/public-api.ts`;
  readonly kind: KpCanonicalAnimationApiBoundaryKind;
  readonly authority: string;
  readonly runtimeExports: readonly string[];
  readonly callerExamples: readonly string[];
  readonly exclusions: readonly string[];
}

/**
 * This is an architecture map, not an import barrel. Keeping it data-only lets
 * documentation and conformance tests agree without pulling optional runtime
 * capabilities into the default application closure.
 */
export const kpCanonicalAnimationApiMap = Object.freeze([
  boundary({
    id: "animation-authoring",
    path: "src/animation/public-api.ts",
    kind: "supported-public",
    authority: "Construct and validate canonical balanced-solve animation assets.",
    runtimeExports: [
      "createKpCanonicalBalancedSolveAnimationAsset",
      "validateKpAnimationAsset"
    ],
    callerExamples: [
      "src/animation/fraction-composition-equation-adapter.ts",
      "src/animation/verified-linear-problem-animation-compiler.ts"
    ],
    exclusions: [
      "builders",
      "domain presenters",
      "provider clients",
      "reader state",
      "renderer state",
      "motif registries"
    ]
  }),
  boundary({
    id: "concept-publication",
    path: "src/authoring/public-api.ts",
    kind: "separate-public",
    authority: "Define, validate, and publish concept manifests.",
    runtimeExports: [
      "KpPublicationFitnessError",
      "assertConceptPublicationFit",
      "canonicalJson",
      "conceptAssetReferenceSchema",
      "conceptCapabilityRefSchema",
      "conceptProviderRefSchema",
      "createConceptDraft",
      "defineCapability",
      "defineConceptCatalog",
      "defineConceptScope",
      "defineProviderRef",
      "definePublicationEnvironment",
      "draftConceptManifestSchema",
      "evaluateConceptPublicationFitness",
      "publishConceptDraft",
      "publishedConceptArtifactSchema",
      "publishedConceptManifestSchema",
      "verifyPublishedConceptArtifact"
    ],
    callerExamples: ["src/bootstrap.ts"],
    exclusions: ["animation assets", "timing", "geometry", "rendering"]
  }),
  boundary({
    id: "provider-integration",
    path: "src/integrations/public-api.ts",
    kind: "separate-public",
    authority: "Fetch, map, and verify external problem traces.",
    runtimeExports: [
      "KpLinearProblemClientError",
      "createLinearProblemClient",
      "inspectVerifiedLinearProblemAnimationTrace",
      "kpVerifiedLinearProblemAnimationOperations",
      "mapLinearProblemToKpTrace"
    ],
    callerExamples: [
      "src/animation/verified-linear-problem-animation-compiler.ts",
      "src/tutorial/verified-generated-linear-solve-session.ts"
    ],
    exclusions: ["animation timing", "animation geometry", "learner prose"]
  }),
  boundary({
    id: "equation-motif-vocabulary",
    path: "src/animation/motifs/public-api.ts",
    kind: "canonical-vocabulary",
    authority: "Expose the renderer-neutral equation motif vocabulary.",
    runtimeExports: [
      "checkEquationCancelationVisualMotifContract",
      "checkGeneratedAlgebraEquationVisualMotifDefaultCoverage",
      "checkTransformTreeVisualMotifRewindLaw",
      "cloneVisualMotifPlan",
      "compileKpExecutableMotifComposition",
      "createTransformTreeVisualMotifTimeline",
      "createVisualMotifPlan",
      "defaultEquationTransformVisualMotifRules",
      "equationVisualMotifDescriptors",
      "equationVisualMotifPhaseIds",
      "isKpVerifiedExecutableSuccessorMotifProgram",
      "kpExecutableMotifGrammar",
      "kpExecutableMotifGrammarVersion",
      "kpExecutableSuccessorMotifProgramSchemaVersion",
      "kpExecutableSuccessorMotifProgramVersion",
      "phaseIdsForEquationVisualMotifKind",
      "primitiveIdsForEquationVisualMotifKind",
      "resolveDefaultEquationTransformVisualMotifRule",
      "validateAndMintKpExecutableSuccessorMotifProgram"
    ],
    callerExamples: [],
    exclusions: [
      "universal motif registry",
      "graph presentation",
      "programming presentation",
      "renderer resources"
    ]
  }),
  internalBoundary(
    "reader-compiler",
    "src/reader/compiler/public-api.ts",
    "Compile reader documents, routes, static math, and hydration manifests."
  ),
  internalBoundary(
    "reader-runtime",
    "src/reader/runtime/public-api.ts",
    "Own reader clocks, controls, scheduling, URL state, and measured layout."
  ),
  internalBoundary(
    "reader-renderers",
    "src/reader/renderers/public-api.ts",
    "Project reader-specific render and material plans."
  )
] as const satisfies readonly KpCanonicalAnimationApiBoundary[]);

function internalBoundary(
  id: string,
  path: `src/${string}/public-api.ts`,
  authority: string
): KpCanonicalAnimationApiBoundary {
  return boundary({
    id,
    path,
    kind: "subsystem-internal",
    authority,
    runtimeExports: [],
    callerExamples: [],
    exclusions: ["cross-subsystem authoring compatibility promise"]
  });
}

function boundary(
  value: KpCanonicalAnimationApiBoundary
): KpCanonicalAnimationApiBoundary {
  return Object.freeze({
    ...value,
    runtimeExports: Object.freeze([...value.runtimeExports]),
    callerExamples: Object.freeze([...value.callerExamples]),
    exclusions: Object.freeze([...value.exclusions])
  });
}
