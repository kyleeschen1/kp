import { normalizeAnimationProgress } from "../animation/kernel.ts";
import { sampleKpTutorialClaimPacedTimeline } from "./claim-paced-timeline.ts";
import {
  applyKpTutorialBranchPatch,
  createKpTutorialExplorationBranch,
  sampleKpTutorialBranchRejoin
} from "./exploration-branch.ts";
import { createKpTutorialExplorationState } from "./exploration-state.ts";
import { sampleKpFtcAccumulatorFrame, type KpFtcAccumulatorFrame } from "./ftc-accumulator-frame.ts";
import { createKpFtcConvergenceSequence, type KpFtcConvergenceFrame } from "./ftc-convergence.ts";
import { createKpFtcDifferenceQuotientFrames } from "./ftc-difference-quotient.ts";
import type { KpFtcFunctionLensId } from "./ftc-function-lens.ts";
import {
  createKpFtcNetChangeFrame,
  createKpFtcReintegrationFrames,
  createKpFtcTutorialDefinition
} from "./ftc-tutorial-module.ts";

export interface KpFtcTutorialRuntimeFrame {
  readonly id: string;
  readonly moduleId: string;
  readonly clockId: string;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly activeClaimId: string;
  readonly activeCheckpointId: string;
  readonly claimLocalProgress: number;
  readonly claimText: string;
  readonly narrationText: string;
  readonly proofStatus: string;
  readonly accumulator: KpFtcAccumulatorFrame;
  readonly convergence: KpFtcConvergenceFrame;
  readonly equationLatex: string;
  readonly equationStage: string;
  readonly activeCorrespondenceIds: readonly string[];
}

export function sampleKpFtcTutorialRuntime(input: {
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
  readonly lensId?: KpFtcFunctionLensId | undefined;
  readonly upperBound?: number | undefined;
}): KpFtcTutorialRuntimeFrame {
  const definition = createKpFtcTutorialDefinition();
  const direction = input.direction ?? "forward";
  const progress = normalizeAnimationProgress(input.progress);
  // Mirrored IEEE-754 subtraction can otherwise create distinct serialized
  // frames for the same semantic instant (for example 0.07 vs 0.07000000000000006).
  const semanticProgress = roundClock(
    direction === "rewind" ? 1 - progress : progress
  );
  const paced = sampleKpTutorialClaimPacedTimeline(
    definition.timeline,
    semanticProgress
  );
  const lensId = input.lensId ?? "quadratic";
  const upperBound = Math.min(2.25, Math.max(0.75, input.upperBound ?? 2));
  const areaProgress = normalizeAnimationProgress(semanticProgress / 0.3);
  const animatedUpperBound = 0.75 + (upperBound - 0.75) * smoothstep(areaProgress);
  const accumulator = sampleKpFtcAccumulatorFrame({
    lensId,
    upperBound: animatedUpperBound
  });
  const convergenceFrames = createKpFtcConvergenceSequence({
    lensId,
    x: upperBound
  });
  const convergenceIndex = Math.min(
    convergenceFrames.length - 1,
    Math.floor(paced.localProgress * convergenceFrames.length)
  );
  const convergence = convergenceFrames[convergenceIndex]!;
  const equation = equationForClaim(
    paced.activeClaimId,
    paced.localProgress,
    convergence
  );
  const claim = definition.graphs.claimGraph.nodes.find(
    ({ id }) => id === paced.activeClaimId
  );
  const narration = definition.narrations.find(
    ({ claimId }) => claimId === paced.activeClaimId
  );
  if (claim === undefined || narration === undefined) {
    throw new Error(`FTC runtime cannot resolve ${paced.activeClaimId}.`);
  }

  return {
    id: `frame.ftc.runtime.${direction}.${semanticProgress.toFixed(6)}`,
    moduleId: definition.module.id,
    clockId: definition.module.clockId,
    direction,
    progress,
    semanticProgress,
    activeClaimId: paced.activeClaimId,
    activeCheckpointId: paced.activeCheckpointId,
    claimLocalProgress: paced.localProgress,
    claimText: claim.statement,
    narrationText: narration.text,
    proofStatus: narration.proofStatus,
    accumulator,
    convergence,
    equationLatex: equation.latex,
    equationStage: equation.stage,
    activeCorrespondenceIds: equation.activeCorrespondenceIds
  };
}

