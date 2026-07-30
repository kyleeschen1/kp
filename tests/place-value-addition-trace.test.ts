import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpSettledColumnEvaluationCertificate
} from "../domains/quantities/place-value-column-evaluation.ts";
import {
  createKpPlaceValueAdditionTrace,
  isKpPlaceValueAdditionTrace,
  kpPlaceValueAdditionTrace
} from "../src/semantic/place-value-addition-trace.ts";

test("one immutable trace owns the right-to-left written algorithm", () => {
  assert.equal(kpPlaceValueAdditionTrace.expression, "278 + 156 = 434");
  assert.equal(
    kpPlaceValueAdditionTrace.direction,
    "ones-to-tens-to-hundreds"
  );
  assert.deepEqual(
    kpPlaceValueAdditionTrace.states.map((state) => ({
      stage: state.stage,
      settled: state.settledResultIds,
      carries: state.visibleCarryIds,
      activeTotal: state.activeColumnDigitTotal,
      resolved: state.resolvedExactValue
    })),
    [
      {
        stage: "established",
        settled: [],
        carries: [],
        activeTotal: null,
        resolved: 0n
      },
      {
        stage: "ones-evaluated",
        settled: [],
        carries: [],
        activeTotal: 14,
        resolved: 0n
      },
      {
        stage: "ones-exchanged",
        settled: ["result.ones"],
        carries: ["carry.tens"],
        activeTotal: null,
        resolved: 4n
      },
      {
        stage: "tens-evaluated",
        settled: ["result.ones"],
        carries: ["carry.tens"],
        activeTotal: 13,
        resolved: 4n
      },
      {
        stage: "tens-exchanged",
        settled: ["result.ones", "result.tens"],
        carries: ["carry.hundreds"],
        activeTotal: null,
        resolved: 34n
      },
      {
        stage: "hundreds-evaluated",
        settled: ["result.ones", "result.tens", "result.hundreds"],
        carries: [],
        activeTotal: 4,
        resolved: 434n
      },
      {
        stage: "settled",
        settled: ["result.ones", "result.tens", "result.hundreds"],
        carries: [],
        activeTotal: null,
        resolved: 434n
      }
    ]
  );
});

test("trace beats preserve exact causal adjacency and reference order", () => {
  const { beats, states } = kpPlaceValueAdditionTrace;
  assert.equal(beats.length, 7);
  assert.deepEqual(
    beats.map(({ id, operation, dependencyBeatIds }) => ({
      id,
      operation,
      dependencyBeatIds
    })),
    [
      {
        id: "beat.place-value.establish",
        operation: "establish",
        dependencyBeatIds: []
      },
      {
        id: "beat.place-value.evaluate-ones",
        operation: "evaluate-column",
        dependencyBeatIds: ["beat.place-value.establish"]
      },
      {
        id: "beat.place-value.exchange-ones",
        operation: "exchange-adjacent-place",
        dependencyBeatIds: ["beat.place-value.evaluate-ones"]
      },
      {
        id: "beat.place-value.evaluate-tens",
        operation: "evaluate-column",
        dependencyBeatIds: ["beat.place-value.exchange-ones"]
      },
      {
        id: "beat.place-value.exchange-tens",
        operation: "exchange-adjacent-place",
        dependencyBeatIds: ["beat.place-value.evaluate-tens"]
      },
      {
        id: "beat.place-value.evaluate-hundreds",
        operation: "evaluate-column",
        dependencyBeatIds: ["beat.place-value.exchange-tens"]
      },
      {
        id: "beat.place-value.settle",
        operation: "settle-native-result",
        dependencyBeatIds: ["beat.place-value.evaluate-hundreds"]
      }
    ]
  );
  assert.deepEqual(
    beats.map(({ toStateId }) => toStateId),
    states.map(({ id }) => id)
  );
  assert.deepEqual(
    beats.slice(1).map(({ fromStateId }) => fromStateId),
    states.slice(0, -1).map(({ id }) => id)
  );
});

test("the final column uses the carried hundred and proves exact settlement", () => {
  const { hundreds } = kpPlaceValueAdditionTrace.proofs;
  assert.ok(isKpSettledColumnEvaluationCertificate(hundreds));
  assert.deepEqual(
    hundreds.contributors.map(({ id }) => id),
    [
      "carry.hundreds",
      "digit.first.hundreds",
      "digit.second.hundreds"
    ]
  );
  assert.equal(hundreds.digitTotal, 4);
  assert.equal(hundreds.result.id, "result.hundreds");
  assert.equal(hundreds.exactTotal, 400n);
  assert.deepEqual(kpPlaceValueAdditionTrace.verification, {
    sourceSumVerified: true,
    rightToLeftOrderVerified: true,
    carryIdentityVerified: true,
    exactResultVerified: true
  });
});

test("trace authority is sealed and every nested sequence is immutable", () => {
  assert.ok(isKpPlaceValueAdditionTrace(kpPlaceValueAdditionTrace));
  assert.ok(isKpPlaceValueAdditionTrace(createKpPlaceValueAdditionTrace()));
  assert.equal(
    isKpPlaceValueAdditionTrace({ ...kpPlaceValueAdditionTrace }),
    false
  );
  assert.ok(Object.isFrozen(kpPlaceValueAdditionTrace));
  assert.ok(Object.isFrozen(kpPlaceValueAdditionTrace.states));
  assert.ok(Object.isFrozen(kpPlaceValueAdditionTrace.beats));
  assert.ok(
    kpPlaceValueAdditionTrace.states.every((state) =>
      Object.isFrozen(state.settledResultIds) &&
      Object.isFrozen(state.visibleCarryIds)
    )
  );
  assert.ok(
    kpPlaceValueAdditionTrace.beats.every((beat) =>
      Object.isFrozen(beat.dependencyBeatIds) &&
      Object.isFrozen(beat.contributorIds) &&
      Object.isFrozen(beat.outputIds) &&
      Object.isFrozen(beat.proofIds)
    )
  );
});
