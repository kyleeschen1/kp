import type {
  KpNativeKatexConformanceContinuityAssessment,
  KpNativeKatexConformanceSeamAssessment
} from "./native-katex-compositor-continuity-laws.ts";
import type { KpNativeKatexConformanceSeamTrace } from
  "./native-katex-compositor-seam-trace.ts";

export interface KpNativeKatexCompositorDiagnosticReport {
  readonly kind: "native-katex-compositor-diagnostic-report";
  readonly schemaVersion: 1;
  readonly status: "passed" | "failed";
  readonly transitionId: string;
  readonly semanticEntityId: string;
  readonly shapeId: string;
  readonly environment: {
    readonly viewportKey: string;
    readonly lifecycleRevision: number;
    readonly fontRevision: number;
  };
  readonly failures: readonly {
    readonly seam: KpNativeKatexConformanceSeamAssessment["seam"];
    readonly reasons:
      KpNativeKatexConformanceSeamAssessment["failureReasons"];
    readonly metrics: {
      readonly horizontalTranslationPx: number;
      readonly verticalTranslationPx: number;
      readonly widthScaleRatio: number;
      readonly heightScaleRatio: number;
    };
  }[];
  readonly samples: readonly {
    readonly slot: KpNativeKatexConformanceSeamTrace["samples"][number]["slot"];
    readonly progress: number;
    readonly owner: KpNativeKatexConformanceSeamTrace["samples"][number]["owner"];
    readonly paintOpacityByOwner:
      KpNativeKatexConformanceSeamTrace["samples"][number]["paintOpacityByOwner"];
    readonly rect: { left: number; top: number; width: number; height: number };
    readonly baselineY: number | null;
  }[];
}

export function createKpNativeKatexCompositorDiagnosticReport(input: {
  readonly trace: KpNativeKatexConformanceSeamTrace;
  readonly assessment: KpNativeKatexConformanceContinuityAssessment;
}): KpNativeKatexCompositorDiagnosticReport {
  if (
    input.trace.transitionId !== input.assessment.transitionId ||
    input.trace.semanticEntityId !== input.assessment.semanticEntityId ||
    input.trace.shapeId !== input.assessment.shapeId
  ) {
    throw new Error("Diagnostic trace and continuity assessment do not match.");
  }
  const failures = input.assessment.seams
    .filter(({ passed }) => !passed)
    .map((seam) => Object.freeze({
      seam: seam.seam,
      reasons: Object.freeze([...seam.failureReasons]),
      metrics: Object.freeze({
        horizontalTranslationPx: seam.horizontalTranslationPx,
        verticalTranslationPx: seam.verticalTranslationPx,
        widthScaleRatio: seam.widthScaleRatio,
        heightScaleRatio: seam.heightScaleRatio
      })
    }));
  return Object.freeze({
    kind: "native-katex-compositor-diagnostic-report" as const,
    schemaVersion: 1 as const,
    status: input.assessment.passed ? "passed" as const : "failed" as const,
    transitionId: input.trace.transitionId,
    semanticEntityId: input.trace.semanticEntityId,
    shapeId: input.trace.shapeId,
    environment: Object.freeze({
      viewportKey: input.trace.viewportKey,
      lifecycleRevision: input.trace.lifecycleRevision,
      fontRevision: input.trace.fontRevision
    }),
    failures: Object.freeze(failures),
    samples: Object.freeze(input.trace.samples.map((sample) => Object.freeze({
      slot: sample.slot,
      progress: sample.progress,
      owner: sample.owner,
      paintOpacityByOwner: Object.freeze({ ...sample.paintOpacityByOwner }),
      rect: Object.freeze({ ...sample.observation.rect }),
      baselineY: sample.observation.baselineY
    })))
  });
}

export function serializeKpNativeKatexCompositorDiagnosticReport(
  report: KpNativeKatexCompositorDiagnosticReport
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
