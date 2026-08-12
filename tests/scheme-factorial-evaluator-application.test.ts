import assert from "node:assert/strict";
import test from "node:test";

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

test("composes definition application and parameter binding causally", () => {
  const transitions = runPrefix(7);
  assert.deepEqual(transitions.map(({ event }) => event.kind), [
    "closure-created",
    "definition-bound",
    "application-entered",
    "symbol-resolved",
    "application-operator-resolved",
    "literal-evaluated",
    "parameter-bound"
  ]);
  const final = transitions.at(-1)!.after;
  assert.deepEqual(final.control, {
    kind: "expression",
    expressionId: sourceId(0, 2)
  });
  assert.match(final.activeEnvironmentId, /environment\.call\.006$/);
  assert.equal(final.continuations.find(({ id }) =>
    id === final.activeContinuationId)?.kind, "call-return");
  assert.doesNotThrow(() => defineTrace(transitions));
});

test("binds the function only after closure creation", () => {
  const [created, bound] = runPrefix(2);
  assert.equal(created?.after.environments[0]?.bindings.some(({ name }) =>
    name === "factorial"), false);
  const binding = bound?.after.environments[0]?.bindings.find(({ name }) =>
    name === "factorial");
  assert.deepEqual(binding, {
    id: "scheme-factorial.binding.definition.factorial",
    name: "factorial",
    kind: "definition",
    binderOccurrenceId: sourceId(0, 1, 0),
    valueId: "scheme-factorial.value.closure.factorial"
  });
});

test("keeps one argument value identity across the parameter boundary", () => {
  const transitions = runPrefix(7);
  const literal = transitions[5]!.event;
  const parameter = transitions[6]!.event;
  assert.equal(literal.kind, "literal-evaluated");
  assert.equal(parameter.kind, "parameter-bound");
  if (literal.kind !== "literal-evaluated" ||
      parameter.kind !== "parameter-bound") return;
  assert.equal(parameter.argumentValueId, literal.valueId);
  const binding = transitions[6]!.after.environments
    .find(({ id }) => id === parameter.calleeEnvironmentId)
    ?.bindings[0];
  assert.equal(binding?.valueId, literal.valueId);
  assert.equal(transitions[6]!.after.values.filter(({ id }) =>
    id === literal.valueId).length, 1);
});

test("application events retain exact operator and argument source identities", () => {
  const transitions = runPrefix(5);
  const entered = transitions[2]!.event;
  const resolved = transitions[4]!.event;
  assert.equal(entered.kind, "application-entered");
  assert.equal(resolved.kind, "application-operator-resolved");
  if (entered.kind !== "application-entered" ||
      resolved.kind !== "application-operator-resolved") return;
  assert.equal(entered.applicationExpressionId, sourceId(1));
  assert.equal(entered.operatorExpressionId, sourceId(1, 0));
  assert.deepEqual(entered.argumentExpressionIds, [sourceId(1, 1)]);
  assert.equal(resolved.operatorValueId,
    "scheme-factorial.value.closure.factorial");
  assert.equal(resolved.firstArgumentExpressionId, sourceId(1, 1));
});

test("stepper refuses conditional and primitive work before their slices", () => {
  const state = runPrefix(7).at(-1)!.after;
  assert.throws(() => stepKpSchemeFactorialEvaluator({
    document,
    state,
    eventIndex: 7,
    causedByEventIds: ["scheme-factorial.event.006"]
  }), /cannot yet evaluate conditional/);
});

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
  const snapshots = [transitions[0]!.before,
    ...transitions.map(({ after }) => after)].map((state, index) => ({
      id: kpSchemeTraceSnapshotId(index),
      index,
      state
    }));
  return defineKpSchemeTrace(document, {
    schemaVersion: "kp.scheme-trace.v1",
    documentId: document.id,
    initialSnapshotId: snapshots[0]!.id,
    finalSnapshotId: snapshots.at(-1)!.id,
    snapshots,
    events: transitions.map(({ event }) => event)
  });
}
