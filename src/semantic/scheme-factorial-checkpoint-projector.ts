import type { KpSchemeMachineState } from
  "./scheme-factorial-machine-state.ts";
import type { KpSchemePedagogicalScore } from
  "./scheme-factorial-pedagogical-score.ts";
import type { KpSchemeSourceDocument } from
  "./scheme-factorial-source-model.ts";
import type {
  KpSchemeTrace,
  KpSchemeTraceEvent,
  KpSchemeTraceSnapshot
} from "./scheme-factorial-trace.ts";

export type KpSchemeCheckpointMaterialKind =
  | "definition"
  | "invocation"
  | "active-expression"
  | "parameter-cell"
  | "waiting-shell"
  | "dormant-branch"
  | "value";

export interface KpSchemeCheckpointMaterial {
  readonly id: string;
  readonly kind: KpSchemeCheckpointMaterialKind;
  readonly state: "expanded" | "seed" | "active" | "waiting" | "dormant" |
    "settled";
  readonly sourceExpressionIds: readonly string[];
  readonly runtimeIds: readonly string[];
  readonly textEquivalent: string;
}

export interface KpSchemeSemanticCheckpoint {
  readonly id: string;
  readonly beatId: string | null;
  readonly eventId: string | null;
  readonly snapshotId: string;
  readonly caption: string;
  readonly definitionPresentation: "full" | "seed";
  readonly activeExpressionId: string | null;
  readonly material: readonly KpSchemeCheckpointMaterial[];
  readonly accessibleDescription: string;
}

export interface KpSchemeCheckpointProjection {
  readonly schemaVersion: "kp.scheme-factorial-checkpoints.v1";
  readonly id: "scheme-factorial.checkpoints.canonical-v1";
  readonly checkpoints: readonly KpSchemeSemanticCheckpoint[];
}

export function projectKpSchemeFactorialCheckpoints(input: {
  readonly document: KpSchemeSourceDocument;
  readonly trace: KpSchemeTrace;
  readonly score: KpSchemePedagogicalScore;
}): KpSchemeCheckpointProjection {
  const initial = checkpoint({
    document: input.document,
    trace: input.trace,
    snapshot: input.trace.snapshots[0]!,
    beatId: null,
    event: null,
    eventBoundary: -1,
    caption: "Read the definition and the call to factorial of 3.",
    definitionPresentation: "full"
  });
  const scored = input.score.beats.map((beat) => {
    const eventId = beat.eventIds.at(-1);
    const event = input.trace.events.find((candidate) =>
      candidate.id === eventId);
    if (event === undefined) {
      throw new Error(`Score beat ${beat.id} has no terminal trace event.`);
    }
    const snapshot = input.trace.snapshots[event.index + 1];
    if (snapshot === undefined) {
      throw new Error(`Score beat ${beat.id} has no terminal snapshot.`);
    }
    return checkpoint({
      document: input.document,
      trace: input.trace,
      snapshot,
      beatId: beat.id,
      event,
      eventBoundary: event.index,
      caption: beat.caption,
      definitionPresentation: "seed"
    });
  });
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-checkpoints.v1",
    id: "scheme-factorial.checkpoints.canonical-v1",
    checkpoints: Object.freeze([initial, ...scored])
  });
}

function checkpoint(input: {
  readonly document: KpSchemeSourceDocument;
  readonly trace: KpSchemeTrace;
  readonly snapshot: KpSchemeTraceSnapshot;
  readonly beatId: string | null;
  readonly event: KpSchemeTraceEvent | null;
  readonly eventBoundary: number;
  readonly caption: string;
  readonly definitionPresentation: "full" | "seed";
}): KpSchemeSemanticCheckpoint {
  const state = input.snapshot.state;
  const activeExpressionId = state.control.kind === "expression"
    ? state.control.expressionId
    : null;
  const material = [
    createMaterial(
      "material.definition",
      "definition",
      input.definitionPresentation === "full" ? "expanded" : "seed",
      [input.document.forms[0]!.id],
      [],
      input.definitionPresentation === "full"
        ? "The complete factorial definition is visible."
        : "The factorial definition remains as a callable function seed."
    ),
    createMaterial(
      "material.invocation",
      "invocation",
      "expanded",
      [input.document.forms[1]!.id],
      [],
      "The invocation factorial of 3 remains anchored."
    ),
    ...(activeExpressionId === null ? [] : [createMaterial(
      "material.active-expression",
      "active-expression",
      "active",
      [activeExpressionId],
      [],
      `Evaluation is currently at source expression ${activeExpressionId}.`
    )]),
    ...parameterMaterial(state),
    ...waitingMaterial(state),
    ...dormantMaterial(input.trace, input.eventBoundary),
    ...valueMaterial(state)
  ];
  const suffix = input.beatId?.split(".").at(-1) ?? "source";
  return Object.freeze({
    id: `scheme-factorial.checkpoint.${suffix}`,
    beatId: input.beatId,
    eventId: input.event?.id ?? null,
    snapshotId: input.snapshot.id,
    caption: input.caption,
    definitionPresentation: input.definitionPresentation,
    activeExpressionId,
    material: Object.freeze(material),
    accessibleDescription: `${input.caption} ${material.map(
      ({ textEquivalent }) => textEquivalent).join(" ")}`
  });
}

