import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import type {
  KpFinitePartition,
  KpFinitePartitionPartId,
  KpFinitePartitionSelection
} from "./finite-partition.ts";

declare const kpPartitionProofBrand: unique symbol;

type KpLineageKind = "persist" | "fission" | "fusion" | "regroup";

export interface KpPartitionLineageCohort<
  SourcePartitionId extends string,
  TargetPartitionId extends string
> {
  readonly sourcePartIds:
    readonly KpFinitePartitionPartId<SourcePartitionId>[];
  readonly targetPartIds:
    readonly KpFinitePartitionPartId<TargetPartitionId>[];
  readonly lifecycle: KpLineageKind;
  readonly exactMeasure: KpNormalizedRational;
}

export interface KpPartitionRefinementCertificate<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
> {
  readonly schemaVersion: "kp.partition-refinement-certificate.v1";
  readonly lawId: "law.partition.refinement-conserves-whole";
  readonly unitId: UnitId;
  readonly sourcePartitionId: SourcePartitionId;
  readonly targetPartitionId: TargetPartitionId;
  readonly cohorts:
    readonly KpPartitionLineageCohort<
      SourcePartitionId,
      TargetPartitionId
    >[];
  readonly [kpPartitionProofBrand]: "refinement";
}

export interface KpSelectionRefinementCertificate<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
> {
  readonly schemaVersion: "kp.selection-refinement-certificate.v1";
  readonly lawId: "law.partition.selection-refinement-conserves-quantity";
  readonly unitId: UnitId;
  readonly sourceSelectionId: string;
  readonly targetSelectionId: string;
  readonly exactMeasure: KpNormalizedRational;
  readonly cohorts:
    readonly KpPartitionLineageCohort<
      SourcePartitionId,
      TargetPartitionId
    >[];
  readonly [kpPartitionProofBrand]: "selection-refinement";
}

export interface KpSelectionMergeCertificate<
  UnitId extends string,
  PartitionId extends string
> {
  readonly schemaVersion: "kp.selection-merge-certificate.v1";
  readonly lawId: "law.partition.disjoint-selection-union";
  readonly unitId: UnitId;
  readonly partitionId: PartitionId;
  readonly contributorSelectionIds: readonly string[];
  readonly targetSelectionId: string;
  readonly contributorPartIds:
    readonly KpFinitePartitionPartId<PartitionId>[];
  readonly exactMeasure: KpNormalizedRational;
  readonly lifecycle: "fusion";
  readonly [kpPartitionProofBrand]: "merge";
}

export interface KpSelectionRegroupingCertificate<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
> {
  readonly schemaVersion: "kp.selection-regrouping-certificate.v1";
  readonly lawId: "law.partition.equivalent-regrouping";
  readonly unitId: UnitId;
  readonly sourceSelectionId: string;
  readonly targetSelectionId: string;
  readonly exactMeasure: KpNormalizedRational;
  readonly cohorts:
    readonly KpPartitionLineageCohort<
      SourcePartitionId,
      TargetPartitionId
    >[];
  readonly [kpPartitionProofBrand]: "regrouping";
}

const sealedProofs = new WeakSet<object>();

export function certifyKpPartitionRefinement<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
>(input: {
  readonly source:
    KpFinitePartition<UnitId, SourcePartitionId>;
  readonly target:
    KpFinitePartition<NoInfer<UnitId>, TargetPartitionId>;
  readonly cohorts: readonly {
    readonly sourcePartId:
      KpFinitePartitionPartId<NoInfer<SourcePartitionId>>;
    readonly targetPartIds:
      readonly KpFinitePartitionPartId<NoInfer<TargetPartitionId>>[];
  }[];
}): KpPartitionRefinementCertificate<
  UnitId,
  SourcePartitionId,
  TargetPartitionId
