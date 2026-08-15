import {
  type KpChoreographyLifecycle,
  type KpChoreographyLifecycleRecord
} from "./choreography-lifecycle.ts";
import {
  isKpCompiledLogExponentTransformationTree,
  kpCanonicalLogExponentTransformationTree,
  type KpCompiledLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import {
  kpCanonicalLogExponentSolveStates,
  listKpLogExponentExpressionNodes
} from "../semantic/log-exponent-solve-states.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

export interface KpLogExponentLifecyclePlan {
  readonly operationId: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly lifecycle: KpChoreographyLifecycle;
}

export function compileKpLogExponentLifecycles(
  tree: KpCompiledLogExponentTransformationTree =
    kpCanonicalLogExponentTransformationTree
): readonly KpLogExponentLifecyclePlan[] {
  if (!isKpCompiledLogExponentTransformationTree(tree)) {
    throw new Error("Log-exponent lifecycle compilation requires the nominal transformation tree.");
  }
  const states = new Map(
    kpCanonicalLogExponentSolveStates.map((state) => [state.id, state])
  );
  return Object.freeze(tree.operations.map((edge) => {
    const source = states.get(edge.operation.sourceStateId);
    const target = states.get(edge.operation.targetStateId);
    if (source === undefined || target === undefined) {
      throw new Error(`Lifecycle operation ${edge.operation.id} references a missing state.`);
    }
    const correspondence = edge.transformation.correspondenceMap;
    if (correspondence === undefined) {
      throw new Error(`Lifecycle operation ${edge.operation.id} requires correspondence.`);
    }
    const sourceEntityIds = Object.freeze(
      listKpLogExponentExpressionNodes(source).map(({ id }) => id)
    );
    const targetEntityIds = Object.freeze(
      listKpLogExponentExpressionNodes(target).map(({ id }) => id)
    );
    const records = Object.freeze(correspondence.records.map((record) =>
      lifecycleRecord(edge.operation.id, edge.transformation.id, record)
    ));
    assertSingleLifecycle(sourceEntityIds, targetEntityIds, records);
    return Object.freeze({
      operationId: edge.operation.id,
      sourceEntityIds,
      targetEntityIds,
      lifecycle: Object.freeze({
        id: `lifecycle.${edge.transformation.id}`,
        records
      })
    });
  }));
}

export const kpCanonicalLogExponentLifecycles =
  compileKpLogExponentLifecycles();

function lifecycleRecord(
  operationId: string,
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
        continuantId: `continuant.${record.id}`
      });
    case "introduction":
      return Object.freeze({
        ...common,
        kind: "introduction" as const,
        cause: Object.freeze({
          kind: record.id.includes("derive-")
            ? "semantic-introduction" as const
            : "structural-realization" as const,
          authorityId: `${operationId}#${record.id}`
        })
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
    case "fan-in":
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(
        `Canonical log-exponent lifecycle does not yet admit ${record.relation}.`
      );
  }
}

function assertSingleLifecycle(
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  records: readonly KpChoreographyLifecycleRecord[]
): void {
  assertCoverage(
    "source",
    sourceEntityIds,
    records.flatMap(({ sourceEntityIds }) => sourceEntityIds)
  );
  assertCoverage(
    "target",
    targetEntityIds,
    records.flatMap(({ targetEntityIds }) => targetEntityIds)
  );
}

function assertCoverage(
  side: "source" | "target",
  expected: readonly string[],
  actual: readonly string[]
): void {
  const counts = new Map<string, number>();
  actual.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const mismatch = expected.find((id) => counts.get(id) !== 1);
  if (mismatch !== undefined || actual.length !== expected.length) {
    throw new Error(
      `Log-exponent ${side} lifecycle must classify every visible entity exactly once${
        mismatch === undefined ? "" : `; ${mismatch} is invalid`
      }.`
    );
  }
}
