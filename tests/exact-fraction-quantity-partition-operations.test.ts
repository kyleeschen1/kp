import assert from "node:assert/strict";
import test from "node:test";

import { createKpExactQuantityUnit } from "../domains/quantities/exact-quantity.ts";
import {
  createKpFinitePartitionSelection,
  createKpUniformFinitePartition
} from "../domains/quantities/finite-partition.ts";
import {
  certifyKpPartitionRefinement,
  certifyKpSelectionMerge,
  certifyKpSelectionRefinement,
  certifyKpSelectionRegrouping,
  isKpPartitionProof,
  type KpPartitionRefinementCertificate
} from "../domains/quantities/partition-operations.ts";

const unit = createKpExactQuantityUnit(
  "unit.exact-fraction-quantity.one-whole",
  "one whole"
);
const thirds = createKpUniformFinitePartition({
  id: "partition.thirds",
  unit,
  partCount: 3,
  partIdPrefix: "part.third"
});
const sixths = createKpUniformFinitePartition({
  id: "partition.sixths",
  unit,
  partCount: 6,
  partIdPrefix: "part.sixth"
});
const halves = createKpUniformFinitePartition({
  id: "partition.halves",
  unit,
  partCount: 2,
  partIdPrefix: "part.half"
});

function thirdsToSixths() {
  return certifyKpPartitionRefinement({
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
}

test("refinement accounts for every part with exact fission lineage", () => {
  const proof = thirdsToSixths();

  assert.ok(isKpPartitionProof(proof));
  assert.equal(proof.cohorts.length, 3);
  assert.ok(proof.cohorts.every(({ lifecycle, exactMeasure }) =>
    lifecycle === "fission" &&
    exactMeasure.numerator === 1n &&
    exactMeasure.denominator === 3n
  ));
  assert.equal(
    new Set(proof.cohorts.flatMap(({ targetPartIds }) => targetPartIds)).size,
    6
  );
});

test("a selected third refines to the exact corresponding two sixths", () => {
  const source = createKpFinitePartitionSelection(
    thirds,
    "selection.one-third",
    [thirds.parts[0]!.id]
  );
  const target = createKpFinitePartitionSelection(
    sixths,
    "selection.two-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );
  const proof = certifyKpSelectionRefinement({
    source,
    target,
    refinement: thirdsToSixths()
  });

  assert.ok(isKpPartitionProof(proof));
  assert.equal(proof.cohorts[0]?.lifecycle, "fission");
  assert.deepEqual(proof.exactMeasure, {
    numerator: 1n,
    denominator: 3n
  });
});

test("two-sixths and one-sixth fuse as one disjoint exact union", () => {
  const twoSixths = createKpFinitePartitionSelection(
    sixths,
    "selection.two-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );
  const oneSixth = createKpFinitePartitionSelection(
    sixths,
    "selection.one-sixth",
    [sixths.parts[2]!.id]
  );
  const threeSixths = createKpFinitePartitionSelection(
    sixths,
    "selection.three-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id, sixths.parts[2]!.id]
  );
  const proof = certifyKpSelectionMerge({
    contributors: [twoSixths, oneSixth],
    target: threeSixths
  });

  assert.ok(isKpPartitionProof(proof));
  assert.equal(proof.lifecycle, "fusion");
  assert.deepEqual(proof.contributorSelectionIds, [
    "selection.two-sixths",
    "selection.one-sixth"
  ]);
  assert.deepEqual(proof.exactMeasure, {
    numerator: 1n,
    denominator: 2n
  });
});

test("three sixths and one half regroup with reversible lineage", () => {
  const threeSixths = createKpFinitePartitionSelection(
    sixths,
    "selection.three-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id, sixths.parts[2]!.id]
  );
  const oneHalf = createKpFinitePartitionSelection(
    halves,
    "selection.one-half",
    [halves.parts[0]!.id]
  );
  const forward = certifyKpSelectionRegrouping({
    sourcePartition: sixths,
    targetPartition: halves,
    source: threeSixths,
    target: oneHalf,
    cohorts: [{
      sourcePartIds: threeSixths.partIds,
      targetPartIds: oneHalf.partIds
    }]
  });
  const reverse = certifyKpSelectionRegrouping({
    sourcePartition: halves,
    targetPartition: sixths,
    source: oneHalf,
    target: threeSixths,
    cohorts: [{
      sourcePartIds: oneHalf.partIds,
      targetPartIds: threeSixths.partIds
    }]
  });

  assert.equal(forward.cohorts[0]?.lifecycle, "fusion");
  assert.equal(reverse.cohorts[0]?.lifecycle, "fission");
  assert.deepEqual(forward.exactMeasure, reverse.exactMeasure);
});

test("incomplete, overlapping, or non-conserving lineage is rejected", () => {
  assert.throws(
    () => certifyKpPartitionRefinement({
      source: thirds,
      target: sixths,
      cohorts: [{
        sourcePartId: thirds.parts[0]!.id,
        targetPartIds: [sixths.parts[0]!.id]
      }]
    }),
    /does not conserve exact measure|must be exact and complete/
  );

  const first = createKpFinitePartitionSelection(
    sixths,
    "selection.first",
    [sixths.parts[0]!.id]
  );
  const overlap = createKpFinitePartitionSelection(
    sixths,
    "selection.overlap",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );
  const target = createKpFinitePartitionSelection(
    sixths,
    "selection.target",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );
  assert.throws(
    () => certifyKpSelectionMerge({
      contributors: [first, overlap],
      target
    }),
    /must be disjoint/
  );
});

test("a structurally forged refinement cannot authorize a selection proof", () => {
  const real = thirdsToSixths();
  const forged = {
    ...real,
    cohorts: real.cohorts
  } as unknown as KpPartitionRefinementCertificate<
    typeof unit.id,
    typeof thirds.id,
    typeof sixths.id
  >;
  const source = createKpFinitePartitionSelection(
    thirds,
    "selection.one-third",
    [thirds.parts[0]!.id]
  );
  const target = createKpFinitePartitionSelection(
    sixths,
    "selection.two-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );

  assert.equal(isKpPartitionProof(forged), false);
  assert.throws(
    () => certifyKpSelectionRefinement({
      source,
      target,
      refinement: forged
    }),
    /Unsealed partition refinement proof/
  );
});
