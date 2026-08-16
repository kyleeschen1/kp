import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import type {
  KpFunctionWrapEnclosureEntityRoles
} from "./function-wrap-reception.ts";

export type KpSymbolMetricTransition =
  | "preserve-source-metrics"
  | "interpolate-to-target-metrics";

export interface KpSymbolContinuantMotionRule {
  readonly kind: "continuant";
  readonly id: string;
  readonly correspondenceRecordId: string;
  readonly relation: "identity" | "role-change";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly presence: "continuous-opaque";
  readonly metricTransition: KpSymbolMetricTransition;
}

export interface KpRigidSymbolCompoundMotionRule {
  readonly kind: "rigid-compound";
  readonly id: string;
  readonly memberContinuantIds: readonly string[];
  readonly topology: "preserve-relative-geometry";
  readonly routing: "single-motion-unit";
}

export interface KpSymbolStructuralShellMotionRule {
  readonly kind: "structural-shell";
  readonly id: string;
  readonly correspondenceRecordId: string;
  readonly lifecycle: "introduce" | "retire";
  readonly entityIds: readonly string[];
  readonly timing:
    | "after-continuants-settle"
    | "after-continuants-depart";
}

export interface KpFunctionWrapMotionBranch {
  readonly id: string;
  readonly argumentContinuantIds: readonly string[];
  readonly wrapperEntityIds: readonly string[];
  readonly enclosureEntityRoles?: KpFunctionWrapEnclosureEntityRoles | undefined;
}

export interface KpCanonicalFunctionWrapMotionBinding {
  readonly kind: "canonical-function-wrap";
  readonly id: string;
  readonly canonicalOperationId: "kp.core.wrap";
  readonly wrapperIntroductionRecordId: string;
  readonly branches: readonly KpFunctionWrapMotionBranch[];
  readonly synchronization: "together";
}

declare const kpCompiledSymbolMotionContractAuthority: unique symbol;
const compiledContracts = new WeakSet<object>();

export interface KpCompiledSymbolMotionContract {
  readonly schemaVersion: "kp.compiled-symbol-motion-contract.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly continuants: readonly KpSymbolContinuantMotionRule[];
  readonly rigidCompounds: readonly KpRigidSymbolCompoundMotionRule[];
  readonly structuralShells: readonly KpSymbolStructuralShellMotionRule[];
  readonly canonicalMotifs: readonly KpCanonicalFunctionWrapMotionBinding[];
  readonly [kpCompiledSymbolMotionContractAuthority]: true;
}

