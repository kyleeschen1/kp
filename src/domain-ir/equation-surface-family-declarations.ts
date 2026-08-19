export type KpEquationSelectedSurfaceCapability =
  | "equation-katex"
  | "fraction-equivalence"
  | "log-exponent"
  | "logarithm-change-of-base"
  | "log-quotient"
  | "log-product"
  | "exact-fraction-quantity"
  | "operation-evaluation"
  | "place-value-addition";

export type KpEquationPrimarySurfaceCapability =
  | "equation-katex"
  | "fraction-equivalence"
  | "log-exponent"
  | "logarithm-change-of-base"
  | "log-quotient"
  | "log-product"
  | "operation-evaluation";

export type KpDeclaredEquationSurfaceDisposition =
  | "canonical"
  | "adapter-backed"
  | "static-only"
  | "unsupported"
  | "retirement-candidate";

export type KpDeclaredEquationMigrationWave =
  | "wave-a-operation-plan"
  | "wave-b-structural-native-math"
  | "wave-c-generated-bespoke-diagnostic-static";

export type KpEquationPresentationRoute =
  | "declared-operation-plan"
  | "declared-structural-recipe"
  | "specialized-native-adapter"
  | "declared-semantic-transition"
  | "declared-static-layer-transition"
  | "declared-diagnostic-transition"
  | "retirement-negative-fixture"
  | "unsupported-static-hold";

export type KpEquationOperationPlanRecipeId =
  | "recipe.operation-plan.identity-absorption.v1"
  | "recipe.operation-plan.inverse-cancellation.v1"
  | "recipe.operation-plan.distribution.v1"
  | "recipe.operation-plan.factoring.v1"
  | "recipe.operation-plan.linear-rearrangement.v1"
  | "recipe.operation-plan.successor-synthesis.v1";

export type KpEquationStructuralRecipeId =
  | "recipe.equation.exponent-expansion.v1"
  | "recipe.equation.fraction-material.v1"
  | "recipe.equation.fraction-equivalence.v1"
  | "recipe.equation.function-application.v1"
  | "recipe.equation.log-exponent.v1"
  | "recipe.equation.change-logarithm-base.v1"
  | "recipe.equation.log-quotient-fusion.v1"
  | "recipe.equation.dot-product-traversal.v1"
  | "recipe.equation.matrix-matrix-composition.v1"
  | "recipe.equation.matrix-vector-composition.v1"
  | "recipe.equation.radical-succession.v1";

export type KpEquationRuntimeBindingId =
  | "runtime-binding.semantic-motion.inverse-cancellation.v1"
  | "runtime-binding.distribution-pressure.v1";

export type KpEquationMaterialContinuityId =
  | "material-continuity.solve-x-linear-rearrangement.v1"
  | "material-continuity.radical-native-settlement.v1";

export type KpEquationExplanationProjectionId =
  "explanation-projection.exponent-fluent-unit-omission.v1";

export type KpEquationStructuralAugmentationId =
  "structural-augmentation.matrix-vector-rank6-linear-map.v1";

export interface KpWaveAEquationOperationPlanDeclaration {
  readonly animationId: string;
  readonly recipeIds: readonly KpEquationOperationPlanRecipeId[];
  readonly runtimeBindingIds: readonly KpEquationRuntimeBindingId[];
  readonly materialContinuityId?: KpEquationMaterialContinuityId | undefined;
  readonly authority:
    | "verified-operation-plan"
    | "semantic-correspondence-recipe";
  readonly recipeOwnerPaths: readonly string[];
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22" | undefined;
}

export interface KpWaveBEquationStructuralDeclaration {
  readonly animationId: string;
  readonly recipeIds: readonly KpEquationStructuralRecipeId[];
  readonly materialContinuityId?: KpEquationMaterialContinuityId | undefined;
  readonly explanationProjectionId?:
    KpEquationExplanationProjectionId | undefined;
  readonly structuralAugmentationId?:
    KpEquationStructuralAugmentationId | undefined;
  readonly recipeOwnerPaths: readonly string[];
  readonly authority: "typed-structural-recipe";
}

export type KpWaveCEquationClassification =
  | "generated-bespoke"
  | "diagnostic"
  | "static-only"
  | "unsupported"
  | "retirement-candidate";

