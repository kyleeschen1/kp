import type { KpLispReconstructionPlan } from
  "./lisp-reconstruction-choreography.ts";
import {
  compileKpLispReductionChoreography,
  sampleKpLispReductionChoreography,
  type KpLispReductionPlan,
  type KpLispReductionSample
} from "./lisp-reduction-choreography.ts";
import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialProjection,
  KpLispSourceMaterialToken
} from "./lisp-s-expression-material-projection.ts";
import {
  compileKpLispDwellTimeline,
  defineKpLispInternalTuning,
  KP_LISP_AUTHORED_DWELL_BEATS,
  type KpLispDwellTimeline,
  type KpLispInternalTuningProjection
} from "./lisp-s-expression-timing.ts";
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";

export interface KpLispEvaluationGeometryRect {
  readonly xEm: number;
  readonly yEm: number;
  readonly widthEm: number;
  readonly heightEm: number;
}

export interface KpLispEvaluationMotionProgram {
  readonly id: "evaluation-motion-program.lisp.integer-addition";
  readonly source: KpLispCanonicalMaterialState;
  readonly result: KpLispCanonicalMaterialState;
  readonly reduction: KpLispReductionPlan;
  readonly timeline: KpLispDwellTimeline;
  readonly tuning: KpLispInternalTuningProjection;
  readonly geometry: {
    readonly fontSizePx: 20;
    readonly characterAdvanceEm: 0.64;
    readonly stage: KpLispEvaluationGeometryRect & { readonly reserved: true };
    readonly sourceTokens: readonly {
      readonly materialId: string;
      readonly rect: KpLispEvaluationGeometryRect;
    }[];
    readonly resultRect: KpLispEvaluationGeometryRect;
  };
}

export interface KpLispEvaluationMotionFrame {
  readonly id: "evaluation-motion-frame.lisp.integer-addition";
  readonly progress: number;
  readonly checkpointId: string;
  readonly phase:
    | "structural-hold"
    | "gather"
    | "inputs-gathered"
    | "operate"
    | "emit"
    | "settle"
    | "settled";
  readonly canonicalEndpoint: "reconstructed" | "result" | null;
  readonly sourceState: KpLispCanonicalMaterialState;
  readonly resultState: KpLispCanonicalMaterialState;
  readonly geometry: KpLispEvaluationMotionProgram["geometry"];
  readonly sourceTokens: readonly {
    readonly token: KpLispSourceMaterialToken;
    readonly disposition: KpLispReductionPlan["ledger"][number]["disposition"];
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
  }[];
  readonly operatorBead: {
    readonly id: string;
    readonly materialId: string;
    readonly nativeCode: string;
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
    readonly causalPulse: number;
  };
  readonly result: {
    readonly materialId: string;
    readonly nativeCode: string;
    readonly originIds: readonly string[];
    readonly emittedFromOperatorId: string;
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
  };
  readonly accessibleDescription: string;
}

export function compileKpLispEvaluationMotionProgram(input: {
  readonly fixture: KpLispLambdaApplicationFixture;
  readonly material: KpLispSourceMaterialProjection;
  readonly reconstruction: KpLispReconstructionPlan;
  readonly availableWidthPx: number;
  readonly tuning?: KpLispInternalTuningProjection | undefined;
}): KpLispEvaluationMotionProgram {
  if (!Number.isFinite(input.availableWidthPx) || input.availableWidthPx <= 0) {
    throw new Error("Evaluation stage width must be a positive finite number.");
  }
  const source = canonical(input.material, "reconstructed");
  const result = canonical(input.material, "result");
  const tuning = input.tuning ?? defineKpLispInternalTuning();
  const stageWidthEm = stable(input.availableWidthPx / 20);
  const stageHeightEm = 12;
  const advance = 0.64;
  const sourceWidth = source.nativeCode.length * advance;
  const sourceX = (stageWidthEm - sourceWidth) / 2;
  const sourceY = stageHeightEm / 2 - 0.6;
  const sourceTokens = source.tokens.map((token) => Object.freeze({
    materialId: token.id,
    rect: rect(
      sourceX + token.source.start * advance,
      sourceY,
      token.lexeme.length * advance,
      1.2
    )
  }));
  const resultWidth = result.nativeCode.length * advance;
  return Object.freeze({
    id: "evaluation-motion-program.lisp.integer-addition",
    source,
    result,
    reduction: compileKpLispReductionChoreography(
      input.fixture,
      input.material,
      input.reconstruction
    ),
    timeline: compileKpLispDwellTimeline(
      KP_LISP_AUTHORED_DWELL_BEATS.filter(({ block }) => block === "evaluation"),
      tuning
    ),
    tuning,
    geometry: Object.freeze({
      fontSizePx: 20 as const,
      characterAdvanceEm: 0.64 as const,
      stage: Object.freeze({
        ...rect(0, 0, stageWidthEm, stageHeightEm),
        reserved: true as const
      }),
      sourceTokens: Object.freeze(sourceTokens),
      resultRect: rect(
        (stageWidthEm - resultWidth) / 2,
        sourceY,
        resultWidth,
        1.2
      )
    })
  });
}

