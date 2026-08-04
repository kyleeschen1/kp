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

const accessibleStageCss = `
.kp-lisp-lesson-stage__accessible {
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
`;

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
      css: `${kpLispBotanicalStageCss}\n${accessibleStageCss}`,
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
    css: `${material.css}\n${accessibleStageCss}`,
    render: (frameInput: KpLispLessonStageRenderInput) => {
      const projection = material.project({
        operation: frameInput.activeBlockId,
        progress: frameInput.localProgress,
        availableWidthPx: frameInput.availableWidthPx,
        reducedMotion: frameInput.reducedMotion
      });
      return wrap(
        rendererKind,
        frameInput.runtimeFrame,
        projection.html,
        projection.accessibleDescription
      );
    }
  });
}

function wrap(
  rendererKind: KpLispLessonStageRendererKind,
  runtimeFrame: KpLispLambdaApplicationRuntimeFrame,
  html: string,
  accessibleDescription: string = runtimeFrame.accessibleDescription
): string {
  return `<div data-kp-lisp-lesson-stage-projection="${rendererKind}" data-kp-lisp-runtime-frame="${runtimeFrame.id}" data-kp-lisp-runtime-checkpoint="${runtimeFrame.checkpointId}">${html}<p class="kp-lisp-lesson-stage__accessible" data-kp-lisp-accessible-state role="status" aria-live="polite" aria-atomic="true">${escapeHtml(accessibleDescription)}</p></div>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
