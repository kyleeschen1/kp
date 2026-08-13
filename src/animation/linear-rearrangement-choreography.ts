import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
import {
  compileKpChoreographyTimeline,
  sampleKpChoreographyTimeline,
  type KpChoreographyTimeline,
  type KpChoreographyTimelineFrame
} from "./choreography-timeline.ts";
import type {
  KpChoreographyLifecycle,
  KpChoreographyLifecycleRecord
} from "./choreography-lifecycle.ts";
import type {
  KpChoreographyVocabulary,
  KpSemanticContinuant
} from "./choreography-vocabulary.ts";
import {
  compileKpFocusProfile,
  sampleKpFocusProfile,
  type KpFocusAccessibilityMode,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
import type { KpChoreographyEnvelopePhaseId } from "./choreography-plan.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge
} from "../semantic/semantic-lineage-graph.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import {
  kpEquationLinearRearrangementKindForTransformType,
  type KpEquationLinearRearrangementKind
} from "./equation-linear-rearrangement-kind.ts";
import {
  compileKpBridgedChoreographySequence,
  type KpBridgedChoreographySequence
} from "./choreography-envelope-bridge.ts";
import {
  createKpSuccessorSynthesisBindingFromMetadata,
  type KpSuccessorSynthesisBinding
} from "./successor-synthesis.ts";
import {
  createKpBalancedBranchScheduling,
  type KpBalancedBranchScheduling
} from "./equation-balanced-branch-scheduling.ts";
import {
  resolveKpEquationPresentationBranchStrategy
} from "./equation-presentation-policy.ts";

export const kpLinearRearrangementTiming = {
  orientEnd: 0.14,
  reflowEnd: 0.38,
  actEnd: 0.72,
  settleEnd: 0.9
} as const;

export interface KpLinearRearrangementSubgraphNode {
  readonly id: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly kind:
    | "focus-cause"
    | "reserve-space"
    | "hold-layout"
    | "move-continuants"
    | "introduce-balanced-terms"
    | "introduce-division-structure"
    | "bifurcate-fraction-structure"
    | "lower-numerator-operator"
    | "merge-fraction-structure"
    | "raise-numerator-operator"
    | "meet-canceling-terms"
    | "collapse-canceling-terms"
    | "compact-survivors"
    | "converge-operands"
    | "derive-result"
    | "recognize-result"
    | "release-focus";
  readonly dependsOnNodeIds: readonly string[];
}

export interface KpLinearRearrangementStep {
  readonly transformationId: string;
  readonly kind: KpEquationLinearRearrangementKind;
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focus: KpFocusProfilePlan;
  readonly operationSubgraph: {
    readonly id: string;
    readonly nodes: readonly KpLinearRearrangementSubgraphNode[];
  };
  readonly branchOperation?: KpBalancedBranchScheduling["branchOperation"] | undefined;
  readonly branchSchedules?: KpBalancedBranchScheduling["branchSchedules"] | undefined;
  readonly branchSchedule?: KpBalancedBranchScheduling["branchSchedule"] | undefined;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
}

export interface KpLinearRearrangementChoreography {
  readonly id: string;
  readonly steps: readonly KpLinearRearrangementStep[];
  readonly sequence: KpBridgedChoreographySequence;
}

export interface KpLinearRearrangementChoreographyFrame {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly timeline: KpChoreographyTimelineFrame;
  readonly focus: KpFocusProfileFrame;
  readonly reservationProgress: number;
  readonly actProgress: number;
  readonly recognitionProgress: number;
  readonly releaseProgress: number;
  readonly activeSubgraphNodeIds: readonly string[];
}

