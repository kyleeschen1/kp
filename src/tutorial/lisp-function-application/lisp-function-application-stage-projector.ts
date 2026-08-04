import type { KpLispBotanicalPresentationPlan } from
  "../../animation/lisp-botanical-presentation-plan.ts";
import type { KpLispLambdaApplicationRuntimeFrame } from
  "../../animation/lisp-lambda-application-runtime-frame.ts";
import {
  kpLispBotanicalStageCss,
  renderKpLispBotanicalStageHtml
} from "../../rendering/lisp-botanical-stage-html.ts";
import { createKpLispMaterialStageProjector } from
  "../../rendering/lisp-material-stage-projector.ts";
import type { KpLispLambdaApplicationAsset } from
  "../../semantic/lisp-lambda-application-asset.ts";
import type { KpLispLessonMotionBlockId } from
  "./lisp-function-application-motion-blocks.ts";

export const kpLispSExpressionMaterialRendererKind =
  "lisp-s-expression-material-v0" as const;

export const kpLispBotanicalRollbackRendererKind =
  "lisp-botanical-local-v0" as const;

export const kpLispDefaultLessonStageRendererKind =
  kpLispSExpressionMaterialRendererKind;

export type KpLispLessonStageRendererKind =
  | typeof kpLispSExpressionMaterialRendererKind
  | typeof kpLispBotanicalRollbackRendererKind;

export interface KpLispLessonStageRenderInput {
  readonly runtimeFrame: KpLispLambdaApplicationRuntimeFrame;
  readonly activeBlockId: KpLispLessonMotionBlockId;
  readonly localProgress: number;
  readonly availableWidthPx: number;
  readonly reducedMotion?: boolean | undefined;
}

export interface KpLispLessonStageProjector {
  readonly rendererKind: KpLispLessonStageRendererKind;
  readonly css: string;
  readonly render: (input: KpLispLessonStageRenderInput) => string;
}

/**
 * Owns the presentation-only rollback boundary. Semantic/runtime truth remains
 * an input to both renderers, so changing this selector cannot change it.
 */
export function createKpLispLessonStageProjector(input: {
  readonly source: KpLispLambdaApplicationAsset;
  readonly botanicalPlan: KpLispBotanicalPresentationPlan;
  readonly rendererKind?: KpLispLessonStageRendererKind | undefined;
}): KpLispLessonStageProjector {
  const rendererKind = input.rendererKind ??
    kpLispDefaultLessonStageRendererKind;
  if (rendererKind === kpLispBotanicalRollbackRendererKind) {
    return Object.freeze({
      rendererKind,
      css: kpLispBotanicalStageCss,
      render: (frameInput: KpLispLessonStageRenderInput) => wrap(
        rendererKind,
        frameInput.runtimeFrame,
        renderKpLispBotanicalStageHtml({
          frame: frameInput.runtimeFrame,
          plan: input.botanicalPlan,
          reducedMotion: frameInput.reducedMotion
        })
      )
    });
  }

  const material = createKpLispMaterialStageProjector(input.source.fixture);

  return Object.freeze({
    rendererKind,
    css: material.css,
    render: (frameInput: KpLispLessonStageRenderInput) => {
      const html = material.render({
        operation: frameInput.activeBlockId,
        progress: frameInput.localProgress,
        availableWidthPx: frameInput.availableWidthPx
      });
      return wrap(rendererKind, frameInput.runtimeFrame, html);
    }
  });
}

function wrap(
  rendererKind: KpLispLessonStageRendererKind,
  runtimeFrame: KpLispLambdaApplicationRuntimeFrame,
  html: string
): string {
  return `<div data-kp-lisp-lesson-stage-projection="${rendererKind}" data-kp-lisp-runtime-frame="${runtimeFrame.id}" data-kp-lisp-runtime-checkpoint="${runtimeFrame.checkpointId}">${html}</div>`;
}
