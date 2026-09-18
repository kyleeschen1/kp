import { createKpCertifiedNativeKatexContributorFusionRealization } from "../../rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import type {
  KpCanonicalNativeKatexPureScenePlan,
  KpCanonicalNativeKatexSceneInput,
  KpNativeKatexRendererSession
} from "../../rendering/native-katex-scene-compositor.ts";
import { createKpFractionDistributionCoherentMotion } from "../../rendering/fraction-distribution-coherent-motion.ts";
import { createKpNativeFractionFactorSplit } from "../../rendering/native-fraction-factor-split.ts";
import type {
  KpNativeKatexSemanticPaintRelation
} from "../../rendering/native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "../../rendering/native-katex-rendered-scene.ts";
import type {
  KpNativeKatexFeaturePack
} from "../../rendering/native-katex-feature-pack-contract.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../../rendering/native-katex-feature-pack-loader.ts";
import type {
  KpNativeKatexSuccessorSynthesisIntent
} from "../../rendering/native-katex-successor-synthesis.ts";
import type {
  KpReaderEquationMaterialPlan,
  KpReaderEquationTransitionMaterialPlan
} from "./equation-material-plan.ts";
import type {
  KpReaderEquationRenderPlan,
  KpReaderEquationTransitionPlan
} from "./equation-render-plan.ts";
import {
  auditKpNativeKatexChoreographyFidelity
} from "../../rendering/native-katex-choreography-fidelity.ts";
import {
  bindKpNativeKatexFactoringScene
} from "../../rendering/native-katex-factoring-choreography.ts";
import {
  assertKpEquationStageMeasurementIdentity,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageMeasurementIdentity
} from "../runtime/public-api.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/public-api.ts";
import type {
  KpEquationMotionStageOccupancy
} from "../../rendering/equation-motion-path-planner.ts";
import {
  type KpReaderEquationTransitionPresentationPlan
} from "./equation-transition-presentation-plan.ts";
import {
  assertKpFactorCommonTermMotifBinding
} from "../../animation/factoring-motif-binding.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch
} from "./executable-successor-motif-program-adapter.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "../../domain-ir/equation-evaluation-family-certificate-v2.ts";

export interface KpReaderEquationMeasuredRendererSession
  extends KpNativeKatexRendererSession {
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly presentationMode:
    | "verified-motion"
    | "certified-family-motion-carrier"
    | "certified-family-motion"
    | "review-family-motion"
    | "explicit-static-checkpoint";
  readonly certifiedExternalMotionCertificate?:
    KpVerifiedEquationEvaluationFamilyCertificateV2 | undefined;
  readonly executableProgramExecution?:
    KpExecutableSuccessorMotifProgramAdapterDispatch | undefined;
}

export interface KpReaderEquationSceneCompositorInput {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
  readonly motionMode?: "continuous" | "essential" | "checkpoint" | undefined;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly stageLayout?:
    KpCorridorCertifiedEquationStageLayout | undefined;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly nativeKatex: KpNativeKatexFeaturePack;
  /**
   * Exact compiler authority for a family renderer that will wrap a static
   * measured carrier before the owning host publishes readiness.
   */
  readonly certifiedExternalMotionCertificate?:
    KpVerifiedEquationEvaluationFamilyCertificateV2 | undefined;
}

export interface KpReaderEquationPureScenePlan {
  readonly kind: "reader-equation-pure-scene-plan";
  readonly lifecycle: "pure-measured-plan";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly nativePlan: KpCanonicalNativeKatexPureScenePlan;
}

/**
 * Reader hosts receive a bound client so application code cannot reach past
 * the feature-pack boundary or accidentally construct a second compositor.
 */
export async function loadKpReaderEquationSceneCompositorClient() {
  const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
  return Object.freeze({
    createKpReaderEquationSceneCompositorSession: (
      input: Omit<KpReaderEquationSceneCompositorInput, "nativeKatex"> & {
        readonly purePlan?: KpReaderEquationPureScenePlan | undefined;
      }
    ) => createKpReaderEquationSceneCompositorSession({
      ...input,
      nativeKatex
    }),
    compileKpReaderEquationPureScenePlan: (
      input: Omit<KpReaderEquationSceneCompositorInput, "nativeKatex">
    ) => compileKpReaderEquationPureScenePlan({
      ...input,
      nativeKatex
    }),
    observeKpNativeKatexRenderedScene: nativeKatex.observe.observe
  });
}

