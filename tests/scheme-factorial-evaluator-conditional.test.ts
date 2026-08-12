import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSchemeMachineState } from
  "../src/semantic/scheme-factorial-machine-state.ts";
import {
  createKpSchemeFactorialInitialState,
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

test("enters the conditional by evaluating only its predicate", () => {
  const transitions = runPrefix(8);
  const transition = transitions.at(-1)!;
  assert.equal(transition.event.kind, "conditional-entered");
  assert.deepEqual(transition.after.control, {
    kind: "expression",
    expressionId: sourceId(0, 2, 1)
  });
  const continuation = transition.after.continuations.find(({ id }) =>
    id === transition.after.activeContinuationId);
  assert.deepEqual(continuation?.kind === "conditional" ? {
    consequent: continuation.consequentExpressionId,
    alternative: continuation.alternativeExpressionId,
    parent: continuation.parentContinuationId
  } : null, {
    consequent: sourceId(0, 2, 2),
    alternative: sourceId(0, 2, 3),
    parent: "scheme-factorial.continuation.call-return.006"
  });
  assert.doesNotThrow(() => defineTrace(transitions));
});

test("false selects recursive work and leaves the base value dormant", () => {
  const transition = branchTransition(false);
  assert.equal(transition.event.kind, "branch-selected");
  if (transition.event.kind !== "branch-selected") return;
  assert.equal(transition.event.branch, "alternative");
  assert.equal(transition.event.selectedExpressionId, sourceId(0, 2, 3));
  assert.equal(transition.event.dormantExpressionId, sourceId(0, 2, 2));
  assert.deepEqual(transition.after.control, {
    kind: "expression",
    expressionId: sourceId(0, 2, 3)
  });
  assertSingleTransitionTrace(transition);
});

test("true selects the base value and leaves recursion dormant", () => {
  const transition = branchTransition(true);
  assert.equal(transition.event.kind, "branch-selected");
  if (transition.event.kind !== "branch-selected") return;
  assert.equal(transition.event.branch, "consequent");
  assert.equal(transition.event.selectedExpressionId, sourceId(0, 2, 2));
  assert.equal(transition.event.dormantExpressionId, sourceId(0, 2, 3));
  assertSingleTransitionTrace(transition);
});

test("branch selection restores the conditional parent continuation", () => {
  const transition = branchTransition(false);
  assert.equal(transition.after.activeContinuationId,
    "scheme-factorial.continuation.call-return.006");
  assert.equal(transition.after.activeEnvironmentId,
    "scheme-factorial.environment.call.006");
});

test("rejects a non-boolean predicate value", () => {
  const entered = runPrefix(8).at(-1)!.after;
  const integer = entered.values.find((value) =>
    value.kind === "integer" && value.exactInteger === 3)!;
  const invalid = defineKpSchemeMachineState(document, {
    ...entered,
    control: { kind: "value", valueId: integer.id }
  });
  assert.throws(() => stepKpSchemeFactorialEvaluator({
    document,
    state: invalid,
    eventIndex: 0
  }), /predicate must produce a boolean/);
});

function branchTransition(value: boolean): KpSchemeEvaluatorTransition {
  const entered = runPrefix(8).at(-1)!.after;
  const valueId = `scheme-factorial.value.boolean.test-${String(value)}`;
  const state = defineKpSchemeMachineState(document, {
    ...entered,
    control: { kind: "value", valueId },
    values: [...entered.values, {
      kind: "boolean",
      id: valueId,
      value,
      originExpressionIds: [sourceId(0, 2, 1)]
    }]
  });
  return stepKpSchemeFactorialEvaluator({
    document,
    state,
    eventIndex: 0
  });
}

function runPrefix(count: number): readonly KpSchemeEvaluatorTransition[] {
  let state = createKpSchemeFactorialInitialState(document);
  const transitions: KpSchemeEvaluatorTransition[] = [];
  for (let index = 0; index < count; index += 1) {
    const transition = stepKpSchemeFactorialEvaluator({
      document,
      state,
      eventIndex: index,
      causedByEventIds: index === 0
        ? []
        : [`scheme-factorial.event.${String(index - 1).padStart(3, "0")}`]
    });
    transitions.push(transition);
    state = transition.after;
  }
  return transitions;
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

function assertSingleTransitionTrace(
  transition: KpSchemeEvaluatorTransition
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
