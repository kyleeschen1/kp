import {
  collectKpSchemeSourceExpressions,
  type KpSchemeSourceDocument
} from "./scheme-factorial-source-model.ts";

export type KpSchemePrimitiveName = "=" | "*" | "-";

export type KpSchemeValue =
  | KpSchemeIntegerValue
  | KpSchemeBooleanValue
  | KpSchemePrimitiveValue
  | KpSchemeClosureValue;

interface KpSchemeValueBase {
  readonly id: string;
  readonly originExpressionIds: readonly string[];
}

export interface KpSchemeIntegerValue extends KpSchemeValueBase {
  readonly kind: "integer";
  readonly exactInteger: number;
}

export interface KpSchemeBooleanValue extends KpSchemeValueBase {
  readonly kind: "boolean";
  readonly value: boolean;
}

export interface KpSchemePrimitiveValue extends KpSchemeValueBase {
  readonly kind: "primitive";
  readonly name: KpSchemePrimitiveName;
}

export interface KpSchemeClosureValue extends KpSchemeValueBase {
  readonly kind: "closure";
  readonly name: "factorial";
  readonly parameterName: "n";
  readonly parameterOccurrenceId: string;
  readonly bodyExpressionId: string;
  readonly environmentId: string;
}

export interface KpSchemeEnvironmentBinding {
  readonly id: string;
  readonly name: string;
  readonly kind: "primitive" | "definition" | "parameter";
  readonly binderOccurrenceId: string | null;
  readonly valueId: string;
}

export interface KpSchemeEnvironment {
  readonly id: string;
  readonly parentEnvironmentId: string | null;
  readonly bindings: readonly KpSchemeEnvironmentBinding[];
}

interface KpSchemeContinuationBase {
  readonly id: string;
  readonly parentContinuationId: string | null;
}

export type KpSchemeContinuation =
  | KpSchemeSequenceContinuation
  | KpSchemeDefinitionContinuation
  | KpSchemeConditionalContinuation
  | KpSchemeApplicationOperatorContinuation
  | KpSchemeApplicationArgumentsContinuation
  | KpSchemeCallReturnContinuation;

export interface KpSchemeSequenceContinuation extends KpSchemeContinuationBase {
  readonly kind: "sequence";
  readonly remainingExpressionIds: readonly string[];
  readonly environmentId: string;
}

export interface KpSchemeDefinitionContinuation extends KpSchemeContinuationBase {
  readonly kind: "definition";
  readonly definitionExpressionId: string;
  readonly binderOccurrenceId: string;
  readonly bindingName: "factorial";
  readonly environmentId: string;
}

export interface KpSchemeConditionalContinuation extends KpSchemeContinuationBase {
  readonly kind: "conditional";
  readonly conditionalExpressionId: string;
  readonly predicateExpressionId: string;
  readonly consequentExpressionId: string;
  readonly alternativeExpressionId: string;
  readonly environmentId: string;
}

export interface KpSchemeApplicationOperatorContinuation
  extends KpSchemeContinuationBase {
  readonly kind: "application-operator";
  readonly applicationExpressionId: string;
  readonly argumentExpressionIds: readonly string[];
  readonly environmentId: string;
}

export interface KpSchemeApplicationArgumentsContinuation
  extends KpSchemeContinuationBase {
  readonly kind: "application-arguments";
  readonly applicationExpressionId: string;
  readonly operatorValueId: string;
  readonly argumentExpressionIds: readonly string[];
  readonly evaluatedArgumentValueIds: readonly string[];
  readonly nextArgumentIndex: number;
  readonly environmentId: string;
}

export interface KpSchemeCallReturnContinuation extends KpSchemeContinuationBase {
  readonly kind: "call-return";
  readonly applicationExpressionId: string;
  readonly calleeValueId: string;
  readonly callerEnvironmentId: string;
  readonly calleeEnvironmentId: string;
}

export type KpSchemeMachineControl =
  | { readonly kind: "expression"; readonly expressionId: string }
  | { readonly kind: "value"; readonly valueId: string }
  | { readonly kind: "complete"; readonly valueId: string };

export interface KpSchemeMachineState {
  readonly schemaVersion: "kp.scheme-machine-state.v1";
  readonly documentId: string;
  readonly control: KpSchemeMachineControl;
  readonly activeEnvironmentId: string;
  readonly activeContinuationId: string | null;
  readonly values: readonly KpSchemeValue[];
  readonly environments: readonly KpSchemeEnvironment[];
  readonly continuations: readonly KpSchemeContinuation[];
}

