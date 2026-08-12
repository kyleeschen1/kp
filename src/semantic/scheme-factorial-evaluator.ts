import {
  defineKpSchemeMachineState,
  resolveKpSchemeEnvironmentBinding,
  type KpSchemeApplicationArgumentsContinuation,
  type KpSchemeApplicationOperatorContinuation,
  type KpSchemeCallReturnContinuation,
  type KpSchemeClosureValue,
  type KpSchemeConditionalContinuation,
  type KpSchemeContinuation,
  type KpSchemeDefinitionContinuation,
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

export interface KpSchemeEvaluatorStepInput {
  readonly document: KpSchemeSourceDocument;
  readonly state: KpSchemeMachineState;
  readonly eventIndex: number;
  readonly causedByEventIds?: readonly string[] | undefined;
}

export type KpSchemeTrustedPrimitiveResult =
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "integer"; readonly exactInteger: number };

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

export function stepKpSchemeFactorialEvaluator(
  input: KpSchemeEvaluatorStepInput
): KpSchemeEvaluatorTransition {
  if (input.state.control.kind === "expression") {
    const expression = expressionById(
      input.document,
      input.state.control.expressionId
    );
    if (expression.kind === "list" && expression.role === "application") {
      return enterApplication(input, expression);
    }
    if (expression.kind === "list" && expression.role === "conditional") {
      return enterConditional(input, expression);
    }
    return evaluateKpSchemeAtomicControl(input);
  }
  if (input.state.control.kind === "complete") {
    throw new Error("Completed Scheme evaluation has no next transition.");
  }
  if (input.state.activeContinuationId === null) {
    return completeEvaluation(input);
  }
  const continuation = requireActiveContinuation(input.state);
  if (continuation.kind === "definition") {
    return bindDefinition(input, continuation);
  }
  if (continuation.kind === "application-operator") {
    return scheduleFirstArgument(input, continuation);
  }
  if (continuation.kind === "application-arguments") {
    return acceptApplicationArgument(input, continuation);
  }
  if (continuation.kind === "conditional") {
    return selectConditionalBranch(input, continuation);
  }
  if (continuation.kind === "call-return") {
    return returnFromCall(input, continuation);
  }
  throw new Error(
    `Scheme evaluator slice cannot yet resume ${continuation.kind}.`
  );
}

function enterConditional(
  input: KpSchemeEvaluatorStepInput,
  expression: Extract<KpSchemeSourceExpression, { readonly kind: "list" }>
): KpSchemeEvaluatorTransition {
  const [keyword, predicate, consequent, alternative] = expression.children;
  if (keyword?.kind !== "atom" || keyword.lexeme !== "if" ||
      predicate === undefined || consequent === undefined ||
      alternative === undefined || expression.children.length !== 4) {
    throw new Error("Scheme conditional requires the certified if shape.");
  }
  const continuationId =
    `scheme-factorial.continuation.conditional.${pad(input.eventIndex)}`;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "expression", expressionId: predicate.id },
    activeContinuationId: continuationId,
    continuations: [...input.state.continuations, {
      kind: "conditional",
      id: continuationId,
      parentContinuationId: input.state.activeContinuationId,
      conditionalExpressionId: expression.id,
      predicateExpressionId: predicate.id,
      consequentExpressionId: consequent.id,
      alternativeExpressionId: alternative.id,
      environmentId: input.state.activeEnvironmentId
    }]
  });
  return transition(input, after, {
    ...eventBase(input, [expression.id, predicate.id], [], []),
    kind: "conditional-entered",
    conditionalExpressionId: expression.id,
    predicateExpressionId: predicate.id,
    continuationId
  });
}

