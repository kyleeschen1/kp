import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
import {
  compileKpChoreographyTimeline,
  type KpChoreographyTimeline
} from "./choreography-timeline.ts";
import type {
  KpChoreographyLifecycle,
  KpChoreographyLifecycleRecord
} from "./choreography-lifecycle.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";
import type { KpSalienceNode } from "./salience-graph.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge
} from "../semantic/semantic-lineage-graph.ts";

export interface KpExponentSuccessionChoreography {
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focusGroupIds: readonly string[];
}

export function createKpExponentSuccessionChoreography(input: {
  readonly animation: KpAnimationAsset;
  readonly transformationId: string;
}): KpExponentSuccessionChoreography {
  const transformation = input.animation.transformations.find(
    (candidate) => candidate.id === input.transformationId
  );
  if (
    transformation === undefined ||
    (transformation.transformType !== "lowerExponent" &&
      transformation.transformType !== "unwrapUnitExponent")
  ) {
    throw new Error(
      `Animation ${input.animation.id} has no inspectable exponent transformation ${input.transformationId}.`
    );
  }
  const records = transformation.correspondenceMap?.records ?? [];
  if (records.length === 0) {
    throw new Error("Exponent succession requires semantic correspondence.");
  }

  const vocabulary = createVocabulary(transformation, records);
  const lifecycle = createLifecycle(transformation, records);
  const lineageEdges = records.map((record) =>
    createLineageEdge(transformation, record)
  );
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: unique(records.flatMap((record) => record.sourceSelectorIds)),
    targetEntityIds: unique(records.flatMap((record) => record.targetSelectorIds)),
    edges: lineageEdges
  });
  const salienceRecords = records.filter(
    (record) =>
      record.sourceSelectorIds.length > 0 &&
      record.targetSelectorIds.length > 0
  );
  const salienceNodes: KpSalienceNode[] = salienceRecords.flatMap((record) => [
    {
      id: `salience.${transformation.id}.${record.id}.source`,
      entityIds: record.sourceSelectorIds,
      role: "source" as const,
      readinessThreshold: 0.6
    },
    {
      id: `salience.${transformation.id}.${record.id}.target`,
      entityIds: record.targetSelectorIds,
      role: "target" as const,
      readinessThreshold: 0.72
    }
  ]);
  const participants = records.map((record, rank) => ({
    id: `participant.${transformation.id}.${record.id}`,
    entityIds: unique([
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ]),
    rank
  }));
  const canonicalOperationId =
    transformation.transformType === "lowerExponent"
      ? "kp.algebra.lower-exponent"
      : "kp.algebra.unwrap-unit-exponent";
  const result = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId:
      input.animation.timeline?.id ?? `timeline.${input.animation.id}`,
    canonicalOperationId,
    transformation,
    bundle: input.animation.bundle,
    vocabulary,
    lifecycle,
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: salienceNodes,
      edges: salienceRecords.map((record) => ({
        id: `salience.${transformation.id}.${record.id}.handoff`,
        sourceNodeId: `salience.${transformation.id}.${record.id}.source`,
        targetNodeId: `salience.${transformation.id}.${record.id}.target`,
        lineageEdgeId: `lineage.${transformation.id}.${record.id}`,
        targetReadyAt: 0.68,
        sourceReleaseAt: 0.82
      })),
      branchGroups: []
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "execution",
      authorityId: canonicalOperationId,
      participants,
      ranks: participants.map((participant) => ({
        rank: participant.rank,
        participantIds: [participant.id],
        presentation: "show"
      })),
      cascade: {
        adjacentOnly: true,
        nextRankReadinessThreshold: 0.66
      }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: [
      transformation.transformType === "lowerExponent"
        ? "exponent-factor-peel"
        : "exponent-unit-absorb"
    ]
  });
  if (result.status !== "compiled") {
    throw new Error(
      `Exponent succession choreography failed: ${
        result.gaps.map((gap) => gap.message).join(" ")
      }`
    );
  }

  return {
    plan: result.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.choreography`,
      plan: result.plan,
      focusReadinessThreshold: 0.6,
      recognitionDwell: 0.45,
      phaseWeights:
        transformation.transformType === "lowerExponent"
          ? {
              orient: 0.14,
              reflow: 0.2,
              act: 0.34,
              settle: 0.22,
              release: 0.1
            }
          : {
              orient: 0.18,
              reflow: 0.16,
              act: 0.26,
              settle: 0.3,
              release: 0.1
            }
    }),
    focusGroupIds: records.map(
      (record) => `group.${transformation.id}.${record.id}`
    )
  };
}

function createVocabulary(
  transformation: KpSemanticTransformation,
  records: readonly SelectorCorrespondenceRecord[]
): KpChoreographyVocabulary {
  const continuantRecords = records.filter(
    (record) => record.relation === "identity" || record.relation === "role-change"
  );
  const continuants = continuantRecords.map((record) => ({
    id: `continuant.${transformation.id}.${record.id}`,
    meaning: record.summary,
    relation: record.relation as "identity" | "role-change",
    source: {
      entityId: record.sourceSelectorIds[0]!,
      selectorIds: record.sourceSelectorIds
    },
    target: {
      entityId: record.targetSelectorIds[0]!,
      selectorIds: record.targetSelectorIds
    },
    identityAuthority: {
      kind: "correspondence" as const,
      transformationId: transformation.id,
      correspondenceRecordId: record.id
    }
  }));
  return {
    id: `vocabulary.${transformation.id}`,
    continuants,
    representationalLineages: [],
    objectConstancy: continuants.map((continuant) => ({
      id: `constancy.${continuant.id}`,
      continuantId: continuant.id,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    })),
    materialContinuity: continuantRecords.map((record) => ({
      id: `continuity.${transformation.id}.${record.id}`,
      mode: "continuant-motion",
      sourceEntityIds: record.sourceSelectorIds,
      targetEntityIds: record.targetSelectorIds,
      authorityRef: {
        kind: "continuant",
        continuantId: `continuant.${transformation.id}.${record.id}`
      },
      summary: record.summary
    })),
    motionClassifications: records.map((record) => ({
      id: `motion.${transformation.id}.${record.id}`,
      entityIds: unique([
        ...record.sourceSelectorIds,
        ...record.targetSelectorIds
      ]),
      motionClass: "meaningful",
      reason: record.summary
    }))
  };
}

function createLifecycle(
  transformation: KpSemanticTransformation,
  records: readonly SelectorCorrespondenceRecord[]
): KpChoreographyLifecycle {
  return {
    id: `lifecycle.${transformation.id}`,
    records: records.map((record): KpChoreographyLifecycleRecord => {
      const common = {
        id: `lifecycle.${transformation.id}.${record.id}`,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      };
      if (record.relation === "identity" || record.relation === "role-change") {
        return {
          ...common,
          kind: "continuant",
          continuantId: `continuant.${transformation.id}.${record.id}`
        };
      }
      if (record.relation === "fan-out") {
        return {
          ...common,
          kind: "copy",
          operationId: "kp.core.fan-out",
          lineageEdgeId: `lineage.${transformation.id}.${record.id}`
        };
      }
      if (record.relation === "removal") {
        return {
          ...common,
          kind: "elimination",
          cause: {
            kind: "structural-retirement",
            authorityId: transformation.id
          }
        };
      }
      throw new Error(
        `Exponent succession does not support ${record.relation} correspondence.`
      );
    })
  };
}

function createLineageEdge(
  transformation: KpSemanticTransformation,
  record: SelectorCorrespondenceRecord
): KpSemanticLineageEdge {
  const relation =
    record.relation === "identity" || record.relation === "role-change"
      ? "persist"
      : record.relation === "fan-out"
        ? "split"
        : record.relation === "removal"
          ? "removal"
          : undefined;
  if (relation === undefined) {
    throw new Error(
      `Exponent succession does not support ${record.relation} lineage.`
    );
  }
  return {
    id: `lineage.${transformation.id}.${record.id}`,
    relation,
    sourceEntityIds: record.sourceSelectorIds,
    targetEntityIds: record.targetSelectorIds,
    summary: record.summary
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