export interface KpSchemeMachineStateIssue {
  readonly path: string;
  readonly message: string;
}

export function defineKpSchemeMachineState(
  document: KpSchemeSourceDocument,
  input: KpSchemeMachineState
): KpSchemeMachineState {
  const state = freezeState(input);
  const issues = validateKpSchemeMachineState(document, state);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) =>
      `${path}: ${message}`).join("\n"));
  }
  return state;
}

export function validateKpSchemeMachineState(
  document: KpSchemeSourceDocument,
  state: KpSchemeMachineState
): readonly KpSchemeMachineStateIssue[] {
  const issues: KpSchemeMachineStateIssue[] = [];
  const sourceIds = new Set(
    collectKpSchemeSourceExpressions(document).map(({ id }) => id)
  );
  const values = indexUnique(state.values, "values", issues);
  const environments = indexUnique(state.environments, "environments", issues);
  const continuations = indexUnique(
    state.continuations,
    "continuations",
    issues
  );
  const allRuntimeIds = [
    ...state.values.map(({ id }) => id),
    ...state.environments.map(({ id }) => id),
    ...state.environments.flatMap(({ bindings }) => bindings.map(({ id }) => id)),
    ...state.continuations.map(({ id }) => id)
  ];
  if (new Set(allRuntimeIds).size !== allRuntimeIds.length) {
    issues.push(issue("state", "every runtime value, binding, environment, and continuation needs a distinct ID"));
  }
  if (state.schemaVersion !== "kp.scheme-machine-state.v1") {
    issues.push(issue("schemaVersion", "unsupported Scheme machine schema"));
  }
  if (state.documentId !== document.id) {
    issues.push(issue("documentId", "machine state must name its source document"));
  }

  state.values.forEach((value, index) => {
    const path = `values[${index}]`;
    if (value.originExpressionIds.length === 0 && value.kind !== "primitive") {
      issues.push(issue(`${path}.originExpressionIds`,
        "derived values require source provenance"));
    }
    value.originExpressionIds.forEach((id, originIndex) =>
      requireKnown(id, sourceIds, `${path}.originExpressionIds[${originIndex}]`,
        "source expression", issues));
    if (value.kind === "integer" && !Number.isSafeInteger(value.exactInteger)) {
      issues.push(issue(`${path}.exactInteger`, "integer values must be exact safe integers"));
    }
    if (value.kind === "closure") {
      requireKnown(value.parameterOccurrenceId, sourceIds,
        `${path}.parameterOccurrenceId`, "source expression", issues);
      requireKnown(value.bodyExpressionId, sourceIds,
        `${path}.bodyExpressionId`, "source expression", issues);
      requireKnown(value.environmentId, environments,
        `${path}.environmentId`, "environment", issues);
    }
  });

  state.environments.forEach((environment, index) => {
    const path = `environments[${index}]`;
    if (environment.parentEnvironmentId !== null) {
      requireKnown(environment.parentEnvironmentId, environments,
        `${path}.parentEnvironmentId`, "environment", issues);
    }
    const names = new Set<string>();
    environment.bindings.forEach((binding, bindingIndex) => {
      const bindingPath = `${path}.bindings[${bindingIndex}]`;
      if (names.has(binding.name)) {
        issues.push(issue(`${bindingPath}.name`,
          `duplicate binding ${binding.name} in one lexical environment`));
      }
      names.add(binding.name);
      requireKnown(binding.valueId, values, `${bindingPath}.valueId`, "value", issues);
      if (binding.binderOccurrenceId !== null) {
        requireKnown(binding.binderOccurrenceId, sourceIds,
          `${bindingPath}.binderOccurrenceId`, "source expression", issues);
      }
      if (binding.kind !== "primitive" && binding.binderOccurrenceId === null) {
        issues.push(issue(`${bindingPath}.binderOccurrenceId`,
          "source-defined bindings require a binder occurrence"));
      }
    });
  });
  detectParentCycle(state.environments, "environment", issues);

  state.continuations.forEach((continuation, index) => {
    validateContinuation({
      continuation,
      path: `continuations[${index}]`,
      sourceIds,
      values,
      environments,
      continuations,
      issues
    });
  });
  detectParentCycle(state.continuations, "continuation", issues);

  requireKnown(state.activeEnvironmentId, environments,
    "activeEnvironmentId", "environment", issues);
  if (state.activeContinuationId !== null) {
    requireKnown(state.activeContinuationId, continuations,
      "activeContinuationId", "continuation", issues);
  }
  if (state.control.kind === "expression") {
    requireKnown(state.control.expressionId, sourceIds,
      "control.expressionId", "source expression", issues);
  } else {
    requireKnown(state.control.valueId, values,
      "control.valueId", "value", issues);
    if (state.control.kind === "complete" && state.activeContinuationId !== null) {
      issues.push(issue("activeContinuationId",
        "complete control cannot retain pending work"));
    }
  }
  return Object.freeze(issues);
}