export function createKpLinearRearrangementChoreography(
  animation: KpAnimationAsset
): KpLinearRearrangementChoreography {
  const transformations = animation.transformations.filter((candidate) =>
    kpEquationLinearRearrangementKindForTransformType(candidate.transformType) !== undefined
  );
  if (transformations.length === 0) {
    throw new Error(`Animation ${animation.id} has no linear rearrangement steps.`);
  }
  const steps = transformations.map((transformation) =>
    createStep(animation, transformation)
  );
  const persistentMaterialContinuantIds = [
    `material.${animation.id}.lhs.x`,
    `material.${animation.id}.equals`
  ];
  return {
    id: `choreography.${animation.id}.linear-rearrangement`,
    steps,
    sequence: compileKpBridgedChoreographySequence({
      id: `sequence.${animation.id}.linear-rearrangement`,
      steps: steps.map((step) => ({
        transformationId: step.transformationId,
        weight: 1
      })),
      bridges: steps.slice(0, -1).map((step, index) => ({
        id: `bridge.${step.transformationId}.${steps[index + 1]!.transformationId}`,
        fromTransformationId: step.transformationId,
        toTransformationId: steps[index + 1]!.transformationId,
        preserveMaterialContinuantIds: persistentMaterialContinuantIds,
        attention: index === 0 ? "transfer" : "hold",
        velocity: index === 0 ? "settle-before-next" : "continuous"
      })),
      bridgeSpan: 0.06
    })
  };
}

