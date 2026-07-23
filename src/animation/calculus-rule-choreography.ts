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
  KpChoreographyLifecycleRecord
} from "./choreography-lifecycle.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";
import { diagnoseKpAnimationDesign } from "./animation-design-diagnostics.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

export const kpPromotedCalculusRuleTransformTypes = [
  "convergeDifferenceQuotient",
  "applyDerivativeSumRule",
  "applyDerivativePowerRulesToTerms",
  "applyAntiderivativePowerRule",
  "simplifyAntiderivativePowerRule"
] as const;

export interface KpCalculusRuleChoreography {
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focusGroupIds: readonly string[];
}

export function createKpCalculusRuleChoreography(input: {
  readonly animation: KpAnimationAsset;
  readonly transformationId: string;
}): KpCalculusRuleChoreography {
  const transformation = input.animation.transformations.find(
    (candidate) => candidate.id === input.transformationId
  );
  if (
    transformation?.correspondenceMap === undefined ||
    !kpPromotedCalculusRuleTransformTypes.includes(
      transformation.transformType as typeof kpPromotedCalculusRuleTransformTypes[number]
    )
  ) {
    throw new Error(
      `Transformation ${input.transformationId} is not a promoted calculus rule step.`
    );
  }
  const records = transformation.correspondenceMap.records;
  const continuants = records
    .filter((record) => record.relation === "identity" || record.relation === "role-change")
    .map((record) => ({
      id: `continuant.${transformation.id}.${record.id}`,
      meaning: record.summary,
      relation: record.relation as "identity" | "role-change",
      source: {
        entityId: record.sourceSelectorIds[0]!,
        selectorIds: [...record.sourceSelectorIds]
      },
      target: {
        entityId: record.targetSelectorIds[0]!,
        selectorIds: [...record.targetSelectorIds]
      },
      identityAuthority: {
        kind: "correspondence" as const,
        transformationId: transformation.id,
        correspondenceRecordId: record.id
      }
    }));
  const successorRecords = records.filter((record) => record.relation === "fan-in");
  const vocabulary: KpChoreographyVocabulary = {
    id: `vocabulary.${transformation.id}`,
    continuants,
    representationalLineages: successorRecords.map((record) => ({
      id: `representation.${transformation.id}.${record.id}`,
      meaning: record.summary,
      sourceRepresentation: {
        entityId: record.sourceSelectorIds[0]!,
        selectorIds: [...record.sourceSelectorIds]
      },
      targetRepresentation: {
        entityId: record.targetSelectorIds[0]!,
        selectorIds: [...record.targetSelectorIds]
      },
      cause: {
        kind: "transformation",
        transformationId: transformation.id,
        correspondenceRecordIds: [record.id]
      }
    })),
    objectConstancy: continuants.map((continuant) => ({
      id: `constancy.${continuant.id}`,
      continuantId: continuant.id,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    })),
    materialContinuity: continuants.map((continuant) => ({
      id: `continuity.${continuant.id}`,
      mode: "continuant-motion",
      sourceEntityIds: [continuant.source.entityId],
      targetEntityIds: [continuant.target.entityId],
      authorityRef: { kind: "continuant", continuantId: continuant.id },
      summary: `${continuant.meaning} Native ownership transfers only at settlement.`
    })),
    motionClassifications: records
      .filter((record) => record.relation !== "identity" && record.relation !== "role-change")
      .map((record) => ({
        id: `motion.${transformation.id}.${record.id}`,
        entityIds: [...record.sourceSelectorIds, ...record.targetSelectorIds],
        motionClass: "meaningful",
        reason: record.summary
      }))
  };
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: unique(records.flatMap((record) => record.sourceSelectorIds)),
    targetEntityIds: unique(records.flatMap((record) => record.targetSelectorIds)),
    edges: records.map((record) => ({
      id: `lineage.${transformation.id}.${record.id}`,
      relation: lineageRelation(record),
      sourceEntityIds: [...record.sourceSelectorIds],
      targetEntityIds: [...record.targetSelectorIds],
      summary: record.summary
    }))
  });
  const lifecycle: readonly KpChoreographyLifecycleRecord[] = records.map((record) =>
    lifecycleRecord(transformation.id, record)
  );
  const transferRecords = records.filter((record) =>
    record.sourceSelectorIds.length > 0 && record.targetSelectorIds.length > 0
  );
  const salienceNodes = transferRecords.flatMap((record) => [
    {
      id: `salience.${transformation.id}.${record.id}.source`,
      entityIds: [...record.sourceSelectorIds],
      role: "source" as const,
      readinessThreshold: 0.28
    },
    {
      id: `salience.${transformation.id}.${record.id}.target`,
      entityIds: [...record.targetSelectorIds],
      role: "target" as const,
      readinessThreshold: 0.68
    }
  ]);
  const motif = diagnoseKpAnimationDesign({
    animation: input.animation,
    transformationId: transformation.id
  })?.motifKind ?? "artifact-replace";
  const visibleIds = unique(records.flatMap((record) => [
    ...record.sourceSelectorIds,
    ...record.targetSelectorIds
  ]));
  const participantId = `participant.${transformation.id}.operation`;
  const compiled = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: input.animation.timeline?.id ?? `timeline.${input.animation.id}`,
    canonicalOperationId: `kp.calculus.${transformation.transformType}`,
    transformation,
    bundle: input.animation.bundle,
    vocabulary,
    lifecycle: { id: `lifecycle.${transformation.id}`, records: lifecycle },
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: salienceNodes,
      edges: transferRecords.map((record) => ({
        id: `salience.${transformation.id}.${record.id}.transfer`,
        sourceNodeId: `salience.${transformation.id}.${record.id}.source`,
        targetNodeId: `salience.${transformation.id}.${record.id}.target`,
        lineageEdgeId: `lineage.${transformation.id}.${record.id}`,
        targetReadyAt: 0.68,
        sourceReleaseAt: 0.88
      })),
      branchGroups: []
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "execution",
      authorityId: `kp.calculus.${transformation.transformType}`,
      participants: [{ id: participantId, entityIds: visibleIds, rank: 0 }],
      ranks: [{ rank: 0, participantIds: [participantId], presentation: "show" }],
      cascade: { adjacentOnly: true, nextRankReadinessThreshold: 0.65 }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: [motif]
  });
  if (compiled.status !== "compiled") {
    throw new Error(
      `Calculus choreography ${transformation.id} failed: ${compiled.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  return {
    plan: compiled.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.calculus-rule`,
      plan: compiled.plan,
      focusReadinessThreshold: 0.58,
      recognitionDwell: 0.4,
      phaseWeights: {
        orient: 0.16,
        reflow: 0.2,
        act: 0.38,
        settle: 0.18,
        release: 0.08
      }
    }),
    focusGroupIds: records
      .filter((record) => record.sourceSelectorIds.length > 0 && record.relation !== "identity")
      .map((record) => `group.${transformation.id}.${record.id}`)
  };
}

