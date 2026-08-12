import {
  defineKpSchemeMachineState,
  validateKpSchemeMachineState,
  type KpSchemeMachineState,
  type KpSchemePrimitiveName
} from "./scheme-factorial-machine-state.ts";
import {
  collectKpSchemeSourceExpressions,
  type KpSchemeSourceDocument
} from "./scheme-factorial-source-model.ts";

interface KpSchemeTraceEventBase {
  readonly id: string;
  readonly index: number;
  readonly beforeSnapshotId: string;
  readonly afterSnapshotId: string;
  readonly causedByEventIds: readonly string[];
  readonly sourceExpressionIds: readonly string[];
  readonly inputValueIds: readonly string[];
  readonly outputValueIds: readonly string[];
}

export type KpSchemeTraceEvent =
  | KpSchemeLiteralEvaluatedEvent
  | KpSchemeSymbolResolvedEvent
  | KpSchemeClosureCreatedEvent
  | KpSchemeDefinitionBoundEvent
  | KpSchemeApplicationEnteredEvent
  | KpSchemeApplicationOperatorResolvedEvent
  | KpSchemeApplicationArgumentAcceptedEvent
  | KpSchemeParameterBoundEvent
  | KpSchemeConditionalEnteredEvent
  | KpSchemeBranchSelectedEvent
  | KpSchemePrimitiveAppliedEvent
  | KpSchemeCallSuspendedEvent
  | KpSchemeCallReturnedEvent
  | KpSchemeEvaluationCompletedEvent;

export interface KpSchemeLiteralEvaluatedEvent extends KpSchemeTraceEventBase {
  readonly kind: "literal-evaluated";
  readonly expressionId: string;
  readonly valueId: string;
}

export interface KpSchemeSymbolResolvedEvent extends KpSchemeTraceEventBase {
  readonly kind: "symbol-resolved";
  readonly occurrenceId: string;
  readonly environmentId: string;
  readonly bindingId: string;
  readonly valueId: string;
}

export interface KpSchemeClosureCreatedEvent extends KpSchemeTraceEventBase {
  readonly kind: "closure-created";
  readonly definitionExpressionId: string;
  readonly closureValueId: string;
  readonly environmentId: string;
}

export interface KpSchemeDefinitionBoundEvent extends KpSchemeTraceEventBase {
  readonly kind: "definition-bound";
  readonly definitionExpressionId: string;
  readonly binderOccurrenceId: string;
  readonly environmentId: string;
  readonly bindingId: string;
  readonly valueId: string;
}

export interface KpSchemeApplicationEnteredEvent extends KpSchemeTraceEventBase {
  readonly kind: "application-entered";
  readonly applicationExpressionId: string;
  readonly operatorExpressionId: string;
  readonly argumentExpressionIds: readonly string[];
  readonly continuationId: string;
}

export interface KpSchemeApplicationOperatorResolvedEvent
  extends KpSchemeTraceEventBase {
  readonly kind: "application-operator-resolved";
  readonly applicationExpressionId: string;
  readonly operatorValueId: string;
  readonly firstArgumentExpressionId: string;
  readonly continuationId: string;
}

export interface KpSchemeApplicationArgumentAcceptedEvent
  extends KpSchemeTraceEventBase {
  readonly kind: "application-argument-accepted";
  readonly applicationExpressionId: string;
  readonly argumentExpressionId: string;
  readonly argumentValueId: string;
  readonly argumentIndex: number;
  readonly nextArgumentExpressionId: string | null;
  readonly continuationId: string;
}

export interface KpSchemeParameterBoundEvent extends KpSchemeTraceEventBase {
  readonly kind: "parameter-bound";
  readonly applicationExpressionId: string;
  readonly parameterOccurrenceId: string;
  readonly argumentExpressionId: string;
  readonly argumentValueId: string;
  readonly calleeEnvironmentId: string;
  readonly bindingId: string;
}