export function sampleKpLinearRearrangementChoreography(input: {
  readonly step: KpLinearRearrangementStep;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpLinearRearrangementChoreographyFrame {
  const timeline = sampleKpChoreographyTimeline({
    timeline: input.step.timeline,
    progress: input.progress,
    direction: input.direction
  });
  const phaseId = timeline.activePhaseIds.at(-1) ??
    (timeline.semanticProgress <= 0 ? "orient" : "release");
  const focusPlan = input.accessibilityMode === "full"
    ? input.step.focus
    : compileKpFocusProfile({
        id: input.step.focus.id,
        groupId: input.step.focus.groupId,
        semanticEntityIds: input.step.focus.semanticEntityIds,
        fragmentIds: [],
        profile: input.step.focus.groupTreatment.profile,
        strength: 0.52,
        contextDimming: input.step.focus.contextProfile.dimming,
        accessibilityMode: input.accessibilityMode
      });
  return {
    kind: input.step.kind,
    timeline,
    focus: sampleKpFocusProfile({
      plan: focusPlan,
      phaseId,
      phaseProgress: timeline.phaseProgress[phaseId] ?? 1
    }),
    reservationProgress: windowProgress(
      timeline.semanticProgress,
      kpLinearRearrangementTiming.orientEnd,
      kpLinearRearrangementTiming.reflowEnd
    ),
    actProgress: windowProgress(
      timeline.semanticProgress,
      kpLinearRearrangementTiming.reflowEnd,
      kpLinearRearrangementTiming.actEnd
    ),
    recognitionProgress: windowProgress(
      timeline.semanticProgress,
      kpLinearRearrangementTiming.actEnd,
      kpLinearRearrangementTiming.settleEnd
    ),
    releaseProgress: windowProgress(
      timeline.semanticProgress,
      kpLinearRearrangementTiming.settleEnd,
      1
    ),
    activeSubgraphNodeIds: input.step.operationSubgraph.nodes
      .filter((node) => node.phaseId === phaseId)
      .map((node) => node.id)
  };
}

function createStep(
  animation: KpAnimationAsset,
  transformation: KpSemanticTransformation
): KpLinearRearrangementStep {
  const kind = kpEquationLinearRearrangementKindForTransformType(
    transformation.transformType
  );
  if (kind === undefined || transformation.correspondenceMap === undefined) {
    throw new Error(`Transformation ${transformation.id} is not a complete rearrangement step.`);
  }
  const semanticSelectorIds = new Set(
    animation.bundle.objects.flatMap((object) =>
      object.selectors
        .filter(({ kind: selectorKind }) => selectorKind !== "artifact")
        .map(({ id }) => id)
    )
  );
  // Structural paint has a native compositor owner, so this semantic plan
  // must project the same non-artifact inventory as transition IR.
  const records = transformation.correspondenceMap.records.flatMap((record) => {
    const projected = {
      ...record,
      sourceSelectorIds: record.sourceSelectorIds.filter((id) =>
        semanticSelectorIds.has(id)
      ),
      targetSelectorIds: record.targetSelectorIds.filter((id) =>
        semanticSelectorIds.has(id)
      )
    };
    return projected.sourceSelectorIds.length === 0 &&
        projected.targetSelectorIds.length === 0
      ? []
      : [projected];
  });
  const continuantRecords = records.filter((record) =>
    record.relation === "identity" ||
    (isFractionStructureRewriteKind(kind) && record.relation === "role-change")
  );
  const continuants = continuantRecords.map((record) =>
    continuantForRecord(transformation, record)
  );
  const causalRecords = records.filter((record) =>
    !continuantRecords.includes(record)
  );
  const causalRecord = kind === "split-fraction-sum"
    ? causalRecords.find((record) => record.relation === "fan-out")
    : kind === "merge-fractions"
      ? causalRecords.find((record) => record.relation === "fan-in")
    : causalRecords[0];
  if (causalRecord === undefined) {
    throw new Error(`Linear rearrangement ${transformation.id} requires a causal record.`);
  }
  const successorSynthesisBinding = isSuccessorKind(kind)
    ? createKpSuccessorSynthesisBindingFromMetadata({
        bundle: animation.bundle,
        transformation,
        correspondence: causalRecord,
        operationId: `kp.algebra.${kebabCase(transformation.transformType)}`
      })
    : undefined;
  const vocabulary = vocabularyForStep(
    transformation,
    kind,
    continuants,
    causalRecord,
    causalRecords,
    successorSynthesisBinding
  );
  const lifecycle = lifecycleForStep(
    transformation,
    kind,
    continuants,
    causalRecord,
    causalRecords,
    successorSynthesisBinding
  );
  const lineageEdges = records.flatMap((record) =>
    lineageEdgesForRecord(transformation, record, successorSynthesisBinding)
  );
  const sourceEntityIds = records.flatMap((record) => record.sourceSelectorIds);
  const targetEntityIds = records.flatMap((record) => record.targetSelectorIds);
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds,
    targetEntityIds,
    edges: lineageEdges
  });
  const focusEntityIds = focusEntityIdsForStep(
    transformation,
    causalRecord,
    causalRecords
  );
  const sourceNodeId = `salience.${transformation.id}.cause`;
  const targetNodeId = `salience.${transformation.id}.result`;
  const causalTargetIds = causalRecords.flatMap((record) => record.targetSelectorIds);
  const hasTarget = causalTargetIds.length > 0;
  const result = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: animation.timeline?.id ?? `timeline.${animation.id}`,
    canonicalOperationId: `kp.algebra.${kebabCase(transformation.transformType)}`,
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle,
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: [
        {
          id: sourceNodeId,
          entityIds: focusEntityIds,
          role: "source",
          readinessThreshold: 0.62
        },
        ...(hasTarget
          ? [{
              id: targetNodeId,
              entityIds: causalTargetIds,
              role: "target" as const,
              readinessThreshold: 0.72
            }]
          : [])
      ],
      edges: hasTarget
        ? [{
            id: `${transformation.id}.salience-handoff`,
            sourceNodeId,
            targetNodeId,
            lineageEdgeId: `${transformation.id}.${causalRecord.id}`,
            targetReadyAt: 0.68,
            sourceReleaseAt: 0.86
          }]
        : [],
      branchGroups: []
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "execution",
      authorityId: `kp.algebra.${kebabCase(transformation.transformType)}`,
      participants: [{
        id: `${transformation.id}.operation`,
        entityIds: [...new Set([...sourceEntityIds, ...targetEntityIds])],
        rank: 0
      }],
      ranks: [{
        rank: 0,
        participantIds: [`${transformation.id}.operation`],
        presentation: "show"
      }],
      cascade: {
        adjacentOnly: true,
        nextRankReadinessThreshold: 0.68
      }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: motifIdsForKind(kind)
  });
  if (result.status !== "compiled") {
    throw new Error(
      `Linear rearrangement choreography failed: ${result.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  const branchScheduling = createBalancedBranchScheduling({
    animation,
    transformation,
    kind
  });
  return {
    transformationId: transformation.id,
    kind,
    plan: result.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.choreography`,
      plan: result.plan,
      focusReadinessThreshold: 0.62,
      recognitionDwell: 0.45,
      phaseWeights: {
        orient: 0.14,
        reflow: 0.24,
        act: 0.34,
        settle: 0.18,
        release: 0.1
      }
    }),
    focus: compileKpFocusProfile({
      id: `focus.${transformation.id}.cause`,
      groupId: `${transformation.id}.cause`,
      semanticEntityIds: focusEntityIds,
      fragmentIds: [],
      profile: "elevated",
      strength: 0.52,
      contextDimming: 0.1,
      accessibilityMode: "full"
    }),
    operationSubgraph: operationSubgraph(transformation.id, kind),
    ...(branchScheduling === undefined ? {} : branchScheduling),
    ...(successorSynthesisBinding === undefined
      ? {}
      : { successorSynthesisBinding })
  };
}

