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
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import {
  kpOpaqueGatherAndRecognizeRecognitionProgress,
  kpOpaqueGatherAndRecognizeSourceRetirementProgress
} from "../animation/successor-synthesis.ts";
import {
  kpThreeSixthsEvaluationAnimationId,
  kpTwoTimesThreeEvaluationAnimationId
} from "../animation/operation-evaluation-adapter.ts";
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
import type {
  KpOperationEvaluationEndpointMicroscopeSession
} from "./operation-evaluation-endpoint-microscope.dev.ts";
import type {
  KpOperationEvaluationFamilyComparisonSession
} from "./operation-evaluation-family-comparison.dev.ts";

interface OperationEvaluationSurfaceSession {
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingProgress: number;
  activeStage?: HTMLElement | undefined;
  measurementCertificate?: OperationEvaluationMeasurementCertificate | undefined;
  playback?: KpReaderEquationMeasuredRendererSession | undefined;
  referenceComparison?:
    KpOperationEvaluationReferenceComparisonSession | undefined;
  familyComparison?:
    KpOperationEvaluationFamilyComparisonSession | undefined;
  endpointMicroscope?:
    KpOperationEvaluationEndpointMicroscopeSession | undefined;
  disposed: boolean;
}

interface OperationEvaluationMeasurementCertificate {
  readonly host: HTMLElement;
  readonly hostId: string;
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly fontRevision: number;
  readonly generation: number;
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
    if (measurementCertificateIsCurrent(session)) {
      session.playback?.apply(session.pendingProgress);
      session.referenceComparison?.apply(session.pendingProgress);
      session.familyComparison?.apply(session.pendingProgress);
    } else if (session.playback !== undefined) {
      invalidateOperationEvaluationMeasurement(player, session);
    }
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
  try {
    const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
    if (
      input.session.disposed ||
      input.session.generation !== input.generation
    ) {
      return;
    }
    let stageHost = input.slot;
    const measurementHostId =
      `operation-evaluation.${input.renderPlan.animationId}.` +
      `generation-${input.generation}`;
    let familyReviewModule:
      typeof import("./operation-evaluation-family-comparison.dev.ts") |
      undefined;
    if (
      import.meta.env.DEV &&
      (
        input.renderPlan.animationId === kpTwoTimesThreeEvaluationAnimationId ||
        input.renderPlan.animationId === kpThreeSixthsEvaluationAnimationId
      )
    ) {
      familyReviewModule = await import(
        "./operation-evaluation-family-comparison.dev.ts"
      );
      if (
        input.session.disposed ||
        input.session.generation !== input.generation
      ) {
        return;
      }
      input.session.referenceComparison?.dispose();
      input.session.referenceComparison = undefined;
      input.session.familyComparison?.dispose();
      input.session.familyComparison =
        familyReviewModule.mountKpOperationEvaluationFamilyComparison({
          slot: input.slot,
          measurementHostId
        });
      stageHost = input.session.familyComparison.currentStageHost;
    } else if (import.meta.env.DEV) {
      const {
        mountKpOperationEvaluationReferenceComparison
      } = await import(
        "./operation-evaluation-reference-comparison.dev.ts"
      );
      if (
        input.session.disposed ||
        input.session.generation !== input.generation
      ) {
        return;
      }
      input.session.referenceComparison?.dispose();
      input.session.referenceComparison =
        mountKpOperationEvaluationReferenceComparison({
          slot: input.slot,
          source,
          target,
          synthesis,
          measurementHostId
        });
      stageHost = input.session.referenceComparison.currentStageHost;
    } else {
      stageHost.dataset["kpOperationEvaluationMeasurementHostId"] =
        measurementHostId;
    }

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
      String(kpOpaqueGatherAndRecognizeRecognitionProgress);
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
    // Native scenes must settle in their final containing block. Moving this
    // stage afterward invalidates every paint-space coordinate even if wrapper
    // rectangles still look plausible.
    stageHost.replaceChildren(stage);
    bindEndpointOwnership(stage, source, transition.source, "source");
    bindEndpointOwnership(stage, target, transition.target, "target");

    const sourceRoot = required(
      stage,
      "[data-kp-operation-evaluation-source]"
    );
    const targetRoot = required(
      stage,
      "[data-kp-operation-evaluation-target]"
    );
    const [sourceScene, targetScene] = await Promise.all([
      nativeKatex.observe.settleAndObserve({
        endpoint: "source",
        stage,
        root: sourceRoot,
        semanticEntityId: `${transition.id}.source`,
        presentationGroupId: `${transition.id}.source`,
        fontReadiness: input.session.fontReadiness
      }),
      nativeKatex.observe.settleAndObserve({
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
    if (import.meta.env.DEV) {
      const {
        mountKpOperationEvaluationEndpointMicroscope
      } = await import(
        "./operation-evaluation-endpoint-microscope.dev.ts"
      );
      if (
        input.session.disposed ||
        input.session.generation !== input.generation
      ) {
        stage.remove();
        return;
      }
      input.session.endpointMicroscope?.dispose();
      input.session.endpointMicroscope =
        mountKpOperationEvaluationEndpointMicroscope({
          stage,
          targetScene
        });
    }
    const materialPlan = compileKpReaderEquationMaterialPlan(
      input.renderPlan
    );
    const measurementCertificate =
      createOperationEvaluationMeasurementCertificate({
        stage,
        host: stageHost,
        hostId: measurementHostId,
        fontRevision: input.session.fontReadiness.revision,
        generation: input.generation
      });
    const canonicalPlayback = createKpReaderEquationSceneCompositorSession({
      renderPlan: input.renderPlan,
      materialPlan,
      transitionId: transition.id,
      motionMode: operationEvaluationMotionMode(input.player),
      measurementIdentity: createKpEquationStageMeasurementIdentity({
        coordinateSpaceId: [
          `editor.${input.renderPlan.animationId}`,
          measurementCertificate.hostId,
          `${measurementCertificate.width}x${measurementCertificate.height}`,
          `dpr-${measurementCertificate.devicePixelRatio}`,
          `generation-${measurementCertificate.generation}`
        ].join("."),
        revision: measurementCertificate.fontRevision
      }),
      source: sourceScene,
      target: targetScene,
      nativeKatex
    });
    const familyPlayback =
      familyReviewModule === undefined ||
      input.session.familyComparison === undefined
        ? undefined
        : familyReviewModule.createKpOperationEvaluationFamilyPlayback({
            stage,
            base: canonicalPlayback,
            initialFamily: input.session.familyComparison.selectedFamily
          });
    const playback = familyPlayback ?? canonicalPlayback;
    if (
      familyReviewModule !== undefined &&
      input.session.familyComparison !== undefined
    ) {
      input.session.familyComparison.onFamilyChange((family) => {
        if (
          input.session.disposed ||
          input.session.generation !== input.generation
        ) return;
        familyPlayback?.selectFamily(family);
        playback.apply(input.session.pendingProgress);
        input.session.familyComparison?.apply(input.session.pendingProgress);
      });
    }
    input.session.playback?.retire({
      kind: "native-katex-paint-preserving-retirement",
      reason: "scene-replaced",
      structuralSuccession: "retire-preserving-paint"
    });
    input.session.playback = playback;
    input.session.activeStage = stage;
    input.session.measurementCertificate = measurementCertificate;
    stage.dataset["kpOperationEvaluationStatus"] = "ready";
    stage.dataset["kpOperationEvaluationPresentationMode"] =
      playback.presentationMode;
    input.session.referenceComparison?.bindCurrentStage(stage);
    input.session.familyComparison?.bindCurrentStage(stage);
    playback.apply(input.session.pendingProgress);
    input.session.referenceComparison?.apply(
      input.session.pendingProgress
    );
    input.session.familyComparison?.apply(input.session.pendingProgress);
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
      // Structural paint is bound to the native KaTeX node after rendering;
      // wrapping a command such as \frac would incorrectly claim the entire
      // expression as the operator instead of the actual rule paint.
      selectors: state.selectors.filter(({ kind }) => kind !== "artifact")
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
  states: readonly KpReaderEquationStatePlan[],
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
  bindStructuralPaintOwnership(root, states, side);
}

function bindStructuralPaintOwnership(
  root: HTMLElement,
  states: readonly KpReaderEquationStatePlan[],
  side: "source" | "target"
): void {
  const artifacts = states.flatMap((state) =>
    state.selectors.filter(({ kind }) => kind === "artifact")
  );
  // A structural atom inside one semantic result (for example the bar in the
  // reduced target fraction) inherits that result owner's identity. Only
  // independently declared artifacts need a separate native paint binding.
  if (artifacts.length === 0) return;
  const fractionRules = artifacts.filter(
    ({ label }) => label === "fraction-rule"
  );
  if (fractionRules.length !== artifacts.length) {
    const unsupported = artifacts.find(
      ({ label }) => label !== "fraction-rule"
    );
    throw new Error(
      `Operation evaluation cannot bind structural paint ` +
      `${unsupported?.id ?? "unknown"} without a canonical artifact role.`
    );
  }
  const nativeRules = [
    ...root.querySelectorAll<HTMLElement>(".frac-line")
  ];
  if (nativeRules.length !== fractionRules.length) {
    throw new Error(
      `Operation evaluation expected ${fractionRules.length} native ` +
      `fraction rules, received ${nativeRules.length}.`
    );
  }
  fractionRules.forEach((selector, index) => {
    const element = nativeRules[index]!;
    element.dataset["kpSemanticEntityId"] = selector.id;
    element.dataset["kpSemanticSelectorId"] = selector.id;
    element.dataset["kpPresentationGroupId"] =
      `${side}.selector.${selector.id}`;
    element.dataset["kpOperationEvaluationStructuralRole"] =
      "fraction-rule";
  });
}

function createOperationEvaluationMeasurementCertificate(input: {
  readonly stage: HTMLElement;
  readonly host: HTMLElement;
  readonly hostId: string;
  readonly fontRevision: number;
  readonly generation: number;
}): OperationEvaluationMeasurementCertificate {
  if (input.stage.parentElement !== input.host || !input.stage.isConnected) {
    throw new Error(
      "Operation evaluation cannot certify a detached or reparented stage."
    );
  }
  const certificate = {
    host: input.host,
    hostId: input.hostId,
    width: input.host.clientWidth,
    height: input.host.clientHeight,
    devicePixelRatio:
      input.host.ownerDocument.defaultView?.devicePixelRatio ?? 1,
    fontRevision: input.fontRevision,
    generation: input.generation
  } satisfies OperationEvaluationMeasurementCertificate;
  input.host.dataset["kpOperationEvaluationMeasurementHostId"] =
    certificate.hostId;
  input.stage.dataset["kpOperationEvaluationMeasurementHostId"] =
    certificate.hostId;
  input.stage.dataset["kpOperationEvaluationMeasurementWidth"] =
    String(certificate.width);
  input.stage.dataset["kpOperationEvaluationMeasurementHeight"] =
    String(certificate.height);
  input.stage.dataset["kpOperationEvaluationMeasurementDpr"] =
    String(certificate.devicePixelRatio);
  input.stage.dataset["kpOperationEvaluationMeasurementFontRevision"] =
    String(certificate.fontRevision);
  input.stage.dataset["kpOperationEvaluationMeasurementGeneration"] =
    String(certificate.generation);
  return certificate;
}

function measurementCertificateIsCurrent(
  session: OperationEvaluationSurfaceSession
): boolean {
  const certificate = session.measurementCertificate;
  const stage = session.activeStage;
  if (certificate === undefined || stage === undefined) return false;
  return !session.disposed &&
    session.generation === certificate.generation &&
    stage.isConnected &&
    stage.parentElement === certificate.host &&
    certificate.host.isConnected &&
    certificate.host.dataset["kpOperationEvaluationMeasurementHostId"] ===
      certificate.hostId &&
    certificate.host.clientWidth === certificate.width &&
    certificate.host.clientHeight === certificate.height &&
    (certificate.host.ownerDocument.defaultView?.devicePixelRatio ?? 1) ===
      certificate.devicePixelRatio &&
    session.fontReadiness.revision === certificate.fontRevision;
}

function invalidateOperationEvaluationMeasurement(
  player: HTMLElement,
  session: OperationEvaluationSurfaceSession
): void {
  const stage = session.activeStage;
  session.endpointMicroscope?.dispose();
  session.endpointMicroscope = undefined;
  session.playback?.retire({
    kind: "native-katex-paint-preserving-retirement",
    reason: "measurement-invalidated",
    structuralSuccession: "retire-preserving-paint"
  });
  session.playback = undefined;
  session.measurementCertificate = undefined;
  player.dataset["kpOperationEvaluationContinuityStatus"] =
    "measurement-stale";
  if (stage === undefined) return;
  stage.dataset["kpOperationEvaluationStatus"] = "measurement-stale";
  // This still-mounted fallback is presentation policy, not renderer cleanup.
  // Clear transient owners here before selecting the source checkpoint so a
  // generic session retirement never acquires hidden reset-to-source authority.
  stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  )?.replaceChildren();
  const source = stage.querySelector<HTMLElement>(
    "[data-kp-operation-evaluation-source]"
  );
  const target = stage.querySelector<HTMLElement>(
    "[data-kp-operation-evaluation-target]"
  );
  const showTarget = session.pendingProgress >= 0.5;
  if (source !== null) source.style.opacity = showTarget ? "0" : "1";
  if (target !== null) target.style.opacity = showTarget ? "1" : "0";
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
      kpOpaqueGatherAndRecognizeRecognitionProgress
      ? "source"
      : session.pendingProgress <
          kpOpaqueGatherAndRecognizeSourceRetirementProgress
        ? "co-presence"
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
  session.familyComparison?.dispose();
  session.endpointMicroscope?.dispose();
  session.playback?.retire({
    kind: "native-katex-paint-preserving-retirement",
    reason: "surface-disposed",
    structuralSuccession: "retire-preserving-paint"
  });
  session.measurementCertificate = undefined;
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