function selectConditionalBranch(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeConditionalContinuation
): KpSchemeEvaluatorTransition {
  const predicateValueId = controlledValueId(input.state);
  const predicate = requireValue(input.state, predicateValueId);
  if (predicate.kind !== "boolean") {
    throw new Error("Factorial conditional predicate must produce a boolean.");
  }
  const branch = predicate.value ? "consequent" : "alternative";
  const selectedExpressionId = predicate.value
    ? continuation.consequentExpressionId
    : continuation.alternativeExpressionId;
  const dormantExpressionId = predicate.value
    ? continuation.alternativeExpressionId
    : continuation.consequentExpressionId;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "expression", expressionId: selectedExpressionId },
    activeEnvironmentId: continuation.environmentId,
    activeContinuationId: continuation.parentContinuationId
  });
  return transition(input, after, {
    ...eventBase(input, [
      continuation.conditionalExpressionId,
      continuation.predicateExpressionId,
      selectedExpressionId,
      dormantExpressionId
    ], [predicateValueId], [predicateValueId]),
    kind: "branch-selected",
    conditionalExpressionId: continuation.conditionalExpressionId,
    predicateValueId,
    branch,
    selectedExpressionId,
    dormantExpressionId
  });
}

function bindDefinition(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeDefinitionContinuation
): KpSchemeEvaluatorTransition {
  const valueId = controlledValueId(input.state);
  const value = requireValue(input.state, valueId);
  if (value.kind !== "closure" || value.name !== continuation.bindingName) {
    throw new Error("Factorial definition can bind only its certified closure.");
  }
  const parent = continuation.parentContinuationId === null
    ? undefined
    : requireContinuation(input.state, continuation.parentContinuationId);
  if (parent?.kind !== "sequence" || parent.remainingExpressionIds.length !== 1) {
    throw new Error("Factorial definition requires its certified program sequence.");
  }
  const bindingId = "scheme-factorial.binding.definition.factorial";
  const environments = input.state.environments.map((environment) =>
    environment.id === continuation.environmentId ? {
      ...environment,
      bindings: [...environment.bindings, {
        id: bindingId,
        name: continuation.bindingName,
        kind: "definition" as const,
        binderOccurrenceId: continuation.binderOccurrenceId,
        valueId
      }]
    } : environment);
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: {
      kind: "expression",
      expressionId: parent.remainingExpressionIds[0]!
    },
    activeEnvironmentId: parent.environmentId,
    activeContinuationId: parent.parentContinuationId,
    environments
  });
  return transition(input, after, {
    ...eventBase(input, [
      continuation.definitionExpressionId,
      continuation.binderOccurrenceId
    ], [valueId], [valueId]),
    kind: "definition-bound",
    definitionExpressionId: continuation.definitionExpressionId,
    binderOccurrenceId: continuation.binderOccurrenceId,
    environmentId: continuation.environmentId,
    bindingId,
    valueId
  });
}

function enterApplication(
  input: KpSchemeEvaluatorStepInput,
  expression: Extract<KpSchemeSourceExpression, { readonly kind: "list" }>
): KpSchemeEvaluatorTransition {
  const operator = expression.children[0];
  const arguments_ = expression.children.slice(1);
  if (operator === undefined || arguments_.length === 0) {
    throw new Error("Scheme applications require an operator and arguments.");
  }
  const continuationId =
    `scheme-factorial.continuation.application-operator.${pad(input.eventIndex)}`;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "expression", expressionId: operator.id },
    activeContinuationId: continuationId,
    continuations: [...input.state.continuations, {
      kind: "application-operator",
      id: continuationId,
      parentContinuationId: input.state.activeContinuationId,
      applicationExpressionId: expression.id,
      argumentExpressionIds: arguments_.map(({ id }) => id),
      environmentId: input.state.activeEnvironmentId
    }]
  });
  return transition(input, after, {
    ...eventBase(input, [
      expression.id,
      operator.id,
      ...arguments_.map(({ id }) => id)
    ], [], []),
    kind: "application-entered",
    applicationExpressionId: expression.id,
    operatorExpressionId: operator.id,
    argumentExpressionIds: arguments_.map(({ id }) => id),
    continuationId
  });
}