export interface KpWaveCEquationDispositionDeclaration {
  readonly animationId: string;
  readonly classification: KpWaveCEquationClassification;
  readonly disposition: KpDeclaredEquationSurfaceDisposition;
  readonly presentationRoute: Extract<
    KpEquationPresentationRoute,
    | "specialized-native-adapter"
    | "declared-semantic-transition"
    | "declared-static-layer-transition"
    | "declared-diagnostic-transition"
    | "retirement-negative-fixture"
    | "unsupported-static-hold"
  >;
  readonly authoritySourcePath: string;
  readonly genericLayerTransition: "declared" | "forbidden";
  readonly rationale: string;
}

export interface KpEquationSurfaceFamilyProjection {
  readonly selectedCapabilityIds:
    readonly KpEquationSelectedSurfaceCapability[];
  readonly primaryCapabilityId: KpEquationPrimarySurfaceCapability;
  readonly rendererAdapterId: string;
  readonly rendererSourcePath: string;
  readonly disposition: KpDeclaredEquationSurfaceDisposition;
  readonly migrationWave: KpDeclaredEquationMigrationWave;
  readonly presentationRoute: KpEquationPresentationRoute;
  readonly waveCClassification?: KpWaveCEquationClassification | undefined;
  readonly genericLayerTransition: "declared" | "legacy" | "forbidden";
  readonly operationPlanRecipeIds:
    readonly KpEquationOperationPlanRecipeId[];
  readonly runtimeBindingIds: readonly KpEquationRuntimeBindingId[];
  readonly materialContinuityId?: KpEquationMaterialContinuityId | undefined;
  readonly structuralRecipeIds: readonly KpEquationStructuralRecipeId[];
  readonly explanationProjectionId?:
    KpEquationExplanationProjectionId | undefined;
  readonly structuralAugmentationId?:
    KpEquationStructuralAugmentationId | undefined;
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22" | undefined;
}

interface KpEquationSurfaceFamilyDeclaration {
  readonly id: string;
  readonly matches: (animationId: string) => boolean;
  readonly selectedCapabilityIds:
    readonly KpEquationSelectedSurfaceCapability[];
  readonly primaryCapabilityId: KpEquationPrimarySurfaceCapability;
  readonly rendererAdapterId: string;
  readonly rendererSourcePath: string;
}

