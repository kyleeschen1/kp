/// <reference types="vite/client" />

import {
  getKpEditorAnimationPlaybackSession,
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  createKpGenericSelectorAnnotatedLatex
} from "./generic-semantic-latex.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import {
  kpNativeKatexSuccessorMaterialJunctionProgress
} from "../rendering/native-katex-successor-synthesis.ts";
import {
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationStatePlan
} from "../reader/renderers/equation-render-plan.ts";
import {
  compileKpReaderEquationMaterialPlan
} from "../reader/renderers/equation-material-plan.ts";
import {
  createKpReaderEquationSceneCompositorSession,
  type KpReaderEquationMeasuredRendererSession
} from "../reader/renderers/equation-scene-compositor-adapter.ts";
import {
  createKpEquationStageMeasurementIdentity
} from "../reader/runtime/public-api.ts";
import type {
  KpSelectorAnnotatedLatex
} from "../rendering/selector-annotated-latex.ts";
import type {
  KpOperationEvaluationReferenceComparisonSession
} from "./operation-evaluation-reference-comparison.dev.ts";

interface OperationEvaluationSurfaceSession {
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingProgress: number;
  activeStage?: HTMLElement | undefined;
  playback?: KpReaderEquationMeasuredRendererSession | undefined;
  referenceComparison?:
    KpOperationEvaluationReferenceComparisonSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, OperationEvaluationSurfaceSession>();
const animationIdPrefix = "animation.operation-evaluation.";

export const kpEditorOperationEvaluationSurfaceAdapter:
KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.operation-evaluation.canonical-native-katex",
  slotKind: "equation",
  priority: 110,
  supports(state) {
    return state.animationId.startsWith(animationIdPrefix);
  },
  render({ player, slot, state }) {
    const playbackSession = getKpEditorAnimationPlaybackSession(player);
    if (playbackSession === undefined) return;
    let session = sessions.get(player);
    if (session === undefined) {
      session = {
        fontReadiness: createKpEquationFontReadiness(player.ownerDocument),
        generation: 0,
        pendingProgress: 0,
        disposed: false
      };
      sessions.set(player, session);
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeOperationEvaluationSurface(player, session!),
        { once: true }
      );
      const generation = ++session.generation;
      void prepareOperationEvaluationSurface({
        player,
        slot,
        session,
        generation,
        renderPlan: projectKpReaderEquationRenderPlan({
          animation: playbackSession.animation,
          // A single forward compilation owns both directions; rewind samples
          // its exact inverse instead of creating a second presentation route.
          runtimeFrame: {
            ...state.runtimeFrame,
            clock: {
              ...state.runtimeFrame.clock,
              direction: "forward",
              progress: 0.5
            }
          }
        })
      });
    }
    session.pendingProgress = state.direction === "forward"
      ? state.progress
      : 1 - state.progress;
    session.playback?.apply(session.pendingProgress);
    session.referenceComparison?.apply(session.pendingProgress);
    syncProgressTelemetry(player, session.activeStage, state, session);
  }
};

export function registerKpEditorOperationEvaluationSurfaceAdapter():
() => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorOperationEvaluationSurfaceAdapter
  );
}

