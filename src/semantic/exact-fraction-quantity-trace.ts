import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import {
  certifyKpExactQuantitySum,
  createKpExactQuantityUnit,
  isKpExactQuantityProof,
  type KpExactQuantitySumCertificate
} from "../../domains/quantities/exact-quantity.ts";
import {
  createKpFinitePartitionSelection,
  createKpUniformFinitePartition
} from "../../domains/quantities/finite-partition.ts";
import {
  certifyKpPartitionRefinement,
  certifyKpSelectionMerge,
  certifyKpSelectionRefinement,
  certifyKpSelectionRegrouping,
  isKpPartitionProof,
  type KpPartitionRefinementCertificate,
  type KpSelectionMergeCertificate,
  type KpSelectionRefinementCertificate,
  type KpSelectionRegroupingCertificate
} from "../../domains/quantities/partition-operations.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  certifyKpCommonDenominator,
  createKpExactFractionForm as fractionForm,
  isKpCommonDenominatorProof,
  type KpCommonDenominatorCertificate,
  type KpExactFractionForm,
  type KpFractionEquivalenceMultiplier
} from "./fraction-common-denominator.ts";

export { isKpCommonDenominatorProof } from
  "./fraction-common-denominator.ts";
export type {
  KpCommonDenominatorCertificate,
  KpExactFractionForm,
  KpFractionEquivalenceMultiplier
} from "./fraction-common-denominator.ts";

export interface KpExactFractionQuantitySelectionState {
  readonly selectionId: string;
  readonly partitionId: string;
  readonly partIds: readonly string[];
  readonly atomicPartIds: readonly string[];
  readonly exactMeasure: KpNormalizedRational;
}

export interface KpExactFractionQuantityState {
  readonly id: string;
  readonly checkpointId: string;
  readonly semanticStage:
    | "same-unit-established"
    | "third-refined"
    | "common-denominator-aligned"
    | "sixths-merged"
    | "half-recognized";
  readonly symbolicForms: readonly KpExactFractionForm[];
  readonly selections: readonly KpExactFractionQuantitySelectionState[];
  readonly exactTotal: KpNormalizedRational;
}

export interface KpExactFractionQuantityBeat {
  readonly id: string;
  readonly operation:
    | "establish-same-unit"
    | "refine-partition"
    | "align-common-denominator"
    | "merge-disjoint-parts"
    | "recognize-equivalent-regrouping";
  readonly fromStateId?: string | undefined;
  readonly toStateId: string;
  readonly dependencyBeatIds: readonly string[];
  readonly proofIds: readonly string[];
}

export interface KpExactFractionQuantityTrace {
  readonly schemaVersion: "kp.exact-fraction-quantity-trace.v1";
  readonly id: "trace.exact-fraction-quantity.third-plus-sixth";
  readonly unitId: typeof manifest.exactUnit.id;
  readonly states: readonly KpExactFractionQuantityState[];
  readonly beats: readonly KpExactFractionQuantityBeat[];
  readonly proofs: {
    readonly exactSum:
      KpExactQuantitySumCertificate<typeof manifest.exactUnit.id>;
    readonly partitionRefinement:
      KpPartitionRefinementCertificate<
        typeof manifest.exactUnit.id,
        "partition.unit-thirds",
        "partition.unit-sixths"
      >;
    readonly selectionRefinement:
      KpSelectionRefinementCertificate<
        typeof manifest.exactUnit.id,
        "partition.unit-thirds",
        "partition.unit-sixths"
      >;
    readonly commonDenominator: KpCommonDenominatorCertificate;
    readonly merge:
      KpSelectionMergeCertificate<
        typeof manifest.exactUnit.id,
        "partition.unit-sixths"
      >;
    readonly regrouping:
      KpSelectionRegroupingCertificate<
        typeof manifest.exactUnit.id,
        "partition.unit-sixths",
        "partition.unit-halves"
      >;
  };
  readonly verification: {
    readonly adjacentStatesVerified: true;
    readonly dependencyOrderVerified: true;
    readonly contributorClosureVerified: true;
    readonly finalEqualityVerified: true;
  };
}

