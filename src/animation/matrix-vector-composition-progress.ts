import type { KpOrganicMotionSignature } from "./organic-motion-primitives.ts";

export interface KpMatrixVectorCompositionRowPlan {
  readonly id: string;
  readonly semanticIndex: number;
  readonly matrixSelectorIds: readonly string[];
  readonly vectorSelectorIds: readonly string[];
  readonly resultSelectorId: string;
  readonly rowValues: readonly number[];
  readonly vectorValues: readonly number[];
  readonly result: number;
  readonly intermediateObjectId: string;
  readonly rowLatex: string;
  readonly start: number;
  readonly end: number;
  readonly sourceSignatures: Readonly<Record<string, KpOrganicMotionSignature>>;
}

export interface KpMatrixVectorCompositionPlan {
  readonly id: string;
  readonly kind: "matrix-vector-renderer-plan";
  readonly rows: readonly KpMatrixVectorCompositionRowPlan[];
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly sourceReleaseStart: number;
  readonly sourceReleaseEnd: number;
  readonly structureRevealStart: number;
  readonly structureRevealEnd: number;
}

export interface KpMatrixVectorRowFrame {
  readonly semanticIndex: number;
  readonly status: "upcoming" | "active" | "resolved";
  readonly localProgress: number;
  readonly salience: number;
  readonly calculationOpacity: number;
  readonly resultRevealProgress: number;
}

export interface KpMatrixVectorCompositionProgressFrame {
  readonly kind: "matrix-vector-row-composition";
  readonly semanticProgress: number;
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly rows: readonly KpMatrixVectorRowFrame[];
  readonly activeRowIndex: number | undefined;
  readonly resolvedThroughRowIndex: number | undefined;
  readonly sourceOpacity: number;
  readonly structureRevealProgress: number;
  readonly sourceReflowProgress: number;
  readonly targetSettlementProgress: number;
}

export function sampleKpMatrixVectorCompositionProgress(input: {
  readonly plan: KpMatrixVectorCompositionPlan;
  readonly progress: number;
}): KpMatrixVectorCompositionProgressFrame {
  const semanticProgress = clamp01(input.progress);
  const rows = input.plan.rows.map((row) => {
    const localProgress = windowProgress(semanticProgress, row.start, row.end);
    const status = semanticProgress < row.start
      ? "upcoming" as const
      : semanticProgress >= row.end
        ? "resolved" as const
        : "active" as const;
    const salience = status !== "active"
      ? 0
      : localProgress < 0.22
        ? smooth(localProgress / 0.22)
        : localProgress <= 0.72
          ? 1
          : 1 - smooth((localProgress - 0.72) / 0.28);
    return {
      semanticIndex: row.semanticIndex,
      status,
      localProgress,
      salience,
      calculationOpacity: status === "upcoming"
        ? 0
        : status === "active"
          ? smooth(windowProgress(localProgress, 0.12, 0.32))
          : 0.34,
      resultRevealProgress: smooth(windowProgress(localProgress, 0.62, 0.9))
    };
  });
  return {
    kind: "matrix-vector-row-composition",
    semanticProgress,
    semanticDurationMs: input.plan.semanticDurationMs,
    semanticActionCount: input.plan.semanticActionCount,
    rows,
    activeRowIndex: rows
      .filter((row) => row.status === "active")
      .sort((left, right) => right.salience - left.salience)
      .at(0)?.semanticIndex,
    resolvedThroughRowIndex: rows.filter((row) =>
      row.status === "resolved" || row.resultRevealProgress >= 1
    ).at(-1)?.semanticIndex,
    sourceOpacity: 1 - smooth(windowProgress(
      semanticProgress,
      input.plan.sourceReleaseStart,
      input.plan.sourceReleaseEnd
    )),
    structureRevealProgress: smooth(windowProgress(
      semanticProgress,
      input.plan.structureRevealStart,
      input.plan.structureRevealEnd
    )),
    sourceReflowProgress: smooth(windowProgress(semanticProgress, 0.04, 0.14)),
    targetSettlementProgress: smooth(windowProgress(semanticProgress, 0.72, 0.96))
  };
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Matrix-vector composition progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

export type KpMatrixVectorRendererRowPlan =
  KpMatrixVectorCompositionRowPlan;
export type KpMatrixVectorRendererPlan = KpMatrixVectorCompositionPlan;