export function resolveKpSchemeEnvironmentBinding(
  state: KpSchemeMachineState,
  environmentId: string,
  name: string
): KpSchemeEnvironmentBinding | undefined {
  const environments = new Map(state.environments.map((environment) =>
    [environment.id, environment] as const));
  const visited = new Set<string>();
  let current = environments.get(environmentId);
  while (current !== undefined) {
    if (visited.has(current.id)) {
      throw new Error(`Cyclic Scheme environment chain at ${current.id}.`);
    }
    visited.add(current.id);
    const binding = current.bindings.find((candidate) => candidate.name === name);
    if (binding !== undefined) return binding;
    current = current.parentEnvironmentId === null
      ? undefined
      : environments.get(current.parentEnvironmentId);
  }
  return undefined;
}

function validateContinuation(input: {
  readonly continuation: KpSchemeContinuation;
  readonly path: string;
  readonly sourceIds: ReadonlySet<string>;
  readonly values: ReadonlyMap<string, KpSchemeValue>;
  readonly environments: ReadonlyMap<string, KpSchemeEnvironment>;
  readonly continuations: ReadonlyMap<string, KpSchemeContinuation>;
  readonly issues: KpSchemeMachineStateIssue[];
}): void {
  const { continuation, path, sourceIds, values, environments, continuations,
    issues } = input;
  if (continuation.parentContinuationId !== null) {
    requireKnown(continuation.parentContinuationId, continuations,
      `${path}.parentContinuationId`, "continuation", issues);
  }
  if (continuation.kind === "sequence") {
    requireSources(continuation.remainingExpressionIds,
      `${path}.remainingExpressionIds`, sourceIds, issues);
    requireKnown(continuation.environmentId, environments,
      `${path}.environmentId`, "environment", issues);
    return;
  }
  if (continuation.kind === "definition") {
    requireSource(continuation.definitionExpressionId,
      `${path}.definitionExpressionId`, sourceIds, issues);
    requireSource(continuation.binderOccurrenceId,
      `${path}.binderOccurrenceId`, sourceIds, issues);
    requireKnown(continuation.environmentId, environments,
      `${path}.environmentId`, "environment", issues);
    return;
  }
  if (continuation.kind === "conditional") {
    requireSource(continuation.conditionalExpressionId,
      `${path}.conditionalExpressionId`, sourceIds, issues);
    requireSource(continuation.predicateExpressionId,
      `${path}.predicateExpressionId`, sourceIds, issues);
    requireSource(continuation.consequentExpressionId,
      `${path}.consequentExpressionId`, sourceIds, issues);
    requireSource(continuation.alternativeExpressionId,
      `${path}.alternativeExpressionId`, sourceIds, issues);
    requireKnown(continuation.environmentId, environments,
      `${path}.environmentId`, "environment", issues);
    return;
  }
  if (continuation.kind === "application-operator") {
    requireSource(continuation.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSources(continuation.argumentExpressionIds,
      `${path}.argumentExpressionIds`, sourceIds, issues);
    requireKnown(continuation.environmentId, environments,
      `${path}.environmentId`, "environment", issues);
    return;
  }
  if (continuation.kind === "application-arguments") {
    requireSource(continuation.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSources(continuation.argumentExpressionIds,
      `${path}.argumentExpressionIds`, sourceIds, issues);
    requireKnown(continuation.operatorValueId, values,
      `${path}.operatorValueId`, "value", issues);
    continuation.evaluatedArgumentValueIds.forEach((id, index) =>
      requireKnown(id, values, `${path}.evaluatedArgumentValueIds[${index}]`,
        "value", issues));
    if (continuation.nextArgumentIndex !==
        continuation.evaluatedArgumentValueIds.length ||
        continuation.nextArgumentIndex < 0 ||
        continuation.nextArgumentIndex >= continuation.argumentExpressionIds.length) {
      issues.push(issue(`${path}.nextArgumentIndex`,
        "next argument must follow the evaluated prefix and remain in range"));
    }
    requireKnown(continuation.environmentId, environments,
      `${path}.environmentId`, "environment", issues);
    return;
  }
  requireSource(continuation.applicationExpressionId,
    `${path}.applicationExpressionId`, sourceIds, issues);
  requireKnown(continuation.calleeValueId, values,
    `${path}.calleeValueId`, "value", issues);
  requireKnown(continuation.callerEnvironmentId, environments,
    `${path}.callerEnvironmentId`, "environment", issues);
  requireKnown(continuation.calleeEnvironmentId, environments,
    `${path}.calleeEnvironmentId`, "environment", issues);
}

function requireSources(
  ids: readonly string[],
  path: string,
  sourceIds: ReadonlySet<string>,
  issues: KpSchemeMachineStateIssue[]
): void {
  ids.forEach((id, index) => requireSource(id, `${path}[${index}]`, sourceIds,
    issues));
}

function requireSource(
  id: string,
  path: string,
  sourceIds: ReadonlySet<string>,
  issues: KpSchemeMachineStateIssue[]
): void {
  requireKnown(id, sourceIds, path, "source expression", issues);
}

function indexUnique<Value extends { readonly id: string }>(
  values: readonly Value[],
  path: string,
  issues: KpSchemeMachineStateIssue[]
): ReadonlyMap<string, Value> {
  const index = new Map<string, Value>();
  values.forEach((value, position) => {
    if (value.id.trim().length === 0) {
      issues.push(issue(`${path}[${position}].id`, "runtime ID must not be empty"));
    } else if (index.has(value.id)) {
      issues.push(issue(`${path}[${position}].id`, `duplicate ID ${value.id}`));
    }
    index.set(value.id, value);
  });
  return index;
}

function requireKnown(
  id: string,
  values: ReadonlySet<string> | ReadonlyMap<string, unknown>,
  path: string,
  label: string,
  issues: KpSchemeMachineStateIssue[]
): void {
  if (!values.has(id)) issues.push(issue(path, `unknown ${label} ${id}`));
}

function detectParentCycle(
  values: readonly {
    readonly id: string;
    readonly parentEnvironmentId?: string | null;
    readonly parentContinuationId?: string | null;
  }[],
  label: "environment" | "continuation",
  issues: KpSchemeMachineStateIssue[]
): void {
  const index = new Map(values.map((value) => [value.id, value] as const));
  values.forEach((value, position) => {
    const visited = new Set<string>();
    let current: typeof value | undefined = value;
    while (current !== undefined) {
      if (visited.has(current.id)) {
        issues.push(issue(`${label}s[${position}]`, `cyclic ${label} parent chain`));
        return;
      }
      visited.add(current.id);
      const parentId: string | null | undefined = label === "environment"
        ? current.parentEnvironmentId
        : current.parentContinuationId;
      current = parentId === null || parentId === undefined
        ? undefined
        : index.get(parentId);
    }
  });
}

function freezeState(input: KpSchemeMachineState): KpSchemeMachineState {
  return Object.freeze({
    ...input,
    control: Object.freeze({ ...input.control }),
    values: Object.freeze(input.values.map((value) => Object.freeze({
      ...value,
      originExpressionIds: Object.freeze([...value.originExpressionIds])
    }))),
    environments: Object.freeze(input.environments.map((environment) =>
      Object.freeze({
        ...environment,
        bindings: Object.freeze(environment.bindings.map((binding) =>
          Object.freeze({ ...binding })))
      }))),
    continuations: Object.freeze(input.continuations.map((continuation) =>
      Object.freeze({
        ...continuation,
        ...continuationArrays(continuation)
      })))
  });
}

function continuationArrays(
  continuation: KpSchemeContinuation
): Record<string, readonly string[]> {
  if (continuation.kind === "sequence") {
    return { remainingExpressionIds: Object.freeze([
      ...continuation.remainingExpressionIds
    ]) };
  }
  if (continuation.kind === "application-operator") {
    return { argumentExpressionIds: Object.freeze([
      ...continuation.argumentExpressionIds
    ]) };
  }
  if (continuation.kind === "application-arguments") {
    return {
      argumentExpressionIds: Object.freeze([...continuation.argumentExpressionIds]),
      evaluatedArgumentValueIds: Object.freeze([
        ...continuation.evaluatedArgumentValueIds
      ])
    };
  }
  return {};
}

function issue(path: string, message: string): KpSchemeMachineStateIssue {
  return Object.freeze({ path, message });
}