export function sampleKpLispEvaluationMotion(
  program: KpLispEvaluationMotionProgram,
  progress: number
): KpLispEvaluationMotionFrame {
  const normalizedProgress = stableUnit(progress);
  const located = locateTime(program.timeline, normalizedProgress);
  const reductionProgress = resolveReductionProgress(located);
  const reduction = sampleKpLispReductionChoreography(
    program.reduction,
    reductionProgress
  );
  const phase = resolvePhase(located, reduction);
  const operatorPlacement = placement(program, program.reduction.operator.materialId);
  const operatorCenter = center(operatorPlacement.rect);
  const beadFormation = located.checkpoint.id === "reduction-ready"
    ? smoothstep(Math.min(1, located.dwellProgress / 0.35))
    : 1;
  const operands = new Map(reduction.operands.map((operand) => [
    operand.materialId,
    operand
  ]));
  const ledger = new Map(program.reduction.ledger.map((entry) => [
    entry.materialId,
    entry
  ]));
  return Object.freeze({
    id: "evaluation-motion-frame.lisp.integer-addition",
    progress: normalizedProgress,
    checkpointId: located.checkpoint.id,
    phase,
    canonicalEndpoint: phase === "settled"
      ? "result"
      : normalizedProgress === 0 ? "reconstructed" : null,
    sourceState: program.source,
    resultState: program.result,
    geometry: program.geometry,
    sourceTokens: Object.freeze(program.source.tokens.map((token) => {
      const tokenPlacement = placement(program, token.id);
      const entry = required(ledger, token.id, "reduction ledger");
      if (entry.disposition === "operator-root") {
        return tokenFrame(token, entry.disposition, tokenPlacement.rect, {
          xEm: tokenPlacement.rect.xEm,
          yEm: tokenPlacement.rect.yEm,
          scale: 1,
          opacity: 1 - beadFormation
        });
      }
      if (entry.disposition === "input-consumed") {
        const operand = required(operands, token.id, "operand sample");
        const gather = smoothstep(operand.gatherProgress);
        return tokenFrame(token, entry.disposition, tokenPlacement.rect, {
          xEm: lerp(
            tokenPlacement.rect.xEm,
            operatorCenter.xEm - tokenPlacement.rect.widthEm / 2,
            gather
          ),
          yEm: lerp(
            tokenPlacement.rect.yEm,
            operatorCenter.yEm - tokenPlacement.rect.heightEm / 2,
            gather
          ),
          scale: Math.max(0.001, 1 - gather),
          opacity: operand.opacity
        });
      }
      return tokenFrame(token, entry.disposition, tokenPlacement.rect, {
        xEm: tokenPlacement.rect.xEm,
        yEm: tokenPlacement.rect.yEm,
        scale: Math.max(0.001, reduction.shellOpacity),
        opacity: reduction.shellOpacity
      });
    })),
    operatorBead: Object.freeze({
      id: program.reduction.operator.structuralBeadId,
      materialId: program.reduction.operator.materialId,
      nativeCode: program.reduction.operator.nativeCode,
      xEm: operatorCenter.xEm,
      yEm: operatorCenter.yEm,
      scale: stable(program.tuning.values.compression * reduction.operator.scale),
      opacity: stable(beadFormation * reduction.operator.beadOpacity),
      causalPulse: reduction.operator.causalPulse
    }),
    result: Object.freeze({
      materialId: program.reduction.result.materialId,
      nativeCode: program.reduction.result.nativeCode,
      originIds: program.reduction.result.inputOriginIds,
      emittedFromOperatorId: program.reduction.result.emittedFromOperatorId,
      xEm: stable(lerp(
        operatorCenter.xEm - program.geometry.resultRect.widthEm / 2,
        program.geometry.resultRect.xEm,
        reduction.result.opacity
      )),
      yEm: stable(lerp(
        operatorCenter.yEm - program.geometry.resultRect.heightEm / 2,
        program.geometry.resultRect.yEm,
        reduction.result.opacity
      )),
      scale: reduction.result.scale,
      opacity: reduction.result.opacity
    }),
    accessibleDescription: describe(phase)
  });
}

interface LocatedTime {
  readonly checkpoint: KpLispDwellTimeline["checkpoints"][number];
  readonly inTransition: boolean;
  readonly transitionProgress: number;
  readonly dwellProgress: number;
}

