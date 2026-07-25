import { projectKpCanonicalExecutionLineage } from "./canonical-operation-lineage-adapter.ts";
import { scheduleKpBoundedGlyphClearance } from "./bounded-glyph-clearance-scheduler.ts";
import {
  createKpEphemeralGlyphReconciliationPlan,
  resolveKpGlyphReconciliationPlan
} from "./glyph-reconciliation-plan.ts";
import {
  createKpHeadlessNotationMeasurementBackend,
  type KpHeadlessGlyphMetric
} from "./headless-notation-measurement-backend.ts";
import {
  matchKpGlyphsWithinSemanticLineage,
  type KpGlyphObservation
} from "./lineage-constrained-glyph-matcher.ts";
import {
  measureKpNativeNotation,
  type KpNativeNotationMeasurementSnapshot,
  type KpNotationRect,
  type KpProtectedNotationRegion
} from "./native-notation-measurement.ts";
import {
  createKpAnimationPresentationConstraintsV1,
  type KpInteractivePresentationCapability
} from "./presentation-constraints.ts";
import {
  createKpStaticJsGlyphPlayback,
  type KpStaticJsGlyphHost,
  type KpStaticJsGlyphPlayback
} from "./static-js-glyph-reconciliation-renderer.ts";
import type { KpCanonicalOperationExecutionResult } from "../semantic/transformation-definition-binding.ts";

export interface KpGlyphReconciliationCaseInput {
  readonly id: string;
  readonly execution: KpCanonicalOperationExecutionResult;
  readonly viewport: KpNotationRect;
  readonly sourceGlyphs: readonly KpGlyphObservation[];
  readonly targetGlyphs: readonly KpGlyphObservation[];
  readonly sourceMetrics: readonly KpHeadlessGlyphMetric[];
  readonly targetMetrics: readonly KpHeadlessGlyphMetric[];
  readonly sourceProtectedRegions?: readonly KpProtectedNotationRegion[] | undefined;
  readonly targetProtectedRegions?: readonly KpProtectedNotationRegion[] | undefined;
  readonly requiredCapabilities: readonly KpInteractivePresentationCapability[];
  readonly durationMs: number;
  readonly maxPlannerOperations?: number | undefined;
}

export interface KpCompiledGlyphReconciliationCase {
  readonly id: string;
  readonly input: KpGlyphReconciliationCaseInput;
  readonly sourceMeasurement: KpNativeNotationMeasurementSnapshot;
  readonly targetMeasurement: KpNativeNotationMeasurementSnapshot;
  readonly plan: ReturnType<typeof resolveKpGlyphReconciliationPlan>;
  readonly matches: ReturnType<typeof matchKpGlyphsWithinSemanticLineage>;
  readonly schedule: ReturnType<typeof scheduleKpBoundedGlyphClearance>;
  createPlayback(host: KpStaticJsGlyphHost): KpStaticJsGlyphPlayback;
}

export async function compileKpGlyphReconciliationCase(
  input: KpGlyphReconciliationCaseInput
): Promise<KpCompiledGlyphReconciliationCase> {
  const constraints = createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: input.requiredCapabilities,
    maxPlannerOperations: input.maxPlannerOperations ?? 10_000
  });
  const lineage = projectKpCanonicalExecutionLineage(input.execution);
  const matches = matchKpGlyphsWithinSemanticLineage({
    lineage,
    sourceGlyphs: input.sourceGlyphs,
    targetGlyphs: input.targetGlyphs
  });
  const sourceMeasurement = await measureKpNativeNotation({
    backend: createKpHeadlessNotationMeasurementBackend({
      id: `${input.id}.source`,
      viewport: input.viewport,
      metrics: input.sourceMetrics,
      protectedRegions: input.sourceProtectedRegions
    }),
    glyphs: input.sourceGlyphs
  });
  const targetMeasurement = await measureKpNativeNotation({
    backend: createKpHeadlessNotationMeasurementBackend({
      id: `${input.id}.target`,
      viewport: input.viewport,
      metrics: input.targetMetrics,
      protectedRegions: input.targetProtectedRegions
    }),
    glyphs: input.targetGlyphs
  });
  const initialPlan = createKpEphemeralGlyphReconciliationPlan({
    id: `${input.id}.plan`,
    lineage,
    constraints
  });
  const plan = resolveKpGlyphReconciliationPlan(initialPlan, matches);
  const schedule = scheduleKpBoundedGlyphClearance({
    matches,
    source: sourceMeasurement,
    target: targetMeasurement,
    maxOperations: Math.max(1, constraints.maxPlannerOperations - plan.operationCount)
  });
  return Object.freeze({
    id: input.id,
    input,
    sourceMeasurement,
    targetMeasurement,
    plan,
    matches,
    schedule,
    createPlayback(host: KpStaticJsGlyphHost) {
      return createKpStaticJsGlyphPlayback({
        schedule,
        host,
        durationMs: input.durationMs
      });
    }
  });
}
