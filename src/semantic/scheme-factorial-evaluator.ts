import {
  defineKpSchemeMachineState,
  resolveKpSchemeEnvironmentBinding,
  type KpSchemeMachineState,
  type KpSchemePrimitiveName,
  type KpSchemeValue
} from "./scheme-factorial-machine-state.ts";
import {
  collectKpSchemeSourceExpressions,
  kpSchemeSourceOccurrenceId,
  type KpSchemeSourceDocument,
  type KpSchemeSourceExpression
} from "./scheme-factorial-source-model.ts";
import {
  kpSchemeTraceEventId,
  kpSchemeTraceSnapshotId,
  type KpSchemeTraceEvent
} from "./scheme-factorial-trace.ts";

export interface KpSchemeEvaluatorTransition {
  readonly before: KpSchemeMachineState;
  readonly after: KpSchemeMachineState;
  readonly event: KpSchemeTraceEvent;
}

const primitiveAddresses: Readonly<Record<KpSchemePrimitiveName,
  readonly number[]>> = Object.freeze({
    "=": Object.freeze([0, 2, 1, 0]),
    "*": Object.freeze([0, 2, 3, 0]),
    "-": Object.freeze([0, 2, 3, 2, 1, 0])
  });

export function createKpSchemeFactorialInitialState(
  document: KpSchemeSourceDocument
): KpSchemeMachineState {
  const values = (["=", "*", "-"] as const).map((name) => ({
    kind: "primitive" as const,
    id: primitiveValueId(name),
    name,
    originExpressionIds: [sourceId(document, primitiveAddresses[name])]
  }));
  return defineKpSchemeMachineState(document, {
    schemaVersion: "kp.scheme-machine-state.v1",
    documentId: document.id,
    control: { kind: "expression", expressionId: sourceId(document, [0]) },
    activeEnvironmentId: "scheme-factorial.environment.global",
    activeContinuationId: "scheme-factorial.continuation.sequence",
    values,
    environments: [{
      id: "scheme-factorial.environment.global",
      parentEnvironmentId: null,
      bindings: values.map((value) => ({
        id: `scheme-factorial.binding.primitive.${primitiveSlug(value.name)}`,
        name: value.name,
        kind: "primitive" as const,
        binderOccurrenceId: null,
        valueId: value.id
      }))
    }],
    continuations: [{
      kind: "sequence",
      id: "scheme-factorial.continuation.sequence",
      parentContinuationId: null,
      remainingExpressionIds: [sourceId(document, [1])],
      environmentId: "scheme-factorial.environment.global"
    }]
  });
}

export function evaluateKpSchemeAtomicControl(input: {
  readonly document: KpSchemeSourceDocument;
  readonly state: KpSchemeMachineState;
  readonly eventIndex: number;
  readonly causedByEventIds?: readonly string[] | undefined;
}): KpSchemeEvaluatorTransition {
  if (input.state.control.kind !== "expression") {
    throw new Error("Atomic Scheme evaluation requires expression control.");
  }
  const expression = expressionById(
    input.document,
    input.state.control.expressionId
  );
  if (expression.kind === "atom" && expression.atomKind === "integer") {
    return evaluateInteger(input, expression);
  }
  if (expression.kind === "atom") return resolveSymbol(input, expression);
  if (expression.role === "definition") return createClosure(input, expression);
  throw new Error(
    `Scheme evaluator slice cannot yet evaluate ${expression.role} ${expression.id}.`
  );
}

function evaluateInteger(
  input: Parameters<typeof evaluateKpSchemeAtomicControl>[0],
  expression: Extract<KpSchemeSourceExpression, { readonly kind: "atom" }>
): KpSchemeEvaluatorTransition {
  const valueId = `scheme-factorial.value.integer.${pad(input.eventIndex)}`;
  const value = Object.freeze({
    kind: "integer" as const,
    id: valueId,
    exactInteger: Number(expression.lexeme),
    originExpressionIds: Object.freeze([expression.id])
  });
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "value", valueId },
    values: [...input.state.values, value]
  });
  return transition(input, after, {
    ...eventBase(input, [expression.id], [], [valueId]),
    kind: "literal-evaluated",
    expressionId: expression.id,
    valueId
  });
}