async function prepareOperationEvaluationSurface(input: {
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly session: OperationEvaluationSurfaceSession;
  readonly generation: number;
  readonly renderPlan: KpReaderEquationRenderPlan;
}): Promise<void> {
  const transition = input.renderPlan.transitions[0];
  const synthesis =
    transition?.presentationPlan.planKind === "successor-synthesis"
      ? transition.presentationPlan.successorSyntheses[0]
      : undefined;
  if (
    transition === undefined ||
    input.renderPlan.transitions.length !== 1 ||
    transition.presentationPlan.planKind !== "successor-synthesis" ||
    transition.presentationPlan.successorSyntheses.length !== 1 ||
    synthesis === undefined
  ) {
    markCompilationFailure(
      input.player,
      input.slot,
      "Operation evaluation requires one registry-verified successor plan."
    );
    return;
  }
  const source = annotateEndpoint(transition.source);
  const target = annotateEndpoint(transition.target);
  const stage = input.slot.ownerDocument.createElement("div");
  stage.className =
    "editor-equation-stage kp-operation-evaluation-stage";
  stage.dataset["kpOperationEvaluationStage"] = "";
  stage.dataset["kpOperationEvaluationStatus"] = "preparing";
  stage.dataset["kpOperationEvaluationTransitionId"] = transition.id;
  stage.dataset["kpOperationEvaluationPresentationPlanId"] =
    transition.presentationPlan.successorSyntheses[0]
      .operationPresentationPlan.id;
  stage.dataset["kpOperationEvaluationPaintContinuityPlanId"] =
    transition.presentationPlan.successorSyntheses[0]
      .paintContinuityPlan.id;
  stage.dataset["kpOperationEvaluationTransferTopology"] =
    transition.presentationPlan.successorSyntheses[0]
      .paintContinuityPlan.carriers[0]!.transferTopology;
  stage.dataset["kpOperationEvaluationBoundaryProgress"] =
    String(kpNativeKatexSuccessorMaterialJunctionProgress);
  stage.setAttribute(
    "aria-label",
    `${source.map(({ rawLatex }) => rawLatex).join(" ")} evaluates to ` +
    target.map(({ rawLatex }) => rawLatex).join(" ")
  );
  stage.innerHTML = `
    <div class="editor-equation-stage__material-layer"
      data-kp-editor-equation-material-layer aria-hidden="true"></div>
    <div class="kp-operation-evaluation-stage__endpoint"
      data-kp-operation-evaluation-source aria-hidden="true">
      ${source.map((annotated) =>
        renderSelectorAnnotatedLatexToHtml(annotated)).join("")}
    </div>
    <div class="kp-operation-evaluation-stage__endpoint"
      data-kp-operation-evaluation-target aria-hidden="true">
      ${target.map((annotated) =>
        renderSelectorAnnotatedLatexToHtml(annotated)).join("")}
    </div>`;
  input.slot.replaceChildren(stage);
  bindEndpointOwnership(stage, source, "source");
  bindEndpointOwnership(stage, target, "target");

  try {
    const sourceRoot = required(
      stage,
      "[data-kp-operation-evaluation-source]"
    );
    const targetRoot = required(
      stage,
      "[data-kp-operation-evaluation-target]"
    );
    const [sourceScene, targetScene] = await Promise.all([
      settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "source",
        stage,
        root: sourceRoot,
        semanticEntityId: `${transition.id}.source`,
        presentationGroupId: `${transition.id}.source`,
        fontReadiness: input.session.fontReadiness
      }),
      settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "target",
        stage,
        root: targetRoot,
        semanticEntityId: `${transition.id}.target`,
        presentationGroupId: `${transition.id}.target`,
        fontReadiness: input.session.fontReadiness
      })
    ]);
    if (
      input.session.disposed ||
      input.session.generation !== input.generation
    ) {
      stage.remove();
      return;
    }
    const materialPlan = compileKpReaderEquationMaterialPlan(
      input.renderPlan
    );
    const playback = createKpReaderEquationSceneCompositorSession({
      renderPlan: input.renderPlan,
      materialPlan,
      transitionId: transition.id,
      motionMode: operationEvaluationMotionMode(input.player),
      measurementIdentity: createKpEquationStageMeasurementIdentity({
        coordinateSpaceId: `editor.${input.renderPlan.animationId}`,
        revision: input.session.fontReadiness.revision
      }),
      source: sourceScene,
      target: targetScene
    });
    input.session.playback?.dispose();
    input.session.playback = playback;
    input.session.activeStage = stage;
    stage.dataset["kpOperationEvaluationStatus"] = "ready";
    stage.dataset["kpOperationEvaluationPresentationMode"] =
      playback.presentationMode;
    playback.apply(input.session.pendingProgress);
    if (import.meta.env.DEV) {
      const {
        mountKpOperationEvaluationReferenceComparison
      } = await import(
        "./operation-evaluation-reference-comparison.dev.ts"
      );
      if (
        input.session.disposed ||
        input.session.generation !== input.generation
      ) {
        playback.dispose();
        stage.remove();
        return;
      }
      input.session.referenceComparison?.dispose();
      input.session.referenceComparison =
        mountKpOperationEvaluationReferenceComparison({
          slot: input.slot,
          currentStage: stage,
          source,
          target,
          synthesis
        });
      input.session.referenceComparison.apply(
        input.session.pendingProgress
      );
    }
    syncProgressTelemetry(
      input.player,
      stage,
      {
        direction:
          input.player.dataset["kpEditorAnimationDirection"] === "rewind"
            ? "rewind"
            : "forward",
        progress: Number(
          input.player.dataset["kpEditorAnimationProgress"] ?? 0
        )
      },
      input.session
    );
  } catch (error) {
    markCompilationFailure(
      input.player,
      input.slot,
      error instanceof Error ? error.message : "Unknown compositor error."
    );
  }
}