export interface KpSchemeConditionalEnteredEvent extends KpSchemeTraceEventBase {
  readonly kind: "conditional-entered";
  readonly conditionalExpressionId: string;
  readonly predicateExpressionId: string;
  readonly continuationId: string;
}

export interface KpSchemeBranchSelectedEvent extends KpSchemeTraceEventBase {
  readonly kind: "branch-selected";
  readonly conditionalExpressionId: string;
  readonly predicateValueId: string;
  readonly branch: "consequent" | "alternative";
  readonly selectedExpressionId: string;
  readonly dormantExpressionId: string;
}

export interface KpSchemePrimitiveAppliedEvent extends KpSchemeTraceEventBase {
  readonly kind: "primitive-applied";
  readonly applicationExpressionId: string;
  readonly primitive: KpSchemePrimitiveName;
  readonly argumentValueIds: readonly string[];
  readonly resultValueId: string;
}

export interface KpSchemeCallSuspendedEvent extends KpSchemeTraceEventBase {
  readonly kind: "call-suspended";
  readonly applicationExpressionId: string;
  readonly continuationId: string;
  readonly pendingExpressionId: string;
}

export interface KpSchemeCallReturnedEvent extends KpSchemeTraceEventBase {
  readonly kind: "call-returned";
  readonly applicationExpressionId: string;
  readonly continuationId: string;
  readonly resultValueId: string;
}

export interface KpSchemeEvaluationCompletedEvent extends KpSchemeTraceEventBase {
  readonly kind: "evaluation-completed";
  readonly resultValueId: string;
}

export interface KpSchemeTraceSnapshot {
  readonly id: string;
  readonly index: number;
  readonly state: KpSchemeMachineState;
}

export interface KpSchemeTrace {
  readonly schemaVersion: "kp.scheme-trace.v1";
  readonly documentId: string;
  readonly initialSnapshotId: string;
  readonly finalSnapshotId: string;
  readonly snapshots: readonly KpSchemeTraceSnapshot[];
  readonly events: readonly KpSchemeTraceEvent[];
}

export interface KpSchemeTraceIssue {
  readonly path: string;
  readonly message: string;
}

export function kpSchemeTraceSnapshotId(index: number): string {
  requireIndex(index);
  return `scheme-factorial.snapshot.${String(index).padStart(3, "0")}`;
}

export function kpSchemeTraceEventId(index: number): string {
  requireIndex(index);
  return `scheme-factorial.event.${String(index).padStart(3, "0")}`;
}

export function defineKpSchemeTrace(
  document: KpSchemeSourceDocument,
  input: KpSchemeTrace
): KpSchemeTrace {
  const trace = freezeTrace(document, input);
  const issues = validateKpSchemeTrace(document, trace);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) =>
      `${path}: ${message}`).join("\n"));
  }
  return trace;
}

