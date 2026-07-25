import { createKpQuadraticCausalDrillDownBundle } from "./quadratic-causal-drilldown.ts";

export interface KpGlyphReconciliationCompoundTrace {
  readonly kind: "glyph-reconciliation-compound-trace";
  readonly operationIds: readonly string[];
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
  return Object.freeze({
    kind: "glyph-reconciliation-compound-trace",
    operationIds: Object.freeze(operationIds),
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