function resolveSymbol(
  input: Parameters<typeof evaluateKpSchemeAtomicControl>[0],
  expression: Extract<KpSchemeSourceExpression, { readonly kind: "atom" }>
): KpSchemeEvaluatorTransition {
  const binding = resolveKpSchemeEnvironmentBinding(
    input.state,
    input.state.activeEnvironmentId,
    expression.lexeme
  );
  if (binding === undefined) {
    throw new Error(`Unbound Scheme symbol ${expression.lexeme} at ${expression.id}.`);
  }
  const value = requireValue(input.state, binding.valueId);
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "value", valueId: value.id }
  });
  return transition(input, after, {
    ...eventBase(input, [expression.id], [value.id], [value.id]),
    kind: "symbol-resolved",
    occurrenceId: expression.id,
    environmentId: input.state.activeEnvironmentId,
    bindingId: binding.id,
    valueId: value.id
  });
}

function createClosure(
  input: Parameters<typeof evaluateKpSchemeAtomicControl>[0],
  expression: Extract<KpSchemeSourceExpression, { readonly kind: "list" }>
): KpSchemeEvaluatorTransition {
  const signature = expression.children[1];
  const body = expression.children[2];
  if (signature?.kind !== "list" || signature.role !== "procedure-signature" ||
      signature.children[0]?.kind !== "atom" ||
      signature.children[1]?.kind !== "atom" || body === undefined) {
    throw new Error("Factorial closure requires the certified definition shape.");
  }
  const valueId = "scheme-factorial.value.closure.factorial";
  const closure = Object.freeze({
    kind: "closure" as const,
    id: valueId,
    name: "factorial" as const,
    parameterName: "n" as const,
    parameterOccurrenceId: signature.children[1].id,
    bodyExpressionId: body.id,
    environmentId: input.state.activeEnvironmentId,
    originExpressionIds: Object.freeze([expression.id])
  });
  const continuationId =
    `scheme-factorial.continuation.definition.${pad(input.eventIndex)}`;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "value", valueId },
    activeContinuationId: continuationId,
    values: [...input.state.values, closure],
    continuations: [...input.state.continuations, {
      kind: "definition",
      id: continuationId,
      parentContinuationId: input.state.activeContinuationId,
      definitionExpressionId: expression.id,
      binderOccurrenceId: signature.children[0].id,
      bindingName: "factorial",
      environmentId: input.state.activeEnvironmentId
    }]
  });
  return transition(input, after, {
    ...eventBase(input, [
      expression.id,
      signature.children[0].id,
      signature.children[1].id,
      body.id
    ], [], [valueId]),
    kind: "closure-created",
    definitionExpressionId: expression.id,
    closureValueId: valueId,
    environmentId: input.state.activeEnvironmentId
  });
}

function eventBase(
  input: Parameters<typeof evaluateKpSchemeAtomicControl>[0],
  sourceExpressionIds: readonly string[],
  inputValueIds: readonly string[],
  outputValueIds: readonly string[]
) {
  return {
    id: kpSchemeTraceEventId(input.eventIndex),
    index: input.eventIndex,
    beforeSnapshotId: kpSchemeTraceSnapshotId(input.eventIndex),
    afterSnapshotId: kpSchemeTraceSnapshotId(input.eventIndex + 1),
    causedByEventIds: Object.freeze([...(input.causedByEventIds ?? [])]),
    sourceExpressionIds: Object.freeze([...sourceExpressionIds]),
    inputValueIds: Object.freeze([...inputValueIds]),
    outputValueIds: Object.freeze([...outputValueIds])
  };
}

function transition(
  input: Parameters<typeof evaluateKpSchemeAtomicControl>[0],
  after: KpSchemeMachineState,
  event: KpSchemeTraceEvent
): KpSchemeEvaluatorTransition {
  return Object.freeze({ before: input.state, after, event: Object.freeze(event) });
}

function expressionById(
  document: KpSchemeSourceDocument,
  id: string
): KpSchemeSourceExpression {
  const expression = collectKpSchemeSourceExpressions(document).find(
    (candidate) => candidate.id === id
  );
  if (expression === undefined) throw new Error(`Unknown Scheme expression ${id}.`);
  return expression;
}

function sourceId(
  document: KpSchemeSourceDocument,
  address: readonly number[]
): string {
  return kpSchemeSourceOccurrenceId(document.id, address);
}

function requireValue(state: KpSchemeMachineState, id: string): KpSchemeValue {
  const value = state.values.find((candidate) => candidate.id === id);
  if (value === undefined) throw new Error(`Unknown Scheme value ${id}.`);
  return value;
}

function primitiveValueId(name: KpSchemePrimitiveName): string {
  return `scheme-factorial.value.primitive.${primitiveSlug(name)}`;
}

function primitiveSlug(name: KpSchemePrimitiveName): string {
  if (name === "=") return "equals";
  if (name === "*") return "multiply";
  return "subtract";
}

function pad(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("Scheme evaluator indices must be non-negative safe integers.");
  }
  return String(value).padStart(3, "0");
}
