import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary,
  type KpRepresentationalLineage
} from "./choreography-vocabulary.ts";
import type { KpChoreographyLifecycle } from "./choreography-lifecycle.ts";

export function compileKpRepresentationalLineageGraph(input: {
  readonly id: string;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly lifecycle: KpChoreographyLifecycle;
}): KpSemanticLineageGraph {
  const vocabularyResult = checkKpChoreographyVocabularyContract(
    input.vocabulary
  );
  if (!vocabularyResult.passed) {
    const failure = vocabularyResult.failures[0]!;
    throw new Error(`${failure.path}: ${failure.message}`);
  }

  const lineages = new Map(
    input.vocabulary.representationalLineages.map((lineage) => [
      lineage.id,
      lineage
    ])
  );
  const successorRecords = input.lifecycle.records.filter(
    (record) => record.kind === "successor"
  );
  const edges = successorRecords.map((record) => {
    const lineage = lineages.get(record.representationalLineageId);
    if (lineage === undefined) {
      throw new Error(
        `Unknown representational lineage ${record.representationalLineageId}.`
      );
    }
    assertLifecycleMatchesLineage(record, lineage);
    return {
      id: `representation-edge.${record.id}`,
      relation: "representation-succession" as const,
      sourceEntityIds: [...record.sourceEntityIds],
      targetEntityIds: [...record.targetEntityIds],
      summary: record.summary,
      representationAuthorityId: lineageAuthorityId(lineage)
    };
  });

  return createKpSemanticLineageGraph({
    id: input.id,
    sourceEntityIds: unique(successorRecords.flatMap((record) => record.sourceEntityIds)),
    targetEntityIds: unique(successorRecords.flatMap((record) => record.targetEntityIds)),
    edges
  });
}

function assertLifecycleMatchesLineage(
  record: Extract<
    KpChoreographyLifecycle["records"][number],
    { readonly kind: "successor" }
  >,
  lineage: KpRepresentationalLineage
): void {
  const expectedSourceIds = new Set([
    lineage.sourceRepresentation.entityId,
    ...lineage.sourceRepresentation.selectorIds
  ]);
  const expectedTargetIds = new Set([
    lineage.targetRepresentation.entityId,
    ...lineage.targetRepresentation.selectorIds
  ]);
  if (!record.sourceEntityIds.every((id) => expectedSourceIds.has(id))) {
    throw new Error(
      `Successor lifecycle ${record.id} source does not match representational lineage ${lineage.id}.`
    );
  }
  if (!record.targetEntityIds.every((id) => expectedTargetIds.has(id))) {
    throw new Error(
      `Successor lifecycle ${record.id} target does not match representational lineage ${lineage.id}.`
    );
  }
}

function lineageAuthorityId(lineage: KpRepresentationalLineage): string {
  return lineage.cause.kind === "canonical-operation"
    ? `${lineage.cause.operationId}#${lineage.cause.bindingId}`
    : `${lineage.cause.transformationId}#${lineage.cause.correspondenceRecordIds.join("+")}`;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
