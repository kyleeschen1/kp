import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSchemeFactorialInitialState,
  stepKpSchemeFactorialEvaluator,
  type KpSchemeEvaluatorTransition
} from "../src/semantic/scheme-factorial-evaluator.ts";
import type { KpSchemeMachineState } from
  "../src/semantic/scheme-factorial-machine-state.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import {
  defineKpSchemeTrace,
  kpSchemeTraceSnapshotId
} from "../src/semantic/scheme-factorial-trace.ts";

const document = parseKpSchemeFactorialSource();

test("evaluates factorial three through explicit descent and reverse returns", () => {
  const transitions = runFactorial();
  const final = transitions.at(-1)!.after;
  assert.equal(final.control.kind, "complete");
  if (final.control.kind !== "complete") return;
  assert.equal(integer(final, final.control.valueId), 6);

  const boundArguments = transitions.flatMap(({ event, after }) =>
    event.kind === "parameter-bound"
      ? [integer(after, event.argumentValueId)]
      : []);
  assert.deepEqual(boundArguments, [3, 2, 1, 0]);

  const branches = transitions.flatMap(({ event }) =>
    event.kind === "branch-selected" ? [event.branch] : []);
  assert.deepEqual(branches,
    ["alternative", "alternative", "alternative", "consequent"]);

  const suspended = transitions.filter(({ event }) =>
    event.kind === "call-suspended");
  const returned = transitions.filter(({ event }) =>
    event.kind === "call-returned");
  assert.equal(suspended.length, 3);
  assert.equal(returned.length, 4);

  const products = transitions.flatMap(({ event, after }) =>
    event.kind === "primitive-applied" && event.primitive === "*"
      ? [integer(after, event.resultValueId)]
      : []);
  assert.deepEqual(products, [1, 2, 6]);
  assert.doesNotThrow(() => defineTrace(transitions));
});

test("call boundaries preserve the exact returning value identity", () => {
  const transitions = runFactorial();
  for (const transition of transitions) {
    if (transition.event.kind !== "call-returned") continue;
    assert.deepEqual(transition.before.control, {
      kind: "value",
      valueId: transition.event.resultValueId
    });
    assert.deepEqual(transition.after.control, {
      kind: "value",
      valueId: transition.event.resultValueId
    });
    assert.equal(transition.event.inputValueIds[0],
      transition.event.resultValueId);
    assert.equal(transition.event.outputValueIds[0],
      transition.event.resultValueId);
  }
});

test("suspended multiplication remains pending while recursion descends", () => {
  const transitions = runFactorial();
  for (const transition of transitions) {
    if (transition.event.kind !== "call-suspended") continue;
    const event = transition.event;
    assert.deepEqual(transition.after.control, {
      kind: "expression",
      expressionId: event.pendingExpressionId
    });
    assert.equal(transition.after.activeContinuationId,
      event.continuationId);
    const waiting = transition.after.continuations.find(({ id }) =>
      id === event.continuationId);
    assert.equal(waiting?.kind, "application-arguments");
    if (waiting?.kind !== "application-arguments") continue;
    assert.equal(waiting.evaluatedArgumentValueIds.length, 1);
    assert.equal(waiting.nextArgumentIndex, 1);
  }
});

test("the complete recursive trace is deterministic and bounded", () => {
  const first = runFactorial();
  const second = runFactorial();
  assert.equal(JSON.stringify(defineTrace(first)),
    JSON.stringify(defineTrace(second)));
  assert.ok(first.length < 128);
  assert.equal(first.at(-1)?.event.kind, "evaluation-completed");
});

function runFactorial(): readonly KpSchemeEvaluatorTransition[] {
  let state = createKpSchemeFactorialInitialState(document);
  const transitions: KpSchemeEvaluatorTransition[] = [];
  for (let index = 0; index < 128; index += 1) {
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
    if (state.control.kind === "complete") return Object.freeze(transitions);
  }
  throw new Error("factorial evaluator exceeded its certified transition bound");
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

function integer(state: KpSchemeMachineState, valueId: string): number {
  const value = state.values.find(({ id }) => id === valueId);
  if (value?.kind !== "integer") {
    throw new Error(`expected exact integer ${valueId}`);
  }
  return value.exactInteger;
}
