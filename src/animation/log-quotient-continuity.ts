import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary,
  type KpRepresentationalLineage
} from "./choreography-vocabulary.ts";
import {
  validateKpChoreographyLifecycle,
  type KpChoreographyLifecycle,
  type KpChoreographyLifecycleRecord
} from "./choreography-lifecycle.ts";
import {
  kpCanonicalCompiledLogQuotientOperation,
  type KpCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";
import {
  listKpLogQuotientExpressionNodes
} from "../semantic/log-quotient-states.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

export type KpLogQuotientCausalEventKind =
  | "continuant-settled"
  | "derivation-recognizable"
  | "structure-retired"
  | "structure-introduced";

export interface KpLogQuotientCausalEvent {
  readonly id: string;
  readonly kind: KpLogQuotientCausalEventKind;
  readonly correspondenceRecordId: string;
  readonly after: readonly string[];
}

export interface KpCompiledLogQuotientContinuity {
  readonly schemaVersion: "kp.compiled-log-quotient-continuity.v1";
  readonly operation: KpCompiledLogQuotientOperation;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly lineage: KpSemanticLineageGraph;
  readonly lifecycle: KpChoreographyLifecycle;
  readonly causalEvents: readonly KpLogQuotientCausalEvent[];
}

export function compileKpLogQuotientContinuity(
  operation: KpCompiledLogQuotientOperation =
    kpCanonicalCompiledLogQuotientOperation
): KpCompiledLogQuotientContinuity {
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log-quotient continuity requires compiled correspondence authority.");
  }
  const sourceEntityIds = listKpLogQuotientExpressionNodes(operation.contract.source)
    .map(({ id }) => id);
  const targetEntityIds = listKpLogQuotientExpressionNodes(operation.contract.target)
    .map(({ id }) => id);
  const vocabulary = compileVocabulary(operation.transformation.id, records);
  const lifecycle = Object.freeze({
    id: "lifecycle.log-quotient.difference-to-quotient",
    records: Object.freeze(records.map((record) =>
      lifecycleRecord(operation.transformation.id, record)
    ))
  });
  const vocabularyCheck = checkKpChoreographyVocabularyContract(vocabulary);
  const lifecycleIssues = validateKpChoreographyLifecycle({
    lifecycle,
    vocabulary,
    sourceEntityIds,
    targetEntityIds
  });
  if (!vocabularyCheck.passed || lifecycleIssues.length > 0) {
    throw new Error(
      vocabularyCheck.failures[0]?.message ??
      lifecycleIssues[0]?.message ??
      "Log-quotient continuity validation failed."
    );
  }
  const lineage = createKpSemanticLineageGraph({
    id: "lineage.log-quotient.difference-to-quotient",
    sourceEntityIds,
    targetEntityIds,
    edges: records.map((record) => lineageEdge(operation.transformation.id, record))
  });
  const causalEvents = compileCausalEvents(records);
  assertAcyclic(causalEvents);
  return Object.freeze({
    schemaVersion: "kp.compiled-log-quotient-continuity.v1" as const,
    operation,
    vocabulary,
    lineage,
    lifecycle,
    causalEvents
  });
}

export const kpCanonicalLogQuotientContinuity =
  compileKpLogQuotientContinuity();

function compileVocabulary(
  transformationId: string,
  records: readonly SelectorCorrespondenceRecord[]
): KpChoreographyVocabulary {
  const continuantRecords = records.filter(
    ({ relation }) => relation === "identity" || relation === "role-change"
  );
  const derivationRecords = records.filter(({ relation }) => relation === "fan-in");
  const continuants = Object.freeze(continuantRecords.map((record) => Object.freeze({
    id: continuantId(record),
    meaning: record.summary,
    relation: record.relation as "identity" | "role-change",
    source: entityRef(record.sourceSelectorIds),
    target: entityRef(record.targetSelectorIds),
    identityAuthority: Object.freeze({
      kind: "correspondence" as const,
      transformationId,
      correspondenceRecordId: record.id
    })
  })));
  const representationalLineages = Object.freeze([
    ...continuantRecords
      .filter(({ relation }) => relation === "role-change")
      .map((record) => representationLineage(transformationId, record)),
    ...derivationRecords.map((record) =>
      representationLineage(transformationId, record)
    )
  ]);
  return Object.freeze({
    id: "vocabulary.log-quotient.difference-to-quotient",
    continuants,
    representationalLineages,
    objectConstancy: Object.freeze(continuants.map((continuant) => Object.freeze({
      id: `constancy.${continuant.id}`,
      continuantId: continuant.id,
      mode: "continuous" as const,
      preserveThrough: Object.freeze([
        "movement",
        "seek",
        "rewind",
        "renderer-handoff"
      ] as const)
    }))),
    materialContinuity: Object.freeze([
      ...continuantRecords.map((record) => Object.freeze({
        id: `continuity.${record.id}`,
        mode: "continuant-motion" as const,
        sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
        targetEntityIds: Object.freeze([...record.targetSelectorIds]),
        authorityRef: Object.freeze({
          kind: "continuant" as const,
          continuantId: continuantId(record)
        }),
        summary: record.summary
      })),
      ...derivationRecords.map((record) => Object.freeze({
        id: `continuity.${record.id}`,
        mode: "causal-derivation" as const,
        sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
        targetEntityIds: Object.freeze([...record.targetSelectorIds]),
        authorityRef: Object.freeze({
          kind: "representational-lineage" as const,
          lineageId: lineageId(record)
        }),
        summary: record.summary
      }))
    ]),
    motionClassifications: Object.freeze(records.map((record) => Object.freeze({
      id: `motion.${record.id}`,
      entityIds: Object.freeze([
        ...record.sourceSelectorIds,
        ...record.targetSelectorIds
      ]),
      motionClass: record.relation === "identity"
        ? "accommodation" as const
        : record.relation === "removal" || record.relation === "introduction"
          ? "cleanup" as const
          : "meaningful" as const,
      reason: record.summary
    })))
  });
}