function scheduleFirstArgument(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeApplicationOperatorContinuation
): KpSchemeEvaluatorTransition {
  const operatorValueId = controlledValueId(input.state);
  requireValue(input.state, operatorValueId);
  const firstArgumentExpressionId = continuation.argumentExpressionIds[0];
  if (firstArgumentExpressionId === undefined) {
    throw new Error("Scheme application has no first argument.");
  }
  const continuationId =
    `scheme-factorial.continuation.application-arguments.${pad(input.eventIndex)}`;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "expression", expressionId: firstArgumentExpressionId },
    activeContinuationId: continuationId,
    continuations: [...input.state.continuations, {
      kind: "application-arguments",
      id: continuationId,
      parentContinuationId: continuation.parentContinuationId,
      applicationExpressionId: continuation.applicationExpressionId,
      operatorValueId,
      argumentExpressionIds: continuation.argumentExpressionIds,
      evaluatedArgumentValueIds: [],
      nextArgumentIndex: 0,
      environmentId: continuation.environmentId
    }]
  });
  return transition(input, after, {
    ...eventBase(input, [
      continuation.applicationExpressionId,
      firstArgumentExpressionId
    ], [operatorValueId], [operatorValueId]),
    kind: "application-operator-resolved",
    applicationExpressionId: continuation.applicationExpressionId,
    operatorValueId,
    firstArgumentExpressionId,
    continuationId
  });
}

function acceptApplicationArgument(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeApplicationArgumentsContinuation
): KpSchemeEvaluatorTransition {
  const argumentValueId = controlledValueId(input.state);
  requireValue(input.state, argumentValueId);
  const argumentIndex = continuation.nextArgumentIndex;
  const argumentExpressionId = continuation.argumentExpressionIds[argumentIndex];
  if (argumentExpressionId === undefined) {
    throw new Error("Scheme argument continuation points outside its application.");
  }
  const evaluatedArgumentValueIds = [
    ...continuation.evaluatedArgumentValueIds,
    argumentValueId
  ];
  const nextArgumentIndex = argumentIndex + 1;
  const nextArgumentExpressionId =
    continuation.argumentExpressionIds[nextArgumentIndex] ?? null;
  if (nextArgumentExpressionId !== null) {
    const updated = {
      ...continuation,
      evaluatedArgumentValueIds,
      nextArgumentIndex
    };
    const after = defineKpSchemeMachineState(input.document, {
      ...input.state,
      control: { kind: "expression", expressionId: nextArgumentExpressionId },
      continuations: replaceContinuation(input.state, updated)
    });
    const sourceExpressionIds = [
      continuation.applicationExpressionId,
      argumentExpressionId,
      nextArgumentExpressionId
    ];
    if (suspendsForNamedRecursiveCall(
      input.document,
      input.state,
      continuation,
      nextArgumentExpressionId
    )) {
      return transition(input, after, {
        ...eventBase(input, sourceExpressionIds,
          [argumentValueId], [argumentValueId]),
        kind: "call-suspended",
        applicationExpressionId: continuation.applicationExpressionId,
        continuationId: continuation.id,
        pendingExpressionId: nextArgumentExpressionId
      });
    }
    return transition(input, after, {
      ...eventBase(input, sourceExpressionIds,
        [argumentValueId], [argumentValueId]),
      kind: "application-argument-accepted",
      applicationExpressionId: continuation.applicationExpressionId,
      argumentExpressionId,
      argumentValueId,
      argumentIndex,
      nextArgumentExpressionId,
      continuationId: continuation.id
    });
  }
  const operator = requireValue(input.state, continuation.operatorValueId);
  if (operator.kind === "primitive") {
    return applyTrustedPrimitive(
      input,
      continuation,
      operator,
      evaluatedArgumentValueIds
    );
  }
  if (operator.kind !== "closure") {
    throw new Error("Scheme application operator must be primitive or closure.");
  }
  return bindClosureParameter(
    input,
    continuation,
    operator,
    argumentExpressionId,
    argumentValueId,
    evaluatedArgumentValueIds
  );
}