export function compileKpSymbolMotionContract(input: {
  readonly id: string;
  readonly transformation: KpSemanticTransformation;
  readonly continuants: readonly {
    readonly id: string;
    readonly correspondenceRecordId: string;
    readonly metricTransition: KpSymbolMetricTransition;
  }[];
  readonly rigidCompounds?: readonly {
    readonly id: string;
    readonly memberContinuantIds: readonly string[];
  }[] | undefined;
  readonly structuralShells?: readonly {
    readonly id: string;
    readonly correspondenceRecordId: string;
    readonly timing:
      | "after-continuants-settle"
      | "after-continuants-depart";
  }[] | undefined;
  readonly canonicalMotifs?: readonly {
    readonly id: string;
    readonly canonicalOperationId: "kp.core.wrap";
    readonly wrapperIntroductionRecordId: string;
    readonly branches: readonly KpFunctionWrapMotionBranch[];
  }[] | undefined;
}): KpCompiledSymbolMotionContract {
  requireId(input.id, "symbol motion contract");
  const records = input.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Symbol motion contract ${input.id} requires correspondence authority.`
    );
  }
  const recordsById = new Map(records.map((record) => [record.id, record]));
  requireUnique(input.continuants.map(({ id }) => id), "continuant rule");
  requireUnique(
    input.continuants.map(({ correspondenceRecordId }) =>
      correspondenceRecordId
    ),
    "continuant correspondence"
  );
  const continuants = Object.freeze(input.continuants.map((rule) => {
    const record = requiredRecord(recordsById, rule.correspondenceRecordId);
    if (
      (record.relation !== "identity" && record.relation !== "role-change") ||
      record.sourceSelectorIds.length === 0 ||
      record.targetSelectorIds.length === 0
    ) {
      throw new Error(
        `Symbol continuant ${rule.id} requires identity or role-change lineage.`
      );
    }
    return Object.freeze({
      kind: "continuant" as const,
      id: rule.id,
      correspondenceRecordId: rule.correspondenceRecordId,
      relation: record.relation,
      sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
      targetEntityIds: Object.freeze([...record.targetSelectorIds]),
      presence: "continuous-opaque" as const,
      metricTransition: rule.metricTransition
    });
  }));
  const continuantsById = new Map(continuants.map((rule) => [rule.id, rule]));
  const claimedCompoundMembers = new Set<string>();
  const rigidCompounds = Object.freeze((input.rigidCompounds ?? []).map(
    (compound) => {
      requireId(compound.id, "rigid symbol compound");
      requireUnique(compound.memberContinuantIds, `${compound.id} member`);
      if (compound.memberContinuantIds.length < 2) {
        throw new Error(
          `Rigid symbol compound ${compound.id} requires at least two continuants.`
        );
      }
      for (const memberId of compound.memberContinuantIds) {
        if (!continuantsById.has(memberId)) {
          throw new Error(
            `Rigid symbol compound ${compound.id} references unknown continuant ${memberId}.`
          );
        }
        if (claimedCompoundMembers.has(memberId)) {
          throw new Error(
            `Symbol continuant ${memberId} belongs to more than one rigid compound.`
          );
        }
        claimedCompoundMembers.add(memberId);
      }
      return Object.freeze({
        kind: "rigid-compound" as const,
        id: compound.id,
        memberContinuantIds: Object.freeze([
          ...compound.memberContinuantIds
        ]),
        topology: "preserve-relative-geometry" as const,
        routing: "single-motion-unit" as const
      });
    }
  ));
  requireUnique(rigidCompounds.map(({ id }) => id), "rigid compound");
  const structuralShells = Object.freeze((input.structuralShells ?? []).map(
    (shell) => {
      const record = requiredRecord(
        recordsById,
        shell.correspondenceRecordId
      );
      const lifecycle = record.relation === "introduction"
        ? "introduce" as const
        : record.relation === "removal"
          ? "retire" as const
          : undefined;
      if (lifecycle === undefined) {
        throw new Error(
          `Structural shell ${shell.id} requires introduction or removal lineage.`
        );
      }
      if (
        (lifecycle === "introduce" &&
          shell.timing !== "after-continuants-settle") ||
        (lifecycle === "retire" &&
          shell.timing !== "after-continuants-depart")
      ) {
        throw new Error(
          `Structural shell ${shell.id} has non-causal ${lifecycle} timing.`
        );
      }
      return Object.freeze({
        kind: "structural-shell" as const,
        id: shell.id,
        correspondenceRecordId: shell.correspondenceRecordId,
        lifecycle,
        entityIds: Object.freeze([
          ...(lifecycle === "introduce"
            ? record.targetSelectorIds
            : record.sourceSelectorIds)
        ]),
        timing: shell.timing
      });
    }
  ));
  requireUnique(structuralShells.map(({ id }) => id), "structural shell");
  const canonicalMotifs = Object.freeze((input.canonicalMotifs ?? []).map(
    (motif) => compileFunctionWrapBinding({
      motif,
      recordsById,
      continuantsById
    })
  ));
  requireUnique(canonicalMotifs.map(({ id }) => id), "canonical motif");
  assertTotalCorrespondenceCoverage({
    records,
    continuants,
    structuralShells,
    canonicalMotifs
  });
  const compiled = Object.freeze({
    schemaVersion: "kp.compiled-symbol-motion-contract.v1" as const,
    id: input.id,
    transformationId: input.transformation.id,
    continuants,
    rigidCompounds,
    structuralShells,
    canonicalMotifs
  }) as KpCompiledSymbolMotionContract;
  compiledContracts.add(compiled);
  return compiled;
}

export function isKpCompiledSymbolMotionContract(
  value: unknown
): value is KpCompiledSymbolMotionContract {
  return typeof value === "object" && value !== null &&
    compiledContracts.has(value);
}

function compileFunctionWrapBinding(input: {
  readonly motif: {
    readonly id: string;
    readonly canonicalOperationId: "kp.core.wrap";
    readonly wrapperIntroductionRecordId: string;
    readonly branches: readonly KpFunctionWrapMotionBranch[];
  };
  readonly recordsById: ReadonlyMap<string, SelectorCorrespondenceRecord>;
  readonly continuantsById: ReadonlyMap<string, KpSymbolContinuantMotionRule>;
}): KpCanonicalFunctionWrapMotionBinding {
  requireId(input.motif.id, "canonical function-wrap motif");
  const wrapperRecord = requiredRecord(
    input.recordsById,
    input.motif.wrapperIntroductionRecordId
  );
  if (wrapperRecord.relation !== "introduction") {
    throw new Error(
      `Function-wrap motif ${input.motif.id} requires wrapper introduction.`
    );
  }
  if (input.motif.branches.length === 0) {
    throw new Error(`Function-wrap motif ${input.motif.id} requires a branch.`);
  }
  requireUnique(input.motif.branches.map(({ id }) => id), "wrap branch");
  const argumentContinuantIds = input.motif.branches.flatMap(
    ({ argumentContinuantIds: ids }) => ids
  );
  requireUnique(argumentContinuantIds, "wrap argument");
  const wrapperEntityIds = input.motif.branches.flatMap(
    (branch) => branch.wrapperEntityIds
  );
  requireUnique(wrapperEntityIds, "wrap wrapper entity");
  for (const branch of input.motif.branches) {
    if (branch.argumentContinuantIds.length === 0) {
      throw new Error(`Function-wrap branch ${branch.id} requires argument material.`);
    }
    for (const continuantId of branch.argumentContinuantIds) {
      if (!input.continuantsById.has(continuantId)) {
        throw new Error(
          `Function-wrap branch ${branch.id} references unknown argument continuant ${continuantId}.`
        );
      }
    }
    if (branch.wrapperEntityIds.length === 0) {
      throw new Error(`Function-wrap branch ${branch.id} requires wrapper paint.`);
    }
    const enclosureRoles = branch.enclosureEntityRoles ?? [];
    if (enclosureRoles.length !== 0) {
      const [leading, trailing] = enclosureRoles;
      if (leading.side !== "leading" || trailing.side !== "trailing") {
        throw new Error(
          `Function-wrap branch ${branch.id} requires leading then trailing enclosure roles.`
        );
      }
      if (
        leading.entityId === trailing.entityId ||
        !branch.wrapperEntityIds.includes(leading.entityId) ||
        !branch.wrapperEntityIds.includes(trailing.entityId)
      ) {
        throw new Error(
          `Function-wrap branch ${branch.id} enclosure roles must name distinct wrapper entities.`
        );
      }
    }
  }
  requireSameSet(
    wrapperEntityIds,
    wrapperRecord.targetSelectorIds,
    `Function-wrap motif ${input.motif.id}`
  );
  return Object.freeze({
    kind: "canonical-function-wrap" as const,
    id: input.motif.id,
    canonicalOperationId: input.motif.canonicalOperationId,
    wrapperIntroductionRecordId:
      input.motif.wrapperIntroductionRecordId,
    branches: Object.freeze(input.motif.branches.map((branch) =>
      Object.freeze({
        ...branch,
        argumentContinuantIds: Object.freeze([
          ...branch.argumentContinuantIds
        ]),
        wrapperEntityIds: Object.freeze([...branch.wrapperEntityIds]),
        enclosureEntityRoles: Object.freeze(
          (branch.enclosureEntityRoles ?? []).map((role) =>
            Object.freeze({ ...role })
          )
        ) as KpFunctionWrapEnclosureEntityRoles
      })
    )),
    synchronization: "together" as const
  });
}

function assertTotalCorrespondenceCoverage(input: {
  readonly records: readonly SelectorCorrespondenceRecord[];
  readonly continuants: readonly KpSymbolContinuantMotionRule[];
  readonly structuralShells: readonly KpSymbolStructuralShellMotionRule[];
  readonly canonicalMotifs: readonly KpCanonicalFunctionWrapMotionBinding[];
}): void {
  const covered = [
    ...input.continuants.map(({ correspondenceRecordId }) =>
      correspondenceRecordId
    ),
    ...input.structuralShells.map(({ correspondenceRecordId }) =>
      correspondenceRecordId
    ),
    ...input.canonicalMotifs.map(({ wrapperIntroductionRecordId }) =>
      wrapperIntroductionRecordId
    )
  ];
  requireUnique(covered, "symbol motion correspondence coverage");
  requireSameSet(
    covered,
    input.records.map(({ id }) => id),
    "Symbol motion contract"
  );
}

function requiredRecord(
  records: ReadonlyMap<string, SelectorCorrespondenceRecord>,
  id: string
): SelectorCorrespondenceRecord {
  const record = records.get(id);
  if (record === undefined) {
    throw new Error(`Symbol motion contract references unknown correspondence ${id}.`);
  }
  return record;
}

function requireId(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} id must not be empty.`);
}

function requireUnique(values: readonly string[], label: string): void {
  if (
    values.some((value) => value.trim().length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${label} values must be unique and non-empty.`);
  }
}

function requireSameSet(
  left: readonly string[],
  right: readonly string[],
  label: string
): void {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (
    leftSet.size !== left.length ||
    rightSet.size !== right.length ||
    leftSet.size !== rightSet.size ||
    [...leftSet].some((value) => !rightSet.has(value))
  ) {
    throw new Error(`${label} does not cover the same semantic set.`);
  }
}
