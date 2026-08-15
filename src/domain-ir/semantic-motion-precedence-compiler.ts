import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1
} from "./semantic-motion-compiler-contract.ts";
import {
  isKpVerifiedSemanticMotionRoleCohorts,
  type KpVerifiedSemanticMotionRoleCohorts
} from "./semantic-motion-role-cohort-compiler.ts";

export type KpSemanticMotionEventKind =
  | "orient"
  | "clearance"
  | "departure"
  | "arrival"
  | "contact"
  | "recognition"
  | "retirement"
  | "attachment"
  | "settlement"
  | "native-target-ready";

export interface KpSemanticMotionEventSpec {
  readonly id: string;
  readonly kind: KpSemanticMotionEventKind;
  readonly cohortIds: readonly string[];
  readonly attachmentIds: readonly string[];
  readonly correspondenceRecordIds: readonly string[];
  readonly summary: string;
}

export interface KpSemanticMotionPrecedenceEdge {
  readonly beforeEventId: string;
  readonly afterEventId: string;
}

export interface KpSemanticMotionPrecedenceSpec {
  readonly events: readonly KpSemanticMotionEventSpec[];
  readonly edges: readonly KpSemanticMotionPrecedenceEdge[];
}

declare const kpSemanticMotionPrecedenceAuthority: unique symbol;

export type KpVerifiedSemanticMotionPrecedence = Readonly<{
  kind: "verified-semantic-motion-precedence";
  requestId: string;
  structure: KpVerifiedSemanticMotionRoleCohorts;
  events: readonly KpSemanticMotionEventSpec[];
  edges: readonly KpSemanticMotionPrecedenceEdge[];
  topologicalLayers: readonly (readonly string[])[];
  [kpSemanticMotionPrecedenceAuthority]: true;
}>;

export type KpSemanticMotionPrecedenceCompileResult =
  | {
      readonly status: "verified";
      readonly precedence: KpVerifiedSemanticMotionPrecedence;
    }
  | KpSemanticMotionCompilerRepairRequiredV1;

const verifiedPrecedenceGraphs = new WeakSet<object>();

export function compileKpSemanticMotionPrecedence(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly structure: KpVerifiedSemanticMotionRoleCohorts;
  readonly spec: KpSemanticMotionPrecedenceSpec;
}): KpSemanticMotionPrecedenceCompileResult {
  const { request, structure, spec } = input;
  if (!isKpVerifiedSemanticMotionRoleCohorts(structure)) {
    throw new Error("Precedence compilation requires original role/cohort authority.");
  }
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  if (structure.requestId !== request.id) {
    addIssue(issues, "authority-mismatch", "$", "Role/cohort authority does not belong to this request.");
  }
  findPhysicalAuthority(spec).forEach((path) =>
    addIssue(issues, "physical-authority", path, "Semantic precedence cannot own time, easing, progress, paths, or geometry.")
  );
  const eventById = new Map<string, KpSemanticMotionEventSpec>();
  const cohortIds = new Set(structure.cohorts.map(({ id }) => id));
  const attachmentIds = new Set(structure.attachments.map(({ id }) => id));
  const correspondenceIds = new Set(
    structure.lifecycle.materialRecords.map(({ correspondenceRecordId }) => correspondenceRecordId)
  );
  spec.events.forEach((event, index) => {
    const path = `$.events[${index}]`;
    if (eventById.has(event.id)) addIssue(issues, "duplicate-event", `${path}.id`, `Duplicate semantic event ${event.id}.`);
    eventById.set(event.id, event);
    if (event.id.trim().length === 0 || event.summary.trim().length === 0) {
      addIssue(issues, "event-shape", path, "Semantic events require non-empty ids and summaries.");
    }
    event.cohortIds.forEach((id) => {
      if (!cohortIds.has(id)) addIssue(issues, "event-reference", `${path}.cohortIds`, `Event ${event.id} references unknown cohort ${id}.`);
    });
    event.attachmentIds.forEach((id) => {
      if (!attachmentIds.has(id)) addIssue(issues, "event-reference", `${path}.attachmentIds`, `Event ${event.id} references unknown attachment ${id}.`);
    });
    event.correspondenceRecordIds.forEach((id) => {
      if (!correspondenceIds.has(id)) addIssue(issues, "event-reference", `${path}.correspondenceRecordIds`, `Event ${event.id} references unknown correspondence ${id}.`);
    });
    if (
      event.kind !== "native-target-ready" &&
      event.cohortIds.length + event.attachmentIds.length + event.correspondenceRecordIds.length === 0
    ) {
      addIssue(issues, "event-reference", path, `Event ${event.id} must name the semantic material it orders.`);
    }
  });

  const edgeKeys = new Set<string>();
  spec.edges.forEach((edge, index) => {
    const path = `$.edges[${index}]`;
    const key = `${edge.beforeEventId}->${edge.afterEventId}`;
    if (edgeKeys.has(key)) addIssue(issues, "duplicate-edge", path, `Duplicate precedence edge ${key}.`);
    edgeKeys.add(key);
    if (!eventById.has(edge.beforeEventId) || !eventById.has(edge.afterEventId)) {
      addIssue(issues, "edge-reference", path, `Precedence edge ${key} references a missing event.`);
    }
    if (edge.beforeEventId === edge.afterEventId) {
      addIssue(issues, "cycle", path, `Semantic event ${edge.beforeEventId} cannot precede itself.`);
    }
  });
  const targets = spec.events.filter(({ kind }) => kind === "native-target-ready");
  if (targets.length !== 1) {
    addIssue(issues, "target-ready", "$.events", `Precedence graph requires exactly one native-target-ready event; received ${targets.length}.`);
  }

  const layers = topologicalLayers(spec.events, spec.edges);
  if (layers === undefined) {
    addIssue(issues, "cycle", "$.edges", "Semantic precedence graph contains a cycle.");
  } else if (targets[0] !== undefined) {
    const terminalId = targets[0].id;
    const outgoing = spec.edges.filter(({ beforeEventId }) => beforeEventId === terminalId);
    if (outgoing.length > 0) {
      addIssue(issues, "target-ready", "$.edges", "The native target-ready event must be terminal.");
    }
    spec.events.filter(({ id }) => id !== terminalId).forEach(({ id }) => {
      if (!reaches(id, terminalId, spec.edges)) {
        addIssue(issues, "disconnected-event", "$.edges", `Semantic event ${id} does not contribute to native target readiness.`);
      }
    });
  }
  if (issues.length > 0 || layers === undefined) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{ kind: "operation-binding", targetId: request.operation.stepId }]
    });
  }
  const precedence = Object.freeze({
    kind: "verified-semantic-motion-precedence" as const,
    requestId: request.id,
    structure,
    events: Object.freeze(spec.events.map((event) => Object.freeze({
      ...event,
      cohortIds: Object.freeze([...event.cohortIds]),
      attachmentIds: Object.freeze([...event.attachmentIds]),
      correspondenceRecordIds: Object.freeze([...event.correspondenceRecordIds])
    }))),
    edges: Object.freeze(spec.edges.map((edge) => Object.freeze({ ...edge }))),
    topologicalLayers: Object.freeze(layers.map((layer) => Object.freeze([...layer])))
  }) as KpVerifiedSemanticMotionPrecedence;
  verifiedPrecedenceGraphs.add(precedence);
  return { status: "verified", precedence };
}