function lineageRelation(record: SelectorCorrespondenceRecord) {
  switch (record.relation) {
    case "identity":
    case "role-change": return "persist" as const;
    case "fan-out": return "split" as const;
    case "fan-in": return "merge" as const;
    case "introduction": return "introduction" as const;
    case "removal":
    case "cancelation": return "removal" as const;
    case "artifact":
    case "focus": return record.sourceSelectorIds.length === 0
      ? "introduction" as const
      : record.targetSelectorIds.length === 0
        ? "removal" as const
        : "persist" as const;
  }
}

function lifecycleRecord(
  transformationId: string,
  record: SelectorCorrespondenceRecord
): KpChoreographyLifecycleRecord {
  const base = {
    id: `lifecycle.${transformationId}.${record.id}`,
    sourceEntityIds: [...record.sourceSelectorIds],
    targetEntityIds: [...record.targetSelectorIds],
    summary: record.summary
  };
  switch (record.relation) {
    case "identity":
    case "role-change":
      return {
        ...base,
        kind: "continuant",
        continuantId: `continuant.${transformationId}.${record.id}`
      };
    case "fan-out":
      return {
        ...base,
        kind: "copy",
        operationId: `kp.calculus.${transformationId}`,
        lineageEdgeId: `lineage.${transformationId}.${record.id}`
      };
    case "fan-in":
      return {
        ...base,
        kind: "successor",
        representationalLineageId: `representation.${transformationId}.${record.id}`
      };
    case "introduction":
      return {
        ...base,
        kind: "introduction",
        cause: {
          kind: "semantic-introduction",
          authorityId: `kp.calculus.${transformationId}#${record.id}`
        }
      };
    case "removal":
    case "cancelation":
      return {
        ...base,
        kind: "elimination",
        cause: {
          kind: record.relation === "cancelation" ? "cancellation" : "consumption",
          authorityId: `kp.calculus.${transformationId}#${record.id}`
        }
      };
    case "artifact":
    case "focus":
      return {
        ...base,
        kind: "annotation",
        annotationId: `annotation.${transformationId}.${record.id}`
      };
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
