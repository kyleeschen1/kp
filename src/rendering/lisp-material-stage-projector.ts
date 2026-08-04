import {
  compileKpLispApplicationMotionProgram,
  sampleKpLispApplicationMotion,
  type KpLispApplicationMotionProgram
} from "../animation/lisp-application-motion.ts";
import {
  compileKpLispEvaluationMotionProgram,
  sampleKpLispEvaluationMotion,
  type KpLispEvaluationMotionProgram
} from "../animation/lisp-evaluation-motion.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../animation/lisp-s-expression-material-projection.ts";
import {
  compileKpLispStructuralMotionProgram,
  sampleKpLispStructuralMotion,
  type KpLispStructuralMotionProgram
} from "../animation/lisp-structural-motion.ts";
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";
import {
  kpLispApplicationMotionCss,
  renderKpLispApplicationMotionHtml
} from "./lisp-application-motion-html.ts";
import {
  kpLispEvaluationMotionCss,
  renderKpLispEvaluationMotionHtml
} from "./lisp-evaluation-motion-html.ts";
import {
  kpLispStructuralMotionCss,
  renderKpLispStructuralMotionHtml
} from "./lisp-structural-motion-html.ts";

export type KpLispMaterialStageOperation =
  | "structure"
  | "application"
  | "evaluation";

export interface KpLispMaterialStageRenderInput {
  readonly operation: KpLispMaterialStageOperation;
  readonly progress: number;
  readonly availableWidthPx: number;
  readonly reducedMotion?: boolean | undefined;
}

export interface KpLispMaterialStageProjection {
  readonly html: string;
  readonly accessibleDescription: string;
  readonly checkpointId: string;
}

export interface KpLispMaterialStageProjector {
  readonly css: string;
  readonly project: (
    input: KpLispMaterialStageRenderInput
  ) => KpLispMaterialStageProjection;
  readonly render: (input: KpLispMaterialStageRenderInput) => string;
}

/** Shared, framework-neutral projection used by both lesson and catalogue hosts. */
export function createKpLispMaterialStageProjector(
  fixture: KpLispLambdaApplicationFixture
): KpLispMaterialStageProjector {
  const material = projectKpLispLambdaSourceMaterial(fixture);
  const applicationState = material.canonicalStates.find(({ id }) =>
    id === "application"
  );
  if (applicationState === undefined) {
    throw new Error("Lisp material projection requires canonical application code.");
  }
  let compiled: {
    readonly widthPx: number;
    readonly structure: KpLispStructuralMotionProgram;
    readonly application: KpLispApplicationMotionProgram;
    readonly evaluation: KpLispEvaluationMotionProgram;
  } | undefined;

  const programs = (availableWidthPx: number) => {
    const widthPx = normalizedWidth(availableWidthPx);
    if (compiled?.widthPx === widthPx) return compiled;
    const application = compileKpLispApplicationMotionProgram({
      fixture,
      material,
      availableWidthPx: widthPx
    });
    compiled = Object.freeze({
      widthPx,
      structure: compileKpLispStructuralMotionProgram({
        semantic: fixture.semantic,
        state: applicationState,
        availableWidthPx: widthPx
      }),
      application,
      evaluation: compileKpLispEvaluationMotionProgram({
        fixture,
        material,
        reconstruction: application.reconstruction,
        availableWidthPx: widthPx
      })
    });
    return compiled;
  };

  const project = ({ operation, progress, availableWidthPx, reducedMotion }:
    KpLispMaterialStageRenderInput): KpLispMaterialStageProjection => {
    const program = programs(availableWidthPx);
    const operationProgram = program[operation];
    const normalizedProgress = reducedMotion === true
      ? nearestCheckpointProgress(operationProgram.timeline, clamp(progress))
      : clamp(progress);
    if (operation === "structure") {
      const frame = sampleKpLispStructuralMotion(
        program.structure,
        normalizedProgress
      );
      return projection(
        renderKpLispStructuralMotionHtml(frame, { reducedMotion }),
        frame
      );
    }
    if (operation === "evaluation") {
      const frame = sampleKpLispEvaluationMotion(
        program.evaluation,
        normalizedProgress
      );
      return projection(
        renderKpLispEvaluationMotionHtml(frame, { reducedMotion }),
        frame
      );
    }
    const frame = sampleKpLispApplicationMotion(
      program.application,
      normalizedProgress
    );
    return projection(
      renderKpLispApplicationMotionHtml(frame, { reducedMotion }),
      frame
    );
  };

  return Object.freeze({
    css: `${kpLispStructuralMotionCss}\n${kpLispApplicationMotionCss}\n${kpLispEvaluationMotionCss}`,
    project,
    render: (renderInput: KpLispMaterialStageRenderInput) =>
      project(renderInput).html
  });
}

function projection(
  html: string,
  frame: { readonly accessibleDescription: string; readonly checkpointId: string }
): KpLispMaterialStageProjection {
  return Object.freeze({
    html,
    accessibleDescription: frame.accessibleDescription,
    checkpointId: frame.checkpointId
  });
}

function nearestCheckpointProgress(
  timeline: {
    readonly checkpoints: readonly { readonly seekProgress: number }[];
  },
  progress: number
): number {
  return timeline.checkpoints.reduce((nearest, checkpoint) =>
    Math.abs(checkpoint.seekProgress - progress) < Math.abs(nearest - progress)
      ? checkpoint.seekProgress
      : nearest,
  timeline.checkpoints[0]!.seekProgress);
}

function normalizedWidth(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Lisp material stage width must be a positive finite number.");
  }
  // Subpixel resize noise must not recompile immutable geometry every frame.
  return Math.max(320, Math.round(value));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Lisp material stage progress must be finite.");
  }
  return Math.min(1, Math.max(0, value));
}