export function isKpVerifiedSemanticMotionPrecedence(
  value: unknown
): value is KpVerifiedSemanticMotionPrecedence {
  return typeof value === "object" && value !== null && verifiedPrecedenceGraphs.has(value);
}

function topologicalLayers(
  events: readonly KpSemanticMotionEventSpec[],
  edges: readonly KpSemanticMotionPrecedenceEdge[]
): readonly (readonly string[])[] | undefined {
  const eventIds = new Set(events.map(({ id }) => id));
  if (eventIds.size !== events.length || edges.some((edge) =>
    !eventIds.has(edge.beforeEventId) || !eventIds.has(edge.afterEventId)
  )) return undefined;
  const incoming = new Map<string, number>([...eventIds].map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>();
  edges.forEach(({ beforeEventId, afterEventId }) => {
    incoming.set(afterEventId, (incoming.get(afterEventId) ?? 0) + 1);
    outgoing.set(beforeEventId, [...(outgoing.get(beforeEventId) ?? []), afterEventId]);
  });
  const layers: string[][] = [];
  const remaining = new Set(eventIds);
  while (remaining.size > 0) {
    const layer = [...remaining].filter((id) => incoming.get(id) === 0).sort();
    if (layer.length === 0) return undefined;
    layers.push(layer);
    layer.forEach((id) => {
      remaining.delete(id);
      outgoing.get(id)?.forEach((targetId) => incoming.set(targetId, incoming.get(targetId)! - 1));
    });
  }
  return layers;
}

function reaches(
  sourceId: string,
  targetId: string,
  edges: readonly KpSemanticMotionPrecedenceEdge[]
): boolean {
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (id === targetId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return edges.filter(({ beforeEventId }) => beforeEventId === id)
      .some(({ afterEventId }) => visit(afterEventId));
  };
  return visit(sourceId);
}

function findPhysicalAuthority(value: unknown, path = "$"): readonly string[] {
  if (typeof value !== "object" || value === null) return [];
  if (Array.isArray(value)) return value.flatMap((child, index) => findPhysicalAuthority(child, `${path}[${index}]`));
  const forbidden = /(?:duration|delay|easing|progress|timing|window|path|geometry|milliseconds|ms$)/i;
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.test(key) ? [`${path}.${key}`] : []),
    ...findPhysicalAuthority(child, `${path}.${key}`)
  ]);
}

function addIssue(
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][],
  suffix:
    | "authority-mismatch"
    | "physical-authority"
    | "duplicate-event"
    | "event-shape"
    | "event-reference"
    | "duplicate-edge"
    | "edge-reference"
    | "cycle"
    | "target-ready"
    | "disconnected-event",
  path: string,
  message: string
): void {
  issues.push({ code: `semantic-motion.precedence.${suffix}`, path, message });
}