function annotateEndpoint(
  states: readonly KpReaderEquationStatePlan[]
): readonly KpSelectorAnnotatedLatex[] {
  return states.map((state) => {
    const annotated = createKpGenericSelectorAnnotatedLatex({
      objectId: state.objectId,
      latex: state.latex,
      selectors: state.selectors
    });
    if (annotated === undefined) {
      throw new Error(
        `Operation evaluation ${state.objectId} has no structural annotation.`
      );
    }
    return annotated;
  });
}

function bindEndpointOwnership(
  stage: HTMLElement,
  annotatedStates: readonly KpSelectorAnnotatedLatex[],
  side: "source" | "target"
): void {
  const root = required(
    stage,
    `[data-kp-operation-evaluation-${side}]`
  );
  root.dataset["kpSemanticEntityId"] = `${side}.endpoint`;
  root.dataset["kpPresentationGroupId"] = `${side}.endpoint`;
  for (const annotated of annotatedStates) {
    for (const annotation of annotated.annotations) {
      const element = root.querySelector<HTMLElement>(
        `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
      );
      if (element === null) {
        throw new Error(
          `Operation evaluation omitted selector ${annotation.selectorId}.`
        );
      }
      element.dataset["kpSemanticEntityId"] = annotation.selectorId;
      element.dataset["kpSemanticSelectorId"] = annotation.selectorId;
      element.dataset["kpPresentationGroupId"] =
        `${side}.selector.${annotation.selectorId}`;
    }
  }
}

function syncProgressTelemetry(
  player: HTMLElement,
  stage: HTMLElement | undefined,
  state: {
    readonly direction: "forward" | "rewind";
    readonly progress: number;
  },
  session: OperationEvaluationSurfaceSession
): void {
  player.dataset["kpOperationEvaluationContinuityStatus"] =
    stage?.dataset["kpOperationEvaluationStatus"] ?? "preparing";
  player.dataset["kpOperationEvaluationMappedProgress"] =
    String(session.pendingProgress);
  player.dataset["kpOperationEvaluationDirection"] = state.direction;
  if (stage === undefined) return;
  stage.dataset["kpOperationEvaluationMappedProgress"] =
    String(session.pendingProgress);
  stage.dataset["kpOperationEvaluationDirection"] = state.direction;
  stage.dataset["kpOperationEvaluationBoundarySide"] =
    session.pendingProgress <
      kpNativeKatexSuccessorMaterialJunctionProgress
      ? "source"
      : session.pendingProgress ===
          kpNativeKatexSuccessorMaterialJunctionProgress
        ? "junction"
        : "target";
}

function operationEvaluationMotionMode(
  player: HTMLElement
): "continuous" | "essential" | "checkpoint" {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "static"
    ? "checkpoint"
    : mode === "reduced-motion"
      ? "essential"
      : "continuous";
}

function markCompilationFailure(
  player: HTMLElement,
  slot: HTMLElement,
  message: string
): void {
  player.dataset["kpOperationEvaluationContinuityStatus"] = "error";
  slot.dataset["kpEditorAnimationAdapterStatus"] = "error";
  slot.dataset["kpOperationEvaluationError"] = message;
}

function disposeOperationEvaluationSurface(
  player: HTMLElement,
  session: OperationEvaluationSurfaceSession
): void {
  session.disposed = true;
  session.generation += 1;
  session.referenceComparison?.dispose();
  session.playback?.dispose();
  session.fontReadiness.dispose();
  session.activeStage?.remove();
  sessions.delete(player);
}

function required(
  root: ParentNode,
  selector: string
): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Operation evaluation surface is missing ${selector}.`);
  }
  return element;
}
