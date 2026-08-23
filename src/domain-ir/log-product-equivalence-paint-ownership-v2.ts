import {
  isKpCompiledLogProductEquivalenceOccurrencesV2,
  type KpCompiledLogProductEquivalenceOccurrencesV2
} from "./log-product-equivalence-occurrences-v2.ts";

declare const kpLogProductEquivalencePaintOwnershipV2Authority: unique symbol;

export type KpCompiledLogProductEquivalencePaintOwnershipV2 = Readonly<{
  readonly schemaVersion: "kp.log-product-equivalence-paint-ownership.v2";
  readonly kind: "compiled-log-product-equivalence-paint-ownership-v2";
  readonly id: string;
  readonly transitionId: string;
  readonly operationId: string;
  readonly retainedNative: {
    readonly occurrenceId: string;
    readonly paintOccurrenceId: string;
    readonly entityIds: readonly string[];
    readonly lifecycle: "frozen-through-transition";
  };
  readonly equalityNative: {
    readonly occurrenceId: string;
    readonly paintOccurrenceId: string;
    readonly entityIds: readonly string[];
    readonly lifecycle: "native-context";
  };
  readonly liveTransition: {
    readonly occurrenceIds: readonly string[];
    readonly paintOccurrenceIds: readonly string[];
    readonly sourceCloneEntityIds: readonly string[];
    readonly suppressedSourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
  };
  readonly settledTarget: {
    readonly occurrenceId: string;
    readonly paintOccurrenceId: string;
    readonly entityIds: readonly string[];
    readonly handoff: "material-settles-before-native-target";
  };
  readonly [kpLogProductEquivalencePaintOwnershipV2Authority]: true;
}>;

const compiledPlans = new WeakSet<object>();

/**
 * A retained equivalence clones continuant payload ink into the live layer;
 * it never borrows the retained source wrapper as moving paint.
 */
export function compileKpLogProductEquivalencePaintOwnershipV2(input: {
  readonly occurrences: KpCompiledLogProductEquivalenceOccurrencesV2;
}): KpCompiledLogProductEquivalencePaintOwnershipV2 {
  if (!isKpCompiledLogProductEquivalenceOccurrencesV2(input.occurrences)) {
    throw new Error(
      "Log equivalence paint ownership requires compiled occurrence identity."
    );
  }
  const occurrence = input.occurrences;
  const sourceCounts = new Map<string, number>();
  occurrence.provenanceCopies.forEach(({ sourceEntityIds }) =>
    sourceEntityIds.forEach((id) =>
      sourceCounts.set(id, (sourceCounts.get(id) ?? 0) + 1)));
  const sourceCloneEntityIds = [...sourceCounts]
    .filter(([, count]) => count === 1)
    .map(([id]) => id);
  const retainedEntities = new Set(occurrence.retainedWitness.entityIds);
  if (sourceCloneEntityIds.length !== occurrence.provenanceCopies.length ||
      sourceCloneEntityIds.some((id) => !retainedEntities.has(id))) {
    throw new Error(
      "Each provenance branch requires one distinct continuant source payload."
    );
  }
  const suppressedSourceEntityIds = occurrence.retainedWitness.entityIds
    .filter((id) => !sourceCloneEntityIds.includes(id));
  const targetEntityIds = unique([
    ...occurrence.provenanceCopies.flatMap(({ targetEntityIds: ids }) => ids),
    ...occurrence.target.entityIds
  ]);
  const paintIds = [
    occurrence.retainedWitness.paintOccurrenceId,
    occurrence.equality.paintOccurrenceId,
    ...occurrence.provenanceCopies.map(({ paintOccurrenceId }) =>
      paintOccurrenceId),
    occurrence.target.paintOccurrenceId
  ];
  if (new Set(paintIds).size !== paintIds.length ||
      suppressedSourceEntityIds.length === 0) {
    throw new Error(
      "Log equivalence requires exclusive occurrences and retained source syntax."
    );
  }
  const plan = Object.freeze({
    schemaVersion: "kp.log-product-equivalence-paint-ownership.v2" as const,
    kind: "compiled-log-product-equivalence-paint-ownership-v2" as const,
    id: `paint-ownership.${occurrence.transitionId}`,
    transitionId: occurrence.transitionId,
    operationId: occurrence.operationId,
    retainedNative: Object.freeze({
      occurrenceId: occurrence.retainedWitness.id,
      paintOccurrenceId: occurrence.retainedWitness.paintOccurrenceId,
      entityIds: occurrence.retainedWitness.entityIds,
      lifecycle: "frozen-through-transition" as const
    }),
    equalityNative: Object.freeze({
      occurrenceId: occurrence.equality.id,
      paintOccurrenceId: occurrence.equality.paintOccurrenceId,
      entityIds: occurrence.equality.entityIds,
      lifecycle: "native-context" as const
    }),
    liveTransition: Object.freeze({
      occurrenceIds: Object.freeze(occurrence.provenanceCopies.map(
        ({ id }) => id)),
      paintOccurrenceIds: Object.freeze(occurrence.provenanceCopies.map(
        ({ paintOccurrenceId }) => paintOccurrenceId)),
      sourceCloneEntityIds: Object.freeze(sourceCloneEntityIds),
      suppressedSourceEntityIds: Object.freeze(suppressedSourceEntityIds),
      targetEntityIds: Object.freeze(targetEntityIds)
    }),
    settledTarget: Object.freeze({
      occurrenceId: occurrence.target.id,
      paintOccurrenceId: occurrence.target.paintOccurrenceId,
      entityIds: occurrence.target.entityIds,
      handoff: "material-settles-before-native-target" as const
    })
  }) as unknown as KpCompiledLogProductEquivalencePaintOwnershipV2;
  compiledPlans.add(plan);
  return plan;
}

export function isKpCompiledLogProductEquivalencePaintOwnershipV2(
  value: unknown
): value is KpCompiledLogProductEquivalencePaintOwnershipV2 {
  return typeof value === "object" && value !== null &&
    compiledPlans.has(value);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
