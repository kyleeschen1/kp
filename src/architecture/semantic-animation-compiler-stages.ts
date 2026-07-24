export type KpSemanticAnimationCompilerStageId =
  | "domain-state"
  | "transformation-instance"
  | "operation-resolution"
  | "correspondence-lineage"
  | "presentation-profile"
  | "choreography"
  | "domain-ir"
  | "motion-plan"
  | "sampled-frame"
  | "domain-payload"
  | "renderer-adapter";

export type KpSemanticAnimationStageOwner =
  | "semantic"
  | "animation"
  | "domain-ir"
  | "presentation"
  | "rendering";

export type KpSemanticAnimationStageAuthority =
  | "authoritative-source"
  | "reusable-definition"
  | "bound-invocation"
  | "compiled-semantic-intermediate"
  | "presentation-policy"
  | "executable-choreography"
  | "renderer-motion-plan"
  | "sampled-frame"
  | "domain-frame-payload"
  | "renderer-output";

export interface KpSemanticAnimationCompilerStage {
  readonly id: KpSemanticAnimationCompilerStageId;
  readonly owner: KpSemanticAnimationStageOwner;
  readonly authority: KpSemanticAnimationStageAuthority;
  readonly representations: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly dependsOn: readonly KpSemanticAnimationCompilerStageId[];
  readonly migrationStatus:
    | "canonical"
    | "target-owner"
    | "compatibility-boundary";
}