> {
  assertSameUnit(input.source.unit.id, input.target.unit.id);
  const cohorts = input.cohorts.map(({ sourcePartId, targetPartIds }) => {
    if (targetPartIds.length === 0) {
      throw new Error("A refinement cohort requires at least one target part.");
    }
    return {
      sourcePartIds: [sourcePartId],
      targetPartIds
    };
  });
  const certified = certifyLineageCohorts(
    input.source,
    input.target,
    cohorts,
    input.source.parts.map(({ id }) => id),
    input.target.parts.map(({ id }) => id)
  );
  return sealProof({
    schemaVersion: "kp.partition-refinement-certificate.v1",
    lawId: "law.partition.refinement-conserves-whole",
    unitId: input.source.unit.id,
    sourcePartitionId: input.source.id,
    targetPartitionId: input.target.id,
    cohorts: certified
  }) as KpPartitionRefinementCertificate<
    UnitId,
    SourcePartitionId,
    TargetPartitionId
  >;
}

export function certifyKpSelectionRefinement<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
>(input: {
  readonly source:
    KpFinitePartitionSelection<UnitId, SourcePartitionId>;
  readonly target:
    KpFinitePartitionSelection<NoInfer<UnitId>, TargetPartitionId>;
  readonly refinement:
    KpPartitionRefinementCertificate<
      NoInfer<UnitId>,
      NoInfer<SourcePartitionId>,
      NoInfer<TargetPartitionId>
    >;
}): KpSelectionRefinementCertificate<
  UnitId,
  SourcePartitionId,
  TargetPartitionId
> {
  assertSealed(input.refinement, "partition refinement");
  if (
    input.refinement.sourcePartitionId !== input.source.partitionId ||
    input.refinement.targetPartitionId !== input.target.partitionId
  ) {
    throw new Error(
      "Selection refinement endpoints do not match its partition proof."
    );
  }
  const selectedSource = new Set(input.source.partIds);
  const cohorts = input.refinement.cohorts.filter(({ sourcePartIds }) =>
    sourcePartIds.some((partId) => selectedSource.has(partId))
  );
  assertSameMembers(
    cohorts.flatMap(({ sourcePartIds }) => sourcePartIds),
    input.source.partIds,
    "selection refinement source lineage"
  );
  assertSameMembers(
    cohorts.flatMap(({ targetPartIds }) => targetPartIds),
    input.target.partIds,
    "selection refinement target lineage"
  );
  assertEqualMeasure(
    input.source.quantity.value,
    input.target.quantity.value,
    "Selection refinement"
  );
  return sealProof({
    schemaVersion: "kp.selection-refinement-certificate.v1",
    lawId: "law.partition.selection-refinement-conserves-quantity",
    unitId: input.source.unit.id,
    sourceSelectionId: input.source.id,
    targetSelectionId: input.target.id,
    exactMeasure: input.source.quantity.value,
    cohorts
  }) as KpSelectionRefinementCertificate<
    UnitId,
    SourcePartitionId,
    TargetPartitionId
  >;
}

export function certifyKpSelectionMerge<
  UnitId extends string,
  PartitionId extends string
