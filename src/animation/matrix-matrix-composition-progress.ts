import type { KpOrganicMotionSignature } from "./organic-motion-primitives.ts";

export interface KpMatrixMatrixCompositionCellPlan {
  readonly id: string;
  readonly semanticIndex: number;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly leftSelectorIds: readonly string[];
  readonly rightSelectorIds: readonly string[];
  readonly resultSelectorId: string;
  readonly leftValues: readonly number[];
  readonly rightValues: readonly number[];
  readonly result: number;
  readonly intermediateObjectId: string;
  readonly cellLatex: string;
  readonly start: number;
  readonly end: number;
  readonly sourceSignatures: Readonly<Record<string, KpOrganicMotionSignature>>;
}

export interface KpMatrixMatrixCompositionPlan {
  readonly id: string;
  readonly kind: "matrix-matrix-renderer-plan";
  readonly cells: readonly KpMatrixMatrixCompositionCellPlan[];
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly sourceReleaseStart: number;
  readonly sourceReleaseEnd: number;
  readonly structureRevealStart: number;
  readonly structureRevealEnd: number;
}

export interface KpMatrixMatrixCellFrame {
  readonly semanticIndex: number;
  readonly status: "upcoming" | "active" | "resolved";
  readonly localProgress: number;
  readonly salience: number;
  readonly calculationOpacity: number;
  readonly resultRevealProgress: number;
}

export interface KpMatrixMatrixCompositionProgressFrame {
  readonly kind: "matrix-matrix-cell-composition";
  readonly semanticProgress: number;
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly cells: readonly KpMatrixMatrixCellFrame[];
  readonly activeCellIndex: number | undefined;
  readonly resolvedThroughCellIndex: number | undefined;
  readonly sourceOpacity: number;
  readonly structureRevealProgress: number;
  readonly sourceReflowProgress: number;
  readonly targetSettlementProgress: number;
}

export function sampleKpMatrixMatrixCompositionProgress(input: {
  readonly plan: KpMatrixMatrixCompositionPlan;
  readonly progress: number;
}): KpMatrixMatrixCompositionProgressFrame {
  const semanticProgress = clamp01(input.progress);
  const cells = input.plan.cells.map((cell) => {
    const localProgress = windowProgress(semanticProgress, cell.start, cell.end);
    const status = semanticProgress < cell.start
      ? "upcoming" as const
      : semanticProgress >= cell.end
        ? "resolved" as const
        : "active" as const;
    const salience = status !== "active"
      ? 0
      : localProgress < 0.2
        ? smooth(localProgress / 0.2)
        : localProgress <= 0.74
          ? 1
          : 1 - smooth((localProgress - 0.74) / 0.26);
    return {
      semanticIndex: cell.semanticIndex,
      status,
      localProgress,
      salience,
      calculationOpacity: status === "active"
        ? smooth(windowProgress(localProgress, 0.1, 0.3))
        : 0,
      resultRevealProgress: smooth(windowProgress(localProgress, 0.62, 0.9))
    };
  });
  return {
    kind: "matrix-matrix-cell-composition",
    semanticProgress,
    semanticDurationMs: input.plan.semanticDurationMs,
    semanticActionCount: input.plan.semanticActionCount,
    cells,
    activeCellIndex: cells
      .filter((cell) => cell.status === "active")
      .sort((left, right) => right.salience - left.salience)
      .at(0)?.semanticIndex,
    resolvedThroughCellIndex: cells.filter((cell) =>
      cell.status === "resolved" || cell.resultRevealProgress >= 1
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
    sourceReflowProgress: smooth(windowProgress(semanticProgress, 0.035, 0.13)),
    targetSettlementProgress: smooth(windowProgress(semanticProgress, 0.76, 0.96))
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
    throw new Error("Matrix-matrix composition progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

export type KpMatrixMatrixRendererCellPlan =
  KpMatrixMatrixCompositionCellPlan;
export type KpMatrixMatrixRendererPlan = KpMatrixMatrixCompositionPlan;
