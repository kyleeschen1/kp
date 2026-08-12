import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSchemeMachineState } from
  "../src/semantic/scheme-factorial-machine-state.ts";
import {
  createKpSchemeFactorialInitialState,
  evaluateKpSchemeAtomicControl
} from "../src/semantic/scheme-factorial-evaluator.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { kpSchemeSourceOccurrenceId } from
  "../src/semantic/scheme-factorial-source-model.ts";
import {
  defineKpSchemeTrace,
  kpSchemeTraceSnapshotId
} from "../src/semantic/scheme-factorial-trace.ts";

const document = parseKpSchemeFactorialSource();
const sourceId = (...address: number[]) =>
  kpSchemeSourceOccurrenceId(document.id, address);

test("seeds only trusted primitives and the top-level sequence", () => {
  const state = createKpSchemeFactorialInitialState(document);
  assert.deepEqual(state.values.map((value) =>
    value.kind === "primitive" ? value.name : value.kind), ["=", "*", "-"]);
  assert.deepEqual(state.environments[0]?.bindings.map(({ name }) => name),
    ["=", "*", "-"]);
  assert.deepEqual(state.control,
    { kind: "expression", expressionId: sourceId(0) });
  assert.equal(state.activeContinuationId,
    "scheme-factorial.continuation.sequence");
});

test("creates a recursive closure as data without binding it early", () => {
  const transition = evaluateKpSchemeAtomicControl({
    document,
    state: createKpSchemeFactorialInitialState(document),
    eventIndex: 0
  });
  assert.equal(transition.event.kind, "closure-created");
  const closure = transition.after.values.find(({ kind }) => kind === "closure");
  assert.equal(closure?.kind === "closure" ? closure.environmentId : null,
    "scheme-factorial.environment.global");
  assert.equal(transition.after.environments[0]?.bindings.some(({ name }) =>
    name === "factorial"), false);
  assert.equal(
    transition.after.continuations.at(-1)?.parentContinuationId,
    "scheme-factorial.continuation.sequence"
  );
  assertTransitionTrace(transition);
});

test("evaluates an integer into one source-provenanced exact value", () => {
  const initial = createKpSchemeFactorialInitialState(document);
  const state = defineKpSchemeMachineState(document, {
    ...initial,
    control: { kind: "expression", expressionId: sourceId(1, 1) },
    activeContinuationId: null,
    continuations: []
  });
  const transition = evaluateKpSchemeAtomicControl({
    document,
    state,
    eventIndex: 0
  });
  assert.equal(transition.event.kind, "literal-evaluated");
  const value = transition.after.values.at(-1);
  assert.deepEqual(value, {
    kind: "integer",
    id: "scheme-factorial.value.integer.000",
    exactInteger: 3,
    originExpressionIds: [sourceId(1, 1)]
  });
  assertTransitionTrace(transition);
});

test("resolves a symbol through lexical bindings without copying its value", () => {
  const initial = createKpSchemeFactorialInitialState(document);
  const state = defineKpSchemeMachineState(document, {
    ...initial,
    control: { kind: "expression", expressionId: sourceId(0, 2, 3, 0) },
    activeContinuationId: null,
    continuations: []
  });
  const transition = evaluateKpSchemeAtomicControl({
    document,
    state,
    eventIndex: 0
  });
  assert.equal(transition.event.kind, "symbol-resolved");
  assert.equal(transition.after.values.length, state.values.length);
  assert.deepEqual(transition.after.control, {
    kind: "value",
    valueId: "scheme-factorial.value.primitive.multiply"
  });
  assertTransitionTrace(transition);
});

test("rejects unbound identifiers and non-atomic application control", () => {
  const initial = createKpSchemeFactorialInitialState(document);
  const unbound = defineKpSchemeMachineState(document, {
    ...initial,
    control: { kind: "expression", expressionId: sourceId(0, 1, 1) },
    activeContinuationId: null,
    continuations: []
  });
  assert.throws(() => evaluateKpSchemeAtomicControl({
    document,
    state: unbound,
    eventIndex: 0
  }), /Unbound Scheme symbol n/);
  const application = defineKpSchemeMachineState(document, {
    ...initial,
    control: { kind: "expression", expressionId: sourceId(1) },
    activeContinuationId: null,
    continuations: []
  });
  assert.throws(() => evaluateKpSchemeAtomicControl({
    document,
    state: application,
    eventIndex: 0
  }), /cannot yet evaluate application/);
});

function assertTransitionTrace(
  transition: ReturnType<typeof evaluateKpSchemeAtomicControl>
): void {
  assert.doesNotThrow(() => defineKpSchemeTrace(document, {
    schemaVersion: "kp.scheme-trace.v1",
    documentId: document.id,
    initialSnapshotId: kpSchemeTraceSnapshotId(0),
    finalSnapshotId: kpSchemeTraceSnapshotId(1),
    snapshots: [
      { id: kpSchemeTraceSnapshotId(0), index: 0, state: transition.before },
      { id: kpSchemeTraceSnapshotId(1), index: 1, state: transition.after }
    ],
    events: [transition.event]
  }));
}