type KpReaderEquationPresentationPlanOf<
  Kind extends KpReaderEquationTransitionPresentationPlan["planKind"]
> = Extract<
  KpReaderEquationTransitionPresentationPlan,
  { readonly planKind: Kind }
>;

interface KpReaderEquationCompositorDispatchBase {
  readonly canonicalInput:
    Omit<KpCanonicalNativeKatexSceneInput, "purePlan">;
  readonly motionProfile:
    | "default"
    | "canonical-factoring-fission-fusion"
    | "canonical-copy-fan-out"
    | "canonical-semantic-reorder-and-group";
  readonly successorSynthesisCount: number;
  readonly executableProgramExecution?:
    KpExecutableSuccessorMotifProgramAdapterDispatch | undefined;
}

type KpReaderEquationCompositorDispatch =
  | (KpReaderEquationCompositorDispatchBase & {
      readonly planKind:
        | "default-motion"
        | "visual-motif"
        | "distribution"
        | "fraction-material"
        | "successor-synthesis";
    })
  | (KpReaderEquationCompositorDispatchBase & {
      readonly planKind: "factoring";
      readonly factoring: ReturnType<typeof bindKpNativeKatexFactoringScene>;
    })
  | (KpReaderEquationCompositorDispatchBase & {
      readonly planKind: "structural-succession";
      readonly structuralSuccession:
        KpReaderEquationPresentationPlanOf<
          "structural-succession"
        >["structuralSuccession"];
    })
  | (KpReaderEquationCompositorDispatchBase & {
      readonly planKind: "operation-choreography";
      readonly operationChoreography:
        KpReaderEquationPresentationPlanOf<
          "operation-choreography"
        >["operationChoreography"];
    })
  | (KpReaderEquationCompositorDispatchBase & {
      readonly planKind: "explicit-static-checkpoint";
      readonly staticCheckpoint:
        KpReaderEquationPresentationPlanOf<
          "explicit-static-checkpoint"
        >["staticCheckpoint"];
    });

export function compileKpReaderEquationPureScenePlan(
  input: KpReaderEquationSceneCompositorInput
): KpReaderEquationPureScenePlan {
  const prepared = prepareReaderEquationScene(input);
  return Object.freeze({
    kind: "reader-equation-pure-scene-plan",
    lifecycle: "pure-measured-plan",
    measurementIdentity: prepared.measurementIdentity,
    nativePlan: input.nativeKatex.compose.compilePurePlan(
      prepared.canonicalInput
    )
  });
}

