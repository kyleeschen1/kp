import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpSchemeMachineState,
  resolveKpSchemeEnvironmentBinding,
  validateKpSchemeMachineState,
  type KpSchemeMachineState
} from "../src/semantic/scheme-factorial-machine-state.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { kpSchemeSourceOccurrenceId } from
  "../src/semantic/scheme-factorial-source-model.ts";

const document = parseKpSchemeFactorialSource();
const sourceId = (...address: number[]) =>
  kpSchemeSourceOccurrenceId(document.id, address);

function waitingState(): KpSchemeMachineState {
  return {
    schemaVersion: "kp.scheme-machine-state.v1",
    documentId: document.id,
    control: { kind: "expression", expressionId: sourceId(0, 2, 3, 2) },
    activeEnvironmentId: "environment.call.3",
    activeContinuationId: "continuation.product.3",
    values: [
      {
        kind: "primitive",
        id: "value.primitive.multiply",
        name: "*",
        originExpressionIds: [sourceId(0, 2, 3, 0)]
      },
      {
        kind: "integer",
        id: "value.integer.3",
        exactInteger: 3,
        originExpressionIds: [sourceId(1, 1)]
      },
      {
        kind: "closure",
        id: "value.closure.factorial",
        name: "factorial",
        parameterName: "n",
        parameterOccurrenceId: sourceId(0, 1, 1),
        bodyExpressionId: sourceId(0, 2),
        environmentId: "environment.global",
        originExpressionIds: [sourceId(0)]
      }
    ],
    environments: [
      {
        id: "environment.global",
        parentEnvironmentId: null,
        bindings: [
          {
            id: "binding.global.multiply",
            name: "*",
            kind: "primitive",
            binderOccurrenceId: null,
            valueId: "value.primitive.multiply"
          },
          {
            id: "binding.global.factorial",
            name: "factorial",
            kind: "definition",
            binderOccurrenceId: sourceId(0, 1, 0),
            valueId: "value.closure.factorial"
          }
        ]
      },
      {
        id: "environment.call.3",
        parentEnvironmentId: "environment.global",
        bindings: [{
          id: "binding.call.3.n",
          name: "n",
          kind: "parameter",
          binderOccurrenceId: sourceId(0, 1, 1),
          valueId: "value.integer.3"
        }]
      }
    ],
    continuations: [
      {
        kind: "call-return",
        id: "continuation.return.3",
        parentContinuationId: null,
        applicationExpressionId: sourceId(1),
        calleeValueId: "value.closure.factorial",
        callerEnvironmentId: "environment.global",
        calleeEnvironmentId: "environment.call.3"
      },
      {
        kind: "application-arguments",
        id: "continuation.product.3",
        parentContinuationId: "continuation.return.3",
        applicationExpressionId: sourceId(0, 2, 3),
        operatorValueId: "value.primitive.multiply",
        argumentExpressionIds: [sourceId(0, 2, 3, 1), sourceId(0, 2, 3, 2)],
        evaluatedArgumentValueIds: ["value.integer.3"],
        nextArgumentIndex: 1,
        environmentId: "environment.call.3"
      }
    ]
  };
}

test("models recursive unfinished work as an explicit continuation", () => {
  const state = defineKpSchemeMachineState(document, waitingState());
  const pending = state.continuations.find(({ id }) =>
    id === state.activeContinuationId);
  assert.equal(pending?.kind, "application-arguments");
  if (pending?.kind !== "application-arguments") return;
  assert.deepEqual(pending.evaluatedArgumentValueIds, ["value.integer.3"]);
  assert.equal(pending.nextArgumentIndex, 1);
  assert.equal(state.control.kind, "expression");
});

test("resolves parameter bindings before recursive global closure bindings", () => {
  const state = defineKpSchemeMachineState(document, waitingState());
  assert.equal(
    resolveKpSchemeEnvironmentBinding(state, "environment.call.3", "n")?.valueId,
    "value.integer.3"
  );
  assert.equal(
    resolveKpSchemeEnvironmentBinding(
      state,
      "environment.call.3",
      "factorial"
    )?.valueId,
    "value.closure.factorial"
  );
});

test("serializes recursive closure references without object cycles", () => {
  const state = defineKpSchemeMachineState(document, waitingState());
  const serialized = JSON.stringify(state);
  assert.equal(JSON.parse(serialized).values[2].environmentId,
    "environment.global");
  assert.equal(Object.isFrozen(state.environments[1]?.bindings), true);
  assert.equal(Object.isFrozen(state.continuations[1]), true);
  assert.equal(Object.isFrozen(
    state.continuations[1]?.kind === "application-arguments"
      ? state.continuations[1].argumentExpressionIds
      : []
  ), true);
});

test("rejects invalid lexical and continuation parent cycles", () => {
  const base = waitingState();
  const invalid: KpSchemeMachineState = {
    ...base,
    environments: base.environments.map((environment) => environment.id ===
      "environment.global" ? {
        ...environment,
        parentEnvironmentId: "environment.call.3"
      } : environment),
    continuations: base.continuations.map((continuation) => continuation.id ===
      "continuation.return.3" ? {
        ...continuation,
        parentContinuationId: "continuation.product.3"
      } : continuation)
  };
  const messages = validateKpSchemeMachineState(document, invalid).map(
    ({ message }) => message
  );
  assert.ok(messages.includes("cyclic environment parent chain"));
  assert.ok(messages.includes("cyclic continuation parent chain"));
});

test("rejects waiting work whose evaluated prefix and next argument disagree", () => {
  const base = waitingState();
  const invalid: KpSchemeMachineState = {
    ...base,
    continuations: base.continuations.map((continuation) =>
      continuation.kind === "application-arguments" ? {
        ...continuation,
        nextArgumentIndex: 0
      } : continuation)
  };
  assert.throws(() => defineKpSchemeMachineState(document, invalid),
    /next argument must follow the evaluated prefix/);
});

test("complete states cannot retain a continuation", () => {
  const base = waitingState();
  const invalid: KpSchemeMachineState = {
    ...base,
    control: { kind: "complete", valueId: "value.integer.3" }
  };
  assert.throws(() => defineKpSchemeMachineState(document, invalid),
    /complete control cannot retain pending work/);
});
