import type {
  KpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-types.ts";
import {
  resolveKpOperationEvaluationPresentationRoute,
  kpOperationEvaluationExecutableProgramCompiler,
  kpSharedJunctionPaintContinuityCompiler,
  kpSuccessorSynthesisPresentationPlanCompiler
} from "./operation-evaluation-presentation-registry.ts";
import {
  runKpOperationPresentationLaws
} from "./operation-presentation-laws.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  operationPresentationPlanAuthorityId
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
import type {
  KpVerifiedPaintContinuityPlan
} from "./paint-continuity-plan-types.ts";
import {
  validateAndMintKpPaintContinuityPlan
} from "./paint-continuity-plan-validator.ts";
import type {
  KpExplicitStaticCheckpointPlan
} from "./operation-presentation-plan-types.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program-validator.ts";

export type KpRegisteredSuccessorSynthesisBinding =
  KpSuccessorSynthesisBinding & {
    readonly operationPresentationPlan:
      KpVerifiedOperationPresentationPlan;
    readonly paintContinuityPlan: KpVerifiedPaintContinuityPlan;
  };

export type KpSuccessorSynthesisPresentationCompilation =
  | {
      readonly status: "compiled";
      readonly operationPresentationPlan:
        KpVerifiedOperationPresentationPlan;
      readonly paintContinuityPlan: KpVerifiedPaintContinuityPlan;
      readonly executableProgram:
        KpVerifiedExecutableSuccessorMotifProgram;
    }
  | {
      readonly status: "explicit-static";
      readonly checkpoint: KpExplicitStaticCheckpointPlan;
    };

export function compileKpRegisteredSuccessorSynthesisPresentation(input: {
  readonly transformationId: string;
  readonly transformationKind: string;
  readonly binding: KpSuccessorSynthesisBinding;
}): KpSuccessorSynthesisPresentationCompilation {
  const route = resolveKpOperationEvaluationPresentationRoute({
    transformationId: input.transformationId,
    transformationKind: input.transformationKind,
    semanticOperationId: input.binding.authority.operationId
  });
  if (route.status === "explicit-static") {
    return Object.freeze({
      status: "explicit-static",
      checkpoint: route.checkpoint
    });
  }
  requireSuccessorCompiler(route.certificate);
  requirePaintContinuityCompiler(route.certificate);
  const executableProgram = requireExecutableProgramCompiler(
    route.certificate
  );
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
  if (materialBundleIds.length === 0) {
    throw new Error(
      `Successor binding ${input.binding.id} requires material input.`
    );
  }
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
    lawIds: route.certificate.planCompiler.lawIds,
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
  const [firstMaterialBundleId, ...remainingMaterialBundleIds] =
    materialBundleIds;
  const paintValidation = validateAndMintKpPaintContinuityPlan({
    draft: {
      schemaVersion: "kp.paint-continuity-plan.v1",
      id: `paint-continuity.${input.binding.id}`,
      transformationId: input.transformationId,
      operationPresentationPlanId:
        operationPresentationPlanAuthorityId(validation.plan),
      ownership: "exclusive-continuous-carrier",
      carriers: [{
        lineageId: `paint-lineage.${input.binding.id}.material-total`,
        sourceBundleIds: [
          firstMaterialBundleId!,
          ...remainingMaterialBundleIds
        ],
        targetBundleIds: [targetBundle.id],
        transferTopology:
          route.certificate.paintContinuityCompiler.transferTopology
      }],
      endpointSettlement:
        route.certificate.paintContinuityCompiler.endpointSettlement,
      nonZeroPaint:
        route.certificate.paintContinuityCompiler.nonZeroPaint
    },
    operationPlan: validation.plan
  });
  if (paintValidation.status !== "verified") {
    throw new Error(
      paintValidation.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  return Object.freeze({
    status: "compiled",
    operationPresentationPlan: validation.plan,
    paintContinuityPlan: paintValidation.plan,
    executableProgram
  });
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

function requirePaintContinuityCompiler(
  certificate: KpResolvedOperationEvaluationPresentation
): void {
  const compiler = certificate.paintContinuityCompiler;
  if (
    compiler.id !== kpSharedJunctionPaintContinuityCompiler.id ||
    compiler.version !== kpSharedJunctionPaintContinuityCompiler.version ||
    compiler.transferTopology !== "shared-zero-area-junction" ||
    compiler.nonZeroPaint !== "opaque" ||
    compiler.endpointSettlement !== "native-source-and-target" ||
    compiler.boundaryLawId !== "paint-continuity.t-epsilon-boundary"
  ) {
    throw new Error(
      `Presentation ${certificate.presentationId} did not resolve the ` +
      "approved shared-junction paint continuity compiler."
    );
  }
}

function requireExecutableProgramCompiler(
  certificate: KpResolvedOperationEvaluationPresentation
): KpVerifiedExecutableSuccessorMotifProgram {
  const compiler = certificate.executableProgramCompiler;
  if (
    compiler.id !== kpOperationEvaluationExecutableProgramCompiler.id ||
    compiler.version !==
      kpOperationEvaluationExecutableProgramCompiler.version ||
    compiler.program.kind !== "operation-evaluation" ||
    !isKpVerifiedExecutableSuccessorMotifProgram(compiler.program)
  ) {
    throw new Error(
      `Presentation ${certificate.presentationId} did not resolve the ` +
      "approved executable operation-evaluation program."
    );
  }
  return compiler.program;
}