export function createKpReaderEquationSceneCompositorSession(
  input: KpReaderEquationSceneCompositorInput & {
    readonly purePlan?: KpReaderEquationPureScenePlan | undefined;
  }
): KpReaderEquationMeasuredRendererSession {
  const prepared = prepareReaderEquationScene(input);
  const {
    measurementIdentity,
    dispatch,
    renderTransition
  } = prepared;
  if (
    input.purePlan !== undefined &&
    (
      input.purePlan.measurementIdentity.coordinateSpaceId !==
        measurementIdentity.coordinateSpaceId ||
      input.purePlan.measurementIdentity.revision !==
        measurementIdentity.revision
    )
  ) {
    throw new Error("Reader pure scene plan has stale measurement identity.");
  }
  if (input.source.stage !== input.target.stage) {
    throw new Error("Reader equation compositor endpoints must share one stage.");
  }
  input.source.stage.dataset["kpNativeKatexSuccessorSynthesisCount"] =
    String(dispatch.successorSynthesisCount);
  input.source.stage.dataset["kpNativeKatexMotionProfile"] =
    dispatch.motionProfile;
  if (dispatch.executableProgramExecution === undefined) {
    delete input.source.stage.dataset["kpExecutedMotifProgramId"];
    delete input.source.stage.dataset["kpExecutedMotifProgramVersion"];
    delete input.source.stage.dataset["kpExecutedMotifProgramKind"];
    delete input.source.stage.dataset["kpExecutedMotifProgramPhase"];
    delete input.source.stage.dataset["kpExecutedMotifContinuityTopology"];
  } else {
    input.source.stage.dataset["kpExecutedMotifProgramId"] =
      dispatch.executableProgramExecution.programId;
    input.source.stage.dataset["kpExecutedMotifProgramVersion"] =
      dispatch.executableProgramExecution.programVersion;
    input.source.stage.dataset["kpExecutedMotifProgramKind"] =
      dispatch.executableProgramExecution.programKind;
    if (
      dispatch.executableProgramExecution.programKind ===
        "operation-evaluation"
    ) {
      input.source.stage.dataset["kpExecutedMotifContinuityTopology"] =
        dispatch.executableProgramExecution.continuityProgram.topology;
    } else {
      delete input.source.stage.dataset[
        "kpExecutedMotifContinuityTopology"
      ];
    }
  }
  if (dispatch.planKind !== "explicit-static-checkpoint") {
    delete input.source.stage.dataset[
      "kpReaderEquationStaticCheckpointReason"
    ];
  } else {
    input.source.stage.dataset["kpReaderEquationStaticCheckpointReason"] =
      dispatch.staticCheckpoint.reason;
  }
  const externalMotionCertificate =
    input.certifiedExternalMotionCertificate;
  if (externalMotionCertificate !== undefined) {
    if (
      !isKpVerifiedEquationEvaluationFamilyCertificateV2(
        externalMotionCertificate
      ) ||
      renderTransition.id !== externalMotionCertificate.transformationId ||
      externalMotionCertificate.familyProfile.family !==
        "contributor-fusion" ||
      dispatch.executableProgramExecution?.programKind !==
        "operation-evaluation"
    ) {
      throw new Error(
        "Reader external evaluation motion requires the transition's exact compiler-minted contributor-fusion certificate."
      );
    }
  }
  // Compile at the reader boundary so renderer setup consumes the exact
  // nominal plan that the exhaustive presentation dispatch authorized.
  const rendererReadyPlan = input.nativeKatex.compose.compileScenePlan({
    ...prepared.canonicalInput,
    ...(externalMotionCertificate === undefined ? {} : {
      successorRealization: createKpCertifiedNativeKatexContributorFusionRealization({
        certificate: externalMotionCertificate,
        source: input.source, target: input.target
      })
    }),
    ...(input.purePlan === undefined
      ? {}
      : { purePlan: input.purePlan.nativePlan })
  });
  const canonical = externalMotionCertificate === undefined
    ? input.nativeKatex.compose.createSession(rendererReadyPlan)
    : input.nativeKatex.compose.createCarrierSession(rendererReadyPlan);
  if (dispatch.planKind === "factoring") {
    if (!rendererReadyPlan.sceneAssembly) throw new Error("Factoring requires final-scene inspection.");
    dispatch.factoring.recordEvidence(rendererReadyPlan.sceneAssembly);
  }
  if (dispatch.planKind === "structural-succession") {
    const reducedMotion =
      input.motionMode !== undefined && input.motionMode !== "continuous";
    const fidelity = auditKpNativeKatexChoreographyFidelity({
      intent: dispatch.structuralSuccession,
      strategy: reducedMotion
        ? {
            kind: "checkpoint-settlement",
            actPhaseIds: dispatch.structuralSuccession.actPhaseIds,
            reason: "reduced-motion"
          }
        : {
            kind: "solid-mask-succession",
            actPhaseIds: dispatch.structuralSuccession.actPhaseIds
          },
      reconciliation: canonical.reconciliation,
      tracks: canonical.session.tracks
    });
    if (!fidelity.passed) {
      throw new Error(
        `Reader structural succession failed fidelity: ${
          fidelity.issues.map(({ code }) => code).join(", ")
        }`
      );
    }
    input.source.stage.dataset["kpNativeKatexChoreographyFidelity"] =
      "passed";
  }
  const checkpointProgress = (progress: number) =>
    dispatch.planKind !== "explicit-static-checkpoint" || progress >= 1
      ? progress
      : 0;
  return Object.freeze({
    ...canonical.session,
    mode:
      dispatch.planKind !== "explicit-static-checkpoint"
        ? canonical.session.mode
        : "checkpoint-settlement",
    presentationMode:
      externalMotionCertificate !== undefined
        ? "certified-family-motion-carrier"
        : dispatch.planKind !== "explicit-static-checkpoint"
        ? "verified-motion"
        : "explicit-static-checkpoint",
    ...(externalMotionCertificate === undefined
      ? {}
      : { certifiedExternalMotionCertificate: externalMotionCertificate }),
    ...(dispatch.executableProgramExecution === undefined
      ? {}
      : {
          executableProgramExecution:
            dispatch.executableProgramExecution
        }),
    sample(progress: number) {
      return canonical.session.sample(checkpointProgress(progress));
    },
    apply(progress: number) {
      if (dispatch.executableProgramExecution !== undefined) {
        const telemetry =
          dispatch.executableProgramExecution.samplePhaseTelemetry(
            checkpointProgress(progress)
          );
        input.source.stage.dataset["kpExecutedMotifProgramPhase"] =
          telemetry.activePhaseId;
      }
      if (dispatch.planKind !== "operation-choreography") {
        delete input.source.stage.dataset["kpNativeKatexOperationChoreography"];
      } else {
        input.source.stage.dataset["kpNativeKatexOperationChoreography"] =
          dispatch.operationChoreography.kind;
      }
      return canonical.session.apply(checkpointProgress(progress));
    },
    measurementIdentity
  });
}

