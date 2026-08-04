import { kpLispLambdaApplicationAnimationId } from
  "../animation/lisp-lambda-application-adapter.ts";
import {
  kpLispReconstructedGlobalProgress,
  sampleKpLispLambdaApplicationRuntimeFrame
} from "../animation/lisp-lambda-application-runtime-frame.ts";
import { createKpLispMaterialStageProjector } from
  "../rendering/lisp-material-stage-projector.ts";
import { createKpLispLambdaApplicationAsset } from
  "../semantic/lisp-lambda-application-asset.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter,
  type KpEditorAnimationSurfaceAdapterRenderInput
} from "./animation-surface-adapter-registry.ts";

export const kpEditorLispMaterialSurfaceAdapterId =
  "editor-animation-surface.programming.lisp-material";

const source = createKpLispLambdaApplicationAsset();
const sessions = new WeakMap<HTMLElement, {
  readonly projector: ReturnType<typeof createKpLispMaterialStageProjector>;
}>();

export const kpEditorLispMaterialSurfaceAdapter:
  KpEditorAnimationSurfaceAdapter = {
    id: kpEditorLispMaterialSurfaceAdapterId,
    slotKind: "programming",
    priority: 110,
    supports(state) {
      return state.animationId === kpLispLambdaApplicationAnimationId &&
        state.surface.slotKinds.includes("programming");
    },
    render(renderInput) {
      let session = sessions.get(renderInput.player);
      if (session === undefined) {
        session = Object.freeze({
          projector: createKpLispMaterialStageProjector(source.fixture)
        });
        sessions.set(renderInput.player, session);
        renderInput.player.addEventListener(
          KP_EDITOR_ANIMATION_DISPOSE_EVENT,
          () => sessions.delete(renderInput.player),
          { once: true }
        );
      }
      renderLispMaterialSurface(renderInput, session.projector);
    }
  };

export function registerKpEditorLispMaterialSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorLispMaterialSurfaceAdapter
  );
}

function renderLispMaterialSurface(
  input: KpEditorAnimationSurfaceAdapterRenderInput,
  projector: ReturnType<typeof createKpLispMaterialStageProjector>
): void {
  const semanticProgress = input.state.direction === "rewind"
    ? 1 - input.state.progress
    : input.state.progress;
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: semanticProgress
  });
  const evaluation = semanticProgress >= kpLispReconstructedGlobalProgress;
  const localProgress = evaluation
    ? (semanticProgress - kpLispReconstructedGlobalProgress) /
      (1 - kpLispReconstructedGlobalProgress)
    : semanticProgress / kpLispReconstructedGlobalProgress;
  const width = input.slot.getBoundingClientRect().width || 720;
  const html = projector.render({
    operation: evaluation ? "evaluation" : "application",
    progress: localProgress,
    availableWidthPx: width
  });

  input.slot.innerHTML = `<style data-kp-lisp-material-surface-styles>${projector.css}</style><div data-kp-editor-lisp-material-surface data-kp-lisp-runtime-frame="${runtimeFrame.id}" data-kp-lisp-runtime-checkpoint="${runtimeFrame.checkpointId}">${html}</div>`;
  input.slot.dataset["kpEditorProgrammingContract"] =
    "kp.lisp-s-expression-material.v0";
}