function createBalancedBranchScheduling(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly kind: KpEquationLinearRearrangementKind;
}): Pick<
  KpLinearRearrangementStep,
  "branchOperation" | "branchSchedules" | "branchSchedule"
> | undefined {
  const selected = resolveKpEquationPresentationBranchStrategy(
    input.animation
  );
  if (selected === undefined) return undefined;
  if (input.kind !== "balanced-introduction") return undefined;
  return createKpBalancedBranchScheduling({
    transformationId: input.transformation.id,
    authorityId: `kp.algebra.${kebabCase(input.transformation.transformType)}`,
    // The schedule owns the complete semantic introduction cohort, not the
    // incidental first correspondence record.
    targetSelectorIds:
      input.transformation.correspondenceMap?.records
        .filter(({ relation }) => relation === "introduction")
        .flatMap(({ targetSelectorIds }) => targetSelectorIds) ?? [],
    selectedStrategy: selected
  });
}

function vocabularyForStep(
  transformation: KpSemanticTransformation,
  kind: KpEquationLinearRearrangementKind,
  continuants: readonly KpSemanticContinuant[],
  causalRecord: SelectorCorrespondenceRecord,
  causalRecords: readonly SelectorCorrespondenceRecord[],
  successorSynthesisBinding: KpSuccessorSynthesisBinding | undefined
): KpChoreographyVocabulary {
  const lineageId = `${transformation.id}.derived-result`;
  const structuralMerge = kind === "merge-fractions";
  const lineageSourceIds = structuralMerge
    ? causalRecords.flatMap((record) => record.sourceSelectorIds)
    : successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "material-input")
      .map((annotation) => annotation.id) ?? causalRecord.sourceSelectorIds;
  const lineageTargetIds = structuralMerge
    ? causalRecords.flatMap((record) => record.targetSelectorIds)
    : successorSynthesisBinding?.targetAnnotations
      .map((annotation) => annotation.id) ?? causalRecord.targetSelectorIds;
  return {
    id: `vocabulary.${transformation.id}`,
    continuants,
    representationalLineages: isSuccessorKind(kind) || structuralMerge
      ? [{
          id: lineageId,
          meaning: structuralMerge
            ? "Two compatible fraction structures reconcile into one shared structure."
            : "The constant expression succeeds into its evaluated value.",
          sourceRepresentation: {
            entityId: `${transformation.id}.source-expression`,
            selectorIds: lineageSourceIds
          },
          targetRepresentation: {
            entityId: `${transformation.id}.target-value`,
            selectorIds: lineageTargetIds
          },
          cause: {
            kind: "transformation",
            transformationId: transformation.id,
            correspondenceRecordIds: [causalRecord.id]
          }
        }]
      : [],
    objectConstancy: continuants.map((continuant) => ({
      id: `${continuant.id}.constancy`,
      continuantId: continuant.id,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    })),
    materialContinuity: [
      ...continuants.map((continuant) => ({
        id: `${continuant.id}.continuity`,
        mode: "continuant-motion" as const,
        sourceEntityIds: continuant.source.selectorIds,
        targetEntityIds: continuant.target.selectorIds,
        authorityRef: {
          kind: "continuant" as const,
          continuantId: continuant.id
        },
        summary: `${continuant.meaning} It remains opaque while moving.`
      })),
      ...(isSuccessorKind(kind) || structuralMerge
        ? [{
            id: `${lineageId}.continuity`,
            mode: "causal-derivation" as const,
            sourceEntityIds: lineageSourceIds,
            targetEntityIds: lineageTargetIds,
            authorityRef: {
              kind: "representational-lineage" as const,
              lineageId
            },
            summary: structuralMerge
              ? "Both fraction structures remain visible while converging into their shared structure."
              : "The operands remain visible while converging into the evaluated result."
          }]
        : [])
    ],
    motionClassifications: [{
      id: `${transformation.id}.causal-motion`,
      entityIds: [
        ...causalRecord.sourceSelectorIds,
        ...causalRecord.targetSelectorIds
      ],
      motionClass: "meaningful",
      reason: meaningfulMotionReason(kind)
    }]
  };
}