export function createKpExactFractionQuantityTrace():
KpExactFractionQuantityTrace {
  const unit = createKpExactQuantityUnit(
    manifest.exactUnit.id,
    manifest.exactUnit.label
  );
  const thirds = createKpUniformFinitePartition({
    id: "partition.unit-thirds",
    unit,
    partCount: 3,
    partIdPrefix: "part.unit-third"
  });
  const sixths = createKpUniformFinitePartition({
    id: "partition.unit-sixths",
    unit,
    partCount: 6,
    partIdPrefix: "part.unit-sixth"
  });
  const halves = createKpUniformFinitePartition({
    id: "partition.unit-halves",
    unit,
    partCount: 2,
    partIdPrefix: "part.unit-half"
  });
  const oneThird = createKpFinitePartitionSelection(
    thirds,
    manifest.selections.oneThird.id,
    [thirds.parts[0]!.id]
  );
  const twoSixths = createKpFinitePartitionSelection(
    sixths,
    "selection.addend.one-third-as-two-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );
  const oneSixth = createKpFinitePartitionSelection(
    sixths,
    manifest.selections.oneSixth.id,
    [sixths.parts[2]!.id]
  );
  const threeSixths = createKpFinitePartitionSelection(
    sixths,
    "selection.sum.three-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id, sixths.parts[2]!.id]
  );
  const oneHalf = createKpFinitePartitionSelection(
    halves,
    manifest.selections.resultHalf.id,
    [halves.parts[0]!.id]
  );

  const exactSum = certifyKpExactQuantitySum(
    oneThird.quantity,
    oneSixth.quantity
  );
  const partitionRefinement = certifyKpPartitionRefinement({
    source: thirds,
    target: sixths,
    cohorts: thirds.parts.map((third, index) => ({
      sourcePartId: third.id,
      targetPartIds: [
        sixths.parts[index * 2]!.id,
        sixths.parts[index * 2 + 1]!.id
      ]
    }))
  });
  const selectionRefinement = certifyKpSelectionRefinement({
    source: oneThird,
    target: twoSixths,
    refinement: partitionRefinement
  });
  const commonDenominator = certifyKpCommonDenominator({
    id: "proof.exact-fraction.common-denominator",
    sourceForms: [fractionForm(1n, 3n), fractionForm(1n, 6n)],
    targetForms: [fractionForm(2n, 6n), fractionForm(1n, 6n)],
    equivalenceMultipliers: [
      multiplier("first", 2n, 2n),
      multiplier("second", 1n, 1n)
    ]
  });
  const merge = certifyKpSelectionMerge({
    contributors: [twoSixths, oneSixth],
    target: threeSixths
  });
  const regrouping = certifyKpSelectionRegrouping({
    sourcePartition: sixths,
    targetPartition: halves,
    source: threeSixths,
    target: oneHalf,
    cohorts: [{
      sourcePartIds: threeSixths.partIds,
      targetPartIds: oneHalf.partIds
    }]
  });

  const atomicThird = manifest.selections.oneThird.atomicPartIds;
  const atomicSixth = manifest.selections.oneSixth.atomicPartIds;
  const atomicHalf = manifest.selections.resultHalf.atomicPartIds;
  const states = Object.freeze([
    state(
      "state.exact-fraction.established",
      manifest.checkpoints[0]!.id,
      "same-unit-established",
      [fractionForm(1n, 3n), fractionForm(1n, 6n)],
      [
        selectionState(oneThird, atomicThird),
        selectionState(oneSixth, atomicSixth)
      ]
    ),
    state(
      "state.exact-fraction.refined",
      manifest.checkpoints[1]!.id,
      "third-refined",
      [fractionForm(2n, 6n), fractionForm(1n, 6n)],
      [
        selectionState(twoSixths, atomicThird),
        selectionState(oneSixth, atomicSixth)
      ]
    ),
    state(
      "state.exact-fraction.aligned",
      manifest.checkpoints[2]!.id,
      "common-denominator-aligned",
      [fractionForm(2n, 6n), fractionForm(1n, 6n)],
      [
        selectionState(twoSixths, atomicThird),
        selectionState(oneSixth, atomicSixth)
      ]
    ),
    state(
      "state.exact-fraction.merged",
      manifest.checkpoints[3]!.id,
      "sixths-merged",
      [fractionForm(3n, 6n)],
      [selectionState(threeSixths, atomicHalf)]
    ),
    state(
      "state.exact-fraction.recognized",
      manifest.checkpoints[4]!.id,
      "half-recognized",
      [fractionForm(1n, 2n)],
      [selectionState(oneHalf, atomicHalf)]
    )
  ]);
  const beats = Object.freeze(manifest.checkpoints.map((checkpoint, index) =>
    Object.freeze({
      id: checkpoint.beatId,
      operation: ([
        "establish-same-unit",
        "refine-partition",
        "align-common-denominator",
        "merge-disjoint-parts",
        "recognize-equivalent-regrouping"
      ] as const)[index]!,
      ...(index === 0 ? {} : { fromStateId: states[index - 1]!.id }),
      toStateId: states[index]!.id,
      dependencyBeatIds: Object.freeze(
        index === 0 ? [] : [manifest.checkpoints[index - 1]!.beatId]
      ),
      proofIds: Object.freeze(([
        ["proof.exact-fraction.same-unit-sum"],
        [
          "proof.exact-fraction.partition-refinement",
          "proof.exact-fraction.selection-refinement"
        ],
        ["proof.exact-fraction.common-denominator"],
        ["proof.exact-fraction.selection-merge"],
        ["proof.exact-fraction.equivalent-regrouping"]
      ] as const)[index]!)
    }))
  );

  if (
    !isKpExactQuantityProof(exactSum) ||
    ![
      partitionRefinement,
      selectionRefinement,
      merge,
      regrouping
    ].every(isKpPartitionProof) ||
    !isKpCommonDenominatorProof(commonDenominator)
  ) {
    throw new Error("Exact fraction trace requires sealed operation proofs.");
  }
  const half = createKpRational(1n, 2n);
  if (
    !states.every(({ exactTotal }) => equalKpRationals(exactTotal, half)) ||
    !equalKpRationals(exactSum.result.value, half) ||
    !equalKpRationals(regrouping.exactMeasure, half)
  ) {
    throw new Error("Exact fraction trace final equality did not verify.");
  }

  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-trace.v1",
    id: "trace.exact-fraction-quantity.third-plus-sixth",
    unitId: unit.id,
    states,
    beats,
    proofs: Object.freeze({
      exactSum,
      partitionRefinement,
      selectionRefinement,
      commonDenominator,
      merge,
      regrouping
    }),
    verification: Object.freeze({
      adjacentStatesVerified: true,
      dependencyOrderVerified: true,
      contributorClosureVerified: true,
      finalEqualityVerified: true
    })
  });
}

