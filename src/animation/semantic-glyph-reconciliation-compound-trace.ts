import { createKpQuadraticCausalDrillDownBundle } from "./quadratic-causal-drilldown.ts";

export interface KpGlyphReconciliationCompoundTrace {
  readonly kind: "glyph-reconciliation-compound-trace";
  readonly operationIds: readonly string[];
  readonly segments: readonly {
    readonly operationId: string;
    readonly startMs: number;
    readonly durationMs: number;
    readonly endMs: number;
  }[];
  readonly compressedDurationMs: number;
  readonly fullDurationMs: number;
  readonly compressionRatio: number;
  readonly accessibilityTranscript: readonly string[];
  readonly drillDown: ReturnType<typeof createKpQuadraticCausalDrillDownBundle>["drillDown"];
}

export function createKpGlyphReconciliationCompoundTrace(input: {
  readonly parentProgress?: number;
} = {}): KpGlyphReconciliationCompoundTrace {
  const bundle = createKpQuadraticCausalDrillDownBundle({
    methodId: "method.quadratic.completing-square",
    parentProgress: input.parentProgress ?? 0.5
  });
  const operationIds = bundle.compressed.actions.map(({ canonicalOperationId }) =>
    canonicalOperationId
  );
  const segments = bundle.compressed.segments.map((segment) => Object.freeze({
    operationId: segment.canonicalOperationId,
    startMs: segment.startMs,
    durationMs: segment.durationMs,
    endMs: segment.endMs
  }));
  return Object.freeze({
    kind: "glyph-reconciliation-compound-trace",
    operationIds: Object.freeze(operationIds),
    segments: Object.freeze(segments),
    compressedDurationMs: bundle.compressed.totalDurationMs,
    fullDurationMs: bundle.full.totalDurationMs,
    compressionRatio: bundle.compressed.totalDurationMs / bundle.full.totalDurationMs,
    accessibilityTranscript: Object.freeze(
      operationIds.map((operationId, index) =>
        `Step ${index + 1}: ${operationId}`
      )
    ),
    drillDown: bundle.drillDown
  });
}