function prepareReaderEquationScene(
  input: KpReaderEquationSceneCompositorInput
) {
  const measurementIdentity = createKpEquationStageMeasurementIdentity(
    input.measurementIdentity
  );
  const { renderTransition, materialTransition } = resolveTransitionPair(input);
  const stageOccupancy = input.stageLayout === undefined
    ? undefined
    : projectStageOccupancy(input.stageLayout, measurementIdentity);
  const relations = projectReaderRelations({
    renderTransition,
    materialTransition
  });
  const base: Omit<
    KpCanonicalNativeKatexSceneInput,
    | "purePlan"
    | "fanInRouting"
    | "factoring"
    | "operationChoreography"
    | "copyFanOutRouting"
    | "horizontalAxisSemanticEntityIds"
    | "reorderRouting"
    | "successorSyntheses"
    | "structuralSuccession"
    | "structuralMotion"
  > = {
    source: input.source,
    target: input.target,
    relations,
    ...(stageOccupancy === undefined ? {} : { stageOccupancy })
  };
  const dispatch = dispatchReaderEquationPresentation({
    plan: renderTransition.presentationPlan,
    base,
    renderTransition,
    direction: input.renderPlan.direction,
    motionMode: input.motionMode,
    source: input.source,
    target: input.target
  });
  return {
    measurementIdentity,
    renderTransition,
    dispatch,
    canonicalInput: dispatch.canonicalInput
  };
}