function representationLineage(
  transformationId: string,
  record: SelectorCorrespondenceRecord
): KpRepresentationalLineage {
  return Object.freeze({
    id: lineageId(record),
    meaning: record.summary,
    sourceRepresentation: entityRef(record.sourceSelectorIds),
    targetRepresentation: entityRef(record.targetSelectorIds),
    cause: Object.freeze({
      kind: "transformation" as const,
      transformationId,
      correspondenceRecordIds: Object.freeze([record.id])
    })
  });
}

function lifecycleRecord(
  transformationId: string,
  record: SelectorCorrespondenceRecord
): KpChoreographyLifecycleRecord {
  const common = {
    id: `lifecycle.${record.id}`,
    sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
    targetEntityIds: Object.freeze([...record.targetSelectorIds]),
    summary: record.summary
  };
  switch (record.relation) {
    case "identity":
    case "role-change":
      return Object.freeze({
        ...common,
        kind: "continuant" as const,
        continuantId: continuantId(record)
      });
    case "fan-in":
      return Object.freeze({
        ...common,
        kind: "successor" as const,
        representationalLineageId: lineageId(record)
      });
    case "removal":
      return Object.freeze({
        ...common,
        kind: "elimination" as const,
        cause: Object.freeze({
          kind: "structural-retirement" as const,
          authorityId: `${transformationId}#${record.id}`
        })
      });
    case "introduction":
      return Object.freeze({
        ...common,
        kind: "introduction" as const,
        cause: Object.freeze({
          kind: "structural-realization" as const,
          authorityId: `${transformationId}#${record.id}`
        })
      });
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(`Log-quotient continuity does not admit ${record.relation}.`);
  }
}

function lineageEdge(
  transformationId: string,
  record: SelectorCorrespondenceRecord
): KpSemanticLineageEdge {
  const common = {
    id: `lineage-edge.${record.id}`,
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
    case "fan-in":
      return { ...common, relation: "merge" };
    case "introduction":
      return { ...common, relation: "introduction" };
    case "removal":
      return { ...common, relation: "removal" };
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(`Log-quotient lineage does not admit ${record.relation}.`);
  }
}

function compileCausalEvents(
  records: readonly SelectorCorrespondenceRecord[]
): readonly KpLogQuotientCausalEvent[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const requireRecord = (id: string): string => {
    if (!byId.has(id)) throw new Error(`Missing log-quotient causal authority ${id}.`);
    return id;
  };
  const x = "event.log-quotient.x-settled";
  const y = "event.log-quotient.y-settled";
  const derived = "event.log-quotient.quotient-recognizable";
  return Object.freeze([
    causalEvent(x, "continuant-settled", requireRecord(
      "correspondence.log-quotient.x-to-numerator"
    )),
    causalEvent(y, "continuant-settled", requireRecord(
      "correspondence.log-quotient.y-to-denominator"
    )),
    causalEvent(
      "event.log-quotient.right-wrapper-retired",
      "structure-retired",
      requireRecord("correspondence.log-quotient.retire-right-wrapper"),
      [y]
    ),
    causalEvent(
      derived,
      "derivation-recognizable",
      requireRecord("correspondence.log-quotient.difference-derives-quotient"),
      [x, y]
    ),
    causalEvent(
      "event.log-quotient.fraction-bar-introduced",
      "structure-introduced",
      requireRecord("correspondence.log-quotient.introduce-fraction-bar"),
      [derived]
    )
  ]);
}

function causalEvent(
  id: string,
  kind: KpLogQuotientCausalEventKind,
  correspondenceRecordId: string,
  after: readonly string[] = []
): KpLogQuotientCausalEvent {
  return Object.freeze({
    id,
    kind,
    correspondenceRecordId,
    after: Object.freeze([...after])
  });
}

function assertAcyclic(events: readonly KpLogQuotientCausalEvent[]): void {
  const ids = new Set(events.map(({ id }) => id));
  if (ids.size !== events.length) {
    throw new Error("Log-quotient causal event ids must be unique.");
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(events.map((event) => [event.id, event]));
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Log-quotient causal graph cycles through ${id}.`);
    if (visited.has(id)) return;
    const event = byId.get(id);
    if (event === undefined) throw new Error(`Log-quotient causal graph references missing event ${id}.`);
    visiting.add(id);
    event.after.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  events.forEach(({ id }) => visit(id));
}

function entityRef(ids: readonly string[]) {
  if (ids.length === 0) throw new Error("Log-quotient semantic lineage requires endpoint material.");
  return Object.freeze({
    entityId: ids[0]!,
    selectorIds: Object.freeze([...ids])
  });
}

function continuantId(record: SelectorCorrespondenceRecord): string {
  return `continuant.${record.id}`;
}

function lineageId(record: SelectorCorrespondenceRecord): string {
  return `representation.${record.id}`;
}