export function serializeKpExactFractionQuantityTrace(
  trace: KpExactFractionQuantityTrace
): string {
  const payload = {
    schemaVersion: trace.schemaVersion,
    id: trace.id,
    unitId: trace.unitId,
    states: trace.states.map((stateValue) => ({
      id: stateValue.id,
      checkpointId: stateValue.checkpointId,
      semanticStage: stateValue.semanticStage,
      symbolicForms: stateValue.symbolicForms.map(serializeForm),
      selections: stateValue.selections.map((selection) => ({
        selectionId: selection.selectionId,
        partitionId: selection.partitionId,
        partIds: selection.partIds,
        atomicPartIds: selection.atomicPartIds,
        exactMeasure: serializeRational(selection.exactMeasure)
      })),
      exactTotal: serializeRational(stateValue.exactTotal)
    })),
    beats: trace.beats,
    proofLaws: [
      trace.proofs.exactSum.lawId,
      trace.proofs.partitionRefinement.lawId,
      trace.proofs.selectionRefinement.lawId,
      trace.proofs.commonDenominator.lawId,
      trace.proofs.merge.lawId,
      trace.proofs.regrouping.lawId
    ],
    commonDenominatorMultipliers:
      trace.proofs.commonDenominator.equivalenceMultipliers.map(
        ({ numerator, denominator }) => ({
          numerator: numerator.toString(),
          denominator: denominator.toString()
        })
      ),
    verification: trace.verification
  };
  return JSON.stringify(payload);
}

function multiplier(
  position: "first" | "second",
  numerator: bigint,
  denominator: bigint
): KpFractionEquivalenceMultiplier {
  const exactValue = createKpRational(numerator, denominator);
  return Object.freeze({
    entityId: `entity.exact-fraction.common-denominator.${position}.multiplier`,
    semanticId:
      `semantic.exact-fraction.common-denominator.${position}.unit-factor`,
    numerator,
    denominator,
    exactValue
  });
}

function state(
  id: string,
  checkpointId: string,
  semanticStage: KpExactFractionQuantityState["semanticStage"],
  symbolicForms: readonly KpExactFractionForm[],
  selections: readonly KpExactFractionQuantitySelectionState[]
): KpExactFractionQuantityState {
  const exactTotal = symbolicForms.reduce(
    (sum, form) => addKpRationals(sum, form.value),
    createKpRational(0n)
  );
  return Object.freeze({
    id,
    checkpointId,
    semanticStage,
    symbolicForms: Object.freeze([...symbolicForms]),
    selections: Object.freeze([...selections]),
    exactTotal
  });
}

function selectionState<
  UnitId extends string,
  PartitionId extends string
>(
  selection: {
    readonly id: string;
    readonly partitionId: PartitionId;
    readonly partIds: readonly { readonly toString: () => string }[];
    readonly quantity: {
      readonly unit: { readonly id: UnitId };
      readonly value: KpNormalizedRational;
    };
  },
  atomicPartIds: readonly string[]
): KpExactFractionQuantitySelectionState {
  return Object.freeze({
    selectionId: selection.id,
    partitionId: selection.partitionId,
    partIds: Object.freeze(selection.partIds.map(String)),
    atomicPartIds: Object.freeze([...atomicPartIds]),
    exactMeasure: selection.quantity.value
  });
}

function serializeForm(form: KpExactFractionForm) {
  return {
    numerator: form.numerator.toString(),
    denominator: form.denominator.toString(),
    value: serializeRational(form.value)
  };
}

function serializeRational(value: KpNormalizedRational) {
  return {
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  };
}