>(input: {
  readonly contributors:
    readonly KpFinitePartitionSelection<UnitId, PartitionId>[];
  readonly target:
    KpFinitePartitionSelection<NoInfer<UnitId>, NoInfer<PartitionId>>;
}): KpSelectionMergeCertificate<UnitId, PartitionId> {
  if (input.contributors.length < 2) {
    throw new Error("Selection merge requires at least two contributors.");
  }
  const contributorIds = input.contributors.map(({ id }) => id);
  if (new Set(contributorIds).size !== contributorIds.length) {
    throw new Error("Selection merge contributor IDs must be unique.");
  }
  if (contributorIds.includes(input.target.id)) {
    throw new Error(
      "Selection merge target must be distinct from its contributors."
    );
  }
  for (const contributor of input.contributors) {
    assertSameUnit(contributor.unit.id, input.target.unit.id);
    if (contributor.partitionId !== input.target.partitionId) {
      throw new Error("Selection merge requires one partition.");
    }
  }
  const contributorPartIds = input.contributors.flatMap(
    ({ partIds }) => partIds
  );
  assertNoDuplicates(
    contributorPartIds,
    "Selection merge contributors must be disjoint."
  );
  assertSameMembers(
    contributorPartIds,
    input.target.partIds,
    "selection merge target"
  );
  const exactMeasure = input.contributors.reduce(
    (sum, contributor) =>
      addKpRationals(sum, contributor.quantity.value),
    createKpRational(0n)
  );
  assertEqualMeasure(
    exactMeasure,
    input.target.quantity.value,
    "Selection merge"
  );
  return sealProof({
    schemaVersion: "kp.selection-merge-certificate.v1",
    lawId: "law.partition.disjoint-selection-union",
    unitId: input.target.unit.id,
    partitionId: input.target.partitionId,
    contributorSelectionIds: Object.freeze(contributorIds),
    targetSelectionId: input.target.id,
    contributorPartIds: Object.freeze(contributorPartIds),
    exactMeasure,
    lifecycle: "fusion"
  }) as KpSelectionMergeCertificate<UnitId, PartitionId>;
}

export function certifyKpSelectionRegrouping<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
>(input: {
  readonly sourcePartition:
    KpFinitePartition<UnitId, SourcePartitionId>;
  readonly targetPartition:
    KpFinitePartition<NoInfer<UnitId>, TargetPartitionId>;
  readonly source:
    KpFinitePartitionSelection<
      NoInfer<UnitId>,
      NoInfer<SourcePartitionId>
    >;
  readonly target:
    KpFinitePartitionSelection<
      NoInfer<UnitId>,
      NoInfer<TargetPartitionId>
    >;
  readonly cohorts: readonly {
    readonly sourcePartIds:
      readonly KpFinitePartitionPartId<NoInfer<SourcePartitionId>>[];
    readonly targetPartIds:
      readonly KpFinitePartitionPartId<NoInfer<TargetPartitionId>>[];
  }[];
}): KpSelectionRegroupingCertificate<
  UnitId,
  SourcePartitionId,
  TargetPartitionId
> {
  assertSameUnit(input.sourcePartition.unit.id, input.targetPartition.unit.id);
  if (
    input.source.partitionId !== input.sourcePartition.id ||
    input.target.partitionId !== input.targetPartition.id
  ) {
    throw new Error("Selection regrouping endpoints must match their partitions.");
  }
  const cohorts = certifyLineageCohorts(
    input.sourcePartition,
    input.targetPartition,
    input.cohorts,
    input.source.partIds,
    input.target.partIds
  );
  assertEqualMeasure(
    input.source.quantity.value,
    input.target.quantity.value,
    "Selection regrouping"
  );
  return sealProof({
    schemaVersion: "kp.selection-regrouping-certificate.v1",
    lawId: "law.partition.equivalent-regrouping",
    unitId: input.source.unit.id,
    sourceSelectionId: input.source.id,
    targetSelectionId: input.target.id,
    exactMeasure: input.source.quantity.value,
    cohorts
  }) as KpSelectionRegroupingCertificate<
    UnitId,
    SourcePartitionId,
    TargetPartitionId
  >;
}

export function isKpPartitionProof(value: unknown): boolean {
  return typeof value === "object" &&
    value !== null &&
    sealedProofs.has(value);
}

function certifyLineageCohorts<
  UnitId extends string,
  SourcePartitionId extends string,
  TargetPartitionId extends string
>(
  source: KpFinitePartition<UnitId, SourcePartitionId>,
  target: KpFinitePartition<UnitId, TargetPartitionId>,
  inputCohorts: readonly {
    readonly sourcePartIds:
      readonly KpFinitePartitionPartId<SourcePartitionId>[];
    readonly targetPartIds:
      readonly KpFinitePartitionPartId<TargetPartitionId>[];
  }[],
  requiredSourcePartIds:
    readonly KpFinitePartitionPartId<SourcePartitionId>[],
  requiredTargetPartIds:
    readonly KpFinitePartitionPartId<TargetPartitionId>[]
): readonly KpPartitionLineageCohort<
  SourcePartitionId,
  TargetPartitionId
