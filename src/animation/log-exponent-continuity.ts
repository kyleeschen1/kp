import {
  kpCanonicalLogExponentLifecycles,
  type KpLogExponentLifecyclePlan
} from "./log-exponent-lifecycle.ts";
import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary
} from "./choreography-vocabulary.ts";
import { validateKpChoreographyLifecycle } from "./choreography-lifecycle.ts";
import {
  kpCanonicalLogExponentTransformationTree,
  type KpCompiledLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

export interface KpLogExponentContinuityPlan {
  readonly operationId: string;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly lineage: KpSemanticLineageGraph;
  readonly lifecycle: KpLogExponentLifecyclePlan["lifecycle"];
}

export function compileKpLogExponentContinuity(input: {
  readonly tree?: KpCompiledLogExponentTransformationTree | undefined;
  readonly lifecycles?: readonly KpLogExponentLifecyclePlan[] | undefined;
} = {}): readonly KpLogExponentContinuityPlan[] {
  const tree = input.tree ?? kpCanonicalLogExponentTransformationTree;
  const lifecycles = input.lifecycles ?? kpCanonicalLogExponentLifecycles;
  return Object.freeze(tree.operations.map((edge) => {
    const lifecycle = lifecycles.find(
      ({ operationId }) => operationId === edge.operation.id
    );
    const records = edge.transformation.correspondenceMap?.records;
    if (lifecycle === undefined || records === undefined) {
      throw new Error(`Continuity compilation lacks lifecycle or correspondence for ${edge.operation.id}.`);
    }
    const vocabulary = compileVocabulary(edge.transformation.id, records);
    const lineage = createKpSemanticLineageGraph({
      id: `lineage.${edge.transformation.id}`,
      sourceEntityIds: lifecycle.sourceEntityIds,
      targetEntityIds: lifecycle.targetEntityIds,
      edges: records.map((record) => lineageEdge(edge.transformation.id, record))
    });
    const vocabularyCheck = checkKpChoreographyVocabularyContract(vocabulary);
    const lifecycleGaps = validateKpChoreographyLifecycle({
      lifecycle: lifecycle.lifecycle,
      vocabulary,
      sourceEntityIds: lifecycle.sourceEntityIds,
      targetEntityIds: lifecycle.targetEntityIds
    });
    if (!vocabularyCheck.passed || lifecycleGaps.length > 0) {
      throw new Error(
        vocabularyCheck.failures[0]?.message ??
          lifecycleGaps[0]?.message ??
          `Continuity validation failed for ${edge.operation.id}.`
      );
    }
    return Object.freeze({
      operationId: edge.operation.id,
      vocabulary,
      lineage,
      lifecycle: lifecycle.lifecycle
    });
  }));
}

export const kpCanonicalLogExponentContinuity =
  compileKpLogExponentContinuity();

function compileVocabulary(
  transformationId: string,
  records: readonly SelectorCorrespondenceRecord[]
): KpChoreographyVocabulary {
  const continuantRecords = records.filter(
    (record) => record.relation === "identity" || record.relation === "role-change"
  );
  const continuants = Object.freeze(continuantRecords.map((record) =>
    Object.freeze({
      id: `continuant.${record.id}`,
      meaning: record.summary,
      relation: record.relation as "identity" | "role-change",
      source: Object.freeze({
        entityId: record.sourceSelectorIds[0]!,
        selectorIds: Object.freeze([...record.sourceSelectorIds])
      }),
      target: Object.freeze({
        entityId: record.targetSelectorIds[0]!,
        selectorIds: Object.freeze([...record.targetSelectorIds])
      }),
      identityAuthority: Object.freeze({
        kind: "correspondence" as const,
        transformationId,
        correspondenceRecordId: record.id
      })
    })
  ));
  return Object.freeze({
    id: `vocabulary.${transformationId}`,
    continuants,
    representationalLineages: Object.freeze(
      continuantRecords
        .filter(({ relation }) => relation === "role-change")
        .map((record) => Object.freeze({
          id: `representation.${record.id}`,
          meaning: record.summary,
          sourceRepresentation: Object.freeze({
            entityId: record.sourceSelectorIds[0]!,
            selectorIds: Object.freeze([...record.sourceSelectorIds])
          }),
          targetRepresentation: Object.freeze({
            entityId: record.targetSelectorIds[0]!,
            selectorIds: Object.freeze([...record.targetSelectorIds])
          }),
          cause: Object.freeze({
            kind: "transformation" as const,
            transformationId,
            correspondenceRecordIds: Object.freeze([record.id])
          })
        }))
    ),
    objectConstancy: Object.freeze(continuants.map((continuant) =>
      Object.freeze({
        id: `constancy.${continuant.id}`,
        continuantId: continuant.id,
        mode: "continuous" as const,
        preserveThrough: Object.freeze([
          "movement",
          "seek",
          "rewind",
          "renderer-handoff"
        ] as const)
      })
    )),
    materialContinuity: Object.freeze(continuants.map((continuant) =>
      Object.freeze({
        id: `continuity.${continuant.id}`,
        mode: "continuant-motion" as const,
        sourceEntityIds: continuant.source.selectorIds,
        targetEntityIds: continuant.target.selectorIds,
        authorityRef: Object.freeze({
          kind: "continuant" as const,
          continuantId: continuant.id
        }),
        summary: continuant.meaning
      })
    )),
    motionClassifications: Object.freeze(records.map((record) =>
      Object.freeze({
        id: `motion.${record.id}`,
        entityIds: Object.freeze([
          ...record.sourceSelectorIds,
          ...record.targetSelectorIds
        ]),
        motionClass: record.relation === "identity"
          ? "accommodation" as const
          : "meaningful" as const,
        reason: record.summary
      })
    ))
  });
}

function lineageEdge(
  transformationId: string,
  record: SelectorCorrespondenceRecord
): KpSemanticLineageEdge {
  const common = {
    id: `lineage.${record.id}`,
    sourceEntityIds: record.sourceSelectorIds,
    targetEntityIds: record.targetSelectorIds,
    summary: record.summary
  };
  switch (record.relation) {
    case "identity":
      return { ...common, relation: "persist" };
    case "role-change":
      return {
        ...common,
        relation: "representation-succession",
        representationAuthorityId: transformationId
      };
    case "introduction":
      return { ...common, relation: "introduction" };
    case "removal":
      return { ...common, relation: "removal" };
    case "fan-in":
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(`Canonical log-exponent lineage does not admit ${record.relation}.`);
  }
}
