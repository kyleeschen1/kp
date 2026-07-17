import type { KpAnimationAsset } from "./asset.ts";
import type { KpRepresentationalLineage } from "./choreography-vocabulary.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import { resolveKpRadicalFragmentSemantics } from "../semantic/radical-fragment-semantics.ts";

export interface KpRadicalFragmentSuccession {
  readonly recordId: string;
  readonly lineageId: string;
  readonly edgeId: string;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly summary: string;
}

export interface KpRadicalFragmentAbsorption {
  readonly recordId: string;
  readonly edgeId: string;
  readonly sourceSelectorIds: readonly string[];
  readonly cause: "conventional-root-notation";
  readonly summary: string;
}

export interface KpRadicalFragmentLineagePlan {
  readonly id: string;
  readonly transformationId: string;
  readonly graph: KpSemanticLineageGraph;
  readonly representationalLineages: readonly KpRepresentationalLineage[];
  readonly successions: readonly KpRadicalFragmentSuccession[];
  readonly absorptions: readonly KpRadicalFragmentAbsorption[];
  readonly introductionEdgeIds: readonly string[];
}

export function createKpRadicalFragmentLineage(
  animation: KpAnimationAsset
): KpRadicalFragmentLineagePlan {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "rewritePowerAsRoot"
  );
  if (transformation === undefined) {
    throw new Error(`Animation ${animation.id} has no radical rewrite.`);
  }
  const semantics = resolveKpRadicalFragmentSemantics(transformation);
  const successions: KpRadicalFragmentSuccession[] = [];
  const absorptions: KpRadicalFragmentAbsorption[] = [];
  const introductionEdgeIds: string[] = [];
  const notationEdges = semantics.notationRecords.map((record) => {
    const edgeId = `${transformation.id}.${record.id}-lineage-edge`;
    if (record.relation === "identity" || record.relation === "role-change") {
      const lineageId = `${transformation.id}.${record.id}-lineage`;
      successions.push({
        recordId: record.id,
        lineageId,
        edgeId,
        sourceSelectorIds: record.sourceSelectorIds,
        targetSelectorIds: record.targetSelectorIds,
        summary: record.summary
      });
      return {
        id: edgeId,
        relation: "representation-succession" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        representationAuthorityId: lineageId,
        summary: record.summary
      };
    }
    if (record.relation === "removal") {
      absorptions.push({
        recordId: record.id,
        edgeId,
        sourceSelectorIds: record.sourceSelectorIds,
        cause: "conventional-root-notation",
        summary: record.summary
      });
      return {
        id: edgeId,
        relation: "removal" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: [],
        summary: record.summary
      };
    }
    if (record.relation === "introduction") {
      introductionEdgeIds.push(edgeId);
      return {
        id: edgeId,
        relation: "introduction" as const,
        sourceEntityIds: [],
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      };
    }
    throw new Error(
      `Radical fragment record ${record.id} has unsupported relation ${record.relation}.`
    );
  });
  const baseEdgeId = `${transformation.id}.base-persist`;
  const graph = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}.fragments`,
    sourceEntityIds: [
      ...semantics.baseRecord.sourceSelectorIds,
      ...semantics.notationRecords.flatMap((record) => record.sourceSelectorIds)
    ],
    targetEntityIds: [
      ...semantics.baseRecord.targetSelectorIds,
      ...semantics.notationRecords.flatMap((record) => record.targetSelectorIds)
    ],
    edges: [
      {
        id: baseEdgeId,
        relation: "persist",
        sourceEntityIds: semantics.baseRecord.sourceSelectorIds,
        targetEntityIds: semantics.baseRecord.targetSelectorIds,
        summary: semantics.baseRecord.summary
      },
      ...notationEdges
    ]
  });
  return {
    id: `${transformation.id}.fragment-lineage-plan`,
    transformationId: transformation.id,
    graph,
    representationalLineages: successions.map((succession) => ({
      id: succession.lineageId,
      meaning: succession.summary,
      sourceRepresentation: {
        entityId: succession.sourceSelectorIds[0]!,
        selectorIds: succession.sourceSelectorIds
      },
      targetRepresentation: {
        entityId: succession.targetSelectorIds[0]!,
        selectorIds: succession.targetSelectorIds
      },
      cause: {
        kind: "transformation",
        transformationId: transformation.id,
        correspondenceRecordIds: [succession.recordId]
      }
    })),
    successions,
    absorptions,
    introductionEdgeIds
  };
}