>[] {
  if (inputCohorts.length === 0) {
    throw new Error("Partition lineage requires at least one cohort.");
  }
  const sourcePartById = new Map(
    source.parts.map((part) => [part.id, part] as const)
  );
  const targetPartById = new Map(
    target.parts.map((part) => [part.id, part] as const)
  );
  const cohorts = inputCohorts.map((cohort) => {
    if (
      cohort.sourcePartIds.length === 0 ||
      cohort.targetPartIds.length === 0
    ) {
      throw new Error(
        "Partition lineage cohorts require source and target parts."
      );
    }
    const sourceMeasure = measureParts(
      cohort.sourcePartIds,
      sourcePartById,
      "source"
    );
    const targetMeasure = measureParts(
      cohort.targetPartIds,
      targetPartById,
      "target"
    );
    assertEqualMeasure(
      sourceMeasure,
      targetMeasure,
      "Partition lineage cohort"
    );
    return Object.freeze({
      sourcePartIds: Object.freeze([...cohort.sourcePartIds]),
      targetPartIds: Object.freeze([...cohort.targetPartIds]),
      lifecycle: lineageKind(
        cohort.sourcePartIds.length,
        cohort.targetPartIds.length
      ),
      exactMeasure: sourceMeasure
    });
  });
  assertSameMembers(
    cohorts.flatMap(({ sourcePartIds }) => sourcePartIds),
    requiredSourcePartIds,
    "partition lineage source coverage"
  );
  assertSameMembers(
    cohorts.flatMap(({ targetPartIds }) => targetPartIds),
    requiredTargetPartIds,
    "partition lineage target coverage"
  );
  return Object.freeze(cohorts);
}

function measureParts<PartitionId extends string>(
  partIds: readonly KpFinitePartitionPartId<PartitionId>[],
  partById: ReadonlyMap<
    KpFinitePartitionPartId<PartitionId>,
    { readonly measure: KpNormalizedRational }
  >,
  side: string
): KpNormalizedRational {
  return partIds.reduce((sum, partId) => {
    const part = partById.get(partId);
    if (part === undefined) {
      throw new Error(`Partition lineage references missing ${side} part ${partId}.`);
    }
    return addKpRationals(sum, part.measure);
  }, createKpRational(0n));
}

function assertSameMembers<T>(
  actual: readonly T[],
  expected: readonly T[],
  label: string
): void {
  assertNoDuplicates(actual, `${label} contains a duplicate part.`);
  if (
    actual.length !== expected.length ||
    actual.some((value) => !expected.includes(value))
  ) {
    throw new Error(`${label} must be exact and complete.`);
  }
}

function assertNoDuplicates<T>(values: readonly T[], message: string): void {
  if (new Set(values).size !== values.length) throw new Error(message);
}

function assertSameUnit(left: string, right: string): void {
  if (left !== right) {
    throw new Error(`Partition operation units differ: ${left} and ${right}.`);
  }
}

function assertEqualMeasure(
  left: KpNormalizedRational,
  right: KpNormalizedRational,
  label: string
): void {
  if (!equalKpRationals(left, right)) {
    throw new Error(`${label} does not conserve exact measure.`);
  }
}

function lineageKind(sourceCount: number, targetCount: number): KpLineageKind {
  if (sourceCount === 1 && targetCount === 1) return "persist";
  if (sourceCount === 1) return "fission";
  if (targetCount === 1) return "fusion";
  return "regroup";
}

function sealProof<T extends object>(proof: T): T {
  const sealed = Object.freeze(proof);
  sealedProofs.add(sealed);
  return sealed;
}

function assertSealed(value: object, label: string): void {
  if (!sealedProofs.has(value)) {
    throw new Error(`Unsealed ${label} proof cannot be trusted.`);
  }
}