function lifecycleForStep(
  transformation: KpSemanticTransformation,
  kind: KpEquationLinearRearrangementKind,
  continuants: readonly KpSemanticContinuant[],
  causalRecord: SelectorCorrespondenceRecord,
  causalRecords: readonly SelectorCorrespondenceRecord[],
  successorSynthesisBinding: KpSuccessorSynthesisBinding | undefined
): KpChoreographyLifecycle {
  const records: KpChoreographyLifecycleRecord[] = continuants.map(
    (continuant) => ({
      id: `${continuant.id}.lifecycle`,
      kind: "continuant",
      continuantId: continuant.id,
      sourceEntityIds: continuant.source.selectorIds,
      targetEntityIds: continuant.target.selectorIds,
      summary: continuant.meaning
    })
  );
  if (kind === "balanced-introduction") {
    const introducedEntityIds = transformation.correspondenceMap?.records
      .filter(({ relation }) => relation === "introduction")
      .flatMap(({ targetSelectorIds }) => targetSelectorIds) ?? [];
    records.push({
      id: `${transformation.id}.balanced-introduction`,
      kind: "introduction",
      cause: {
        kind: "semantic-introduction",
        authorityId: `kp.algebra.subtract-both-sides#balanced-inverse`
      },
      sourceEntityIds: [],
      targetEntityIds: introducedEntityIds,
      summary: "Equal inverse terms enter only after both sides reserve space."
    });
  } else if (kind === "divide-both-sides") {
    for (const record of causalRecords) {
      if (record.relation !== "introduction") {
        throw new Error(
          `Divide-both-sides step ${transformation.id} requires introduction-only causal records.`
        );
      }
      records.push({
        id: `${transformation.id}.${record.id}.introduction`,
        kind: "introduction",
        cause: {
          kind: "semantic-introduction",
          authorityId: "kp.algebra.divide-both-sides#matched-division-structure"
        },
        sourceEntityIds: [],
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      });
    }
  } else if (kind === "split-fraction-sum") {
    for (const record of causalRecords) {
      if (record.relation !== "fan-out") {
        throw new Error(
          `Split-fraction-sum step ${transformation.id} requires fan-out causal records.`
        );
      }
      records.push({
        id: `${transformation.id}.${record.id}.copy`,
        kind: "copy",
        operationId: "kp.algebra.split-fraction-sum",
        lineageEdgeId: `${transformation.id}.${record.id}`,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      });
    }
  } else if (kind === "merge-fractions") {
    records.push({
      id: `${transformation.id}.structural-merge`,
      kind: "successor",
      representationalLineageId: `${transformation.id}.derived-result`,
      sourceEntityIds: causalRecords.flatMap((record) => record.sourceSelectorIds),
      targetEntityIds: causalRecords.flatMap((record) => record.targetSelectorIds),
      summary: "Paired fraction rules and denominators reconcile into one shared fraction structure."
    });
  } else if (isCancellationKind(kind)) {
    records.push({
      id: `${transformation.id}.cancellation`,
      kind: "elimination",
      cause: {
        kind: "cancellation",
        authorityId: kind === "cancel-additive-inverses"
          ? "kp.algebra.cancel-additive-inverses#additive-inverse"
          : "kp.algebra.cancel-multiplicative-inverses#multiplicative-inverse"
      },
      sourceEntityIds: causalRecord.sourceSelectorIds,
      targetEntityIds: [],
      summary: "The additive inverse pair meets and collapses before survivor compaction."
    });
    for (const record of causalRecords.filter((candidate) => candidate.relation === "removal")) {
      records.push({
        id: `${transformation.id}.${record.id}.retirement`,
        kind: "elimination",
        cause: {
          kind: "consumption",
          authorityId: `${transformation.id}#${record.id}.structural-retirement`
        },
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: [],
        summary: record.summary
      });
    }
  } else {
    const materialSourceIds = successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "material-input")
      .map((annotation) => annotation.id) ?? causalRecord.sourceSelectorIds;
    const catalystSourceIds = successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "catalyst")
      .map((annotation) => annotation.id) ?? [];
    records.push({
      id: `${transformation.id}.successor`,
      kind: "successor",
      representationalLineageId: `${transformation.id}.derived-result`,
      sourceEntityIds: materialSourceIds,
      targetEntityIds: causalRecord.targetSelectorIds,
      summary: "The constant expression succeeds into its evaluated result."
    });
    if (catalystSourceIds.length > 0) {
      records.push({
        id: `${transformation.id}.catalyst-retirement`,
        kind: "elimination",
        cause: {
          kind: "consumption",
          authorityId: `${transformation.id}#${causalRecord.id}.catalyst`
        },
        sourceEntityIds: catalystSourceIds,
        targetEntityIds: [],
        summary: "The operator shapes the synthesis but contributes no result material."
      });
    }
  }
  return { id: `lifecycle.${transformation.id}`, records };
}

