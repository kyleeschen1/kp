import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSchemeFactorialInitialState,
  evaluateKpSchemeTrustedPrimitive,
  stepKpSchemeFactorialEvaluator,
  type KpSchemeEvaluatorTransition
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

test("evaluates the first equality and selects recursive work", () => {
  const transitions = runUntil((transition) =>
    transition.event.kind === "branch-selected");
  const equality = transitions.find(({ event }) =>
    event.kind === "primitive-applied" && event.primitive === "=")!;
  const equalityEvent = equality.event;
  assert.equal(equalityEvent.kind, "primitive-applied");
  if (equalityEvent.kind !== "primitive-applied") return;
  const result = equality.after.values.find(({ id }) =>
    id === equalityEvent.resultValueId);
  assert.deepEqual(result?.kind === "boolean" ? {
    value: result.value,
    origins: result.originExpressionIds
  } : null, {
    value: false,
    origins: [sourceId(0, 2, 1), sourceId(1, 1), sourceId(0, 2, 1, 2)]
  });
  assert.deepEqual(transitions.at(-1)!.after.control, {
    kind: "expression",
    expressionId: sourceId(0, 2, 3)
  });
  assert.doesNotThrow(() => defineTrace(transitions));
});

test("evaluates decrement locally before the recursive closure is applied", () => {
  const transitions = runUntil((transition) =>
    transition.event.kind === "primitive-applied" &&
    transition.event.primitive === "-");
  const decrement = transitions.at(-1)!;
  const decrementEvent = decrement.event;
  assert.equal(decrementEvent.kind, "primitive-applied");
  if (decrementEvent.kind !== "primitive-applied") return;
  const result = decrement.after.values.find(({ id }) =>
    id === decrementEvent.resultValueId);
  assert.equal(result?.kind === "integer" ? result.exactInteger : null, 2);
  assert.equal(decrement.after.continuations.find(({ id }) =>
    id === decrement.after.activeContinuationId)?.kind,
  "application-arguments");
  assert.doesNotThrow(() => defineTrace(transitions));
});

test("trusted primitive kernel implements only exact binary arithmetic", () => {
  assert.deepEqual(evaluateKpSchemeTrustedPrimitive("=", [2, 2]),
    { kind: "boolean", value: true });
  assert.deepEqual(evaluateKpSchemeTrustedPrimitive("=", [2, 3]),
    { kind: "boolean", value: false });
  assert.deepEqual(evaluateKpSchemeTrustedPrimitive("-", [3, 1]),
    { kind: "integer", exactInteger: 2 });
  assert.deepEqual(evaluateKpSchemeTrustedPrimitive("*", [3, 2]),
    { kind: "integer", exactInteger: 6 });
});

test("trusted primitives reject arity nonintegers and unsafe results", () => {
  assert.throws(() => evaluateKpSchemeTrustedPrimitive("*", [3]),
    /requires two exact integers/);
  assert.throws(() => evaluateKpSchemeTrustedPrimitive("-", [3, 0.5]),
    /requires two exact integers/);
  assert.throws(() => evaluateKpSchemeTrustedPrimitive("*", [
    Number.MAX_SAFE_INTEGER,
    2
  ]), /exceeded exact integer range/);
});

test("primitive result events retain both value lineage and source lineage", () => {
  const transition = runUntil((candidate) =>
    candidate.event.kind === "primitive-applied").at(-1)!;
  assert.equal(transition.event.kind, "primitive-applied");
  if (transition.event.kind !== "primitive-applied") return;
  assert.equal(transition.event.argumentValueIds.length, 2);
  assert.deepEqual(
    transition.event.inputValueIds.slice(1),
    transition.event.argumentValueIds
  );
  assert.ok(transition.event.sourceExpressionIds.includes(
    transition.event.applicationExpressionId
  ));
});

function runUntil(
  predicate: (transition: KpSchemeEvaluatorTransition) => boolean
): readonly KpSchemeEvaluatorTransition[] {
  let state = createKpSchemeFactorialInitialState(document);
  const transitions: KpSchemeEvaluatorTransition[] = [];
  for (let index = 0; index < 80; index += 1) {
    const transition = stepKpSchemeFactorialEvaluator({
      document,
      state,
      eventIndex: index,
      causedByEventIds: index === 0
        ? []
        : [`scheme-factorial.event.${String(index - 1).padStart(3, "0")}`]
    });
    transitions.push(transition);
    if (predicate(transition)) return transitions;
    state = transition.after;
  }
  throw new Error("evaluator did not reach requested primitive checkpoint");
}

function defineTrace(transitions: readonly KpSchemeEvaluatorTransition[]) {
  const states = [transitions[0]!.before,
    ...transitions.map(({ after }) => after)];
  return defineKpSchemeTrace(document, {
    schemaVersion: "kp.scheme-trace.v1",
    documentId: document.id,
    initialSnapshotId: kpSchemeTraceSnapshotId(0),
    finalSnapshotId: kpSchemeTraceSnapshotId(states.length - 1),
    snapshots: states.map((state, index) => ({
      id: kpSchemeTraceSnapshotId(index),
      index,
      state
    })),
    events: transitions.map(({ event }) => event)
  });
}