function returnFromCall(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeCallReturnContinuation
): KpSchemeEvaluatorTransition {
  const resultValueId = controlledValueId(input.state);
  const result = requireValue(input.state, resultValueId);
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "value", valueId: resultValueId },
    activeEnvironmentId: continuation.callerEnvironmentId,
    activeContinuationId: continuation.parentContinuationId
  });
  return transition(input, after, {
    ...eventBase(input, unique([
      continuation.applicationExpressionId,
      ...result.originExpressionIds
    ]), [resultValueId], [resultValueId]),
    kind: "call-returned",
    applicationExpressionId: continuation.applicationExpressionId,
    continuationId: continuation.id,
    resultValueId
  });
}

function completeEvaluation(
  input: KpSchemeEvaluatorStepInput
): KpSchemeEvaluatorTransition {
  const resultValueId = controlledValueId(input.state);
  const result = requireValue(input.state, resultValueId);
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "complete", valueId: resultValueId }
  });
  return transition(input, after, {
    ...eventBase(input, result.originExpressionIds,
      [resultValueId], [resultValueId]),
    kind: "evaluation-completed",
    resultValueId
  });
}

function suspendsForNamedRecursiveCall(
  document: KpSchemeSourceDocument,
  state: KpSchemeMachineState,
  continuation: KpSchemeApplicationArgumentsContinuation,
  pendingExpressionId: string
): boolean {
  const operator = requireValue(state, continuation.operatorValueId);
  const pending = expressionById(document, pendingExpressionId);
  if (operator.kind !== "primitive" || operator.name !== "*" ||
      pending.kind !== "list" || pending.role !== "application") {
    return false;
  }
  const pendingOperator = pending.children[0];
  return pendingOperator?.kind === "atom" &&
    pendingOperator.lexeme === "factorial";
}

function applyTrustedPrimitive(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeApplicationArgumentsContinuation,
  operator: Extract<KpSchemeValue, { readonly kind: "primitive" }>,
  argumentValueIds: readonly string[]
): KpSchemeEvaluatorTransition {
  const arguments_ = argumentValueIds.map((id) => requireValue(input.state, id));
  if (arguments_.some((value) => value.kind !== "integer")) {
    throw new Error(`Scheme primitive ${operator.name} requires exact integers.`);
  }
  const result = evaluateKpSchemeTrustedPrimitive(
    operator.name,
    arguments_.map((value) => value.kind === "integer"
      ? value.exactInteger
      : Number.NaN)
  );
  const suffix = pad(input.eventIndex);
  const resultValueId = result.kind === "boolean"
    ? `scheme-factorial.value.boolean.${suffix}`
    : `scheme-factorial.value.integer.${suffix}`;
  const originExpressionIds = unique([
    continuation.applicationExpressionId,
    ...arguments_.flatMap(({ originExpressionIds }) => originExpressionIds)
  ]);
  const resultValue = result.kind === "boolean" ? {
    kind: "boolean" as const,
    id: resultValueId,
    value: result.value,
    originExpressionIds
  } : {
    kind: "integer" as const,
    id: resultValueId,
    exactInteger: result.exactInteger,
    originExpressionIds
  };
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "value", valueId: resultValueId },
    activeEnvironmentId: continuation.environmentId,
    activeContinuationId: continuation.parentContinuationId,
    values: [...input.state.values, resultValue]
  });
  return transition(input, after, {
    ...eventBase(input, originExpressionIds,
      [operator.id, ...argumentValueIds], [resultValueId]),
    kind: "primitive-applied",
    applicationExpressionId: continuation.applicationExpressionId,
    primitive: operator.name,
    argumentValueIds,
    resultValueId
  });
}