export function validateKpSchemeTrace(
  document: KpSchemeSourceDocument,
  trace: KpSchemeTrace
): readonly KpSchemeTraceIssue[] {
  const issues: KpSchemeTraceIssue[] = [];
  const sourceIds = new Set(
    collectKpSchemeSourceExpressions(document).map(({ id }) => id)
  );
  if (trace.schemaVersion !== "kp.scheme-trace.v1") {
    issues.push(issue("schemaVersion", "unsupported Scheme trace schema"));
  }
  if (trace.documentId !== document.id) {
    issues.push(issue("documentId", "trace must name its source document"));
  }
  if (trace.snapshots.length !== trace.events.length + 1) {
    issues.push(issue("snapshots",
      "a linear trace requires exactly one more snapshot than event"));
  }
  if (trace.initialSnapshotId !== trace.snapshots[0]?.id) {
    issues.push(issue("initialSnapshotId", "initial snapshot must be first"));
  }
  if (trace.finalSnapshotId !== trace.snapshots.at(-1)?.id) {
    issues.push(issue("finalSnapshotId", "final snapshot must be last"));
  }

  const snapshotIds = new Set<string>();
  trace.snapshots.forEach((snapshot, index) => {
    const path = `snapshots[${index}]`;
    if (snapshot.id !== kpSchemeTraceSnapshotId(index) ||
        snapshot.index !== index) {
      issues.push(issue(path, "snapshot ID and index must match trace order"));
    }
    if (snapshotIds.has(snapshot.id)) {
      issues.push(issue(`${path}.id`, `duplicate snapshot ${snapshot.id}`));
    }
    snapshotIds.add(snapshot.id);
    validateKpSchemeMachineState(document, snapshot.state).forEach((stateIssue) =>
      issues.push(issue(`${path}.state.${stateIssue.path}`, stateIssue.message)));
  });

  const priorEventIds = new Set<string>();
  trace.events.forEach((event, index) => {
    const path = `events[${index}]`;
    if (event.id !== kpSchemeTraceEventId(index) || event.index !== index) {
      issues.push(issue(path, "event ID and index must match trace order"));
    }
    if (event.beforeSnapshotId !== trace.snapshots[index]?.id ||
        event.afterSnapshotId !== trace.snapshots[index + 1]?.id) {
      issues.push(issue(path, "event must connect adjacent ordered snapshots"));
    }
    if (new Set(event.causedByEventIds).size !== event.causedByEventIds.length) {
      issues.push(issue(`${path}.causedByEventIds`, "causal predecessors must be unique"));
    }
    event.causedByEventIds.forEach((id, causeIndex) => {
      if (!priorEventIds.has(id)) {
        issues.push(issue(`${path}.causedByEventIds[${causeIndex}]`,
          `causal predecessor ${id} must occur earlier`));
      }
    });
    validateEvent({
      event,
      path,
      before: trace.snapshots[index]?.state,
      after: trace.snapshots[index + 1]?.state,
      sourceIds,
      issues
    });
    priorEventIds.add(event.id);
  });
  return Object.freeze(issues);
}

