import type {
  KpEquationTransformSeriesAdjacencyIntent,
  KpEquationTransformSeriesRequest
} from "./equation-transform-series-request.ts";

export type KpEquationSeriesAdjacencyAnalysis =
  | Readonly<{
      adjacencyId: string;
      status: "single-operation";
      operationId: string;
    }>
  | Readonly<{
      adjacencyId: string;
      status: "compound-operation";
      operationIds: readonly [string, string, ...string[]];
    }>
  | Readonly<{
      adjacencyId: string;
      status: "ambiguous";
      candidateOperationIds: readonly [string, string, ...string[]];
    }>
  | Readonly<{
      adjacencyId: string;
      status: "unresolved";
      reason: string;
    }>;

export interface KpEquationSeriesSegment {
  readonly id: string;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly operationId: string;
  readonly authority: "explicit-request" | "proposed-resolution";
  readonly intent: KpEquationTransformSeriesAdjacencyIntent;
}

export type KpEquationSeriesSegmentationRepair =
  | Readonly<{
      kind: "provide-adjacency-analysis";
      adjacencyId: string;
    }>
  | Readonly<{
      kind: "reorder-adjacency-analysis";
      adjacencyId: string;
      expectedAdjacencyId: string;
    }>
  | Readonly<{
      kind: "correct-explicit-operation";
      adjacencyId: string;
      explicitOperationId: string;
      analyzedOperationId: string;
    }>
  | Readonly<{
      kind: "insert-intermediate-states";
      adjacencyId: string;
      fromStateId: string;
      toStateId: string;
      operationIds: readonly [string, string, ...string[]];
      minimumIntermediateStateCount: number;
    }>
  | Readonly<{
      kind: "choose-single-operation";
      adjacencyId: string;
      candidateOperationIds: readonly [string, string, ...string[]];
    }>
  | Readonly<{
      kind: "resolve-operation";
      adjacencyId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "correct-analysis-shape";
      adjacencyId: string;
    }>;

export type KpEquationSeriesSegmentationResult =
  | Readonly<{
      status: "segmented";
      segments: readonly KpEquationSeriesSegment[];
      repairs: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      repairs: readonly KpEquationSeriesSegmentationRepair[];
    }>;

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;

/**
 * Segmentation is a fail-closed boundary: a displayed jump may own one law,
 * never a guessed bundle of laws hidden behind a visually plausible tween.
 */
export function segmentKpEquationSeriesAdjacencies(
  request: KpEquationTransformSeriesRequest,
  analyses: readonly KpEquationSeriesAdjacencyAnalysis[]
): KpEquationSeriesSegmentationResult {
  const repairs: KpEquationSeriesSegmentationRepair[] = [];
  const segments: KpEquationSeriesSegment[] = [];

  request.adjacencies.forEach((adjacency, index) => {
    const analysis = analyses[index] as unknown;
    if (analysis === undefined) {
      repairs.push(freezeRepair({
        kind: "provide-adjacency-analysis",
        adjacencyId: adjacency.id
      }));
      return;
    }
    if (!isRecord(analysis) || analysis["adjacencyId"] !== adjacency.id) {
      repairs.push(freezeRepair({
        kind: "reorder-adjacency-analysis",
        adjacencyId: isRecord(analysis) && typeof analysis["adjacencyId"] === "string"
          ? analysis["adjacencyId"]
          : "analysis.invalid",
        expectedAdjacencyId: adjacency.id
      }));
      return;
    }

    const typedAnalysis = analysis as unknown as KpEquationSeriesAdjacencyAnalysis;
    switch (typedAnalysis.status) {
      case "single-operation":
        if (!validId(typedAnalysis.operationId)) {
          repairs.push(invalidShape(adjacency.id));
          return;
        }
        if (
          adjacency.intent.mode === "explicit" &&
          typedAnalysis.operationId !== adjacency.intent.operationId
        ) {
          repairs.push(freezeRepair({
            kind: "correct-explicit-operation",
            adjacencyId: adjacency.id,
            explicitOperationId: adjacency.intent.operationId,
            analyzedOperationId: typedAnalysis.operationId
          }));
          return;
        }
        segments.push(deepFreeze({
          id: adjacency.id,
          fromStateId: adjacency.fromStateId,
          toStateId: adjacency.toStateId,
          operationId: typedAnalysis.operationId,
          authority: adjacency.intent.mode === "explicit"
            ? "explicit-request" as const
            : "proposed-resolution" as const,
          intent: immutableIntent(adjacency.intent)
        }));
        return;
      case "compound-operation": {
        const operationIds = validOperationTuple(typedAnalysis.operationIds);
        if (operationIds === undefined) {
          repairs.push(invalidShape(adjacency.id));
          return;
        }
        repairs.push(deepFreeze({
          kind: "insert-intermediate-states" as const,
          adjacencyId: adjacency.id,
          fromStateId: adjacency.fromStateId,
          toStateId: adjacency.toStateId,
          operationIds,
          minimumIntermediateStateCount: operationIds.length - 1
        }));
        return;
      }
      case "ambiguous": {
        const candidateOperationIds = validOperationTuple(
          typedAnalysis.candidateOperationIds
        );
        if (candidateOperationIds === undefined) {
          repairs.push(invalidShape(adjacency.id));
          return;
        }
        repairs.push(deepFreeze({
          kind: "choose-single-operation" as const,
          adjacencyId: adjacency.id,
          candidateOperationIds
        }));
        return;
      }
      case "unresolved":
        if (typeof typedAnalysis.reason !== "string" || typedAnalysis.reason.trim() === "") {
          repairs.push(invalidShape(adjacency.id));
          return;
        }
        repairs.push(freezeRepair({
          kind: "resolve-operation",
          adjacencyId: adjacency.id,
          reason: typedAnalysis.reason
        }));
        return;
      default:
        repairs.push(invalidShape(adjacency.id));
    }
  });

  if (analyses.length > request.adjacencies.length) {
    analyses.slice(request.adjacencies.length).forEach((analysis) => {
      repairs.push(invalidShape(
        isRecord(analysis) && typeof analysis["adjacencyId"] === "string"
          ? analysis["adjacencyId"]
          : "analysis.invalid"
      ));
    });
  }

  // Never leak valid-looking prefixes when any adjacency still needs repair.
  if (repairs.length > 0) return deepFreeze({
    status: "repair-required" as const,
    repairs
  });
  return deepFreeze({
    status: "segmented" as const,
    segments,
    repairs: [] as []
  });
}

function validOperationTuple(
  value: unknown
): readonly [string, string, ...string[]] | undefined {
  if (
    !Array.isArray(value) || value.length < 2 ||
    !value.every((operationId) => validId(operationId))
  ) return undefined;
  return [...value] as [string, string, ...string[]];
}

function immutableIntent(
  intent: KpEquationTransformSeriesAdjacencyIntent
): KpEquationTransformSeriesAdjacencyIntent {
  return intent.mode === "explicit"
    ? deepFreeze({
        ...intent,
        semanticArguments: immutableCopy(intent.semanticArguments)
      })
    : Object.freeze({ ...intent });
}

function invalidShape(adjacencyId: string): KpEquationSeriesSegmentationRepair {
  return freezeRepair({ kind: "correct-analysis-shape", adjacencyId });
}

function freezeRepair<T extends KpEquationSeriesSegmentationRepair>(value: T): T {
  return Object.freeze(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && protocolId.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function immutableCopy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(immutableCopy);
  if (isRecord(value)) return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, immutableCopy(child)])
  );
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