function continuantForRecord(
  transformation: KpSemanticTransformation,
  record: SelectorCorrespondenceRecord
): KpSemanticContinuant {
  return {
    id: `continuant.${transformation.id}.${record.id}`,
    meaning: record.summary,
    relation: record.relation === "role-change" ? "role-change" : "identity",
    source: {
      entityId: record.sourceSelectorIds[0]!,
      selectorIds: record.sourceSelectorIds
    },
    target: {
      entityId: record.targetSelectorIds[0]!,
      selectorIds: record.targetSelectorIds
    },
    identityAuthority: {
      kind: "correspondence",
      transformationId: transformation.id,
      correspondenceRecordId: record.id
    }
  };
}

function lineageEdgesForRecord(
  transformation: KpSemanticTransformation,
  record: SelectorCorrespondenceRecord,
  successorSynthesisBinding: KpSuccessorSynthesisBinding | undefined
): readonly KpSemanticLineageEdge[] {
  const relation = (() => {
    switch (record.relation) {
      case "identity": return "persist" as const;
      case "role-change": return "persist" as const;
      case "introduction": return "introduction" as const;
      case "cancelation": return "removal" as const;
      case "removal": return "removal" as const;
      case "fan-in": return "representation-succession" as const;
      case "fan-out": return "split" as const;
      default:
        throw new Error(
          `Unsupported linear rearrangement relation ${record.relation}.`
        );
    }
  })();
  const materialSourceIds = relation === "representation-succession"
    ? successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "material-input")
      .map((annotation) => annotation.id) ?? record.sourceSelectorIds
    : record.sourceSelectorIds;
  const primary: KpSemanticLineageEdge = {
    id: `${transformation.id}.${record.id}`,
    relation,
    sourceEntityIds: materialSourceIds,
    targetEntityIds: record.targetSelectorIds,
    ...(relation === "representation-succession"
      ? { representationAuthorityId: `${transformation.id}#${record.id}` }
      : {}),
    summary: record.summary
  };
  const catalystSourceIds = relation === "representation-succession"
    ? successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "catalyst")
      .map((annotation) => annotation.id) ?? []
    : [];
  return catalystSourceIds.length === 0
    ? [primary]
    : [
        primary,
        {
          id: `${transformation.id}.${record.id}.catalyst-retirement`,
          relation: "removal",
          sourceEntityIds: catalystSourceIds,
          targetEntityIds: [],
          summary: "The operator retires after catalyzing the successor synthesis."
        }
      ];
}

