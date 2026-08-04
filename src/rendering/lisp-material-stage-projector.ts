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

export type KpLispMaterialStageOperation = "application" | "evaluation";

export interface KpLispMaterialStageRenderInput {
  readonly operation: KpLispMaterialStageOperation;
  readonly progress: number;
  readonly availableWidthPx: number;
}

export interface KpLispMaterialStageProjector {
  readonly css: string;
  readonly render: (input: KpLispMaterialStageRenderInput) => string;
}

/** Shared, framework-neutral projection used by both lesson and catalogue hosts. */
export function createKpLispMaterialStageProjector(
  fixture: KpLispLambdaApplicationFixture
): KpLispMaterialStageProjector {
  const material = projectKpLispLambdaSourceMaterial(fixture);
  let compiled: {
    readonly widthPx: number;
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

  return Object.freeze({
    css: `${kpLispApplicationMotionCss}\n${kpLispEvaluationMotionCss}`,
    render: ({ operation, progress, availableWidthPx }:
      KpLispMaterialStageRenderInput) => {
      const program = programs(availableWidthPx);
      const normalizedProgress = clamp(progress);
      return operation === "evaluation"
        ? renderKpLispEvaluationMotionHtml(
            sampleKpLispEvaluationMotion(
              program.evaluation,
              normalizedProgress
            )
          )
        : renderKpLispApplicationMotionHtml(
            sampleKpLispApplicationMotion(
              program.application,
              normalizedProgress
            )
          );
    }
  });
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
