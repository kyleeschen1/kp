import assert from "node:assert/strict";
import test from "node:test";

import { equalKpRationals } from "../domains/math/exact-rational.ts";
import { isKpExactQuantityProof } from "../domains/quantities/exact-quantity.ts";
import { isKpPartitionProof } from "../domains/quantities/partition-operations.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace,
  isKpCommonDenominatorProof,
  serializeKpExactFractionQuantityTrace,
  type KpCommonDenominatorCertificate
} from "../src/semantic/exact-fraction-quantity-trace.ts";

test("trace binds exactly five states and beats to the frozen checkpoints", () => {
  const trace = createKpExactFractionQuantityTrace();

  assert.equal(trace.states.length, 5);
  assert.equal(trace.beats.length, 5);
  assert.deepEqual(
    trace.states.map(({ checkpointId }) => checkpointId),
    manifest.checkpoints.map(({ id }) => id)
  );
  assert.deepEqual(
    trace.beats.map(({ id }) => id),
    manifest.checkpoints.map(({ beatId }) => beatId)
  );
});

test("every adjacency is explicit, sequential, and dependency ordered", () => {
  const trace = createKpExactFractionQuantityTrace();

  trace.beats.forEach((beat, index) => {
    assert.equal(beat.toStateId, trace.states[index]?.id);
    assert.equal(
      beat.fromStateId,
      index === 0 ? undefined : trace.states[index - 1]?.id
    );
    assert.deepEqual(
      beat.dependencyBeatIds,
      index === 0 ? [] : [trace.beats[index - 1]?.id]
    );
    assert.ok(beat.proofIds.length > 0);
  });
});

test("common denominator, merge, and recognition remain exact semantics", () => {
  const trace = createKpExactFractionQuantityTrace();
  const half = trace.proofs.exactSum.result.value;

  assert.ok(trace.states.every(({ exactTotal }) =>
    equalKpRationals(exactTotal, half)
  ));
  assert.deepEqual(
    trace.states[1]?.symbolicForms.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[2n, 6n], [1n, 6n]]
  );
  assert.deepEqual(
    trace.states[3]?.symbolicForms.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[3n, 6n]]
  );
  assert.deepEqual(
    trace.states[4]?.symbolicForms.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[1n, 2n]]
  );
  assert.deepEqual(
    trace.proofs.commonDenominator.equivalenceMultipliers.map(
      ({ numerator, denominator, exactValue }) => ({
        numerator,
        denominator,
        exactValue: [exactValue.numerator, exactValue.denominator]
      })
    ),
    [
      { numerator: 2n, denominator: 2n, exactValue: [1n, 1n] },
      { numerator: 1n, denominator: 1n, exactValue: [1n, 1n] }
    ]
  );
});

test("all trace proofs are sealed and contributor provenance closes", () => {
  const trace = createKpExactFractionQuantityTrace();
  const resultAtoms = trace.states.at(-1)?.selections[0]?.atomicPartIds;
  const initialAtoms = trace.states[0]?.selections.flatMap(
    ({ atomicPartIds }) => atomicPartIds
  );

  assert.ok(isKpExactQuantityProof(trace.proofs.exactSum));
  assert.ok(isKpCommonDenominatorProof(trace.proofs.commonDenominator));
  assert.ok([
    trace.proofs.partitionRefinement,
    trace.proofs.selectionRefinement,
    trace.proofs.merge,
    trace.proofs.regrouping
  ].every(isKpPartitionProof));
  assert.deepEqual(initialAtoms, resultAtoms);
  assert.deepEqual(resultAtoms, manifest.selections.resultHalf.atomicPartIds);
});

test("trace serialization is deterministic and renderer neutral", () => {
  const first = serializeKpExactFractionQuantityTrace(
    createKpExactFractionQuantityTrace()
  );
  const second = serializeKpExactFractionQuantityTrace(
    createKpExactFractionQuantityTrace()
  );

  assert.equal(first, second);
  assert.match(first, /law\.fraction\.equivalent-common-denominator/u);
  assert.match(
    first,
    /"commonDenominatorMultipliers":\[\{"numerator":"2","denominator":"2"\}/u
  );
  assert.doesNotMatch(
    first,
    /angle|radius|coordinate|pixel|svg|canvas|webgl|dom-order/iu
  );
});

test("a copied common-denominator witness is not sealed", () => {
  const proof = createKpExactFractionQuantityTrace()
    .proofs.commonDenominator;
  const forged = { ...proof } as unknown as
    KpCommonDenominatorCertificate;

  assert.equal(isKpCommonDenominatorProof(proof), true);
  assert.equal(isKpCommonDenominatorProof(forged), false);
});