function dispatchReaderEquationPresentation(input: {
  readonly plan: KpReaderEquationTransitionPresentationPlan;
  readonly base: Omit<
    KpCanonicalNativeKatexSceneInput,
    | "purePlan"
    | "fanInRouting"
    | "factoring"
    | "operationChoreography"
    | "copyFanOutRouting"
    | "horizontalAxisSemanticEntityIds"
    | "reorderRouting"
    | "successorSyntheses"
    | "structuralSuccession"
    | "structuralMotion"
  >;
  readonly renderTransition: KpReaderEquationTransitionPlan;
  readonly direction: KpReaderEquationRenderPlan["direction"];
  readonly motionMode?:
    KpReaderEquationSceneCompositorInput["motionMode"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpReaderEquationCompositorDispatch {
  const { plan } = input;
  switch (plan.planKind) {
    case "default-motion":
      return plainDispatch(plan.planKind, input.base);
    case "visual-motif":
      if (plan.visualMotif.kind === "fraction-factor-split" &&
          input.renderTransition.transformType === "splitFractionFactors") {
        return { planKind: plan.planKind, canonicalInput: { ...input.base,
          trackProjection: createKpNativeFractionFactorSplit(input.renderTransition.relations, input.direction)
        }, motionProfile: "default", successorSynthesisCount: 0 };
      }
      return routedDispatch(
        plan.planKind,
        input.base,
        plan.visualMotif.kind,
        plan.visualMotif.kind === "copy-fan-out"
          ? persistentOperatorAxisIds(input.renderTransition)
          : undefined
      );
    case "distribution":
      if (input.source.stage.dataset["kpFractionCoherentTransportReview"] === "true") {
        return { planKind: plan.planKind, canonicalInput: {
          ...input.base,
          trackProjection: createKpFractionDistributionCoherentMotion(plan.distributionOperationPlans),
          horizontalAxisSemanticEntityIds: persistentOperatorAxisIds(input.renderTransition)
        }, motionProfile: "default", successorSynthesisCount: 0 };
      }
      return routedDispatch(
        plan.planKind,
        input.base,
        plan.visualMotif.kind,
        persistentOperatorAxisIds(input.renderTransition)
      );
    case "fraction-material":
      return routedDispatch(
        plan.planKind,
        input.base,
        plan.visualMotif?.kind
      );
    case "factoring": {
      const choreography = assertKpFactorCommonTermMotifBinding({
        transitionId: input.renderTransition.id,
        transformType: input.renderTransition.transformType,
        motifKind: plan.visualMotif.kind,
        direction: input.direction,
        semanticStatus: input.renderTransition.semanticStatus,
        successorSynthesisCount: 0,
        relations: input.renderTransition.relations,
        binding: plan.factoringMotifBinding
      });
      if (choreography === undefined) {
        throw new Error(
          `Factoring transition ${input.renderTransition.id} has no dispatch.`
        );
      }
      const factoring = bindKpNativeKatexFactoringScene({
        source: input.source,
        target: input.target,
        intent: choreography,
        choreography: plan.factoringMotifBinding.operationPresentationPlan.choreography
      });
      return {
        planKind: plan.planKind,
        canonicalInput: { ...input.base, factoring,
          ...(factoring.semanticClock === undefined ? {} : {
            // Complete factoring assigns arcs to copies, not to continuants.
            // Protect this axis through the later collision-planning pass.
            horizontalAxisSemanticEntityIds: choreography.contextCorrespondences.flatMap(pair =>
              [pair.sourceSelectorId, pair.targetSelectorId])
          }) },
        motionProfile: "canonical-factoring-fission-fusion",
        successorSynthesisCount: 0,
        factoring
      };
    }
    case "successor-synthesis": {
      if (plan.executableProgram.kind !== "operation-evaluation") {
        throw new Error(
          `Successor transition ${input.renderTransition.id} requires the ` +
          "operation-evaluation executable program."
        );
      }
      const successorSyntheses = plan.successorSyntheses.map((binding) => {
        const relation = input.renderTransition.relations.find(
          ({ recordId }) => recordId === binding.relationRecordId
        );
        if (relation === undefined) {
          throw new Error(
            `Successor binding ${binding.id} has no canonical correspondence.`
          );
        }
        return {
          binding,
          direction: input.direction,
          motion: fullMotion(input.motionMode)
        };
      }) as unknown as readonly [
        KpNativeKatexSuccessorSynthesisIntent,
        ...KpNativeKatexSuccessorSynthesisIntent[]
      ];
      const executableProgramExecution =
        compileKpExecutableSuccessorMotifProgramAdapter({
          kind: "operation-evaluation",
          program: plan.executableProgram,
          direction: input.direction,
          primitive: {
            kind: "native-katex-successor-synthesis",
            intents: successorSyntheses
          }
        });
      if (
        executableProgramExecution.programKind !== "operation-evaluation" ||
        executableProgramExecution.primitive.kind !==
          "native-katex-successor-synthesis"
      ) {
        throw new Error(
          `Successor transition ${input.renderTransition.id} resolved a ` +
          "non-evaluation compositor primitive."
        );
      }
      const routed = routingFields(undefined);
      return {
        planKind: plan.planKind,
        canonicalInput: {
          ...input.base,
          ...routed,
          successorSyntheses:
            executableProgramExecution.primitive.intents
        },
        motionProfile: motionProfile(routed),
        successorSynthesisCount: successorSyntheses.length,
        executableProgramExecution
      };
    }
    case "operation-choreography": {
      const routed = routingFields(plan.visualMotif.kind);
      return {
        planKind: plan.planKind,
        canonicalInput: {
          ...input.base,
          ...routed,
          operationChoreography: plan.operationChoreography
        },
        motionProfile: motionProfile(routed),
        successorSynthesisCount: 0,
        operationChoreography: plan.operationChoreography
      };
    }
    case "structural-succession":
      return {
        planKind: plan.planKind,
        canonicalInput: {
          ...input.base,
          structuralSuccession: plan.structuralSuccession,
          structuralMotion: fullMotion(input.motionMode)
        },
        motionProfile: "default",
        successorSynthesisCount: 0,
        structuralSuccession: plan.structuralSuccession
      };
    case "explicit-static-checkpoint":
      return {
        planKind: plan.planKind,
        canonicalInput: input.base,
        motionProfile: "default",
        successorSynthesisCount: 0,
        staticCheckpoint: plan.staticCheckpoint
      };
    default:
      // The never boundary makes a new reader-plan variant fail compilation
      // until this sole compositor dispatch gives it an explicit realization.
      return unreachablePresentationPlan(plan);
  }
}

type KpReaderEquationRoutingFields = Pick<
  KpCanonicalNativeKatexSceneInput,
  | "fanInRouting"
  | "copyFanOutRouting"
  | "reorderRouting"
  | "horizontalAxisSemanticEntityIds"
>;

function routingFields(
  motifKind: string | undefined
): KpReaderEquationRoutingFields {
  return motifKind === "merge-fan-in"
    ? { fanInRouting: true }
    : motifKind === "copy-fan-out"
      ? { copyFanOutRouting: true }
      : motifKind === "semantic-reorder-and-group"
        ? { reorderRouting: true }
        : {};
}

function routedDispatch(
  planKind:
    | "visual-motif"
    | "distribution"
    | "fraction-material",
  base: KpReaderEquationCompositorDispatchBase["canonicalInput"],
  motifKind: string | undefined,
  horizontalAxisSemanticEntityIds?: readonly string[] | undefined
): KpReaderEquationCompositorDispatch {
  const routed = routingFields(motifKind);
  return {
    planKind,
    canonicalInput: {
      ...base,
      ...routed,
      ...(horizontalAxisSemanticEntityIds === undefined
        ? {}
        : { horizontalAxisSemanticEntityIds })
    },
    motionProfile: motionProfile(routed),
    successorSynthesisCount: 0
  };
}

function persistentOperatorAxisIds(
  transition: KpReaderEquationTransitionPlan
): readonly string[] {
  const kinds = new Map([
    ...transition.source.flatMap((state) => state.selectors),
    ...transition.target.flatMap((state) => state.selectors)
  ].map((selector) => [selector.id, selector.semanticKind] as const));
  return Object.freeze([...new Set(transition.relations.flatMap((relation) =>
    (relation.lifecycle === "persist" || relation.lifecycle === "role-change") &&
      [...relation.sourceSelectorIds, ...relation.targetSelectorIds].every(
        (selectorId) => kinds.get(selectorId) === "operator"
      )
      ? [...relation.sourceSelectorIds, ...relation.targetSelectorIds]
      : []
  ))]);
}

function plainDispatch(
  planKind: "default-motion",
  canonicalInput:
    KpReaderEquationCompositorDispatchBase["canonicalInput"]
): KpReaderEquationCompositorDispatch {
  return {
    planKind,
    canonicalInput,
    motionProfile: "default",
    successorSynthesisCount: 0
  };
}

function motionProfile(
  routing: KpReaderEquationRoutingFields
): KpReaderEquationCompositorDispatchBase["motionProfile"] {
  return routing.copyFanOutRouting === true
    ? "canonical-copy-fan-out"
    : routing.reorderRouting === true
      ? "canonical-semantic-reorder-and-group"
      : "default";
}

function fullMotion(
  motionMode: KpReaderEquationSceneCompositorInput["motionMode"]
): "full" | "checkpoint" {
  return motionMode === undefined || motionMode === "continuous"
    ? "full"
    : "checkpoint";
}

function unreachablePresentationPlan(plan: never): never {
  throw new Error(`Unreachable reader presentation plan: ${String(plan)}`);
}

function projectStageOccupancy(
  layout: KpCorridorCertifiedEquationStageLayout,
  measurementIdentity: KpEquationStageMeasurementIdentity
): KpEquationMotionStageOccupancy {
  assertKpEquationStageMeasurementIdentity(
    layout.measurementIdentity,
    measurementIdentity,
    "Reader equation compositor stage occupancy"
  );
  return Object.freeze({
    measurementIdentity,
    rows: Object.freeze(layout.rows.map(({ id, rect }) => Object.freeze({
      id,
      rect: Object.freeze({ ...rect })
    }))),
    protectedCorridor: Object.freeze({
      ...layout.protectedTransitCorridor.rect
    }),
    geometryAuthority: "certified-stage-layout" as const
  });
}

function resolveTransitionPair(input: {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
}): {
  readonly renderTransition: KpReaderEquationTransitionPlan;
  readonly materialTransition: KpReaderEquationTransitionMaterialPlan;
} {
  if (input.materialPlan.renderPlanId !== input.renderPlan.id) {
    throw new Error(
      `Material plan ${input.materialPlan.id} does not belong to ${input.renderPlan.id}.`
    );
  }
  if (input.materialPlan.direction !== input.renderPlan.direction) {
    throw new Error("Reader equation compositor plans disagree on direction.");
  }
  const renderTransition = input.renderPlan.transitions.find(
    ({ id }) => id === input.transitionId
  );
  const materialTransition = input.materialPlan.transitions.find(
    ({ transitionId }) => transitionId === input.transitionId
  );
  if (renderTransition === undefined || materialTransition === undefined) {
    throw new Error(
      `Reader equation compositor is missing transition ${input.transitionId}.`
    );
  }
  return { renderTransition, materialTransition };
}

function projectReaderRelations(input: {
  readonly renderTransition: KpReaderEquationTransitionPlan;
  readonly materialTransition: KpReaderEquationTransitionMaterialPlan;
}): readonly KpNativeKatexSemanticPaintRelation[] {
  const relationById = new Map(
    input.renderTransition.relations.map((relation) => [
      relation.recordId,
      relation
    ])
  );
  const anchorsById = new Map(
    input.materialTransition.anchors.map((anchor) => [anchor.id, anchor])
  );
  return Object.freeze(input.materialTransition.owners.flatMap((owner) => {
    const canonical = relationById.get(owner.relationRecordId);
    if (canonical === undefined) {
      throw new Error(
        `Material owner ${owner.id} has no canonical correspondence record.`
      );
    }
    const sourceEntityIds = owner.sourceAnchorIds.map((anchorId) => {
      const anchor = anchorsById.get(anchorId);
      if (anchor === undefined || anchor.side !== "source") {
        throw new Error(`Material owner ${owner.id} has an invalid source anchor.`);
      }
      return anchor.selectorId;
    });
    const targetEntityIds = owner.targetAnchorIds.map((anchorId) => {
      const anchor = anchorsById.get(anchorId);
      if (anchor === undefined || anchor.side !== "target") {
        throw new Error(`Material owner ${owner.id} has an invalid target anchor.`);
      }
      return anchor.selectorId;
    });
    if (
      !sameValues(sourceEntityIds, canonical.sourceSelectorIds) ||
      !sameValues(targetEntityIds, canonical.targetSelectorIds)
    ) {
      throw new Error(
        `Material owner ${owner.id} diverges from canonical correspondence.`
      );
    }
    if (sourceEntityIds.length === 0 || targetEntityIds.length === 0) return [];
    const relation =
      sourceEntityIds.length > 1 && targetEntityIds.length === 1
        ? "merge" as const
        : sourceEntityIds.length === 1 && targetEntityIds.length > 1
          ? "split" as const
          : sourceEntityIds.length === 1 && targetEntityIds.length === 1
            ? "persist" as const
            : undefined;
    if (relation === undefined) {
      throw new Error(
        `Material owner ${owner.id} has unsupported many-to-many paint lineage.`
      );
    }
    return [Object.freeze({
      id: `reader-paint.${owner.relationRecordId}`,
      relation,
      sourceEntityIds: Object.freeze(sourceEntityIds),
      targetEntityIds: Object.freeze(targetEntityIds)
    })];
  }));
}

function sameValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