function focusEntityIdsForStep(
  transformation: KpSemanticTransformation,
  causalRecord: SelectorCorrespondenceRecord,
  causalRecords: readonly SelectorCorrespondenceRecord[]
): readonly string[] {
  if (causalRecord.sourceSelectorIds.length > 0) {
    return causalRecord.sourceSelectorIds;
  }
  const introduced = causalRecords.flatMap((record) =>
    record.targetSelectorIds
  );
  if (introduced.length > 0) return introduced;
  const records = transformation.correspondenceMap!.records;
  return records
    .filter((record) => record.id === "left-constant-persists")
    .flatMap((record) => record.sourceSelectorIds);
}

function operationSubgraph(
  transformationId: string,
  kind: KpEquationLinearRearrangementKind
): KpLinearRearrangementStep["operationSubgraph"] {
  const node = (
    suffix: string,
    phaseId: KpChoreographyEnvelopePhaseId,
    nodeKind: KpLinearRearrangementSubgraphNode["kind"],
    dependsOnNodeIds: readonly string[] = []
  ): KpLinearRearrangementSubgraphNode => ({
    id: `${transformationId}.${suffix}`,
    phaseId,
    kind: nodeKind,
    dependsOnNodeIds
  });
  const focus = node("focus-cause", "orient", "focus-cause");
  const recognize = node("recognize", "settle", "recognize-result");
  const release = node(
    "release",
    "release",
    "release-focus",
    [recognize.id]
  );
  const nodes = kind === "balanced-introduction" || kind === "divide-both-sides"
    ? (() => {
        const reserve = node(
          "reserve-space",
          "reflow",
          "reserve-space",
          [focus.id]
        );
        const move = node(
          "move-continuants",
          "reflow",
          "move-continuants",
          [reserve.id]
        );
        const introduce = node(
          kind === "divide-both-sides"
            ? "introduce-division-structure"
            : "introduce-balanced-terms",
          "act",
          kind === "divide-both-sides"
            ? "introduce-division-structure"
            : "introduce-balanced-terms",
          [move.id]
        );
        return [focus, reserve, move, introduce, {
          ...recognize,
          dependsOnNodeIds: [introduce.id]
        }, release];
      })()
    : kind === "split-fraction-sum"
      ? (() => {
          const reserve = node(
            "reserve-space",
            "reflow",
            "reserve-space",
            [focus.id]
          );
          const lower = node(
            "lower-numerator-operator",
            "act",
            "lower-numerator-operator",
            [reserve.id]
          );
          const bifurcate = node(
            "bifurcate-fraction-structure",
            "act",
            "bifurcate-fraction-structure",
            [lower.id]
          );
          return [focus, reserve, lower, bifurcate, {
            ...recognize,
            dependsOnNodeIds: [bifurcate.id]
          }, release];
        })()
    : kind === "merge-fractions"
      ? (() => {
          const reserve = node(
            "reserve-space",
            "reflow",
            "reserve-space",
            [focus.id]
          );
          const raise = node(
            "raise-numerator-operator",
            "act",
            "raise-numerator-operator",
            [reserve.id]
          );
          const merge = node(
            "merge-fraction-structure",
            "act",
            "merge-fraction-structure",
            [raise.id]
          );
          return [focus, reserve, raise, merge, {
            ...recognize,
            dependsOnNodeIds: [merge.id]
          }, release];
        })()
    : isCancellationKind(kind)
      ? (() => {
          const hold = node(
            "hold-layout",
            "reflow",
            "hold-layout",
            [focus.id]
          );
          const meet = node(
            "meet-canceling-terms",
            "act",
            "meet-canceling-terms",
            [hold.id]
          );
          const collapse = node(
            "collapse-canceling-terms",
            "act",
            "collapse-canceling-terms",
            [meet.id]
          );
          const compact = node(
            "compact-survivors",
            "settle",
            "compact-survivors",
            [collapse.id]
          );
          return [focus, hold, meet, collapse, compact, {
            ...recognize,
            dependsOnNodeIds: [compact.id]
          }, release];
        })()
      : (() => {
          const move = node(
            "move-continuants",
            "reflow",
            "move-continuants",
            [focus.id]
          );
          const converge = node(
            "converge-operands",
            "act",
            "converge-operands",
            [move.id]
          );
          const derive = node(
            "derive-result",
            "act",
            "derive-result",
            [converge.id]
          );
          return [focus, move, converge, derive, {
            ...recognize,
            dependsOnNodeIds: [derive.id]
          }, release];
        })();
  return {
    id: `${transformationId}.operation-subgraph`,
    nodes
  };
}

