import type { KpQuadraticKatexState } from "../../projections/quadratic-completing-square-katex.ts";
import {
  createKpCompletingSquareKatexProjection
} from "../../projections/quadratic-completing-square-katex.ts";
import {
  createKpQuadraticFormulaKatexProjection
} from "../../projections/quadratic-formula-katex.ts";
import type { KpQuadraticMethodId } from "../../semantic/quadratic-solution-method-graph.ts";

export const kpQuadraticReaderCheckpoints = Object.freeze([
  { id: "source", label: "Read the equation", progressPermille: 0, beatId: "beat.read-equation" },
  { id: "method", label: "Choose a method", progressPermille: 320, beatId: "beat.choose-method" },
  { id: "branches", label: "Follow plus and minus", progressPermille: 680, beatId: "beat.split-branches" },
  { id: "solution-set", label: "Reunite the roots", progressPermille: 880, beatId: "beat.reunite-roots" },
  { id: "graph", label: "Locate the roots", progressPermille: 1_000, beatId: "beat.connect-graph" }
] as const);

export interface KpQuadraticReaderSurfaceFrame {
  readonly progress: number;
  readonly progressPermille: number;
  readonly phase: "intro" | "method" | "branch" | "reunion" | "graph";
  readonly methodId: KpQuadraticMethodId;
  readonly equationState: KpQuadraticKatexState;
  readonly branchProgress: number;
  readonly solutionSetNative: boolean;
  readonly checkpointId: string;
  readonly checkpointLabel: string;
  readonly beatId: string;
}

export function projectKpQuadraticReaderSurface(input: {
  readonly progress: number;
  readonly methodId: KpQuadraticMethodId;
}): KpQuadraticReaderSurfaceFrame {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Quadratic reader progress must be normalized.");
  }
  const states = methodStates(input.methodId);
  const phase = phaseAt(input.progress);
  const methodProgress = clamp01((input.progress - 0.1) / 0.48);
  const stateIndex = Math.min(
    states.length - 1,
    Math.floor(methodProgress * states.length)
  );
  const checkpoint = [...kpQuadraticReaderCheckpoints]
    .reverse()
    .find(({ progressPermille }) => progressPermille <= Math.round(input.progress * 1_000))
    ?? kpQuadraticReaderCheckpoints[0];
  return Object.freeze({
    progress: input.progress,
    progressPermille: Math.round(input.progress * 1_000),
    phase,
    methodId: input.methodId,
    equationState: states[stateIndex]!,
    branchProgress: clamp01((input.progress - 0.58) / 0.22),
    solutionSetNative: input.progress >= 0.8,
    checkpointId: checkpoint.id,
    checkpointLabel: checkpoint.label,
    beatId: checkpoint.beatId
  });
}

export function parseKpQuadraticReaderMethod(
  value: string | null | undefined
): KpQuadraticMethodId {
  return value === "formula"
    ? "method.quadratic.formula"
    : "method.quadratic.completing-square";
}

export function kpQuadraticReaderMethodQueryValue(
  methodId: KpQuadraticMethodId
): "completing-square" | "formula" {
  return methodId === "method.quadratic.formula"
    ? "formula"
    : "completing-square";
}

function methodStates(methodId: KpQuadraticMethodId): readonly KpQuadraticKatexState[] {
  return methodId === "method.quadratic.formula"
    ? createKpQuadraticFormulaKatexProjection().states
    : createKpCompletingSquareKatexProjection().states;
}

function phaseAt(
  progress: number
): KpQuadraticReaderSurfaceFrame["phase"] {
  if (progress < 0.1) return "intro";
  if (progress < 0.58) return "method";
  if (progress < 0.8) return "branch";
  if (progress < 0.9) return "reunion";
  return "graph";
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