function parameterMaterial(
  state: KpSchemeMachineState
): readonly KpSchemeCheckpointMaterial[] {
  const environment = state.environments.find(({ id }) =>
    id === state.activeEnvironmentId);
  const binding = environment?.bindings.find(({ kind }) => kind === "parameter");
  if (binding === undefined || binding.binderOccurrenceId === null) return [];
  const value = state.values.find(({ id }) => id === binding.valueId);
  const text = value?.kind === "integer" ? String(value.exactInteger) : "a value";
  return [createMaterial(
    "material.parameter-cell",
    "parameter-cell",
    "active",
    [binding.binderOccurrenceId],
    [binding.id, binding.valueId],
    `The persistent parameter cell binds n to ${text}.`
  )];
}

function waitingMaterial(
  state: KpSchemeMachineState
): readonly KpSchemeCheckpointMaterial[] {
  const continuations = new Map(state.continuations.map((continuation) =>
    [continuation.id, continuation]));
  const waiting: KpSchemeCheckpointMaterial[] = [];
  const visited = new Set<string>();
  let id = state.activeContinuationId;
  while (id !== null) {
    if (visited.has(id)) throw new Error(`Cyclic checkpoint continuation ${id}.`);
    visited.add(id);
    const continuation = continuations.get(id);
    if (continuation === undefined) break;
    if (continuation.kind === "application-arguments" &&
        continuation.evaluatedArgumentValueIds.length === 1 &&
        continuation.nextArgumentIndex === 1) {
      waiting.push(createMaterial(
        `material.waiting-shell.${id}`,
        "waiting-shell",
        "waiting",
        [continuation.applicationExpressionId],
        [id, ...continuation.evaluatedArgumentValueIds],
        "A multiplication shell retains its first factor while recursion finishes."
      ));
    }
    id = continuation.parentContinuationId;
  }
  return waiting;
}

function dormantMaterial(
  trace: KpSchemeTrace,
  eventBoundary: number
): readonly KpSchemeCheckpointMaterial[] {
  const branch = [...trace.events.slice(0, eventBoundary + 1)]
    .reverse()
    .find((event) => event.kind === "branch-selected");
  if (branch?.kind !== "branch-selected") return [];
  return [createMaterial(
    "material.dormant-branch",
    "dormant-branch",
    "dormant",
    [branch.dormantExpressionId],
    [branch.id],
    branch.branch === "consequent"
      ? "The recursive branch is dormant because the base case was selected."
      : "The base-case branch is dormant because recursive work was selected."
  )];
}

function valueMaterial(
  state: KpSchemeMachineState
): readonly KpSchemeCheckpointMaterial[] {
  if (state.control.kind === "expression") return [];
  const valueId = state.control.valueId;
  const value = state.values.find(({ id }) => id === valueId);
  if (value === undefined) return [];
  const text = value.kind === "integer"
    ? String(value.exactInteger)
    : value.kind === "boolean"
      ? String(value.value)
      : value.kind === "closure"
        ? value.name
        : value.name;
  return [createMaterial(
    "material.current-value",
    "value",
    "settled",
    value.originExpressionIds,
    [value.id],
    `The current exact value is ${text}.`
  )];
}

function createMaterial(
  id: string,
  kind: KpSchemeCheckpointMaterialKind,
  state: KpSchemeCheckpointMaterial["state"],
  sourceExpressionIds: readonly string[],
  runtimeIds: readonly string[],
  textEquivalent: string
): KpSchemeCheckpointMaterial {
  if (sourceExpressionIds.length === 0 || textEquivalent.trim().length === 0) {
    throw new Error(`Checkpoint material ${id} requires provenance and text.`);
  }
  return Object.freeze({
    id,
    kind,
    state,
    sourceExpressionIds: Object.freeze([...sourceExpressionIds]),
    runtimeIds: Object.freeze([...runtimeIds]),
    textEquivalent
  });
}