function validateEvent(input: {
  readonly event: KpSchemeTraceEvent;
  readonly path: string;
  readonly before: KpSchemeMachineState | undefined;
  readonly after: KpSchemeMachineState | undefined;
  readonly sourceIds: ReadonlySet<string>;
  readonly issues: KpSchemeTraceIssue[];
}): void {
  const { event, path, before, after, sourceIds, issues } = input;
  if (before === undefined || after === undefined) return;
  const beforeValues = new Set(before.values.map(({ id }) => id));
  const afterValues = new Set(after.values.map(({ id }) => id));
  requireSources(event.sourceExpressionIds, `${path}.sourceExpressionIds`,
    sourceIds, issues);
  event.inputValueIds.forEach((id, index) => requireKnown(id, beforeValues,
    `${path}.inputValueIds[${index}]`, "input value", issues));
  event.outputValueIds.forEach((id, index) => requireKnown(id, afterValues,
    `${path}.outputValueIds[${index}]`, "output value", issues));
  const afterEnvironments = new Set(after.environments.map(({ id }) => id));
  const afterBindings = new Set(after.environments.flatMap(({ bindings }) =>
    bindings.map(({ id }) => id)));
  const beforeContinuations = new Set(before.continuations.map(({ id }) => id));
  const afterContinuations = new Set(after.continuations.map(({ id }) => id));

  if (event.kind === "literal-evaluated") {
    requireSource(event.expressionId, `${path}.expressionId`, sourceIds, issues);
    requireKnown(event.valueId, afterValues, `${path}.valueId`, "value", issues);
  } else if (event.kind === "symbol-resolved") {
    requireSource(event.occurrenceId, `${path}.occurrenceId`, sourceIds, issues);
    requireKnown(event.environmentId, afterEnvironments,
      `${path}.environmentId`, "environment", issues);
    requireKnown(event.bindingId, afterBindings, `${path}.bindingId`, "binding",
      issues);
    requireKnown(event.valueId, afterValues, `${path}.valueId`, "value", issues);
  } else if (event.kind === "closure-created") {
    requireSource(event.definitionExpressionId,
      `${path}.definitionExpressionId`, sourceIds, issues);
    requireKnown(event.closureValueId, afterValues,
      `${path}.closureValueId`, "closure value", issues);
    requireKnown(event.environmentId, afterEnvironments,
      `${path}.environmentId`, "environment", issues);
  } else if (event.kind === "definition-bound") {
    requireSource(event.definitionExpressionId,
      `${path}.definitionExpressionId`, sourceIds, issues);
    requireSource(event.binderOccurrenceId,
      `${path}.binderOccurrenceId`, sourceIds, issues);
    requireKnown(event.environmentId, afterEnvironments,
      `${path}.environmentId`, "environment", issues);
    requireKnown(event.bindingId, afterBindings, `${path}.bindingId`, "binding",
      issues);
    requireKnown(event.valueId, afterValues, `${path}.valueId`, "value", issues);
  } else if (event.kind === "application-entered") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSource(event.operatorExpressionId,
      `${path}.operatorExpressionId`, sourceIds, issues);
    requireSources(event.argumentExpressionIds,
      `${path}.argumentExpressionIds`, sourceIds, issues);
    requireKnown(event.continuationId, afterContinuations,
      `${path}.continuationId`, "continuation", issues);
  } else if (event.kind === "application-operator-resolved") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSource(event.firstArgumentExpressionId,
      `${path}.firstArgumentExpressionId`, sourceIds, issues);
    requireKnown(event.operatorValueId, beforeValues,
      `${path}.operatorValueId`, "operator value", issues);
    requireKnown(event.continuationId, afterContinuations,
      `${path}.continuationId`, "continuation", issues);
  } else if (event.kind === "application-argument-accepted") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSource(event.argumentExpressionId,
      `${path}.argumentExpressionId`, sourceIds, issues);
    if (event.nextArgumentExpressionId !== null) {
      requireSource(event.nextArgumentExpressionId,
        `${path}.nextArgumentExpressionId`, sourceIds, issues);
    }
    requireKnown(event.argumentValueId, beforeValues,
      `${path}.argumentValueId`, "argument value", issues);
    requireKnown(event.continuationId, afterContinuations,
      `${path}.continuationId`, "continuation", issues);
    if (!Number.isSafeInteger(event.argumentIndex) || event.argumentIndex < 0) {
      issues.push(issue(`${path}.argumentIndex`,
        "argument index must be a non-negative safe integer"));
    }
  } else if (event.kind === "parameter-bound") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSource(event.parameterOccurrenceId,
      `${path}.parameterOccurrenceId`, sourceIds, issues);
    requireSource(event.argumentExpressionId,
      `${path}.argumentExpressionId`, sourceIds, issues);
    requireKnown(event.argumentValueId, beforeValues,
      `${path}.argumentValueId`, "argument value", issues);
    requireKnown(event.calleeEnvironmentId, afterEnvironments,
      `${path}.calleeEnvironmentId`, "callee environment", issues);
    requireKnown(event.bindingId, afterBindings, `${path}.bindingId`, "binding",
      issues);
  } else if (event.kind === "conditional-entered") {
    requireSource(event.conditionalExpressionId,
      `${path}.conditionalExpressionId`, sourceIds, issues);
    requireSource(event.predicateExpressionId,
      `${path}.predicateExpressionId`, sourceIds, issues);
    requireKnown(event.continuationId, afterContinuations,
      `${path}.continuationId`, "continuation", issues);
  } else if (event.kind === "branch-selected") {
    requireSource(event.conditionalExpressionId,
      `${path}.conditionalExpressionId`, sourceIds, issues);
    requireSource(event.selectedExpressionId,
      `${path}.selectedExpressionId`, sourceIds, issues);
    requireSource(event.dormantExpressionId,
      `${path}.dormantExpressionId`, sourceIds, issues);
    requireKnown(event.predicateValueId, beforeValues,
      `${path}.predicateValueId`, "predicate value", issues);
    if (event.selectedExpressionId === event.dormantExpressionId) {
      issues.push(issue(path, "selected and dormant branches must be distinct"));
    }
  } else if (event.kind === "primitive-applied") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    event.argumentValueIds.forEach((id, index) => requireKnown(id, beforeValues,
      `${path}.argumentValueIds[${index}]`, "argument value", issues));
    requireKnown(event.resultValueId, afterValues,
      `${path}.resultValueId`, "result value", issues);
  } else if (event.kind === "call-suspended") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireSource(event.pendingExpressionId,
      `${path}.pendingExpressionId`, sourceIds, issues);
    requireKnown(event.continuationId, afterContinuations,
      `${path}.continuationId`, "continuation", issues);
  } else if (event.kind === "call-returned") {
    requireSource(event.applicationExpressionId,
      `${path}.applicationExpressionId`, sourceIds, issues);
    requireKnown(event.continuationId, beforeContinuations,
      `${path}.continuationId`, "continuation", issues);
    requireKnown(event.resultValueId, afterValues,
      `${path}.resultValueId`, "result value", issues);
  } else {
    requireKnown(event.resultValueId, afterValues,
      `${path}.resultValueId`, "result value", issues);
    if (after.control.kind !== "complete" ||
        after.control.valueId !== event.resultValueId) {
      issues.push(issue(path,
        "evaluation-completed must settle the same final value"));
    }
  }
}