function motifIdsForKind(
  kind: KpEquationLinearRearrangementKind
): readonly string[] {
  switch (kind) {
    case "balanced-introduction": return ["append-after-shift", "balanced-entry"];
    case "divide-both-sides": return ["append-after-shift", "matched-fraction-entry"];
    case "certified-fraction-transfer": return ["transfer", "certified-projection"];
    case "split-fraction-sum": return ["copy-fan-out", "fraction-structure-split"];
    case "merge-fractions": return ["merge-fan-in", "fraction-structure-merge"];
    case "cancel-additive-inverses": return ["cancelation", "meet-collapse"];
    case "cancel-multiplicative-inverses": return ["cancelation", "meet-collapse"];
    case "simplify-constant-difference": return ["merge-fan-in", "derive-result"];
    case "simplify-constant-quotient": return ["merge-fan-in", "derive-result"];
    case "simplify-constant-product": return ["merge-fan-in", "derive-result"];
  }
}

function meaningfulMotionReason(
  kind: KpEquationLinearRearrangementKind
): string {
  switch (kind) {
    case "balanced-introduction":
      return "Reserved-space entry communicates that the same inverse operation applies to both sides.";
    case "divide-both-sides":
      return "Synchronized fraction structure communicates that the same non-zero divisor applies to both sides.";
    case "certified-fraction-transfer":
      return "A continuous presentation proxy compresses a certified balanced multiplication and cancellation without claiming semantic identity.";
    case "split-fraction-sum":
      return "Structural fan-out and operator descent communicate that each numerator term inherits the shared denominator.";
    case "merge-fractions":
      return "Structural convergence and operator ascent communicate that compatible fractions recover one shared numerator and denominator.";
    case "cancel-additive-inverses":
      return "Meet then collapse communicates additive inverse cancellation.";
    case "cancel-multiplicative-inverses":
      return "Meet then collapse communicates multiplicative inverse cancellation.";
    case "simplify-constant-difference":
      return "Token convergence communicates that the operands causally derive the result.";
    case "simplify-constant-quotient":
      return "Token convergence communicates that the dividend and divisor causally derive the quotient.";
    case "simplify-constant-product":
      return "Token convergence communicates that the factors causally derive the product.";
  }
}

function isCancellationKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "cancel-additive-inverses" || kind === "cancel-multiplicative-inverses";
}

function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" ||
    kind === "simplify-constant-quotient" ||
    kind === "simplify-constant-product";
}

function isFractionStructureRewriteKind(
  kind: KpEquationLinearRearrangementKind
): boolean {
  return kind === "split-fraction-sum" || kind === "merge-fractions";
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}