export function checkKpFtcTutorialRuntimeLaws(): readonly string[] {
  const diagnostics: string[] = [];
  const samples = [0, 0.07, 0.25, 0.5, 0.73, 0.92, 1];

  samples.forEach((progress) => {
    const first = sampleKpFtcTutorialRuntime({ progress });
    const second = sampleKpFtcTutorialRuntime({ progress });
    if (JSON.stringify(first) !== JSON.stringify(second)) {
      diagnostics.push(`Direct sampling changed at ${progress}.`);
    }
    const rewind = sampleKpFtcTutorialRuntime({
      progress: 1 - progress,
      direction: "rewind"
    });
    if (!sameSemanticFrame(first, rewind)) {
      diagnostics.push(`Mirrored rewind changed semantic frame at ${progress}.`);
    }
  });

  const direct = sampleKpFtcTutorialRuntime({ progress: 0.73 });
  sampleKpFtcTutorialRuntime({ progress: 0.12 });
  sampleKpFtcTutorialRuntime({ progress: 0.94 });
  const afterOtherSeeks = sampleKpFtcTutorialRuntime({ progress: 0.73 });
  if (JSON.stringify(direct) !== JSON.stringify(afterOtherSeeks)) {
    diagnostics.push("Seek order changed the sampled FTC frame.");
  }

  const branch = applyKpTutorialBranchPatch(
    createKpTutorialExplorationBranch({
      id: "branch.ftc.runtime-law",
      state: createKpTutorialExplorationState({
        id: "state.ftc.runtime-law",
        values: { upperBound: 2, deltaX: 0.5 }
      })
    }),
    { upperBound: 2.25, deltaX: 0.25 }
  );
  const rejoined = sampleKpTutorialBranchRejoin(branch, 1);
  if (
    !rejoined.rejoined ||
    rejoined.remainingDiffs.length > 0 ||
    JSON.stringify(rejoined.snapshot.values) !==
      JSON.stringify(branch.state.reference.values)
  ) {
    diagnostics.push("Branch rejoin did not restore the canonical FTC state.");
  }

  return diagnostics;
}

function equationForClaim(
  claimId: string,
  localProgress: number,
  convergence: KpFtcConvergenceFrame
): {
  readonly latex: string;
  readonly stage: string;
  readonly activeCorrespondenceIds: readonly string[];
} {
  switch (claimId) {
    case "claim.ftc.whole":
    case "claim.ftc.accumulated-area":
      return {
        latex: "A(x)=\\int_0^x f(t)\\,dt",
        stage: "accumulator",
        activeCorrespondenceIds: ["correspondence.ftc.graph-x-to-equation-x"]
      };
    case "claim.ftc.finite-strip":
      return {
        latex: "\\Delta A=A(x+\\Delta x)-A(x)",
        stage: "finite-strip",
        activeCorrespondenceIds: ["correspondence.ftc.strip-to-delta-area"]
      };
    case "claim.ftc.convergence":
      return {
        latex: "m\\,\\Delta x\\leq\\Delta A\\leq M\\,\\Delta x",
        stage: `convergence-${convergence.levelIndex}`,
        activeCorrespondenceIds: ["correspondence.ftc.height-to-integrand"]
      };
    case "claim.ftc.quotient": {
      const frames = createKpFtcDifferenceQuotientFrames(convergence);
      const index = Math.min(
        frames.length - 1,
        Math.floor(localProgress * frames.length)
      );
      const frame = frames[index]!;
      return {
        latex: frame.latex,
        stage: frame.stage,
        activeCorrespondenceIds: frame.crossViewCorrespondenceIds
      };
    }
    case "claim.ftc.identity": {
      const frames = createKpFtcReintegrationFrames();
      const index = Math.min(
        frames.length - 1,
        Math.floor(localProgress * frames.length)
      );
      const frame = frames[index]!;
      return {
        latex: frame.latex,
        stage: frame.stage,
        activeCorrespondenceIds: frame.activeCorrespondenceIds
      };
    }
    case "claim.ftc.net-change": {
      const frame = createKpFtcNetChangeFrame();
      return {
        latex: frame.latex,
        stage: "net-change",
        activeCorrespondenceIds: frame.activeCorrespondenceIds
      };
    }
    default:
      throw new Error(`Unknown FTC claim ${claimId}.`);
  }
}

function sameSemanticFrame(
  left: KpFtcTutorialRuntimeFrame,
  right: KpFtcTutorialRuntimeFrame
): boolean {
  const omitTransport = ({
    id: _id,
    direction: _direction,
    progress: _progress,
    ...semantic
  }: KpFtcTutorialRuntimeFrame) => semantic;
  return JSON.stringify(omitTransport(left)) === JSON.stringify(omitTransport(right));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function roundClock(value: number): number {
  return Math.round(normalizeAnimationProgress(value) * 1e12) / 1e12;
}