function freezeTrace(
  document: KpSchemeSourceDocument,
  input: KpSchemeTrace
): KpSchemeTrace {
  return Object.freeze({
    ...input,
    snapshots: Object.freeze(input.snapshots.map((snapshot) => Object.freeze({
      ...snapshot,
      state: defineKpSchemeMachineState(document, snapshot.state)
    }))),
    events: Object.freeze(input.events.map((event) => Object.freeze({
      ...event,
      causedByEventIds: Object.freeze([...event.causedByEventIds]),
      sourceExpressionIds: Object.freeze([...event.sourceExpressionIds]),
      inputValueIds: Object.freeze([...event.inputValueIds]),
      outputValueIds: Object.freeze([...event.outputValueIds]),
      ...eventArrays(event)
    })))
  });
}

function eventArrays(event: KpSchemeTraceEvent): Record<string, readonly string[]> {
  if (event.kind === "application-entered") {
    return { argumentExpressionIds: Object.freeze([...event.argumentExpressionIds]) };
  }
  if (event.kind === "primitive-applied") {
    return { argumentValueIds: Object.freeze([...event.argumentValueIds]) };
  }
  return {};
}

function requireSources(
  ids: readonly string[],
  path: string,
  sourceIds: ReadonlySet<string>,
  issues: KpSchemeTraceIssue[]
): void {
  ids.forEach((id, index) => requireSource(id, `${path}[${index}]`, sourceIds,
    issues));
}

function requireSource(
  id: string,
  path: string,
  sourceIds: ReadonlySet<string>,
  issues: KpSchemeTraceIssue[]
): void {
  requireKnown(id, sourceIds, path, "source expression", issues);
}

function requireKnown(
  id: string,
  values: ReadonlySet<string>,
  path: string,
  label: string,
  issues: KpSchemeTraceIssue[]
): void {
  if (!values.has(id)) issues.push(issue(path, `unknown ${label} ${id}`));
}

function requireIndex(index: number): void {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new Error("Scheme trace indices must be non-negative safe integers.");
  }
}

function issue(path: string, message: string): KpSchemeTraceIssue {
  return Object.freeze({ path, message });
}