export const kpEquationSurfaceFamilyDeclarations:
readonly KpEquationSurfaceFamilyDeclaration[] = Object.freeze([
  declaration({
    id: "family.equation.carrier-preserving-simplification",
    matches: (id) => id ===
      "animation.operation-evaluation.two-times-one-carrier",
    selectedCapabilityIds: ["operation-evaluation", "equation-katex"],
    primaryCapabilityId: "operation-evaluation",
    rendererAdapterId:
      "editor-animation-surface.operation-evaluation.carrier-preserving-simplification",
    rendererSourcePath:
      "src/editor/carrier-preserving-simplification-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.exact-fraction-quantity",
    matches: (id) => id === "animation.exact-fraction-quantity.third-plus-sixth",
    selectedCapabilityIds: ["exact-fraction-quantity", "equation-katex"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.place-value-addition",
    matches: (id) => id === "animation.place-value-addition.278-plus-156",
    selectedCapabilityIds: ["place-value-addition"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.operation-evaluation",
    matches: (id) => id.startsWith("animation.operation-evaluation."),
    selectedCapabilityIds: ["operation-evaluation", "equation-katex"],
    primaryCapabilityId: "operation-evaluation",
    rendererAdapterId:
      "editor-animation-surface.operation-evaluation.canonical-native-katex",
    rendererSourcePath: "src/editor/operation-evaluation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-exponent",
    matches: (id) => id === "animation.algebra.log-exponent.solve-two-power-x",
    selectedCapabilityIds: ["log-exponent"],
    primaryCapabilityId: "log-exponent",
    rendererAdapterId:
      "editor-animation-surface.log-exponent.canonical-native-katex",
    rendererSourcePath: "src/editor/log-exponent-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.common-denominator-pressure",
    matches: (id) => id ===
      "animation.equation.fraction-equivalence.common-denominator-pressure.v1",
    selectedCapabilityIds: ["fraction-equivalence"],
    primaryCapabilityId: "fraction-equivalence",
    rendererAdapterId:
      "editor-animation-surface.fraction-equivalence.common-denominator-pressure",
    rendererSourcePath:
      "src/editor/common-denominator-pressure-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.fraction-equivalence",
    matches: (id) =>
      id.startsWith("animation.equation.fraction-equivalence."),
    selectedCapabilityIds: ["fraction-equivalence"],
    primaryCapabilityId: "fraction-equivalence",
    rendererAdapterId:
      "editor-animation-surface.fraction-equivalence.canonical-native-katex",
    rendererSourcePath:
      "src/editor/fraction-equivalence-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.logarithm-change-of-base",
    matches: (id) => id === "animation.equation.logarithm-change-of-base.v1",
    selectedCapabilityIds: ["logarithm-change-of-base"],
    primaryCapabilityId: "logarithm-change-of-base",
    rendererAdapterId:
      "editor-animation-surface.logarithm-change-of-base.canonical-native-katex",
    rendererSourcePath:
      "src/editor/logarithm-change-of-base-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-quotient",
    matches: (id) => id === "animation.algebra.log-quotient.difference-to-quotient",
    selectedCapabilityIds: ["log-quotient"],
    primaryCapabilityId: "log-quotient",
    rendererAdapterId:
      "editor-animation-surface.log-quotient.canonical-native-katex",
    rendererSourcePath: "src/editor/log-quotient-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-product",
    matches: (id) => id.startsWith("animation.algebra.log-product."),
    selectedCapabilityIds: ["log-product"],
    primaryCapabilityId: "log-product",
    rendererAdapterId:
      "editor-animation-surface.log-product.canonical-native-katex",
    rendererSourcePath: "src/editor/log-product-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.generic-katex",
    matches: () => true,
    selectedCapabilityIds: ["equation-katex"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  })
]);

export const kpWaveAEquationOperationPlanDeclarations:
readonly KpWaveAEquationOperationPlanDeclaration[] = Object.freeze([
  operationPlan({
    animationId: "animation.generated.add-zero",
    recipeIds: ["recipe.operation-plan.identity-absorption.v1"],
    authority: "semantic-correspondence-recipe",
    recipeOwnerPaths: [
      "src/animation/identity-absorption-choreography.ts"
    ]
  }),
  operationPlan({
    animationId: "animation.generated.cancellation.additive-inverses",
    recipeIds: ["recipe.operation-plan.inverse-cancellation.v1"],
    runtimeBindingIds: [
      "runtime-binding.semantic-motion.inverse-cancellation.v1"
    ],
    recipeOwnerPaths: [
      "src/animation/cancellation-operation-presentation-plan.ts",
      "src/semantic/cancellation-pressure-semantic-motion.ts"
    ],
    preCheckpointAdapterSlice: "s22"
  }),
  operationPlan({
    animationId: "animation.generated.distribution.expand-a-sum",
    recipeIds: ["recipe.operation-plan.distribution.v1"],
    runtimeBindingIds: ["runtime-binding.distribution-pressure.v1"],
    recipeOwnerPaths: [
      "src/animation/distribution-factoring-presentation-plan.ts",
      "src/animation/distribution-pressure-animation.ts"
    ],
    preCheckpointAdapterSlice: "s21"
  }),
  operationPlan({
    animationId: "animation.generated.distribution.factor-common-a",
    recipeIds: ["recipe.operation-plan.factoring.v1"],
    recipeOwnerPaths: [
      "src/animation/distribution-factoring-presentation-plan.ts"
    ],
    preCheckpointAdapterSlice: "s21"
  }),
  operationPlan({
    animationId: "animation.generated.linear-solve.linear-68c15d41",
    recipeIds: [
      "recipe.operation-plan.linear-rearrangement.v1",
      "recipe.operation-plan.inverse-cancellation.v1",
      "recipe.operation-plan.successor-synthesis.v1"
    ],
    recipeOwnerPaths: [
      "src/animation/linear-rearrangement-choreography.ts",
      "src/animation/cancellation-operation-presentation-plan.ts",
      "src/animation/successor-synthesis-presentation-plan.ts"
    ]
  }),
  operationPlan({
    animationId: "animation.linear-solve.solve-x",
    recipeIds: [
      "recipe.operation-plan.linear-rearrangement.v1",
      "recipe.operation-plan.inverse-cancellation.v1",
      "recipe.operation-plan.successor-synthesis.v1"
    ],
    materialContinuityId:
      "material-continuity.solve-x-linear-rearrangement.v1",
    recipeOwnerPaths: [
      "src/animation/linear-rearrangement-choreography.ts",
      "src/animation/cancellation-operation-presentation-plan.ts",
      "src/animation/successor-synthesis-presentation-plan.ts"
    ]
  }),
  ...[
    "animation.operation-evaluation.five-plus-two",
    "animation.operation-evaluation.one-plus-two",
    "animation.operation-evaluation.three-sixths",
    "animation.operation-evaluation.two-times-three"
  ].map((animationId) => operationPlan({
    animationId,
    recipeIds: ["recipe.operation-plan.successor-synthesis.v1"],
    recipeOwnerPaths: [
      "src/animation/operation-evaluation-presentation-registry.ts"
    ]
  }))
]);
const waveAIds = Object.freeze(
  kpWaveAEquationOperationPlanDeclarations.map(({ animationId }) => animationId)
);
const waveAOperationPlanByAnimationId = Object.freeze(Object.fromEntries(
  kpWaveAEquationOperationPlanDeclarations.map((entry) => [
    entry.animationId,
    entry
  ])
)) as Readonly<Record<string, KpWaveAEquationOperationPlanDeclaration>>;
export const kpWaveBEquationStructuralDeclarations:
readonly KpWaveBEquationStructuralDeclaration[] = Object.freeze([
  structural({
    animationId: "animation.algebra.log-exponent.solve-two-power-x",
    recipeIds: ["recipe.equation.log-exponent.v1"],
    recipeOwnerPaths: ["src/editor/log-exponent-surface-adapter.ts"]
  }),
  structural({
    animationId: "animation.equation.logarithm-change-of-base.v1",
    recipeIds: [
      "recipe.equation.change-logarithm-base.v1",
      "recipe.equation.fraction-material.v1",
      "recipe.equation.function-application.v1"
    ],
    recipeOwnerPaths: [
      "src/animation/logarithm-change-of-base-presentation-plan.ts",
      "src/animation/function-wrap-motif.ts"
    ]
  }),
  structural({
    animationId: "animation.algebra.log-quotient.difference-to-quotient",
    recipeIds: [
      "recipe.equation.log-quotient-fusion.v1",
      "recipe.equation.function-application.v1"
    ],
    recipeOwnerPaths: [
      "src/editor/log-quotient-surface-adapter.ts",
      "src/animation/function-wrap-motif.ts"
    ]
  }),
  structural({
    animationId: "animation.generated.exponent.square-as-product",
    recipeIds: ["recipe.equation.exponent-expansion.v1"],
    explanationProjectionId:
      "explanation-projection.exponent-fluent-unit-omission.v1",
    recipeOwnerPaths: ["src/animation/exponent-law-choreography.ts"]
  }),
  structural({
    animationId: "animation.generated.fraction-expression.two-fourths",
    recipeIds: ["recipe.equation.fraction-material.v1"],
    recipeOwnerPaths: ["src/animation/fraction-choreography.ts"]
  }),
  structural({
    animationId: "animation.generated.function-wrap.apply-f",
    recipeIds: ["recipe.equation.function-application.v1"],
    recipeOwnerPaths: ["src/animation/function-wrap-motif.ts"]
  }),
  structural({
    animationId: "animation.generated.linear-algebra.dot-product.three-vector",
    recipeIds: ["recipe.equation.dot-product-traversal.v1"],
    recipeOwnerPaths: ["src/animation/dot-product-traversal-choreography.ts"]
  }),
  structural({
    animationId: "animation.generated.linear-algebra.matrix-matrix.two-by-two",
    recipeIds: ["recipe.equation.matrix-matrix-composition.v1"],
    recipeOwnerPaths: [
      "src/animation/matrix-matrix-composition-choreography.ts"
    ]
  }),
  structural({
    animationId: "animation.generated.linear-algebra.matrix-vector.two-by-two",
    recipeIds: ["recipe.equation.matrix-vector-composition.v1"],
    structuralAugmentationId:
      "structural-augmentation.matrix-vector-rank6-linear-map.v1",
    recipeOwnerPaths: [
      "src/animation/matrix-vector-composition-choreography.ts",
      "src/animation/matrix-linear-map-frame.ts"
    ]
  }),
  structural({
    animationId: "animation.generated.radical.square-root-as-power",
    recipeIds: ["recipe.equation.radical-succession.v1"],
    materialContinuityId:
      "material-continuity.radical-native-settlement.v1",
    recipeOwnerPaths: ["src/animation/radical-succession-choreography.ts"]
  })
]);
const waveBIds = Object.freeze(
  kpWaveBEquationStructuralDeclarations.map(({ animationId }) => animationId)
);
const waveBStructuralByAnimationId = Object.freeze(Object.fromEntries(
  kpWaveBEquationStructuralDeclarations.map((entry) => [
    entry.animationId,
    entry
  ])
)) as Readonly<Record<string, KpWaveBEquationStructuralDeclaration>>;

export const kpWaveCEquationDispositionDeclarations:
readonly KpWaveCEquationDispositionDeclaration[] = Object.freeze([
  waveC({
    animationId:
      "animation.operation-evaluation.two-times-one-carrier",
    classification: "generated-bespoke",
    disposition: "adapter-backed",
    presentationRoute: "specialized-native-adapter",
    authoritySourcePath:
      "src/editor/carrier-preserving-simplification-surface-adapter.ts",
    genericLayerTransition: "forbidden",
    rationale:
      "The carrier-preserving simplification exemplar has a dedicated Native KaTeX adapter and remains a reversible candidate until two human checkpoints approve promotion."
  }),
  waveC({
    animationId:
      "animation.equation.fraction-equivalence.common-denominator-pressure.v1",
    classification: "generated-bespoke",
    disposition: "adapter-backed",
    presentationRoute: "specialized-native-adapter",
    authoritySourcePath:
      "src/editor/common-denominator-pressure-surface-adapter.ts",
    genericLayerTransition: "forbidden",
    rationale:
      "The larger-expression fraction pressure caller composes approved " +
      "native motifs behind a dedicated adapter while awaiting visual review."
  }),
  waveC({
    animationId: "animation.algebra.log-product.product-to-sum",
    classification: "generated-bespoke",
    disposition: "adapter-backed",
    presentationRoute: "specialized-native-adapter",
    authoritySourcePath: "src/editor/log-product-surface-adapter.ts",
    genericLayerTransition: "forbidden",
    rationale:
      "The binary log-product candidate has a dedicated Native KaTeX adapter and remains pending human visual review."
  }),
  waveC({
    animationId: "animation.algebra.log-product.three-factors-to-sum",
    classification: "generated-bespoke",
    disposition: "adapter-backed",
    presentationRoute: "specialized-native-adapter",
    authoritySourcePath: "src/editor/log-product-surface-adapter.ts",
    genericLayerTransition: "forbidden",
    rationale:
      "The three-factor pressure caller uses the dedicated log-product adapter without promoting its pending visual policy."
  }),
  ...[
    "animation.comparison.jacobian-hessian",
    "animation.comparison.linear-solve-programming",
    "animation.sample.fourier-transform-pair",
    "animation.sample.fundamental-theorem-calculus"
  ].map((animationId) => waveC({
    animationId,
    classification: "static-only",
    disposition: "static-only",
    presentationRoute: "declared-static-layer-transition",
    authoritySourcePath: "src/editor/equation-surface-adapter.ts",
    genericLayerTransition: "declared",
    rationale:
      "This row presents or compares endpoints without claiming a canonical executable equation operation."
  })),
  ...[
    "animation.generated.calculus.derivative.power-rule-x-cubed",
    "animation.generated.calculus.derivative.sum-rule-polynomial",
    "animation.generated.calculus.integral.power-rule-quadratic",
    "animation.inequality.sign-flip.basic"
  ].map((animationId) => waveC({
    animationId,
    classification: "generated-bespoke",
    disposition: "adapter-backed",
    presentationRoute: "declared-semantic-transition",
    authoritySourcePath: "src/editor/equation-surface-adapter.ts",
    genericLayerTransition: "declared",
    rationale:
      "This generated operation has explicit semantic correspondence and a declared generic Native KaTeX transition, but no promoted narrow recipe."
  })),
  waveC({
    animationId: "animation.generated.substitute-three",
    classification: "diagnostic",
    disposition: "adapter-backed",
    presentationRoute: "declared-diagnostic-transition",
    authoritySourcePath: "src/animation/llm-animation-draft-examples.ts",
    genericLayerTransition: "declared",
    rationale:
      "The accepted LLM draft is retained as generation diagnostics with an explicit semantic transition route."
  }),
  waveC({
    animationId: "animation.generated.substitute-three.provisional-incorrect",
    classification: "retirement-candidate",
    disposition: "retirement-candidate",
    presentationRoute: "retirement-negative-fixture",
    authoritySourcePath: "src/animation/llm-animation-draft-examples.ts",
    genericLayerTransition: "declared",
    rationale:
      "The deliberately incorrect draft remains negative evidence and cannot satisfy promotion."
  })
]);
const waveCDispositionByAnimationId = Object.freeze(Object.fromEntries(
  kpWaveCEquationDispositionDeclarations.map((entry) => [
    entry.animationId,
    entry
  ])
)) as Readonly<Record<string, KpWaveCEquationDispositionDeclaration>>;

export function projectKpEquationSurfaceFamily(
  animationId: string
): KpEquationSurfaceFamilyProjection {
  const family = kpEquationSurfaceFamilyDeclarations.find(
    ({ matches }) => matches(animationId)
  )!;
  const operationPlanDeclaration =
    waveAOperationPlanByAnimationId[animationId];
  const structuralDeclaration = waveBStructuralByAnimationId[animationId];
  const waveCDeclaration = waveCDispositionByAnimationId[animationId];
  const disposition = operationPlanDeclaration !== undefined ||
    structuralDeclaration !== undefined
    ? family.primaryCapabilityId === "operation-evaluation"
      ? "canonical" as const
      : "adapter-backed" as const
    : waveCDeclaration?.disposition ?? "unsupported" as const;
  const migrationWave = waveAIds.includes(animationId)
    ? "wave-a-operation-plan" as const
    : waveBIds.includes(animationId)
      ? "wave-b-structural-native-math" as const
      : "wave-c-generated-bespoke-diagnostic-static" as const;
  const preCheckpointAdapterSlice = animationId.includes("log-quotient")
    ? "s20" as const
    : operationPlanDeclaration?.preCheckpointAdapterSlice;
  return Object.freeze({
    selectedCapabilityIds: family.selectedCapabilityIds,
    primaryCapabilityId: family.primaryCapabilityId,
    rendererAdapterId: family.rendererAdapterId,
    rendererSourcePath: family.rendererSourcePath,
    disposition,
    migrationWave,
    presentationRoute: operationPlanDeclaration !== undefined
      ? "declared-operation-plan" as const
      : structuralDeclaration !== undefined
        ? "declared-structural-recipe" as const
        : waveCDeclaration?.presentationRoute ??
          "unsupported-static-hold" as const,
    ...(waveCDeclaration === undefined
      ? {}
      : { waveCClassification: waveCDeclaration.classification }),
    genericLayerTransition: operationPlanDeclaration !== undefined ||
      structuralDeclaration !== undefined
      ? "legacy" as const
      : waveCDeclaration?.genericLayerTransition ?? "forbidden" as const,
    operationPlanRecipeIds:
      operationPlanDeclaration?.recipeIds ?? Object.freeze([]),
    structuralRecipeIds:
      structuralDeclaration?.recipeIds ?? Object.freeze([]),
    runtimeBindingIds:
      operationPlanDeclaration?.runtimeBindingIds ?? Object.freeze([]),
    ...((operationPlanDeclaration?.materialContinuityId ??
      structuralDeclaration?.materialContinuityId) === undefined
      ? {}
      : {
          materialContinuityId:
            operationPlanDeclaration?.materialContinuityId ??
            structuralDeclaration!.materialContinuityId
        }),
    ...(structuralDeclaration?.explanationProjectionId === undefined
      ? {}
      : {
          explanationProjectionId:
            structuralDeclaration.explanationProjectionId
        }),
    ...(structuralDeclaration?.structuralAugmentationId === undefined
      ? {}
      : {
          structuralAugmentationId:
            structuralDeclaration.structuralAugmentationId
        }),
    ...(preCheckpointAdapterSlice === undefined
      ? {}
      : { preCheckpointAdapterSlice })
  });
}

export function hasKpSpecializedEquationSurfaceFamily(
  animationId: string
): boolean {
  // Specialized equation families can own diagram slots (exact quantity and
  // place value), so capability selection cannot infer this boundary from the
  // renderer slot name alone.
  return kpEquationSurfaceFamilyDeclarations
    .slice(0, -1)
    .some(({ matches }) => matches(animationId));
}

export function findKpWaveAEquationOperationPlanDeclaration(
  animationId: string
): KpWaveAEquationOperationPlanDeclaration | undefined {
  return waveAOperationPlanByAnimationId[animationId];
}

export function findKpWaveBEquationStructuralDeclaration(
  animationId: string
): KpWaveBEquationStructuralDeclaration | undefined {
  return waveBStructuralByAnimationId[animationId];
}

export function findKpWaveCEquationDispositionDeclaration(
  animationId: string
): KpWaveCEquationDispositionDeclaration | undefined {
  return waveCDispositionByAnimationId[animationId];
}

function declaration(
  input: KpEquationSurfaceFamilyDeclaration
): KpEquationSurfaceFamilyDeclaration {
  return Object.freeze({
    ...input,
    selectedCapabilityIds: Object.freeze([...input.selectedCapabilityIds])
  });
}

function operationPlan(input: {
  readonly animationId: string;
  readonly recipeIds: readonly KpEquationOperationPlanRecipeId[];
  readonly runtimeBindingIds?: readonly KpEquationRuntimeBindingId[] | undefined;
  readonly materialContinuityId?: KpEquationMaterialContinuityId | undefined;
  readonly recipeOwnerPaths: readonly string[];
  readonly authority?: KpWaveAEquationOperationPlanDeclaration["authority"] | undefined;
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22" | undefined;
}): KpWaveAEquationOperationPlanDeclaration {
  return Object.freeze({
    animationId: input.animationId,
    recipeIds: Object.freeze([...input.recipeIds]),
    runtimeBindingIds: Object.freeze([...(input.runtimeBindingIds ?? [])]),
    ...(input.materialContinuityId === undefined
      ? {}
      : { materialContinuityId: input.materialContinuityId }),
    authority: input.authority ?? "verified-operation-plan",
    recipeOwnerPaths: Object.freeze([...input.recipeOwnerPaths]),
    ...(input.preCheckpointAdapterSlice === undefined
      ? {}
      : { preCheckpointAdapterSlice: input.preCheckpointAdapterSlice })
  });
}

function structural(input: {
  readonly animationId: string;
  readonly recipeIds: readonly KpEquationStructuralRecipeId[];
  readonly materialContinuityId?: KpEquationMaterialContinuityId | undefined;
  readonly explanationProjectionId?:
    KpEquationExplanationProjectionId | undefined;
  readonly structuralAugmentationId?:
    KpEquationStructuralAugmentationId | undefined;
  readonly recipeOwnerPaths: readonly string[];
}): KpWaveBEquationStructuralDeclaration {
  return Object.freeze({
    animationId: input.animationId,
    recipeIds: Object.freeze([...input.recipeIds]),
    ...(input.materialContinuityId === undefined
      ? {}
      : { materialContinuityId: input.materialContinuityId }),
    ...(input.explanationProjectionId === undefined
      ? {}
      : { explanationProjectionId: input.explanationProjectionId }),
    ...(input.structuralAugmentationId === undefined
      ? {}
      : { structuralAugmentationId: input.structuralAugmentationId }),
    recipeOwnerPaths: Object.freeze([...input.recipeOwnerPaths]),
    authority: "typed-structural-recipe" as const
  });
}

function waveC(input: KpWaveCEquationDispositionDeclaration):
KpWaveCEquationDispositionDeclaration {
  return Object.freeze({ ...input });
}