// This is a compiler inventory, not a directory map. Stages name authority and
// conversion order even where the current package location still needs repair.
export const kpSemanticAnimationCompilerStages = [
  stage({
    id: "domain-state",
    owner: "semantic",
    authority: "authoritative-source",
    representations: ["KpAssetBundle", "KpSemanticAssetObject"],
    sourcePaths: ["src/semantic/asset.ts"],
    dependsOn: [],
    migrationStatus: "canonical"
  }),
  stage({
    id: "transformation-instance",
    owner: "semantic",
    authority: "bound-invocation",
    representations: [
      "KpSemanticTransformation",
      "SemanticTransformationRef"
    ],
    sourcePaths: [
      "src/semantic/asset-transformation.ts",
      "src/semantic/animation.ts"
    ],
    dependsOn: ["domain-state"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "operation-resolution",
    owner: "semantic",
    authority: "reusable-definition",
    representations: [
      "KpSemanticTransformationDefinition",
      "KpCanonicalOperationSpec",
      "KpCanonicalOperationExecution"
    ],
    sourcePaths: [
      "src/semantic/asset-transformation.ts",
      "src/semantic/canonical-operation-spec.ts",
      "src/semantic/transformation-definition-binding.ts"
    ],
    dependsOn: ["transformation-instance"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "correspondence-lineage",
    owner: "semantic",
    authority: "compiled-semantic-intermediate",
    representations: [
      "KpCorrespondenceMap",
      "KpSemanticLineageGraph"
    ],
    sourcePaths: [
      "src/semantic/correspondence.ts",
      "src/semantic/semantic-lineage-graph.ts"
    ],
    dependsOn: ["operation-resolution"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "presentation-profile",
    owner: "presentation",
    authority: "presentation-policy",
    representations: [
      "KpEquationPresentationProfileV1",
      "KpEquationPresentationProfile",
      "KpCancellationPresentationResolution"
    ],
    sourcePaths: [
      "src/animation/cancellation-presentation-contract.ts",
      "src/animation/equation-presentation-profile-decoder.ts",
      "src/animation/equation-presentation-profile.ts",
      "src/rendering/equation-presentation-policy.ts"
    ],
    dependsOn: ["correspondence-lineage"],
    migrationStatus: "target-owner"
  }),
  stage({
    id: "choreography",
    owner: "animation",
    authority: "executable-choreography",
    representations: [
      "KpChoreographyPlan",
      "KpChoreographyTimeline",
      "SemanticTransformationNode",
      "EquationVisualMotifDescriptor",
      "KpExecutableMotifComposition",
      "TransformTreeVisualMotifTimeline",
      "KpEasingName",
      "KpDotProductTraversalPlan",
      "KpMatrixVectorCompositionPlan",
      "KpMatrixMatrixCompositionPlan"
    ],
    sourcePaths: [
      "src/animation/choreography-plan.ts",
      "src/animation/choreography-timeline.ts",
      "src/animation/dot-product-traversal-progress.ts",
      "src/animation/easing.ts",
      "src/animation/equation-linear-rearrangement-kind.ts",
      "src/animation/matrix-matrix-composition-progress.ts",
      "src/animation/matrix-vector-composition-progress.ts",
      "src/animation/motifs/public-api.ts",
      "src/animation/saddle-surface-morph.ts",
      "src/semantic/transformation-composition.ts"
    ],
    dependsOn: ["presentation-profile"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "domain-ir",
    owner: "domain-ir",
    authority: "compiled-semantic-intermediate",
    representations: ["KpEquationTransitionIr"],
    sourcePaths: [
      "src/domain-ir/equation-transition-ir.ts",
      "src/domain-ir/semantic-equation-transition-compiler.ts"
    ],
    dependsOn: ["choreography"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "motion-plan",
    owner: "presentation",
    authority: "renderer-motion-plan",
    representations: ["KpEquationMotionPlan", "KpAnimationMotionPlan"],
    sourcePaths: [
      "src/rendering/equation-motion-plan.ts",
      "src/animation/kernel.ts"
    ],
    dependsOn: ["domain-ir"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "sampled-frame",
    owner: "animation",
    authority: "sampled-frame",
    representations: [
      "KpSampledFrameEnvelope",
      "KpAnimationRuntimeFrame",
      "KpAnimationFrameDescriptor"
    ],
    sourcePaths: [
      "src/animation/sampled-frame-envelope.ts",
      "src/animation/runtime-sampler.ts",
      "src/animation/frame-descriptor.ts"
    ],
    dependsOn: ["motion-plan"],
    migrationStatus: "canonical"
  }),
  stage({
    id: "domain-payload",
    owner: "domain-ir",
    authority: "domain-frame-payload",
    representations: [
      "KpSampledFrameDomainPayload",
      "KpEquationSampledFramePayload",
      "KpGraphDiagramSampledFramePayload",
      "KpProgramTraceSampledFramePayload",
      "KpEquationMotionFrame",
      "KpDerivativeTangentRuntimeFrame",
      "KpProgramTraceFramePreview"
    ],
    sourcePaths: [
      "src/animation/sampled-frame-payload.ts",
      "src/animation/equation-sampled-frame-adapter.ts",
      "src/animation/non-equation-sampled-frame-adapter.ts",
      "src/rendering/equation-motion-sampler.ts",
      "src/animation/derivative-tangent-runtime-frame.ts",
      "src/animation/program-trace-frame-preview.ts"
    ],
    dependsOn: ["sampled-frame"],
    migrationStatus: "target-owner"
  }),
  stage({
    id: "renderer-adapter",
    owner: "rendering",
    authority: "renderer-output",
    representations: [
      "KpEquationMaterialOwner",
      "KpAnimationSurfaceAdapter",
      "KpAnimationRuntimeVisualFrameSampleFactory"
    ],
    sourcePaths: [
      "src/rendering/equation-material-owner.ts",
      "src/animation/runtime-visual-frame-sample.ts",
      "src/editor/animation-surface-adapter-registry.ts"
    ],
    dependsOn: ["domain-payload"],
    migrationStatus: "canonical"
  })
] as const satisfies readonly KpSemanticAnimationCompilerStage[];

export function assertKpSemanticAnimationCompilerStages(
  stages: readonly KpSemanticAnimationCompilerStage[]
): void {
  const seen = new Set<KpSemanticAnimationCompilerStageId>();
  for (const compilerStage of stages) {
    if (seen.has(compilerStage.id)) {
      throw new Error(
        `Duplicate semantic-animation compiler stage ${compilerStage.id}.`
      );
    }
    for (const dependency of compilerStage.dependsOn) {
      if (!seen.has(dependency)) {
        throw new Error(
          `Compiler stage ${compilerStage.id} requires earlier stage ${dependency}.`
        );
      }
    }
    if (
      compilerStage.representations.length === 0 ||
      compilerStage.sourcePaths.length === 0
    ) {
      throw new Error(
        `Compiler stage ${compilerStage.id} requires representations and sources.`
      );
    }
    seen.add(compilerStage.id);
  }
}

function stage(
  input: KpSemanticAnimationCompilerStage
): KpSemanticAnimationCompilerStage {
  return input;
}
