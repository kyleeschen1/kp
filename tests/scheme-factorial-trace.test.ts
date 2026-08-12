import assert from "node:assert/strict";
import test from "node:test";

import type { KpSchemeMachineState } from
  "../src/semantic/scheme-factorial-machine-state.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { kpSchemeSourceOccurrenceId } from
  "../src/semantic/scheme-factorial-source-model.ts";
import {
  defineKpSchemeTrace,
  kpSchemeTraceEventId,
  kpSchemeTraceSnapshotId,
  validateKpSchemeTrace,
  type KpSchemeTrace
} from "../src/semantic/scheme-factorial-trace.ts";

const document = parseKpSchemeFactorialSource();
const literalId = kpSchemeSourceOccurrenceId(document.id, [1, 1]);

function state(control: KpSchemeMachineState["control"], withValue: boolean):
  KpSchemeMachineState {
  return {
    schemaVersion: "kp.scheme-machine-state.v1",
    documentId: document.id,
    control,
    activeEnvironmentId: "environment.global",
    activeContinuationId: null,
    values: withValue ? [{
      kind: "integer",
      id: "value.integer.initial-3",
      exactInteger: 3,
      originExpressionIds: [literalId]
    }] : [],
    environments: [{
      id: "environment.global",
      parentEnvironmentId: null,
      bindings: []
    }],
    continuations: []
  };
}

function tinyTrace(): KpSchemeTrace {
  return {
    schemaVersion: "kp.scheme-trace.v1",
    documentId: document.id,
    initialSnapshotId: kpSchemeTraceSnapshotId(0),
    finalSnapshotId: kpSchemeTraceSnapshotId(2),
    snapshots: [
      {
        id: kpSchemeTraceSnapshotId(0),
        index: 0,
        state: state({ kind: "expression", expressionId: literalId }, false)
      },
      {
        id: kpSchemeTraceSnapshotId(1),
        index: 1,
        state: state({ kind: "value", valueId: "value.integer.initial-3" }, true)
      },
      {
        id: kpSchemeTraceSnapshotId(2),
        index: 2,
        state: state({ kind: "complete", valueId: "value.integer.initial-3" }, true)
      }
    ],
    events: [
      {
        kind: "literal-evaluated",
        id: kpSchemeTraceEventId(0),
        index: 0,
        beforeSnapshotId: kpSchemeTraceSnapshotId(0),
        afterSnapshotId: kpSchemeTraceSnapshotId(1),
        causedByEventIds: [],
        sourceExpressionIds: [literalId],
        inputValueIds: [],
        outputValueIds: ["value.integer.initial-3"],
        expressionId: literalId,
        valueId: "value.integer.initial-3"
      },
      {
        kind: "evaluation-completed",
        id: kpSchemeTraceEventId(1),
        index: 1,
        beforeSnapshotId: kpSchemeTraceSnapshotId(1),
        afterSnapshotId: kpSchemeTraceSnapshotId(2),
        causedByEventIds: [kpSchemeTraceEventId(0)],
        sourceExpressionIds: [literalId],
        inputValueIds: ["value.integer.initial-3"],
        outputValueIds: ["value.integer.initial-3"],
        resultValueId: "value.integer.initial-3"
      }
    ]
  };
}

test("freezes a linear causal trace with exact before and after states", () => {
  const trace = defineKpSchemeTrace(document, tinyTrace());
  assert.equal(trace.snapshots.length, trace.events.length + 1);
  assert.equal(trace.events[1]?.causedByEventIds[0], trace.events[0]?.id);
  assert.equal(Object.isFrozen(trace), true);
  assert.equal(Object.isFrozen(trace.snapshots[1]?.state.values), true);
  assert.equal(Object.isFrozen(trace.events[1]?.causedByEventIds), true);
  assert.doesNotThrow(() => JSON.stringify(trace));
});

test("rejects events that skip snapshots or claim future causes", () => {
  const base = tinyTrace();
  const invalid: KpSchemeTrace = {
    ...base,
    events: [{
      ...base.events[0]!,
      afterSnapshotId: kpSchemeTraceSnapshotId(2),
      causedByEventIds: [kpSchemeTraceEventId(1)]
    }, base.events[1]!]
  };
  const messages = validateKpSchemeTrace(document, invalid).map(
    ({ message }) => message
  );
  assert.ok(messages.includes("event must connect adjacent ordered snapshots"));
  assert.ok(messages.some((message) => message.includes("must occur earlier")));
});

test("rejects output provenance absent from the after snapshot", () => {
  const base = tinyTrace();
  const invalid: KpSchemeTrace = {
    ...base,
    events: [{
      ...base.events[0]!,
      outputValueIds: ["value.missing"]
    }, base.events[1]!]
  };
  assert.ok(validateKpSchemeTrace(document, invalid).some(({ message }) =>
    message === "unknown output value value.missing"));
});

test("rejects completion that settles a different result identity", () => {
  const base = tinyTrace();
  const completed = base.events[1];
  if (completed?.kind !== "evaluation-completed") {
    throw new Error("test trace is missing its completion event");
  }
  const invalid: KpSchemeTrace = {
    ...base,
    events: [base.events[0]!, {
      ...completed,
      resultValueId: "value.missing"
    }]
  };
  const messages = validateKpSchemeTrace(document, invalid).map(
    ({ message }) => message
  );
  assert.ok(messages.includes("unknown result value value.missing"));
  assert.ok(messages.includes(
    "evaluation-completed must settle the same final value"
  ));
});

test("trace identity helpers reject negative and fractional indices", () => {
  assert.throws(() => kpSchemeTraceEventId(-1), /non-negative/);
  assert.throws(() => kpSchemeTraceSnapshotId(0.5), /non-negative/);
});
