import type {
  KpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-types.ts";
import {
  resolveKpOperationEvaluationPresentation,
  kpSuccessorSynthesisPresentationPlanCompiler
} from "./operation-evaluation-presentation-registry.ts";
import {
  runKpOperationPresentationLaws
} from "./operation-presentation-laws.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "./operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "./operation-presentation-roles.ts";
import type {
  KpSuccessorSynthesisBinding
} from "./successor-synthesis.ts";

export type KpRegisteredSuccessorSynthesisBinding =
  KpSuccessorSynthesisBinding & {
    readonly operationPresentationPlan?:
      KpVerifiedOperationPresentationPlan | undefined;
  };

export function compileKpRegisteredSuccessorSynthesisPresentationPlan(input: {
  readonly transformationId: string;
  readonly transformationKind: string;
  readonly binding: KpSuccessorSynthesisBinding;
}): KpVerifiedOperationPresentationPlan | undefined {
  const resolution = resolveKpOperationEvaluationPresentation({
    transformationKind: input.transformationKind
  });
  if (resolution.status === "unknown-transformation") return undefined;
  if (resolution.status !== "resolved") {
    throw new Error(resolution.message);
  }
  requireSuccessorCompiler(resolution.certificate);
  requireCompleteSuccessorLineage(input.binding);

  const sourceBundles = input.binding.sourceAnnotations.map((annotation) =>
    createKpOperationPresentationBundle({
      id: `${input.binding.id}.bundle.source.${annotation.id}`,
      role: annotation.contribution === "material-input"
        ? "source-material"
        : "catalyst",
      semanticEntityIds: annotation.selectorIds
    })
  );
  const materialBundleIds = input.binding.sourceAnnotations.flatMap(
    (annotation, index) =>
      annotation.contribution === "material-input"
        ? [sourceBundles[index]!.id]
        : []
  );
  const targetBundle = createKpOperationPresentationBundle({
    id: `${input.binding.id}.bundle.target`,
    role: "target-material",
    semanticEntityIds: input.binding.targetAnnotations.flatMap(
      ({ selectorIds }) => selectorIds
    )
  });
  const fusionGroup = createKpOperationPresentationGroup({
    id: `${input.binding.id}.group.fusion`,
    groupKind: "fusion",
    bundleIds: [...materialBundleIds, targetBundle.id]
  });
  const draft = {
    schemaVersion: "kp.verified-operation-presentation-plan.v1",
    id: `operation-presentation.${input.binding.id}`,
    transformationId: input.transformationId,
    planKind: "successor-synthesis",
    roles: createKpOperationPresentationRoles({
      bundles: [...sourceBundles, targetBundle],
      groups: [fusionGroup]
    }),
    fusionGroupId: fusionGroup.id,
    resultBundleId: targetBundle.id
  } as const;
  const sourceSelectorIds = input.binding.sourceAnnotations.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const targetSelectorIds = input.binding.targetAnnotations.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const validation = validateAndMintKpOperationPresentationPlan({
    draft,
    expectedSelectorIds: [...sourceSelectorIds, ...targetSelectorIds]
  });
  if (validation.status !== "verified") {
    throw new Error(
      validation.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  const lawDiagnostics = runKpOperationPresentationLaws({
    plan: validation.plan,
    lawIds: resolution.certificate.planCompiler.lawIds,
    context: {
      sourceSelectorIds,
      targetSelectorIds,
      scheduledGroupIds: [fusionGroup.id],
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });
  if (lawDiagnostics.length > 0) {
    throw new Error(
      lawDiagnostics.map(({ lawId, message }) =>
        `${lawId}: ${message}`
      ).join("\n")
    );
  }
  return validation.plan;
}

function requireCompleteSuccessorLineage(
  binding: KpSuccessorSynthesisBinding
): void {
  const materialIds = new Set(
    binding.sourceAnnotations
      .filter(({ contribution }) => contribution === "material-input")
      .map(({ id }) => id)
  );
  const catalystIds = new Set(
    binding.sourceAnnotations
      .filter(({ contribution }) => contribution === "catalyst")
      .map(({ id }) => id)
  );
  const targetIds = new Set(
    binding.targetAnnotations.map(({ id }) => id)
  );
  const lineageSources = new Set(
    binding.lineages.flatMap(({ sourceAnnotationIds }) => sourceAnnotationIds)
  );
  const lineageTargets = new Set(
    binding.lineages.flatMap(({ targetAnnotationIds }) => targetAnnotationIds)
  );
  if (
    binding.lineages.length === 0 ||
    [...materialIds].some((id) => !lineageSources.has(id)) ||
    [...targetIds].some((id) => !lineageTargets.has(id)) ||
    [...lineageSources].some((id) =>
      catalystIds.has(id) || !materialIds.has(id)
    ) ||
    [...lineageTargets].some((id) => !targetIds.has(id))
  ) {
    throw new Error(
      `Successor binding ${binding.id} requires total material-to-target ` +
      "lineage without catalyst contribution."
    );
  }
}

function requireSuccessorCompiler(
  certificate: KpResolvedOperationEvaluationPresentation
): void {
  const compiler = certificate.planCompiler;
  if (
    compiler.id !== kpSuccessorSynthesisPresentationPlanCompiler.id ||
    compiler.version !==
      kpSuccessorSynthesisPresentationPlanCompiler.version ||
    compiler.planKind !== "successor-synthesis"
  ) {
    throw new Error(
      `Presentation ${certificate.presentationId} did not resolve the ` +
      "approved successor-synthesis plan compiler."
    );
  }
}
