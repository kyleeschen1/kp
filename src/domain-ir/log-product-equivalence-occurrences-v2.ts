import {
  isKpCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
import { listKpLogProductExpressionNodes } from
  "../semantic/log-product-states.ts";

export interface KpLogProductRetainedWitnessOccurrenceV2 {
  readonly id: string;
  readonly kind: "retained-witness";
  readonly stateId: string;
  readonly entityIds: readonly string[];
  readonly paintOccurrenceId: string;
}

export interface KpLogProductEqualityOccurrenceV2 {
  readonly id: string;
  readonly kind: "equality";
  readonly stateId: string;
  readonly entityIds: readonly [string];
  readonly paintOccurrenceId: string;
}

export interface KpLogProductProvenanceCopyOccurrenceV2 {
  readonly id: string;
  readonly kind: "derived-provenance-copy";
  readonly factorSemanticId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly correspondenceRecordIds: readonly string[];
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly paintOccurrenceId: string;
}

export interface KpLogProductNativeTargetOccurrenceV2 {
  readonly id: string;
  readonly kind: "native-target";
  readonly stateId: string;
  readonly entityIds: readonly string[];
  readonly paintOccurrenceId: string;
}

declare const kpLogProductEquivalenceOccurrencesV2Authority: unique symbol;

export type KpCompiledLogProductEquivalenceOccurrencesV2 = Readonly<{
  readonly schemaVersion: "kp.log-product-equivalence-occurrences.v2";
  readonly kind: "compiled-log-product-equivalence-occurrences-v2";
  readonly transitionId: string;
  readonly operationId: string;
  readonly retainedWitness: KpLogProductRetainedWitnessOccurrenceV2;
  readonly equality: KpLogProductEqualityOccurrenceV2;
  readonly provenanceCopies:
    readonly KpLogProductProvenanceCopyOccurrenceV2[];
  readonly target: KpLogProductNativeTargetOccurrenceV2;
  readonly [kpLogProductEquivalenceOccurrencesV2Authority]: true;
}>;

const compiledLedgers = new WeakSet<object>();

export function compileKpLogProductEquivalenceOccurrencesV2(input: {
  readonly transitionId: string;
  readonly relationStateId: string;
  readonly relationEntityId: string;
  readonly operation: KpCompiledLogProductOperation;
}): KpCompiledLogProductEquivalenceOccurrencesV2 {
  if (!isKpCompiledLogProductOperation(input.operation)) {
    throw new Error(
      "Log-product occurrence compilation requires a canonical compiled operation."
    );
  }
  requireId(input.transitionId, "transition");
  requireId(input.relationStateId, "relation state");
  requireId(input.relationEntityId, "relation entity");
  const { family, source, target } = input.operation.contract;
  const sourceNodes = listKpLogProductExpressionNodes(source);
  const targetNodes = listKpLogProductExpressionNodes(target);
  const correspondenceMap = input.operation.transformation.correspondenceMap;
  if (correspondenceMap === undefined) {
    throw new Error(
      "Log-product occurrence compilation requires semantic correspondence."
    );
  }
  const records = correspondenceMap.records;
  const provenanceCopies = family.factors.map((factor) => {
    const wrapperSemanticIds = new Set([
      ...Object.values(factor.targetWrapper),
      factor.semanticId
    ]);
    const targetEntityIds = targetNodes
      .filter(({ semanticId }) => wrapperSemanticIds.has(semanticId))
      .map(({ id }) => id);
    const factorRecords = records.filter((record) =>
      record.targetSelectorIds.some((id) => targetEntityIds.includes(id)));
    if (targetEntityIds.length !== wrapperSemanticIds.size ||
        factorRecords.length === 0) {
      throw new Error(
        `Factor ${factor.name} lacks complete derived-wrapper provenance.`
      );
    }
    return Object.freeze({
      id: `occurrence.log-product-equivalence.provenance.${factor.ordinal}`,
      kind: "derived-provenance-copy" as const,
      factorSemanticId: factor.semanticId,
      sourceStateId: source.id,
      targetStateId: target.id,
      correspondenceRecordIds: Object.freeze(factorRecords.map(({ id }) => id)),
      sourceEntityIds: Object.freeze(unique(factorRecords.flatMap(
        ({ sourceSelectorIds }) => sourceSelectorIds
      ))),
      targetEntityIds: Object.freeze(targetEntityIds),
      paintOccurrenceId:
        `paint.log-product-equivalence.provenance.${factor.ordinal}`
    });
  });
  const retainedWitness = Object.freeze({
    id: "occurrence.log-product-equivalence.retained-witness",
    kind: "retained-witness" as const,
    stateId: source.id,
    entityIds: Object.freeze(sourceNodes.map(({ id }) => id)),
    paintOccurrenceId: "paint.log-product-equivalence.retained-witness"
  });
  const equality = Object.freeze({
    id: "occurrence.log-product-equivalence.equality",
    kind: "equality" as const,
    stateId: input.relationStateId,
    entityIds: Object.freeze([input.relationEntityId]) as readonly [string],
    paintOccurrenceId: "paint.log-product-equivalence.equality"
  });
  const nativeTarget = Object.freeze({
    id: "occurrence.log-product-equivalence.native-target",
    kind: "native-target" as const,
    stateId: target.id,
    entityIds: Object.freeze(targetNodes.map(({ id }) => id)),
    paintOccurrenceId: "paint.log-product-equivalence.native-target"
  });
  const paintOccurrenceIds = [
    retainedWitness.paintOccurrenceId,
    equality.paintOccurrenceId,
    ...provenanceCopies.map(({ paintOccurrenceId }) => paintOccurrenceId),
    nativeTarget.paintOccurrenceId
  ];
  if (new Set(paintOccurrenceIds).size !== paintOccurrenceIds.length) {
    throw new Error(
      "Retained, relational, derived, and target occurrences require distinct paint identity."
    );
  }
  const ledger = Object.freeze({
    schemaVersion: "kp.log-product-equivalence-occurrences.v2" as const,
    kind: "compiled-log-product-equivalence-occurrences-v2" as const,
    transitionId: input.transitionId,
    operationId: input.operation.transformation.id,
    retainedWitness,
    equality,
    provenanceCopies: Object.freeze(provenanceCopies),
    target: nativeTarget
  }) as unknown as KpCompiledLogProductEquivalenceOccurrencesV2;
  compiledLedgers.add(ledger);
  return ledger;
}

export function isKpCompiledLogProductEquivalenceOccurrencesV2(
  value: unknown
): value is KpCompiledLogProductEquivalenceOccurrencesV2 {
  return typeof value === "object" && value !== null &&
    compiledLedgers.has(value);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function requireId(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`Log-product ${label} is required.`);
}