function locateTime(timeline: KpLispDwellTimeline, progress: number): LocatedTime {
  const time = stable(progress * timeline.duration);
  const checkpoint = timeline.checkpoints.find(({ dwell }) => time <= dwell.end) ??
    timeline.checkpoints.at(-1)!;
  return Object.freeze({
    checkpoint,
    inTransition: time < checkpoint.transition.end,
    transitionProgress: intervalProgress(checkpoint.transition, time),
    dwellProgress: intervalProgress(checkpoint.dwell, time)
  });
}

function resolveReductionProgress(located: LocatedTime): number {
  const local = located.inTransition ? located.transitionProgress : 1;
  switch (located.checkpoint.id) {
    case "reduction-ready": return 0;
    case "inputs-gathered": return stable(local * 0.56);
    case "result-settled": return stable(0.56 + local * 0.44);
    default: throw new Error(`Unknown evaluation checkpoint ${located.checkpoint.id}.`);
  }
}

function resolvePhase(
  located: LocatedTime,
  reduction: KpLispReductionSample
): KpLispEvaluationMotionFrame["phase"] {
  if (located.checkpoint.id === "reduction-ready") return "structural-hold";
  if (located.checkpoint.id === "inputs-gathered" && !located.inTransition) {
    return "inputs-gathered";
  }
  if (located.checkpoint.id === "result-settled" && !located.inTransition) {
    return "settled";
  }
  return reduction.phase;
}

function tokenFrame(
  token: KpLispSourceMaterialToken,
  disposition: KpLispReductionPlan["ledger"][number]["disposition"],
  _rect: KpLispEvaluationGeometryRect,
  pose: { readonly xEm: number; readonly yEm: number; readonly scale: number; readonly opacity: number }
): KpLispEvaluationMotionFrame["sourceTokens"][number] {
  return Object.freeze({
    token,
    disposition,
    xEm: stable(pose.xEm),
    yEm: stable(pose.yEm),
    scale: stable(pose.scale),
    opacity: stable(pose.opacity)
  });
}

function placement(
  program: KpLispEvaluationMotionProgram,
  materialId: string
): KpLispEvaluationMotionProgram["geometry"]["sourceTokens"][number] {
  const value = program.geometry.sourceTokens.find((candidate) =>
    candidate.materialId === materialId);
  if (value === undefined) throw new Error(`Missing evaluation placement ${materialId}.`);
  return value;
}

function canonical(
  projection: KpLispSourceMaterialProjection,
  id: KpLispCanonicalMaterialState["id"]
): KpLispCanonicalMaterialState {
  const state = projection.canonicalStates.find((candidate) => candidate.id === id);
  if (state === undefined) throw new Error(`Missing canonical Lisp state ${id}.`);
  return state;
}

function rect(
  xEm: number,
  yEm: number,
  widthEm: number,
  heightEm: number
): KpLispEvaluationGeometryRect {
  return Object.freeze({
    xEm: stable(xEm),
    yEm: stable(yEm),
    widthEm: stable(widthEm),
    heightEm: stable(heightEm)
  });
}

function center(rectangle: KpLispEvaluationGeometryRect) {
  return Object.freeze({
    xEm: stable(rectangle.xEm + rectangle.widthEm / 2),
    yEm: stable(rectangle.yEm + rectangle.heightEm / 2)
  });
}

function required<T>(values: ReadonlyMap<string, T>, id: string, label: string): T {
  const value = values.get(id);
  if (value === undefined) throw new Error(`Missing ${label} for ${id}.`);
  return value;
}

function describe(phase: KpLispEvaluationMotionFrame["phase"]): string {
  switch (phase) {
    case "structural-hold": return "The plus sign is held as a structural operator bead; no computation has occurred.";
    case "gather": return "The exact operands 4 and 1 gather into the plus operator.";
    case "inputs-gathered": return "Both operands have been absorbed; the plus operator has not yet emitted a result.";
    case "operate": return "The plus operator pulses as the visible causal site of evaluation.";
    case "emit": return "The exact result 5 emerges from the plus operator and moves to the center.";
    case "settle": return "The operator bead exits while the result 5 becomes ordinary code.";
    case "settled": return "The ordinary selectable Lisp result 5 is settled.";
  }
}

function intervalProgress(
  interval: { readonly start: number; readonly end: number },
  value: number
): number {
  if (interval.end === interval.start) return 1;
  return stableUnit((value - interval.start) / (interval.end - interval.start));
}

function smoothstep(value: number): number {
  const unit = stableUnit(value);
  return stable(unit * unit * (3 - 2 * unit));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function stableUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return stable(Math.max(0, Math.min(1, value)));
}

function stable(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