export function evaluateKpSchemeTrustedPrimitive(
  primitive: KpSchemePrimitiveName,
  operands: readonly number[]
): KpSchemeTrustedPrimitiveResult {
  if (operands.length !== 2 || operands.some((operand) =>
    !Number.isSafeInteger(operand))) {
    throw new Error(`Scheme primitive ${primitive} requires two exact integers.`);
  }
  const [left, right] = operands as readonly [number, number];
  if (primitive === "=") {
    return Object.freeze({ kind: "boolean", value: left === right });
  }
  const exactInteger = primitive === "*" ? left * right : left - right;
  if (!Number.isSafeInteger(exactInteger)) {
    throw new Error(`Scheme primitive ${primitive} exceeded exact integer range.`);
  }
  return Object.freeze({ kind: "integer", exactInteger });
}

function bindClosureParameter(
  input: KpSchemeEvaluatorStepInput,
  continuation: KpSchemeApplicationArgumentsContinuation,
  closure: KpSchemeClosureValue,
  argumentExpressionId: string,
  argumentValueId: string,
  evaluatedArgumentValueIds: readonly string[]
): KpSchemeEvaluatorTransition {
  if (evaluatedArgumentValueIds.length !== 1) {
    throw new Error("Factorial closure requires exactly one argument.");
  }
  const suffix = pad(input.eventIndex);
  const environmentId = `scheme-factorial.environment.call.${suffix}`;
  const bindingId = `scheme-factorial.binding.parameter.n.${suffix}`;
  const continuationId = `scheme-factorial.continuation.call-return.${suffix}`;
  const after = defineKpSchemeMachineState(input.document, {
    ...input.state,
    control: { kind: "expression", expressionId: closure.bodyExpressionId },
    activeEnvironmentId: environmentId,
    activeContinuationId: continuationId,
    environments: [...input.state.environments, {
      id: environmentId,
      parentEnvironmentId: closure.environmentId,
      bindings: [{
        id: bindingId,
        name: closure.parameterName,
        kind: "parameter",
        binderOccurrenceId: closure.parameterOccurrenceId,
        valueId: argumentValueId
      }]
    }],
    continuations: [...input.state.continuations, {
      kind: "call-return",
      id: continuationId,
      parentContinuationId: continuation.parentContinuationId,
      applicationExpressionId: continuation.applicationExpressionId,
      calleeValueId: closure.id,
      callerEnvironmentId: continuation.environmentId,
      calleeEnvironmentId: environmentId
    }]
  });
  return transition(input, after, {
    ...eventBase(input, [
      continuation.applicationExpressionId,
      closure.parameterOccurrenceId,
      argumentExpressionId,
      closure.bodyExpressionId
    ], [closure.id, argumentValueId], [argumentValueId]),
    kind: "parameter-bound",
    applicationExpressionId: continuation.applicationExpressionId,
    parameterOccurrenceId: closure.parameterOccurrenceId,
    argumentExpressionId,
    argumentValueId,
    calleeEnvironmentId: environmentId,
    bindingId
  });
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

function controlledValueId(state: KpSchemeMachineState): string {
  if (state.control.kind !== "value") {
    throw new Error("Scheme continuation requires value control.");
  }
  return state.control.valueId;
}

function requireActiveContinuation(
  state: KpSchemeMachineState
): KpSchemeContinuation {
  if (state.activeContinuationId === null) {
    throw new Error("Scheme value has no continuation to receive it.");
  }
  return requireContinuation(state, state.activeContinuationId);
}

function requireContinuation(
  state: KpSchemeMachineState,
  id: string
): KpSchemeContinuation {
  const continuation = state.continuations.find((candidate) =>
    candidate.id === id);
  if (continuation === undefined) {
    throw new Error(`Unknown Scheme continuation ${id}.`);
  }
  return continuation;
}

function replaceContinuation(
  state: KpSchemeMachineState,
  replacement: KpSchemeContinuation
): readonly KpSchemeContinuation[] {
  return state.continuations.map((continuation) =>
    continuation.id === replacement.id ? replacement : continuation);
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

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}
