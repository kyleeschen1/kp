import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import {
  measureKpEquationTransitionGeometry,
} from "../rendering/equation-motion-dom.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../domain-ir/public-api.ts";
import type { KpSelectorAnnotatedLatex } from "../rendering/selector-annotated-latex.ts";
import {
  projectKpEditorEquationRuntimeFrame,
  type KpEditorEquationRuntimeFrameProjection,
  type KpEditorEquationObjectProjection
} from "./equation-runtime-frame-projection.ts";
import {
  createKpEditorEquationTransitionMotifFrame,
  type KpEditorEquationTransitionMotifFrame
} from "./equation-transition-motifs.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  dispatchKpEditorAnimationPlaybackAction,
  getKpEditorAnimationPlaybackSession
} from "./animation-player-controller.ts";
import {
  syncKpEditorEquationMaterialContinuityInspection
} from "./equation-material-continuity-inspector.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  createKpEditorSolveXSharedPlayerFrame,
  type KpEditorSolveXSharedPlayerFrame
} from "./solve-x-shared-player.ts";
import {
  applyKpEditorSemanticEquationTokenFrame,
  createKpEditorSemanticEquationTokenFrame
} from "./semantic-equation-player-adapter.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "../rendering/solve-x-selector-annotated-latex.ts";
import {
  bindKpFractionStructuralMotionIds,
  createKpFractionSelectorAnnotatedLatex
} from "./fraction-semantic-latex.ts";
import { createKpFunctionWrapSelectorAnnotatedLatex } from "./function-wrap-semantic-latex.ts";
import { createKpDistributionSelectorAnnotatedLatex } from "./distribution-semantic-latex.ts";
import {
  bindKpExponentRadicalStructuralMotionIds,
  createKpExponentRadicalSelectorAnnotatedLatex
} from "./exponent-radical-semantic-latex.ts";
import { createKpInequalitySelectorAnnotatedLatex } from "./inequality-semantic-latex.ts";
import {
  bindKpMatrixStructuralMotionIds,
  createKpMatrixSelectorAnnotatedLatex
} from "./matrix-semantic-latex.ts";
import { createKpGenericSelectorAnnotatedLatex } from "./generic-semantic-latex.ts";
import {
  bindKpGeneratedLinearSolveStructuralMotionIds,
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../rendering/generated-linear-solve-selector-annotated-latex.ts";
import {
  createKpFractionCompositionSelectorAnnotatedLatex
} from "../rendering/fraction-composition-selector-annotated-latex.ts";
import {
  createKpDerivativePowerSelectorAnnotatedLatex
} from "./derivative-power-semantic-latex.ts";
import {
  createKpDerivativeSumSelectorAnnotatedLatex
} from "./derivative-sum-semantic-latex.ts";
import {
  createKpAntiderivativePowerSelectorAnnotatedLatex
} from "./antiderivative-power-semantic-latex.ts";
import {
  createKpPrecomputedEquationMotionPlan,
  type KpPrecomputedEquationMotionPlan
} from "../rendering/precomputed-equation-motion.ts";
import {
  createKpFunctionWrapChoreography,
  sampleKpFunctionWrapChoreography,
  type KpFunctionWrapChoreography,
  type KpFunctionWrapChoreographyFrame
} from "../animation/function-wrap-choreography.ts";
import {
  bindKpFocusFrameToCss,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "../animation/focus-profile.ts";
import {
  createKpRadicalSuccessionChoreography,
  sampleKpRadicalSuccessionChoreography,
  type KpRadicalSuccessionChoreography,
  type KpRadicalSuccessionChoreographyFrame
} from "../animation/radical-succession-choreography.ts";
import {
  kpRadicalSourceNativeSettlementEnd,
  kpRadicalSourceNativeSettlementStart,
  sampleKpRadicalCompositeNativeSettlement,
  sampleKpRadicalNativeSettlement
} from "../animation/radical-native-settlement.ts";
import {
  kpRadicalConventionalMorphProfile
} from "../animation/radical-morph-profile.ts";
import {
  disposeKpRadicalWebglMorph,
  measureKpRadicalWebglInk,
  syncKpRadicalWebglMorph,
  type KpRadicalWebglMorphSyncResult
} from "../rendering/radical-webgl-morph.ts";
import {
  createKpLinearRearrangementChoreography,
  sampleKpLinearRearrangementChoreography,
  type KpLinearRearrangementChoreography,
  type KpLinearRearrangementChoreographyFrame,
  type KpLinearRearrangementStep
} from "../animation/linear-rearrangement-choreography.ts";
import {
  kpEquationWitnessedAnnihilationRuntime
} from "../rendering/equation-witnessed-annihilation-runtime.ts";
// The concrete equation adapter owns renderer registration; neutral catalog
// loading must not trigger presentation implementations by side effect.
import "../rendering/equation-witnessed-annihilation-register.ts";
import {
  kpEquationPresentationPolicy
} from "../rendering/equation-presentation-policy.ts";
import {
  createKpDotProductTraversalChoreography,
  sampleKpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreographyFrame
} from "../animation/dot-product-traversal-choreography.ts";
import {
  createKpMatrixVectorCompositionChoreography,
  sampleKpMatrixVectorCompositionChoreography,
  type KpMatrixVectorCompositionChoreography,
  type KpMatrixVectorCompositionChoreographyFrame
} from "../animation/matrix-vector-composition-choreography.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame,
  type KpMatrixLinearMapFrame,
  type KpMatrixLinearMapPlan
} from "../animation/matrix-linear-map-frame.ts";
import {
  createKpMatrixMatrixCompositionChoreography,
  sampleKpMatrixMatrixCompositionChoreography,
  type KpMatrixMatrixCompositionChoreography,
  type KpMatrixMatrixCompositionChoreographyFrame
} from "../animation/matrix-matrix-composition-choreography.ts";
import {
  applyKpAnimationEpistemicBranch,
  sampleKpAnimationEpistemicBranch,
  type KpEpistemicBranchRuntimeFrame
} from "../animation/epistemic-branch-runtime.ts";
import {
  deriveKpOrganicMotionSignature,
  sampleKpOrganicMotion,
  sampleKpOrganicProgress
} from "../animation/organic-motion-primitives.ts";
import {
  projectKpGestaltOffsetToPath,
  resolveKpGestaltMotionEligibility
} from "../animation/gestalt-motion-eligibility.ts";
import {
  sampleKpBridgedChoreographySequence,
  type KpBridgedChoreographyFrame
} from "../animation/choreography-envelope-bridge.ts";
import {
  kpBaseGestaltStyleCatalog
} from "../animation/gestalt-base-styles.ts";
import type { KpGestaltStyleChannels } from "../animation/gestalt-style.ts";
import {
  syncKpEquationMaterialLayer,
  type KpEquationMaterialLayerOwnerFrame
} from "../rendering/equation-material-layer-dom.ts";
import {
  invalidateKpEquationNativeFit,
  syncKpEquationNativeFit
} from "./equation-native-fit.ts";
import {
  disposeKpEditorEquationStageHotPathCache,
  getKpEditorEquationStageHotPathCache,
  invalidateKpEditorEquationStageHotPathCache,
  isKpEditorEquationStageHotPathCacheValid,
  type KpEditorEquationStageCacheInvalidationReason,
  type KpEditorEquationStageHotPathCache
} from "./equation-stage-hot-path-cache.ts";
import {
  decideKpEditorAnimationDiagnosticsCadence,
  type KpEditorAnimationDiagnosticsCadenceState
} from "./animation-diagnostics-cadence.ts";
import {
  compileKpDerivativePowerChoreography,
  sampleKpDerivativePowerChoreography,
  type KpDerivativePowerChoreographyFrame,
  type KpDerivativePowerChoreographyPlan
} from "../animation/derivative-power-choreography.ts";
import {
  resolveKpDerivativePowerRuleSemanticRoles
} from "../semantic/derivative-power-rule-semantics.ts";
import type {
  KpDistributionChoreographyFrame
} from "../animation/distribution-choreography.ts";
import type {
  KpFactoringChoreographyFrame
} from "../animation/factoring-choreography.ts";
import type {
  KpFractionChoreographyFrame,
  KpFractionChoreographyKind
} from "../animation/fraction-choreography.ts";
import type {
  KpExponentLawChoreographyFrame,
  KpExponentLawChoreographyKind
} from "../animation/exponent-law-choreography.ts";
import type {
  KpIdentityAbsorptionChoreographyFrame,
  KpIdentityAbsorptionChoreographyKind
} from "../animation/identity-absorption-choreography.ts";
import type {
  KpInequalityPivotChoreographyFrame
} from "../animation/inequality-pivot-choreography.ts";

const semanticMotionPlanCache = new WeakMap<HTMLElement, {
  readonly contentKey: string;
  readonly plans: ReadonlyMap<number, KpPrecomputedEquationMotionPlan>;
}>();
const continuityCadenceStates = new WeakMap<
  HTMLElement,
  KpEditorAnimationDiagnosticsCadenceState
>();
const gestaltMotionTokenCache = new WeakMap<HTMLElement, {
  readonly contentKey: string;
  readonly tokens: readonly HTMLElement[];
}>();
const functionWrapChoreographyCache =
  new Map<string, KpFunctionWrapChoreography>();
const radicalSuccessionChoreographyCache =
  new Map<string, KpRadicalSuccessionChoreography>();
const linearRearrangementChoreographyCache =
  new Map<string, KpLinearRearrangementChoreography>();
const dotProductTraversalChoreographyCache =
  new Map<string, KpDotProductTraversalChoreography>();
const matrixVectorCompositionChoreographyCache =
  new Map<string, KpMatrixVectorCompositionChoreography>();
const matrixLinearMapPlanCache = new Map<string, KpMatrixLinearMapPlan>();
const matrixMatrixCompositionChoreographyCache =
  new Map<string, KpMatrixMatrixCompositionChoreography>();
const derivativePowerChoreographyCache =
  new Map<string, KpDerivativePowerChoreographyPlan>();

export interface KpEditorEquationStageFrame {
  readonly stageIdentityKey: string;
  readonly contentKey: string;
  readonly materialIdentityKey: string;
  readonly mathLayout: "display" | "inline";
  readonly projection: KpEditorEquationRuntimeFrameProjection;
  readonly globalProgress: number;
  readonly semanticProgress: number;
  readonly localProgress: number;
  readonly easedProgress: number;
  readonly motifs: readonly KpEditorEquationTransitionMotifFrame[];
  readonly epistemicBranch?: KpEpistemicBranchRuntimeFrame | undefined;
  readonly solveX?: KpEditorSolveXSharedPlayerFrame | undefined;
  readonly functionWrap?: {
    readonly choreography: KpFunctionWrapChoreography;
    readonly frame: KpFunctionWrapChoreographyFrame;
  } | undefined;
  readonly radicalSuccession?: {
    readonly choreography: KpRadicalSuccessionChoreography;
    readonly frame: KpRadicalSuccessionChoreographyFrame;
  } | undefined;
  readonly linearRearrangement?: {
    readonly step: KpLinearRearrangementStep;
    readonly frame: KpLinearRearrangementChoreographyFrame;
    readonly sequenceFrame: KpBridgedChoreographyFrame;
  } | undefined;
  readonly dotProductTraversal?: {
    readonly choreography: KpDotProductTraversalChoreography;
    readonly frame: KpDotProductTraversalChoreographyFrame;
  } | undefined;
  readonly matrixVectorComposition?: {
    readonly choreography: KpMatrixVectorCompositionChoreography;
    readonly frame: KpMatrixVectorCompositionChoreographyFrame;
    readonly rank6Plan?: KpMatrixLinearMapPlan | undefined;
    readonly rank6Frame?: KpMatrixLinearMapFrame | undefined;
  } | undefined;
  readonly matrixMatrixComposition?: {
    readonly choreography: KpMatrixMatrixCompositionChoreography;
    readonly frame: KpMatrixMatrixCompositionChoreographyFrame;
  } | undefined;
  readonly derivativePower?: {
    readonly plan: KpDerivativePowerChoreographyPlan;
    readonly frame: KpDerivativePowerChoreographyFrame;
  } | undefined;
}

export function createKpEditorEquationStageFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
  readonly authoringRevision?: number | undefined;
  readonly gestaltChannels?: KpGestaltStyleChannels | undefined;
  readonly mathLayout?: "display" | "inline" | undefined;
}): KpEditorEquationStageFrame {
  const projection = projectKpEditorEquationRuntimeFrame({
    animation: input.animation,
    runtimeFrame: input.state.runtimeFrame
  });
  const description = describeKpAnimationAssetTransformationTree(input.animation);
  const phaseCount = input.state.direction === "forward"
    ? description.forwardPhases.length
    : description.rewindPhases.length;
  const localProgress = phaseCount <= 1
    ? input.state.progress
    : Math.min(
        1,
        Math.max(
          0,
          input.state.progress * phaseCount - input.state.runtimeFrame.phase.phaseIndex
        )
      );

  const easedProgress = localProgress * localProgress * (3 - 2 * localProgress);
  const semanticProgress = input.state.direction === "forward"
    ? input.state.progress
    : 1 - input.state.progress;
  const epistemicBranch = sampleKpAnimationEpistemicBranch({
    animation: input.animation,
    progress: semanticProgress
  });
  const solveX = createKpEditorSolveXSharedPlayerFrame(input);
  const functionWrap = createFunctionWrapFrame(
    input.animation,
    input.state,
    localProgress
  );
  const radicalSuccession = createRadicalSuccessionFrame(
    input.animation,
    input.state,
    localProgress
  );
  const linearRearrangement = createLinearRearrangementFrame(
    input.animation,
    input.state,
    projection.transitions[0]?.id,
    localProgress
  );
  const dotProductTraversal = createDotProductTraversalFrame(
    input.animation,
    input.state,
    projection.transitions[0]?.id,
    localProgress
  );
  const matrixVectorComposition = createMatrixVectorCompositionFrame(
    input.animation,
    input.state,
    projection.transitions[0]?.id,
    localProgress
  );
  const matrixMatrixComposition = createMatrixMatrixCompositionFrame(
    input.animation,
    input.state,
    projection.transitions[0]?.id,
    localProgress
  );
  const derivativePower = createDerivativePowerFrame(
    input.animation,
    input.state,
    projection.transitions[0]?.id,
    localProgress
  );
  const stageIdentityKey = projection.animationId;
  const mathLayout = input.mathLayout ?? "display";
  const contentKey = `${projection.direction}:${projection.transitions
    .map((transition) => transition.id)
    .join(":")}:authoring-${input.authoringRevision ?? 0}:math-${mathLayout}`;
  const materialIdentityKey = `${projection.animationId}:${projection.transitions
    .map((transition) => transition.id)
    .join(":")}:authoring-${input.authoringRevision ?? 0}`;

  return {
    stageIdentityKey,
    contentKey,
    materialIdentityKey,
    mathLayout,
    projection,
    globalProgress: input.state.progress,
    semanticProgress,
    localProgress,
    easedProgress,
    ...(epistemicBranch === undefined ? {} : { epistemicBranch }),
    motifs: projection.transitions.map((transition) =>
      createKpEditorEquationTransitionMotifFrame({
        transition,
        progress: easedProgress
      })
    ),
    ...(solveX === undefined ? {} : { solveX }),
    ...(functionWrap === undefined ? {} : { functionWrap }),
    ...(radicalSuccession === undefined ? {} : { radicalSuccession }),
    ...(linearRearrangement === undefined ? {} : { linearRearrangement }),
    ...(dotProductTraversal === undefined ? {} : { dotProductTraversal }),
    ...(matrixVectorComposition === undefined
      ? {}
      : { matrixVectorComposition }),
    ...(matrixMatrixComposition === undefined
      ? {}
      : { matrixMatrixComposition }),
    ...(derivativePower === undefined ? {} : { derivativePower })
  };
}

export const kpEditorEquationSurfaceAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.equation.katex",
  slotKind: "equation",
  priority: 0,
  supports(state) {
    return state.surface.slotKinds.includes("equation");
  },
  render({ player, slot, state }) {
    const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
    if (animation === undefined) {
      renderUnavailable(slot, `Missing equation animation ${state.animationId}.`);
      return;
    }

    const authoringRevision = Number(
      player.dataset["kpEditorAnimationAuthoringRevision"] ?? 0
    );
    const gestaltChannels = selectedGestaltChannels(player);
    const frame = createKpEditorEquationStageFrame({
      animation,
      state,
      authoringRevision,
      gestaltChannels,
      mathLayout:
        player.dataset["kpEditorAnimationMathLayout"] === "inline"
          ? "inline"
          : "display"
    });
    if (frame.projection.transitions.length === 0) {
      renderUnavailable(
        slot,
        frame.projection.diagnostics[0]?.message ?? "No active equation transition."
      );
      return;
    }

    let stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");

    let contentChanged = false;
    if (stage?.dataset["kpEditorEquationStageIdentityKey"] !== frame.stageIdentityKey) {
      if (stage !== null) {
        disposeKpRadicalWebglMorph(stage);
        disposeKpEditorEquationStageHotPathCache(stage);
      }
      slot.innerHTML = renderStage(frame);
      stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");
      contentChanged = true;
    } else if (stage.dataset["kpEditorEquationContentKey"] !== frame.contentKey) {
      if (
        stage.dataset["kpEditorEquationMaterialIdentityKey"] !==
          frame.materialIdentityKey
      ) {
        disposeKpRadicalWebglMorph(stage);
      }
      invalidateKpEditorEquationStageHotPathCache(stage, "content");
      replaceStageContent(stage, frame);
      contentChanged = true;
    }

    if (stage === null) return;

    const cacheReady = isKpEditorEquationStageHotPathCacheValid(
      stage,
      frame.contentKey
    );
    if (contentChanged || !cacheReady) {
      resetEquationStageForMeasurement(stage);
      const nativeFit = syncKpEquationNativeFit(stage);
      if (nativeFit.changed) {
        invalidateKpEditorEquationStageHotPathCache(stage, "native-fit");
        semanticMotionPlanCache.delete(stage);
      }
    }
    const hotPath = getKpEditorEquationStageHotPathCache({
      stage,
      contentKey: frame.contentKey,
      onInvalidate: invalidateEquationStageMeasurements
    });

    stage.dataset["kpEditorEquationPhaseId"] = frame.projection.phaseId;
    stage.dataset["kpEditorEquationGlobalProgress"] =
      String(frame.globalProgress);
    stage.dataset["kpEditorEquationSemanticProgress"] =
      String(frame.semanticProgress);
    stage.dataset["kpEditorEquationLocalProgress"] = String(frame.localProgress);
    stage.dataset["kpEditorEquationGestaltStyle"] =
      player?.dataset["kpEditorAnimationGestaltSelectedStyle"] ?? "unresolved";
    stage.style.setProperty("--kp-editor-equation-progress", String(frame.easedProgress));
    syncSolveXSequence(stage, frame.solveX);
    frame.projection.transitions.forEach((transition, index) => {
      const transitionNodes = hotPath.transitions[index];
      const motif = frame.motifs[index];
      if (transitionNodes === undefined || motif === undefined) {
        return;
      }
      const transitionElement = transitionNodes.element;

      transitionElement.dataset["kpEditorEquationMotif"] = motif.kind;
      // Fraction composition can expose annotated focus identities now, but
      // its structural fraction rules still use the established layer-motion
      // path until their token geometry is promoted as a separate renderer slice.
      const semanticMotionApplied = transition.semanticStatus === "ready" &&
        state.animationId !==
          "animation.fraction-composition.two-thirds-solve" &&
        applySemanticTokenMotion({
          stage,
          transitionElement,
          transitionIndex: index,
          animation,
          state,
          frame
        });
      transitionElement.dataset["kpEditorEquationSemanticMotion"] = semanticMotionApplied
        ? "active"
        : "fallback";
      if (!semanticMotionApplied) {
        applyLayerMotion(
          transitionNodes.source,
          motif.source
        );
        applyLayerMotion(
          transitionNodes.target,
          motif.target
        );
      }
      if (index === 0 && frame.functionWrap !== undefined) {
        applyFunctionWrapChoreography({
          transitionElement,
          direction: state.direction,
          choreography: frame.functionWrap.choreography,
          frame: frame.functionWrap.frame
        });
      }
      if (index === 0 && frame.radicalSuccession !== undefined) {
        applyRadicalSuccessionChoreography({
          transitionElement,
          direction: state.direction,
          choreography: frame.radicalSuccession.choreography,
          frame: frame.radicalSuccession.frame
        });
      }
      if (index === 0 && frame.linearRearrangement !== undefined) {
        applyLinearRearrangementChoreography({
          transitionElement,
          direction: state.direction,
          step: frame.linearRearrangement.step,
          frame: frame.linearRearrangement.frame,
          sequenceFrame: frame.linearRearrangement.sequenceFrame
        });
      }
      if (index === 0 && frame.dotProductTraversal !== undefined) {
        applyDotProductTraversalChoreography({
          transitionElement,
          direction: state.direction,
          choreography: frame.dotProductTraversal.choreography,
          frame: frame.dotProductTraversal.frame
        });
      }
      if (index === 0 && frame.matrixVectorComposition !== undefined) {
        applyMatrixVectorCompositionChoreography({
          transitionElement,
          direction: state.direction,
          choreography: frame.matrixVectorComposition.choreography,
          frame: frame.matrixVectorComposition.frame,
          rank6Plan: frame.matrixVectorComposition.rank6Plan,
          rank6Frame: frame.matrixVectorComposition.rank6Frame
        });
      }
      if (index === 0 && frame.matrixMatrixComposition !== undefined) {
        applyMatrixMatrixCompositionChoreography({
          transitionElement,
          direction: state.direction,
          choreography: frame.matrixMatrixComposition.choreography,
          frame: frame.matrixMatrixComposition.frame
        });
      }
      applyCanonicalReverseChoreography({
        transitionElement,
        animation,
        transformationId: transition.id,
        direction: state.direction,
        announce: index === 0,
        runtimeCapabilities: state.runtimeCapabilities
      });
      applyKpAnimationEpistemicBranch({
        transitionElement,
        transitionId: transition.id,
        frame: frame.epistemicBranch
      });
      transitionNodes.focusTokens.forEach((token) => {
          token.style.setProperty("--kp-editor-equation-focus-progress", String(motif.progress));
      });
    });
    const gestaltTokens = postBindingGestaltMotionTokens(
      stage,
      frame.contentKey
    );
    applyGestaltTokenRealization({
      stage,
      state,
      progress: frame.semanticProgress,
      channels: gestaltChannels,
      tokens: gestaltTokens,
      accessibilityMode:
        player?.dataset["kpEditorAnimationAccessibilityMode"] ?? "full-motion",
      qualityMicroMotionScale: boundedUnit(
        player?.dataset["kpEditorAnimationQualityMicroMotionScale"]
      )
    });
    applyEquationMaterialLayer({
      stage,
      animationId: state.animationId,
      semanticProgress: frame.semanticProgress,
      hotPath
    });
    applyFocusExperiment(
      stage,
      player?.dataset["kpEditorAnimationFocusExperiment"] ?? "flat"
    );
    applyExponentExplanationProjection({
      stage,
      animationId: state.animationId,
      profile:
        player?.dataset["kpEditorAnimationExplanationProfile"] ?? "explain"
    });
    if (shouldSyncContinuityInspection(stage, player, state)) {
      syncKpEditorEquationMaterialContinuityInspection({ player, stage });
      player.dataset["kpEditorAnimationMotionPlanInvalidated"] = "false";
    }
  }
};

function applyExponentExplanationProjection(input: {
  readonly stage: HTMLElement;
  readonly animationId: string;
  readonly profile: string;
}): void {
  if (
    input.animationId !==
      "animation.generated.exponent.square-as-product" ||
    input.profile !== "fluent"
  ) {
    delete input.stage.dataset["kpEditorEquationExplanationProjection"];
    return;
  }
  const unitExponent = input.stage.querySelector<HTMLElement>(
    '[data-kp-motion-id$=".lowered.residual-exponent"]'
  );
  if (unitExponent === null) return;

  // Fluent playback keeps the verified identity step in the semantic trace,
  // but omits its transient ink so the learner sees x² project directly to x·x.
  unitExponent.style.opacity = "0";
  unitExponent.dataset["kpEditorEquationFluentOmission"] = "unit-exponent";
  input.stage.dataset["kpEditorEquationExplanationProjection"] =
    "fluent-omit-unit-exponent";
}

function postBindingGestaltMotionTokens(
  stage: HTMLElement,
  contentKey: string
): readonly HTMLElement[] {
  const cached = gestaltMotionTokenCache.get(stage);
  if (cached?.contentKey === contentKey) return cached.tokens;

  // Structural KaTeX spans receive motion ids while the semantic plan binds
  // on the first frame. Cache only after that binding boundary so later frames
  // include fraction bars and radical fragments without rescanning the stage.
  const tokens = [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
  ];
  gestaltMotionTokenCache.set(stage, { contentKey, tokens });
  return tokens;
}

function shouldSyncContinuityInspection(
  stage: HTMLElement,
  player: HTMLElement,
  state: KpEditorAnimationPlayerState
): boolean {
  const decision = decideKpEditorAnimationDiagnosticsCadence({
    state,
    nowMs: performance.now(),
    revisionKey: player.dataset["kpEditorAnimationDiagnosticsRevision"],
    previous: continuityCadenceStates.get(stage)
  });
  if (!decision.publish || decision.state === undefined) return false;
  continuityCadenceStates.set(stage, decision.state);
  stage.dataset["kpEditorEquationContinuityPublishCount"] = String(
    decision.state.publishCount
  );
  return true;
}

function invalidateEquationStageMeasurements(
  stage: HTMLElement,
  reason: KpEditorEquationStageCacheInvalidationReason
): void {
  semanticMotionPlanCache.delete(stage);
  if (reason === "fonts" || reason === "resize") {
    // The radical atlas captures native glyph ink, not just the stage box.
    // Font metrics may change while the outer dimensions remain stable, so
    // presentation geometry must be recaptured with the hot-path measurements.
    disposeKpRadicalWebglMorph(stage);
  }
  if (reason === "fonts") invalidateKpEquationNativeFit(stage);
  const player = stage.closest<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  player?.setAttribute(
    "data-kp-editor-animation-motion-plan-invalidated",
    "true"
  );
  const session = player === null
    ? undefined
    : getKpEditorAnimationPlaybackSession(player);
  if (
    player !== null &&
    session !== undefined &&
    session.player.playbackStatus !== "playing" &&
    (reason === "fonts" || reason === "resize")
  ) {
    // Paused players have no next RAF to consume an invalidation. Resample the
    // same semantic instant after the observer callback so changed fonts or
    // width can never leave stale geometry waiting for user interaction.
    queueMicrotask(() => {
      if (!player.isConnected) return;
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "resample"
      });
    });
  }
}

function resetEquationStageForMeasurement(stage: HTMLElement): void {
  // Invalidation may arrive between playback frames. Measure native KaTeX
  // layout, never the previous frame's presentation transforms, or resize and
  // font recovery would bake transient motion into the next plan.
  stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]").forEach((token) => {
    token.style.transform = "none";
    token.style.translate = "none";
    token.style.scale = "none";
  });
  stage.querySelectorAll<HTMLElement>(
    "[data-kp-editor-equation-source], [data-kp-editor-equation-target]"
  ).forEach((layer) => {
    layer.style.transform = "none";
    layer.style.filter = "none";
  });
  stage.dataset["kpEditorEquationNativePreparationCount"] = String(
    Number(stage.dataset["kpEditorEquationNativePreparationCount"] ?? 0) + 1
  );
}

function inlineOpacity(element: HTMLElement): number {
  const opacity = Number.parseFloat(element.style.opacity);
  return Number.isFinite(opacity) ? opacity : 1;
}

function materialOwnerTransform(element: HTMLElement): string {
  const transform = element.style.transform
    .replace(/\s*translateZ\(var\([^)]*\)\)/g, "")
    .replace(/\s*scale\(var\([^)]*\)\)/g, "")
    .trim();
  return transform === "" ? "none" : transform;
}

function applyEquationMaterialLayer(input: {
  readonly stage: HTMLElement;
  readonly animationId: string;
  readonly semanticProgress: number;
  readonly hotPath: KpEditorEquationStageHotPathCache;
}): void {
  if (
    input.animationId ===
    "animation.generated.radical.square-root-as-power"
  ) {
    applyRadicalMaterialLayer(input);
    return;
  }
  if (input.animationId !== "animation.linear-solve.solve-x") {
    syncKpEquationMaterialLayer({ stage: input.stage, owners: [] });
    delete input.stage.dataset["kpEditorEquationNativeSettlementProgress"];
    delete input.stage.dataset["kpEditorEquationNativeSettlementPhase"];
    delete input.stage.dataset["kpEditorEquationNativeSettlementReady"];
    delete input.stage.dataset["kpEditorEquationNativeSettlementResidual"];
    return;
  }
  const tokens = input.hotPath.motionTokens;
  if (input.semanticProgress <= 0 || input.semanticProgress >= 1) {
    syncKpEquationMaterialLayer({ stage: input.stage, owners: [] });
    return;
  }
  const candidates = new Map<string, {
    readonly token: HTMLElement;
    readonly opacity: number;
  }>();
  for (const token of tokens) {
    const motionId = token.dataset["kpMotionId"];
    const ownerId = motionId === undefined
      ? undefined
      : linearMaterialOwnerId(motionId);
    if (ownerId === undefined) continue;
    const opacity = inlineOpacity(token);
    const existing = candidates.get(ownerId);
    if (existing === undefined || opacity > existing.opacity) {
      candidates.set(ownerId, { token, opacity });
    }
  }
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners: [...candidates.entries()].map(([ownerId, candidate]) => {
      const rect = input.hotPath.motionTokenRects.get(candidate.token);
      if (rect === undefined) {
        throw new Error("Cached equation token geometry is incomplete.");
      }
      return {
        ownerId,
        sourceElement: candidate.token,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        },
        opacity: candidate.opacity,
        transform: materialOwnerTransform(candidate.token),
        filter: candidate.token.style.filter,
        semanticDepth: candidate.token.dataset["kpEquationSemanticDepth"]
      };
    })
  });
  for (const token of tokens) {
    const motionId = token.dataset["kpMotionId"];
    if (motionId !== undefined && linearMaterialOwnerId(motionId) !== undefined) {
      token.style.opacity = "0";
      token.dataset["kpEquationMaterialNativeHidden"] = "true";
    }
  }
  input.stage.dataset["kpEditorEquationMaterialContinuity"] = "linear-solve";
}

function applyRadicalMaterialLayer(input: {
  readonly stage: HTMLElement;
  readonly semanticProgress: number;
}): void {
  const radicalHook = input.stage.querySelector<HTMLElement>(
    '[data-kp-motion-id*=".radical.radical-hook"]'
  );
  const radicalOverbar = input.stage.querySelector<HTMLElement>(
    '[data-kp-motion-id*=".radical.radical-overbar"]'
  );
  const radicalNative = input.stage.querySelector<HTMLElement>(
    '[data-kp-radical-native-visual="true"]'
  );
  const sourceBase = input.stage.querySelector<HTMLElement>(
    '[data-kp-motion-id*=".power.base"]'
  );
  const targetBase = input.stage.querySelector<HTMLElement>(
    '[data-kp-motion-id*=".radical.radicand"]'
  );
  const powerLayer = sourceBase?.closest<HTMLElement>(
    "[data-kp-editor-equation-source], [data-kp-editor-equation-target]"
  );
  const sourceExponentToken = powerLayer?.querySelector<HTMLElement>(
    '[data-kp-motion-id*=".power.exponent-numerator"]'
  );
  const sourceExponent = sourceExponentToken?.closest<HTMLElement>(".msupsub")
    ?? sourceExponentToken?.parentElement
    ?? null;
  const player = input.stage.closest<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  const webglEnabled =
    editorAccessibilityMode(input.stage) === "full-motion" &&
    player?.dataset["kpEditorAnimationQualityTier"] !== "efficient";
  let warmedWebglMorph: KpRadicalWebglMorphSyncResult = {
    mode: "dom-fallback" as "webgl-solid-mask" | "dom-fallback",
    ready: false
  };
  if (sourceExponent !== null && radicalNative !== null) {
    // Warm the atlas against untouched KaTeX at the initial frame. The canvas
    // stays transparent until the semantic rewrite actually begins.
    warmedWebglMorph = syncKpRadicalWebglMorph({
      stage: input.stage,
      sourceElement: sourceExponent,
      targetElement: radicalNative,
      semanticProgress: input.semanticProgress,
      opacity: 0,
      enabled: webglEnabled
    });
  } else {
    disposeKpRadicalWebglMorph(input.stage);
  }
  if (
    radicalHook === null ||
    radicalOverbar === null ||
    radicalNative === null ||
    sourceBase === null ||
    targetBase === null ||
    input.semanticProgress <= 0 ||
    input.semanticProgress >= 1
  ) {
    sourceExponent?.style.removeProperty("opacity");
    syncKpEquationMaterialLayer({ stage: input.stage, owners: [] });
    if (radicalNative !== null) {
      radicalNative.style.opacity = input.semanticProgress >= 1 ? "1" : "0";
    }
    setRadicalSettlementDataset(input.stage, {
      progress: input.semanticProgress >= 1 ? 1 : 0,
      phase: input.semanticProgress >= 1
        ? "native-geometry"
        : "material-fragments",
      geometryReady: input.semanticProgress >= 1,
      maximumGeometryResidualPx: 0
    });
    setRadicalSourceSettlementDataset(input.stage, {
      progress: input.semanticProgress <= 0 ? 1 : 0,
      phase: input.semanticProgress <= 0
        ? "native-geometry"
        : "material-fragments",
      geometryReady: input.semanticProgress <= 0,
      maximumGeometryResidualPx: 0
    });
    return;
  }
  const stageRect = input.stage.getBoundingClientRect();
  const sourceBaseOpacity = Number.parseFloat(
    getComputedStyle(sourceBase).opacity
  );
  const targetBaseOpacity = Number.parseFloat(
    getComputedStyle(targetBase).opacity
  );
  const base = sourceBaseOpacity >= targetBaseOpacity ? sourceBase : targetBase;
  const baseRect = base.getBoundingClientRect();
  const owners: KpEquationMaterialLayerOwnerFrame[] = [{
    ownerId: "radical-rewrite.base-radicand",
    sourceElement: base,
    rect: {
      left: baseRect.left - stageRect.left,
      top: baseRect.top - stageRect.top,
      width: baseRect.width,
      height: baseRect.height
    },
    opacity: Math.max(sourceBaseOpacity, targetBaseOpacity),
    transform: "none"
  }];

  const hookRect = radicalHook.getBoundingClientRect();
  const overbarRect = radicalOverbar.getBoundingClientRect();
  const nativeRect = radicalNative.getBoundingClientRect();
  const targetInkComparison = (
    warmedWebglMorph.ready &&
    input.semanticProgress >=
      kpRadicalConventionalMorphProfile.settlement.start
  )
    ? measureKpRadicalWebglInk(input.stage, "target")
    : undefined;
  const settlement = sampleKpRadicalNativeSettlement({
    semanticProgress: input.semanticProgress,
    fragmentRects: warmedWebglMorph.ready
      ? targetInkComparison === undefined
        ? []
        : [targetInkComparison.renderedWebglInkRect]
      : [hookRect, overbarRect],
    nativeRect:
      targetInkComparison?.liveNativeInkRect ?? nativeRect,
    ...(warmedWebglMorph.ready
      ? {
          handoffStart:
            kpRadicalConventionalMorphProfile.settlement.start,
          handoffEnd:
            kpRadicalConventionalMorphProfile.settlement.end,
          easing: kpRadicalConventionalMorphProfile.settlement.easing
        }
      : {})
  });
  setRadicalSettlementDataset(input.stage, settlement);
  const sourceInkComparison = (
    warmedWebglMorph.ready &&
    input.semanticProgress <= kpRadicalSourceNativeSettlementEnd
  )
    ? measureKpRadicalWebglInk(input.stage, "source")
    : undefined;
  const sourceSettlement = sourceInkComparison === undefined
    ? undefined
    : sampleKpRadicalCompositeNativeSettlement({
        endpoint: "source",
        semanticProgress: input.semanticProgress,
        fragmentRects: [sourceInkComparison.renderedWebglInkRect],
        nativeRect: sourceInkComparison.liveNativeInkRect,
        handoffStart: kpRadicalSourceNativeSettlementStart,
        handoffEnd: kpRadicalSourceNativeSettlementEnd,
        easing: kpRadicalConventionalMorphProfile.morph.easing
      });
  setRadicalSourceSettlementDataset(input.stage, sourceSettlement ?? {
    progress: 0,
    phase: "material-fragments",
    geometryReady: false,
    maximumGeometryResidualPx: Number.POSITIVE_INFINITY
  });
  const webglMorph = sourceExponent === null
    ? { mode: "dom-fallback" as const, ready: false }
    : syncKpRadicalWebglMorph({
        stage: input.stage,
        sourceElement: sourceExponent,
        targetElement: radicalNative,
        semanticProgress: input.semanticProgress,
        opacity: Math.min(
          settlement.fragmentOpacity,
          sourceSettlement?.fragmentOpacity ?? 1
        ),
        enabled: webglEnabled
      });

  if (webglMorph.ready && sourceExponent !== null) {
    // The overlay owns only the changing notation. The x continuant remains a
    // DOM-owned material owner above it and the exact KaTeX radical takes over
    // during native settlement.
    sourceExponent.style.opacity = String(
      sourceSettlement?.nativeOpacity ?? 0
    );
    radicalNative.style.opacity = String(settlement.nativeOpacity);
    radicalNative.dataset["kpEquationMaterialNativeHidden"] = "true";
    syncKpEquationMaterialLayer({ stage: input.stage, owners });
    sourceBase.style.opacity = "0";
    targetBase.style.opacity = "0";
    sourceBase.dataset["kpEquationMaterialNativeHidden"] = "true";
    targetBase.dataset["kpEquationMaterialNativeHidden"] = "true";
    input.stage.dataset["kpEditorEquationMaterialContinuity"] =
      "radical-rewrite-webgl";
    return;
  }

  sourceExponent?.style.removeProperty("opacity");

  if (input.semanticProgress >= 0.42 && settlement.fragmentOpacity > 0) {
    const hookProgress = Number.parseFloat(
      getComputedStyle(radicalHook).opacity
    );
    const overbarProgress = Number.parseFloat(
      getComputedStyle(radicalOverbar).opacity
    );
    const fragmentRelease = settlement.fragmentOpacity;
    const hook = {
      left: hookRect.left - stageRect.left,
      top: hookRect.top - stageRect.top,
      width: hookRect.width,
      height: hookRect.height
    };
    const overbar = {
      left: overbarRect.left - stageRect.left,
      top: overbarRect.top - stageRect.top,
      width: overbarRect.width,
      height: overbarRect.height
    };
    owners.push(
      {
        ownerId: "radical-rewrite.root-notation.hook",
        sourceElement: radicalNative,
        sourceMotionId: radicalHook.dataset["kpMotionId"],
        rect: hook,
        opacity: hookProgress * fragmentRelease,
        transform: "none",
        clipPath: "inset(0 58% 0 0)",
        fragmentRole: "radical-hook"
      },
      {
        ownerId: "radical-rewrite.root-notation.overbar",
        sourceElement: radicalNative,
        sourceMotionId: radicalOverbar.dataset["kpMotionId"],
        rect: overbar,
        opacity: overbarProgress * fragmentRelease,
        transform: "none",
        clipPath: "inset(0 0 66% 28%)",
        fragmentRole: "radical-overbar"
      }
    );
    radicalNative.style.opacity = String(settlement.nativeOpacity);
    radicalNative.dataset["kpEquationMaterialNativeHidden"] = "true";
  } else {
    radicalNative.style.opacity = String(settlement.nativeOpacity);
  }
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners
  });
  sourceBase.style.opacity = "0";
  targetBase.style.opacity = "0";
  sourceBase.dataset["kpEquationMaterialNativeHidden"] = "true";
  targetBase.dataset["kpEquationMaterialNativeHidden"] = "true";
  input.stage.dataset["kpEditorEquationMaterialContinuity"] =
    "radical-rewrite";
}

function setRadicalSettlementDataset(
  stage: HTMLElement,
  settlement: {
    readonly progress: number;
    readonly phase: string;
    readonly geometryReady: boolean;
    readonly maximumGeometryResidualPx: number;
  }
): void {
  stage.dataset["kpEditorEquationNativeSettlementProgress"] =
    String(settlement.progress);
  stage.dataset["kpEditorEquationNativeSettlementPhase"] = settlement.phase;
  stage.dataset["kpEditorEquationNativeSettlementReady"] =
    String(settlement.geometryReady);
  stage.dataset["kpEditorEquationNativeSettlementResidual"] =
    String(settlement.maximumGeometryResidualPx);
}

function setRadicalSourceSettlementDataset(
  stage: HTMLElement,
  settlement: {
    readonly progress: number;
    readonly phase: string;
    readonly geometryReady: boolean;
    readonly maximumGeometryResidualPx: number;
  }
): void {
  stage.dataset["kpEditorEquationSourceSettlementProgress"] =
    String(settlement.progress);
  stage.dataset["kpEditorEquationSourceSettlementPhase"] = settlement.phase;
  stage.dataset["kpEditorEquationSourceSettlementReady"] =
    String(settlement.geometryReady);
  stage.dataset["kpEditorEquationSourceSettlementResidual"] =
    String(settlement.maximumGeometryResidualPx);
}

function linearMaterialOwnerId(motionId: string): string | undefined {
  const roles = [
    "lhs.x",
    "lhs.plus3",
    "lhs.minus3",
    "equals",
    "rhs.7",
    "rhs.minus3",
    "rhs.minus",
    "rhs.3",
    "rhs.4"
  ] as const;
  const role = roles.find((candidate) => motionId.endsWith(`.${candidate}`));
  return role === undefined ? undefined : `linear-solve.${role}`;
}

function applyFocusExperiment(
  stage: HTMLElement,
  requestedMode: string
): void {
  const mode = requestedMode === "elevated"
    ? "elevated"
    : requestedMode === "no-depth"
      ? "no-depth"
      : "flat";
  stage.dataset["kpEditorEquationFocusExperiment"] = mode;
  let maximumAttention = 0;
  stage.querySelectorAll<HTMLElement>(".kp-focus-group").forEach((group) => {
    const existingZ = Math.abs(Number.parseFloat(
      group.style.getPropertyValue("--kp-focus-z")
    )) / 14;
    const existingOutline = Number.parseFloat(
      group.style.getPropertyValue("--kp-focus-outline-strength")
    );
    const existingDimming = Number.parseFloat(
      group.style.getPropertyValue("--kp-focus-context-dimming")
    ) / 0.24;
    const attention = Math.min(
      1,
      Math.max(
        0,
        Number.isFinite(existingZ) ? existingZ : 0,
        Number.isFinite(existingOutline) ? existingOutline : 0,
        Number.isFinite(existingDimming) ? existingDimming : 0
      )
    );
    maximumAttention = Math.max(maximumAttention, attention);
    const preservesMaterialHandoff =
      group.dataset["kpFocusPreservesMaterialHandoff"] === "true";
    group.dataset["kpFocusProfile"] = mode === "elevated" ? "elevated" : "flat";
    group.style.setProperty(
      "--kp-focus-z",
      mode === "elevated" && !preservesMaterialHandoff
        ? `${12 * attention}px`
        : "0px"
    );
    group.style.setProperty(
      "--kp-focus-scale",
      mode === "elevated" && !preservesMaterialHandoff
        ? String(1 + 0.018 * attention)
        : "1"
    );
    group.style.setProperty(
      "--kp-focus-outline-strength",
      mode !== "elevated" && !preservesMaterialHandoff
        ? String(0.55 * attention)
        : "0"
    );
    group.style.setProperty("--kp-focus-shadow-opacity", "0");
  });
  stage.querySelectorAll<HTMLElement>(
    ".editor-equation-stage__shared-focus-shadow"
  ).forEach((shadow) => {
    shadow.style.setProperty(
      "--kp-focus-shadow-opacity",
      mode === "elevated" ? String(0.14 * maximumAttention) : "0"
    );
  });
}

function selectedGestaltChannels(
  player: HTMLElement | null
): KpGestaltStyleChannels {
  const selectedStyle =
    player?.dataset["kpEditorAnimationGestaltSelectedStyle"] ??
    "kp.organic-subtle@1.0.0";
  return kpBaseGestaltStyleCatalog.get(selectedStyle)?.channels ?? {};
}

function applyGestaltTokenRealization(input: {
  readonly stage: HTMLElement;
  readonly state: KpEditorAnimationPlayerState;
  readonly progress: number;
  readonly channels: KpGestaltStyleChannels;
  readonly accessibilityMode: string;
  readonly qualityMicroMotionScale: number;
  readonly tokens: readonly HTMLElement[];
}): void {
  const fullMotion = input.accessibilityMode === "full-motion";
  const amplitude = fullMotion
    ? (input.channels.microMotion?.amplitude ?? 0) *
      9 * input.qualityMicroMotionScale
    : 0;
  const deformation = fullMotion
    ? (input.channels.deformation?.tokenCeiling ?? 0) * 0.35
    : 0;
  const realizationProgress = sampleKpOrganicProgress({
    progress: input.progress,
    character: input.channels.acceleration?.character ?? "restrained"
  });
  input.tokens.forEach((token) => {
      const identityId = token.dataset["kpMotionId"];
      if (identityId === undefined) return;
      const eligibility = resolveKpGestaltMotionEligibility(identityId);
      // KaTeX glyphs are rigid typography. Organic character belongs in the
      // semantic path and stagger, not periodic glyph translation or scaling.
      const rigidKatexTypography = token.closest(".katex") !== null;
      const sample = sampleKpOrganicMotion({
        signature: deriveKpOrganicMotionSignature({
          identityId: eligibility.identityId,
          motifId: "editor-equation.gestalt",
          motionFieldId: input.state.animationId
        }),
        progress: realizationProgress,
        // Progress is already direction-normalized at the stage boundary.
        // Mirroring again here would give rewind a different material pose.
        direction: "forward",
        microMotionAmplitude: Math.min(
          1,
          rigidKatexTypography
            ? 0
            : amplitude * eligibility.microMotionScale
        ),
        deformationCeiling: Math.min(
          1,
          rigidKatexTypography
            ? 0
            : deformation * eligibility.deformationScale
        )
      });
      const offset = eligibility.coordinateSpace === "path-relative"
        ? projectKpGestaltOffsetToPath({
            x: sample.x,
            y: sample.y,
            transform: materialOwnerTransform(token)
          })
        : { x: sample.x, y: sample.y };
      token.style.translate = `${offset.x}px ${offset.y}px`;
      token.style.scale = `${sample.scaleAlong} ${sample.scaleAcross}`;
      token.dataset["kpEditorGestaltTokenRealization"] =
        input.channels.acceleration?.character ?? "restrained";
      token.dataset["kpEditorGestaltMotionEligibility"] = eligibility.mode;
      token.dataset["kpEditorGestaltMotionIdentity"] =
        eligibility.identityId;
      token.dataset["kpEditorGestaltCoordinateSpace"] =
        eligibility.coordinateSpace;
      token.dataset["kpEditorKatexTypography"] =
        rigidKatexTypography ? "rigid" : "not-katex";
  });
}

function boundedUnit(value: string | undefined): number {
  const numeric = Number(value ?? 1);
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : 1;
}

export function registerKpEditorEquationSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorEquationSurfaceAdapter
  );
}

function createRadicalSuccessionFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  progress: number
): KpEditorEquationStageFrame["radicalSuccession"] {
  if (
    !animation.transformations.some(
      (transformation) => transformation.transformType === "rewritePowerAsRoot"
    )
  ) {
    return undefined;
  }
  let choreography = radicalSuccessionChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpRadicalSuccessionChoreography(animation);
    radicalSuccessionChoreographyCache.set(animation.id, choreography);
  }
  return {
    choreography,
    frame: sampleKpRadicalSuccessionChoreography({
      choreography,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    })
  };
}

function createFunctionWrapFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  progress: number
): KpEditorEquationStageFrame["functionWrap"] {
  if (
    !animation.transformations.some(
      (transformation) => transformation.transformType === "wrapFunction"
    )
  ) {
    return undefined;
  }
  let choreography = functionWrapChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpFunctionWrapChoreography(animation);
    functionWrapChoreographyCache.set(animation.id, choreography);
  }
  return {
    choreography,
    frame: sampleKpFunctionWrapChoreography({
      choreography,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    })
  };
}

function createLinearRearrangementFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["linearRearrangement"] {
  if (transformationId === undefined) return undefined;
  const hasLinearStep = animation.transformations.some(
    (transformation) =>
      transformation.transformType === "subtractBothSides" ||
      transformation.transformType === "cancelAdditiveInverses" ||
      transformation.transformType === "simplifyConstantDifference"
  );
  if (!hasLinearStep) return undefined;
  let choreography = linearRearrangementChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpLinearRearrangementChoreography(animation);
    linearRearrangementChoreographyCache.set(animation.id, choreography);
  }
  const step = choreography.steps.find(
    (candidate) => candidate.transformationId === transformationId
  );
  if (step === undefined) return undefined;
  return {
    step,
    frame: sampleKpLinearRearrangementChoreography({
      step,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    }),
    sequenceFrame: sampleKpBridgedChoreographySequence({
      sequence: choreography.sequence,
      progress: state.progress,
      direction: state.direction
    })
  };
}

function createDotProductTraversalFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["dotProductTraversal"] {
  if (
    transformationId === undefined ||
    !animation.transformations.some(
      (transformation) =>
        transformation.id === transformationId &&
        transformation.transformType === "computeDotProduct"
    )
  ) {
    return undefined;
  }
  let choreography = dotProductTraversalChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpDotProductTraversalChoreography(animation);
    dotProductTraversalChoreographyCache.set(animation.id, choreography);
  }
  return {
    choreography,
    frame: sampleKpDotProductTraversalChoreography({
      choreography,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    })
  };
}

function createMatrixVectorCompositionFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["matrixVectorComposition"] {
  if (
    transformationId === undefined ||
    !animation.transformations.some(
      (transformation) =>
        transformation.id === transformationId &&
        transformation.transformType === "multiplyMatrixVector"
    )
  ) {
    return undefined;
  }
  let choreography = matrixVectorCompositionChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpMatrixVectorCompositionChoreography(animation);
    matrixVectorCompositionChoreographyCache.set(animation.id, choreography);
  }
  let rank6Plan: KpMatrixLinearMapPlan | undefined;
  let rank6Frame: KpMatrixLinearMapFrame | undefined;
  if (
    animation.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
  ) {
    rank6Plan = matrixLinearMapPlanCache.get(animation.id);
    if (rank6Plan === undefined) {
      rank6Plan = createKpMatrixLinearMapPlan(animation);
      matrixLinearMapPlanCache.set(animation.id, rank6Plan);
    }
    rank6Frame = sampleKpMatrixLinearMapFrame({
      plan: rank6Plan,
      progress,
      direction: state.direction,
      accessibilityMode: "full-motion"
    });
  }
  return {
    choreography,
    frame: sampleKpMatrixVectorCompositionChoreography({
      choreography,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    }),
    ...(rank6Plan === undefined || rank6Frame === undefined
      ? {}
      : { rank6Plan, rank6Frame })
  };
}

function createMatrixMatrixCompositionFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["matrixMatrixComposition"] {
  if (
    transformationId === undefined ||
    !animation.transformations.some(
      (transformation) =>
        transformation.id === transformationId &&
        transformation.transformType === "multiplyMatrices"
    )
  ) {
    return undefined;
  }
  let choreography = matrixMatrixCompositionChoreographyCache.get(animation.id);
  if (choreography === undefined) {
    choreography = createKpMatrixMatrixCompositionChoreography(animation);
    matrixMatrixCompositionChoreographyCache.set(animation.id, choreography);
  }
  return {
    choreography,
    frame: sampleKpMatrixMatrixCompositionChoreography({
      choreography,
      progress,
      direction: state.direction,
      accessibilityMode: "full"
    })
  };
}

function createDerivativePowerFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["derivativePower"] {
  const transformation = animation.transformations.find(
    (candidate) =>
      candidate.id === transformationId &&
      candidate.transformType === "applyDerivativePowerRule"
  );
  if (transformation?.correspondenceMap === undefined) return undefined;
  let plan = derivativePowerChoreographyCache.get(transformation.id);
  if (plan === undefined) {
    const semanticRoles = resolveKpDerivativePowerRuleSemanticRoles({
      transformation,
      bundle: animation.bundle
    });
    plan = compileKpDerivativePowerChoreography({
      id: `choreography.${transformation.id}`,
      semanticRoles,
      correspondenceMap: transformation.correspondenceMap
    });
    derivativePowerChoreographyCache.set(transformation.id, plan);
  }
  return {
    plan,
    frame: sampleKpDerivativePowerChoreography({
      plan,
      progress,
      direction: state.direction
    })
  };
}

function applyFunctionWrapChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly choreography: KpFunctionWrapChoreography;
  readonly frame: KpFunctionWrapChoreographyFrame;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpFunctionWrapChoreography({
        choreography: input.choreography,
        progress: input.frame.timeline.requestedProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationChoreographyPlanId"] =
    input.choreography.plan.id;
  input.transitionElement.dataset["kpEditorEquationChoreographyPhase"] =
    sampled.focus.phaseId;
  input.transitionElement.dataset["kpEditorEquationChoreographyPreviousCheckpoint"] =
    sampled.timeline.previousCheckpointId;
  input.transitionElement.dataset["kpEditorEquationChoreographyNextCheckpoint"] =
    sampled.timeline.nextCheckpointId;
  input.transitionElement.dataset["kpEditorEquationContextDimming"] =
    String(sampled.focus.contextDimming);

  const selector = input.direction === "forward"
    ? '[data-kp-editor-equation-source] [data-kp-motion-id$=".input.value"]'
    : '[data-kp-editor-equation-source] [data-kp-motion-id$=".wrapped.argument"]';
  const argument = input.transitionElement.querySelector<HTMLElement>(selector);
  if (argument === null) return;
  const binding = bindKpFocusFrameToCss(
    input.choreography.focus,
    sampled.focus
  );
  argument.classList.add(binding.className);
  Object.entries(binding.attributes).forEach(([name, value]) =>
    argument.setAttribute(name, value)
  );
  Object.entries(binding.variables).forEach(([name, value]) =>
    argument.style.setProperty(name, value)
  );
}

function applyRadicalSuccessionChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly choreography: KpRadicalSuccessionChoreography;
  readonly frame: KpRadicalSuccessionChoreographyFrame;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpRadicalSuccessionChoreography({
        choreography: input.choreography,
        progress: input.frame.timeline.requestedProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationChoreographyPlanId"] =
    input.choreography.plan.id;
  input.transitionElement.dataset["kpEditorEquationChoreographyPhase"] =
    sampled.focus.phaseId;
  input.transitionElement.dataset["kpEditorEquationPropagationRule"] =
    input.choreography.propagationRule;
  input.transitionElement.dataset["kpEditorEquationPathRequirement"] =
    input.choreography.pathRequirement.requiredPathFamily;
  input.transitionElement.dataset["kpEditorEquationHierarchyPlanId"] =
    input.choreography.hierarchy.id;

  const selector = input.direction === "forward"
    ? '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.exponent-"]'
    : '[data-kp-editor-equation-source] [data-kp-motion-id*=".radical.radical-"]';
  const notationTokens = [
    ...input.transitionElement.querySelectorAll<HTMLElement>(selector)
  ];
  const existingShadow =
    input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-radical-shared-shadow]"
    );
  if (sampled.focus.attentionProgress === 0 || notationTokens.length === 0) {
    existingShadow?.remove();
    return;
  }
  const binding = bindKpFocusFrameToCss(
    input.choreography.focus,
    sampled.focus
  );
  notationTokens.forEach((token) => {
    token.classList.add(binding.className);
    // The WebGL successor captures the unadorned KaTeX ink. Keeping focus
    // geometry-neutral prevents an outline or scale from disappearing at the
    // renderer ownership boundary.
    token.dataset["kpFocusPreservesMaterialHandoff"] = "true";
    Object.entries(binding.attributes).forEach(([name, value]) =>
      token.setAttribute(name, value)
    );
    Object.entries(binding.variables).forEach(([name, value]) =>
      token.style.setProperty(
        name,
        name === "--kp-focus-shadow-opacity" ? "0" : value
      )
    );
  });
  const transitionRect = input.transitionElement.getBoundingClientRect();
  const rects = notationTokens.map((token) => token.getBoundingClientRect());
  const bounds = {
    left: Math.min(...rects.map((rect) => rect.left)) - transitionRect.left,
    top: Math.min(...rects.map((rect) => rect.top)) - transitionRect.top,
    right: Math.max(...rects.map((rect) => rect.right)) - transitionRect.left,
    bottom: Math.max(...rects.map((rect) => rect.bottom)) - transitionRect.top
  };
  const shadow = existingShadow ?? document.createElement("span");
  shadow.dataset["kpEditorRadicalSharedShadow"] =
    input.choreography.focus.sharedShadow.id;
  shadow.setAttribute("aria-hidden", "true");
  shadow.className = "editor-equation-stage__shared-focus-shadow";
  shadow.style.left = `${bounds.left}px`;
  shadow.style.top = `${bounds.top}px`;
  shadow.style.width = `${bounds.right - bounds.left}px`;
  shadow.style.height = `${bounds.bottom - bounds.top}px`;
  shadow.style.setProperty(
    "--kp-focus-shadow-y",
    `${input.choreography.focus.sharedShadow.offsetYPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-blur",
    `${input.choreography.focus.sharedShadow.blurPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-opacity",
    String(sampled.focus.shadowOpacity)
  );
  if (existingShadow === null) input.transitionElement.append(shadow);
}

function applyLinearRearrangementChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly step: KpLinearRearrangementStep;
  readonly frame: KpLinearRearrangementChoreographyFrame;
  readonly sequenceFrame: KpBridgedChoreographyFrame;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpLinearRearrangementChoreography({
        step: input.step,
        progress: input.frame.timeline.requestedProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationChoreographyPlanId"] =
    input.step.plan.id;
  input.transitionElement.dataset["kpEditorEquationChoreographyPhase"] =
    sampled.focus.phaseId;
  input.transitionElement.dataset["kpEditorEquationOperationSubgraph"] =
    input.step.operationSubgraph.id;
  input.transitionElement.dataset["kpEditorEquationOperationSubgraphNodes"] =
    input.step.operationSubgraph.nodes.map((node) => node.id).join(" ");
  input.transitionElement.dataset["kpEditorEquationActiveSubgraphNodes"] =
    sampled.activeSubgraphNodeIds.join(" ");
  input.transitionElement.dataset["kpEditorEquationReservationProgress"] =
    String(sampled.reservationProgress);
  input.transitionElement.dataset["kpEditorEquationRecognitionProgress"] =
    String(sampled.recognitionProgress);
  input.transitionElement.dataset["kpEditorEquationReleaseProgress"] =
    String(sampled.releaseProgress);
  const successorBinding = input.step.successorSynthesisBinding;
  if (successorBinding === undefined) {
    delete input.transitionElement.dataset["kpEditorSuccessorSynthesisPlan"];
    delete input.transitionElement.dataset["kpEditorSuccessorSynthesisAuthority"];
  } else {
    input.transitionElement.dataset["kpEditorSuccessorSynthesisPlan"] =
      successorBinding.id;
    input.transitionElement.dataset["kpEditorSuccessorSynthesisAuthority"] =
      `${successorBinding.authority.operationId}#${successorBinding.authority.bindingId}`;
    for (const annotation of successorBinding.sourceAnnotations) {
      const token = [...input.transitionElement.querySelectorAll<HTMLElement>(
        "[data-kp-motion-id]"
      )].find((candidate) =>
        candidate.dataset["kpMotionId"]?.endsWith(annotation.id)
      );
      if (token === undefined) continue;
      token.dataset["kpEditorSuccessorContribution"] = annotation.contribution;
      token.dataset["kpEditorSuccessorSemanticRole"] = annotation.semanticRole;
      token.dataset["kpEditorSuccessorRank"] = String(annotation.propagationRank);
    }
    for (const annotation of successorBinding.targetAnnotations) {
      const token = [...input.transitionElement.querySelectorAll<HTMLElement>(
        "[data-kp-motion-id]"
      )].find((candidate) =>
        candidate.dataset["kpMotionId"]?.endsWith(annotation.id)
      );
      if (token === undefined) continue;
      token.dataset["kpEditorSuccessorContribution"] = "successor-target";
      token.dataset["kpEditorSuccessorSemanticRole"] = annotation.semanticRole;
      token.dataset["kpEditorSuccessorRank"] = String(annotation.propagationRank);
    }
  }
  const activeBridge = input.sequenceFrame.activeBridge;
  if (activeBridge === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeId"];
    delete input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeProgress"];
    delete input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeAttention"];
  } else {
    input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeId"] =
      activeBridge.bridge.id;
    input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeProgress"] =
      String(activeBridge.progress);
    input.transitionElement.dataset["kpEditorEquationEnvelopeBridgeAttention"] =
      activeBridge.bridge.attention;
  }

  const focusTokens = [
    ...input.transitionElement.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
  ].filter((token) =>
    input.step.focus.semanticEntityIds.some((entityId) =>
      token.dataset["kpMotionId"]?.includes(entityId)
    )
  );
  const existingShadow =
    input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-linear-shared-shadow]"
    );
  if (focusTokens.length === 0) {
    existingShadow?.remove();
    return;
  }
  const bridgedFocus = activeBridge === undefined
    ? sampled.focus
    : {
        ...sampled.focus,
        attentionProgress: Math.max(0.24, sampled.focus.attentionProgress),
        outlineStrength: Math.max(0.12, sampled.focus.outlineStrength),
        contextDimming: Math.max(0.04, sampled.focus.contextDimming)
      };
  const binding = bindKpFocusFrameToCss(input.step.focus, bridgedFocus);
  focusTokens.forEach((token) => {
    token.classList.add(binding.className);
    Object.entries(binding.attributes).forEach(([name, value]) =>
      token.setAttribute(name, value)
    );
    Object.entries(binding.variables).forEach(([name, value]) =>
      token.style.setProperty(
        name,
        name === "--kp-focus-shadow-opacity" ? "0" : value
      )
    );
  });
  if (bridgedFocus.attentionProgress === 0) {
    existingShadow?.remove();
    return;
  }
  const transitionRect = input.transitionElement.getBoundingClientRect();
  const rects = focusTokens.map((token) => token.getBoundingClientRect());
  const bounds = {
    left: Math.min(...rects.map((rect) => rect.left)) - transitionRect.left,
    top: Math.min(...rects.map((rect) => rect.top)) - transitionRect.top,
    right: Math.max(...rects.map((rect) => rect.right)) - transitionRect.left,
    bottom: Math.max(...rects.map((rect) => rect.bottom)) - transitionRect.top
  };
  const shadow = existingShadow ?? document.createElement("span");
  shadow.dataset["kpEditorLinearSharedShadow"] =
    input.step.focus.sharedShadow.id;
  shadow.setAttribute("aria-hidden", "true");
  shadow.className = "editor-equation-stage__shared-focus-shadow";
  shadow.style.left = `${bounds.left}px`;
  shadow.style.top = `${bounds.top}px`;
  shadow.style.width = `${bounds.right - bounds.left}px`;
  shadow.style.height = `${bounds.bottom - bounds.top}px`;
  shadow.style.setProperty(
    "--kp-focus-shadow-y",
    `${input.step.focus.sharedShadow.offsetYPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-blur",
    `${input.step.focus.sharedShadow.blurPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-opacity",
    String(bridgedFocus.shadowOpacity)
  );
  if (existingShadow === null) input.transitionElement.append(shadow);
}

function applyDotProductTraversalChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly choreography: KpDotProductTraversalChoreography;
  readonly frame: KpDotProductTraversalChoreographyFrame;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpDotProductTraversalChoreography({
        choreography: input.choreography,
        progress: input.frame.motion.semanticProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationChoreographyPlanId"] =
    input.choreography.plan.id;
  input.transitionElement.dataset["kpEditorEquationTraversalPlanId"] =
    input.choreography.traversal.id;
  input.transitionElement.dataset["kpEditorEquationTraversalOrder"] =
    input.choreography.traversal.participants
      .map((participant) => participant.semanticIndex)
      .join(" ");
  input.transitionElement.dataset["kpEditorEquationPropagationPlanId"] =
    input.choreography.propagation.id;
  input.transitionElement.dataset["kpEditorEquationPropagationStarts"] =
    input.choreography.propagation.entries
      .slice()
      .sort((left, right) => left.rank - right.rank)
      .map((entry) => entry.start)
      .join(" ");
  input.transitionElement.dataset["kpEditorEquationActiveContributionIndices"] =
    sampled.motion.activeContributionIndices.join(" ");
  input.transitionElement.dataset["kpEditorEquationAccumulatedThroughIndex"] =
    sampled.motion.accumulatedThroughIndex === undefined
      ? ""
      : String(sampled.motion.accumulatedThroughIndex);
  input.transitionElement.dataset["kpEditorEquationPatternCompression"] =
    input.choreography.patternCompression.applied ? "applied" : "available";

  const motionTokens = [
    ...input.transitionElement.querySelectorAll<HTMLElement>(
      "[data-kp-editor-equation-source] [data-kp-motion-id]"
    )
  ];
  input.transitionElement.querySelectorAll<HTMLElement>(
    "[data-kp-editor-dot-product-shared-shadow]"
  ).forEach((shadow) => shadow.remove());
  sampled.focusFrames.forEach((focus) => {
    const focusTokens = motionTokens.filter((token) =>
      focus.plan.semanticEntityIds.some((entityId) =>
        token.dataset["kpMotionId"]?.includes(entityId)
      )
    );
    if (focusTokens.length === 0) return;
    const binding = bindKpFocusFrameToCss(focus.plan, focus.frame);
    focusTokens.forEach((token) => {
      token.classList.add(binding.className);
      Object.entries(binding.attributes).forEach(([name, value]) =>
        token.setAttribute(name, value)
      );
      Object.entries(binding.variables).forEach(([name, value]) =>
        token.style.setProperty(
          name,
          name === "--kp-focus-shadow-opacity" ? "0" : value
        )
      );
    });
    if (focus.frame.attentionProgress === 0) return;
    appendDotProductFocusShadow(
      input.transitionElement,
      focus.plan,
      focus.frame,
      focusTokens,
      focus.semanticIndex
    );
  });
  syncDotProductTraversalOverlay(
    input.transitionElement,
    input.choreography,
    sampled
  );
  const narration = input.transitionElement
    .closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.querySelector<HTMLOutputElement>(
      "[data-kp-editor-animation-narration]"
    );
  if (narration !== null && narration !== undefined) {
    narration.replaceChildren(document.createTextNode(
      dotProductNarration(input.choreography, sampled)
    ));
  }
}

function appendDotProductFocusShadow(
  transition: HTMLElement,
  plan: KpFocusProfilePlan,
  frame: KpFocusProfileFrame,
  tokens: readonly HTMLElement[],
  semanticIndex: number
): void {
  const transitionRect = transition.getBoundingClientRect();
  const rects = tokens.map((token) => token.getBoundingClientRect());
  const shadow = document.createElement("span");
  shadow.dataset["kpEditorDotProductSharedShadow"] = String(semanticIndex);
  shadow.setAttribute("aria-hidden", "true");
  shadow.className = "editor-equation-stage__shared-focus-shadow";
  shadow.style.left = `${
    Math.min(...rects.map((rect) => rect.left)) - transitionRect.left
  }px`;
  shadow.style.top = `${
    Math.min(...rects.map((rect) => rect.top)) - transitionRect.top
  }px`;
  shadow.style.width = `${
    Math.max(...rects.map((rect) => rect.right)) -
    Math.min(...rects.map((rect) => rect.left))
  }px`;
  shadow.style.height = `${
    Math.max(...rects.map((rect) => rect.bottom)) -
    Math.min(...rects.map((rect) => rect.top))
  }px`;
  shadow.style.setProperty(
    "--kp-focus-shadow-y",
    `${plan.sharedShadow.offsetYPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-blur",
    `${plan.sharedShadow.blurPx}px`
  );
  shadow.style.setProperty(
    "--kp-focus-shadow-opacity",
    String(frame.shadowOpacity)
  );
  transition.append(shadow);
}

function syncDotProductTraversalOverlay(
  transition: HTMLElement,
  choreography: KpDotProductTraversalChoreography,
  frame: KpDotProductTraversalChoreographyFrame
): void {
  let overlay = transition.querySelector<HTMLElement>(
    "[data-kp-editor-dot-product-overlay]"
  );
  if (overlay === null) {
    overlay = document.createElement("div");
    overlay.className = "editor-equation-stage__dot-product-overlay";
    overlay.dataset["kpEditorDotProductOverlay"] = choreography.id;
    overlay.innerHTML = `
      ${choreography.contributions.map((contribution) => `
        <span class="editor-equation-stage__dot-product-contribution" data-kp-editor-dot-product-contribution="${contribution.semanticIndex}">
          ${renderLatexToHtml(
            contribution.productLatex,
            { displayMode: false }
          )}
        </span>
      `).join("")}
      <span class="editor-equation-stage__dot-product-accumulation" data-kp-editor-dot-product-accumulation></span>
    `;
    transition.append(overlay);
  }
  const accumulation = overlay.querySelector<HTMLElement>(
    "[data-kp-editor-dot-product-accumulation]"
  );
  if (accumulation === null) return;
  const accumulationChanged =
    accumulation.dataset["kpEditorDotProductAccumulationLatex"] !==
      frame.motion.accumulationLatex;
  if (accumulationChanged) {
    accumulation.dataset["kpEditorDotProductAccumulationLatex"] =
      frame.motion.accumulationLatex;
    accumulation.innerHTML = frame.motion.accumulationLatex === ""
      ? ""
      : renderLatexToHtml(frame.motion.accumulationLatex, {
          displayMode: false
        });
  }
  const geometryRevision = equationOverlayGeometryRevision(transition);
  const measureGeometry = accumulationChanged ||
    overlay.dataset["kpEditorOverlayGeometryRevision"] !== geometryRevision;
  const transitionRect = measureGeometry
    ? transition.getBoundingClientRect()
    : undefined;
  const sourceRoot = measureGeometry
    ? transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source] [data-kp-editor-equation-object-id]"
      )?.getBoundingClientRect()
    : undefined;
  const sourceInk = measureGeometry
    ? transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source] .katex-display > .katex"
      )?.getBoundingClientRect() ?? sourceRoot
    : undefined;
  choreography.contributions.forEach((contribution) => {
    const contributionFrame = frame.motion.contributions.find(
      (candidate) => candidate.semanticIndex === contribution.semanticIndex
    )!;
    const element = overlay!.querySelector<HTMLElement>(
      `[data-kp-editor-dot-product-contribution="${contribution.semanticIndex}"]`
    );
    if (element === null) return;
    if (
      measureGeometry &&
      transitionRect !== undefined &&
      sourceRoot !== undefined &&
      sourceInk !== undefined
    ) {
      const left = findMotionTokenByEntityId(
        transition,
        contribution.leftSelectorId
      );
      const right = findMotionTokenByEntityId(
        transition,
        contribution.rightSelectorId
      );
      if (left !== undefined && right !== undefined) {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        const pairY =
          (leftRect.top + leftRect.height / 2 +
            rightRect.top + rightRect.height / 2) / 2 -
          transitionRect.top;
        const preferredLeft = sourceInk.right - transitionRect.left + 14;
        // Keep the product readable as a live overlay at narrow widths;
        // clipping would hide the contribution the traversal is explaining.
        const containedLeft = Math.min(
          preferredLeft,
          transitionRect.width - element.offsetWidth - 6
        );
        element.style.left = `${Math.max(6, containedLeft)}px`;
        element.style.top = `${pairY}px`;
      }
    }
    element.style.opacity = String(contributionFrame.productOpacity);
    element.style.transform =
      `translateY(-50%) scale(${contributionFrame.productScale})`;
    element.dataset["kpEditorDotProductContributionStatus"] =
      contributionFrame.status;
    element.dataset["kpEditorDotProductSemanticIndex"] =
      String(contribution.semanticIndex);
    element.dataset["kpEditorDotProductProductObjectId"] =
      contribution.productObjectId;
  });
  if (
    measureGeometry &&
    transitionRect !== undefined &&
    sourceRoot !== undefined
  ) {
    accumulation.style.left = `${
      sourceRoot.left + sourceRoot.width / 2 - transitionRect.left
    }px`;
    const captionTop = transition.querySelector<HTMLElement>(
      ".editor-equation-stage__caption"
    )?.getBoundingClientRect().top;
    const desiredTop = sourceRoot.bottom - transitionRect.top + 8;
    const maximumTop = captionTop === undefined
      ? desiredTop
      : captionTop -
        transitionRect.top -
        accumulation.getBoundingClientRect().height -
        5;
    accumulation.style.top = `${Math.min(desiredTop, maximumTop)}px`;
    markEquationOverlayGeometryMeasured(overlay, geometryRevision);
  }
  accumulation.style.opacity = String(frame.motion.accumulationOpacity);
  accumulation.style.transform = "translateX(-50%)";
  const partialSum = choreography.contributions.find(
    (contribution) =>
      contribution.semanticIndex === frame.motion.accumulatedThroughIndex
  );
  if (partialSum === undefined) {
    delete accumulation.dataset["kpEditorDotProductPartialSumObjectId"];
  } else {
    accumulation.dataset["kpEditorDotProductPartialSumObjectId"] =
      partialSum.partialSumObjectId;
  }
}

function dotProductNarration(
  choreography: KpDotProductTraversalChoreography,
  frame: KpDotProductTraversalChoreographyFrame
): string {
  const activeIndex = frame.motion.activeContributionIndices.at(-1);
  if (activeIndex !== undefined) {
    const contribution = choreography.contributions.find(
      (candidate) => candidate.semanticIndex === activeIndex
    )!;
    return `Pair ${activeIndex + 1}: ${contribution.leftValue} times ${contribution.rightValue} contributes ${contribution.product}.`;
  }
  if (frame.motion.resultRevealProgress > 0) {
    return `The component products accumulate to ${
      choreography.contributions.at(-1)!.accumulatedValue
    }.`;
  }
  if (frame.motion.accumulationLatex !== "") {
    return `Accumulated products: ${frame.motion.accumulationLatex}.`;
  }
  return "Follow matching vector components in semantic index order.";
}

function applyMatrixVectorCompositionChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly choreography: KpMatrixVectorCompositionChoreography;
  readonly frame: KpMatrixVectorCompositionChoreographyFrame;
  readonly rank6Plan?: KpMatrixLinearMapPlan | undefined;
  readonly rank6Frame?: KpMatrixLinearMapFrame | undefined;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpMatrixVectorCompositionChoreography({
        choreography: input.choreography,
        progress: input.frame.motion.semanticProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationMatrixVectorComposition"] =
    input.choreography.id;
  input.transitionElement.dataset["kpEditorEquationMatrixVectorTraversalOrder"] =
    input.choreography.traversal.participants
      .map((participant) => participant.semanticIndex)
      .join(" ");
  input.transitionElement.dataset["kpEditorEquationMatrixVectorActiveRow"] =
    sampled.motion.activeRowIndex === undefined
      ? ""
      : String(sampled.motion.activeRowIndex);
  input.transitionElement.dataset["kpEditorEquationMatrixVectorResolvedThrough"] =
    sampled.motion.resolvedThroughRowIndex === undefined
      ? ""
      : String(sampled.motion.resolvedThroughRowIndex);

  const sourceTokens = [
    ...input.transitionElement.querySelectorAll<HTMLElement>(
      "[data-kp-editor-equation-source] [data-kp-motion-id]"
    )
  ];
  sampled.focusFrames.forEach((focus) => {
    if (focus.frame.attentionProgress <= 0) return;
    const tokens = sourceTokens.filter((token) =>
      focus.plan.semanticEntityIds.some((entityId) =>
        token.dataset["kpMotionId"]?.includes(entityId)
      )
    );
    if (tokens.length === 0) return;
    const binding = bindKpFocusFrameToCss(focus.plan, focus.frame);
    tokens.forEach((token) => {
      token.classList.add(binding.className);
      Object.entries(binding.attributes).forEach(([name, value]) =>
        token.setAttribute(name, value)
      );
      Object.entries(binding.variables).forEach(([name, value]) =>
        token.style.setProperty(name, value)
      );
      token.dataset["kpEditorMatrixVectorFocusRow"] = String(focus.semanticIndex);
    });
  });
  const presentationMode = editorAccessibilityMode(input.transitionElement);
  const rank6Frame = input.rank6Plan === undefined || input.rank6Frame === undefined
    ? undefined
    : presentationMode === "full-motion"
      ? input.rank6Frame
      : sampleKpMatrixLinearMapFrame({
          plan: input.rank6Plan,
          progress: input.direction === "forward"
            ? input.rank6Frame.semanticProgress
            : 1 - input.rank6Frame.semanticProgress,
          direction: input.direction,
          accessibilityMode: presentationMode
        });
  syncMatrixVectorCompositionOverlay(
    input.transitionElement,
    input.choreography,
    sampled,
    rank6Frame
  );
  const narration = input.transitionElement
    .closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.querySelector<HTMLOutputElement>("[data-kp-editor-animation-narration]");
  if (narration !== null && narration !== undefined) {
    const active = input.choreography.rows.find(
      (row) => row.semanticIndex === sampled.motion.activeRowIndex
    );
    narration.replaceChildren(document.createTextNode(
      rank6Frame?.accessibility.liveNarration ?? (active === undefined
        ? "Each resolved component persists while the next matrix row meets the vector."
        : "Row " + (active.semanticIndex + 1) + ": " +
          active.rowValues
            .map((value, index) =>
              value + " times " + active.vectorValues[index]
            )
            .join(" plus ") +
          " equals " + active.result + ".")
    ));
  }
}

function syncMatrixVectorCompositionOverlay(
  transition: HTMLElement,
  choreography: KpMatrixVectorCompositionChoreography,
  frame: KpMatrixVectorCompositionChoreographyFrame,
  rank6Frame?: KpMatrixLinearMapFrame | undefined
): void {
  if (rank6Frame !== undefined) {
    syncMatrixLinearMapOperationBank(transition, choreography, rank6Frame);
    return;
  }
  let overlay = transition.querySelector<HTMLElement>(
    "[data-kp-editor-matrix-vector-overlay]"
  );
  if (overlay === null) {
    overlay = document.createElement("div");
    overlay.className = "editor-equation-stage__matrix-vector-overlay";
    overlay.dataset["kpEditorMatrixVectorOverlay"] = choreography.id;
    overlay.innerHTML = choreography.rows.map((row) => `
      <span class="editor-equation-stage__matrix-vector-row" data-kp-editor-matrix-vector-row="${row.semanticIndex}" data-kp-editor-matrix-vector-intermediate-object-id="${row.intermediateObjectId}">
        ${renderLatexToHtml(row.rowLatex, { displayMode: false })}
      </span>
    `).join("");
    transition.append(overlay);
  }
  const geometryRevision = equationOverlayGeometryRevision(transition);
  const measureGeometry =
    overlay.dataset["kpEditorOverlayGeometryRevision"] !== geometryRevision;
  const transitionRect = measureGeometry
    ? transition.getBoundingClientRect()
    : undefined;
  const sourceInk = measureGeometry
    ? transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source] .katex-display > .katex"
      )?.getBoundingClientRect()
    : undefined;
  choreography.rows.forEach((row) => {
    const rowFrame = frame.motion.rows.find(
      (candidate) => candidate.semanticIndex === row.semanticIndex
    )!;
    const element = overlay!.querySelector<HTMLElement>(
      `[data-kp-editor-matrix-vector-row="${row.semanticIndex}"]`
    );
    if (element === null) return;
    if (measureGeometry && transitionRect !== undefined && sourceInk !== undefined) {
      const rowTokens = row.matrixSelectorIds
        .map((selectorId) => findMotionTokenByEntityId(transition, selectorId))
        .filter((token): token is HTMLElement => token !== undefined);
      if (rowTokens.length > 0) {
        const rowRects = rowTokens.map((token) => token.getBoundingClientRect());
        const rowCenter = rowRects.reduce(
          (sum, rect) => sum + rect.top + rect.height / 2,
          0
        ) / rowRects.length - transitionRect.top;
        if (transitionRect.width < 400) {
          element.style.left = String(Math.max(
            6,
            (transitionRect.width - element.offsetWidth) / 2
          )) + "px";
          element.style.top = String(
            sourceInk.bottom -
            transitionRect.top +
            13 +
            row.semanticIndex * 25
          ) + "px";
        } else {
          const preferredLeft = sourceInk.right - transitionRect.left + 14;
          const containedLeft = Math.min(
            preferredLeft,
            transitionRect.width - element.offsetWidth - 6
          );
          element.style.left = `${Math.max(6, containedLeft)}px`;
          element.style.top = `${rowCenter}px`;
        }
      }
    }
    element.style.opacity = String(
      rowFrame.calculationOpacity * frame.motion.sourceOpacity
    );
    element.style.transform = `translateY(-50%) translateX(${
      5 * (1 - rowFrame.localProgress)
    }px)`;
    element.dataset["kpEditorMatrixVectorRowStatus"] = rowFrame.status;
    element.dataset["kpEditorMatrixVectorResult"] = String(row.result);
  });
  if (
    measureGeometry &&
    transitionRect !== undefined &&
    sourceInk !== undefined
  ) {
    markEquationOverlayGeometryMeasured(overlay, geometryRevision);
  }
}

function syncMatrixLinearMapOperationBank(
  transition: HTMLElement,
  choreography: KpMatrixVectorCompositionChoreography,
  frame: KpMatrixLinearMapFrame
): void {
  let bank = transition.querySelector<HTMLElement>(
    "[data-kp-editor-matrix-operation-bank]"
  );
  if (bank === null) {
    bank = document.createElement("section");
    bank.className = "editor-equation-stage__matrix-operation-bank";
    bank.dataset["kpEditorMatrixVectorOverlay"] = choreography.id;
    bank.dataset["kpEditorMatrixOperationBank"] = frame.animationId;
    bank.dataset["kpEditorMatrixOperationInputPolicy"] =
      "persistent-reference";
    bank.dataset["kpEditorMatrixOperationDepletion"] = "false";
    bank.dataset["kpEditorMatrixOperationTopology"] =
      "persistent-input-pour";
    bank.setAttribute("role", "img");
    const inputContributions = frame.operationBank.rows[0]?.contributions ?? [];
    bank.innerHTML = `
      <div class="editor-equation-stage__matrix-operation-inputs">
        <span class="editor-equation-stage__matrix-operation-matrix" data-kp-editor-matrix-operation-input="matrix">
          <small>row operations</small>
          ${renderLatexToHtml(
            String.raw`A=\begin{bmatrix}2&1\\0&3\end{bmatrix}`,
            { displayMode: false }
          )}
        </span>
        <span class="editor-equation-stage__matrix-operation-sources" data-kp-editor-matrix-operation-input="vector">
          <small>persistent inputs</small>
          <span class="editor-equation-stage__matrix-operation-source-list">
            ${inputContributions.map((contribution) => `
              <span data-kp-editor-matrix-operation-source="${contribution.columnIndex}">
                ${renderLatexToHtml(
                  `v_{${contribution.columnIndex + 1}}=${contribution.vectorValue}`,
                  { displayMode: false }
                )}
              </span>
            `).join("")}
          </span>
        </span>
      </div>
      <p class="editor-equation-stage__matrix-operation-instruction">
        Pour each persistent input through every row operation; the source remains available.
      </p>
      <div class="editor-equation-stage__matrix-operation-rows">
        ${choreography.rows.map((row) => {
          const frameRow = frame.operationBank.rows.find((candidate) =>
            candidate.semanticIndex === row.semanticIndex
          )!;
          return `
            <div class="editor-equation-stage__matrix-operation-row" data-kp-editor-matrix-vector-row="${row.semanticIndex}" data-kp-editor-matrix-vector-intermediate-object-id="${row.intermediateObjectId}">
              <span class="editor-equation-stage__matrix-operation-row-label">
                ${renderLatexToHtml(`r_{${row.semanticIndex + 1}}`, { displayMode: false })}
              </span>
              <span class="editor-animation-player__visually-hidden">
                ${renderLatexToHtml(row.rowLatex, { displayMode: false })}
              </span>
              <span class="editor-equation-stage__matrix-operation-flow">
                ${frameRow.contributions.map((contribution) => `
                  <span class="editor-equation-stage__matrix-operation-route" data-kp-editor-matrix-operation-contribution="${row.semanticIndex}.${contribution.columnIndex}">
                    <span class="editor-equation-stage__matrix-operation-source-reference">${renderLatexToHtml(
                      String(contribution.vectorValue),
                      { displayMode: false }
                    )}</span>
                    <span class="editor-equation-stage__matrix-operation-channel" aria-hidden="true">
                      <i></i><b></b>
                    </span>
                    <span class="editor-equation-stage__matrix-operation-gate" data-kp-editor-matrix-operation-gate="${row.semanticIndex}.${contribution.columnIndex}">${renderLatexToHtml(
                      `\\times ${contribution.matrixValue}`,
                      { displayMode: false }
                    )}</span>
                    <span class="editor-equation-stage__matrix-operation-product" data-kp-editor-matrix-operation-product="${row.semanticIndex}.${contribution.columnIndex}">
                      ${renderLatexToHtml(`=${contribution.product}`, { displayMode: false })}
                    </span>
                  </span>
                `).join("")}
              </span>
              <span class="editor-equation-stage__matrix-operation-fold" data-kp-editor-matrix-operation-fold="${row.semanticIndex}">
                <i aria-hidden="true"></i>
                ${renderLatexToHtml(
                  frameRow.contributions.map((item) => item.product).join("+"),
                  { displayMode: false }
                )}
              </span>
              <span class="editor-equation-stage__matrix-operation-output" data-kp-editor-matrix-operation-output="${row.semanticIndex}">
                ${renderLatexToHtml(String(row.result), { displayMode: false })}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;
    transition.append(bank);
  }
  bank.setAttribute("aria-label", frame.accessibility.description);
  bank.dataset["kpEditorMatrixOperationAccessibilityMode"] =
    frame.accessibilityMode;
  bank.dataset["kpEditorMatrixOperationMotionPolicy"] =
    frame.accessibility.motionPolicy;
  frame.operationBank.rows.forEach((row) => {
    const rowElement = bank!.querySelector<HTMLElement>(
      `[data-kp-editor-matrix-vector-row="${row.semanticIndex}"]`
    );
    if (rowElement === null) return;
    rowElement.dataset["kpEditorMatrixVectorRowStatus"] = row.status;
    rowElement.dataset["kpEditorMatrixVectorResult"] = String(row.result);
    rowElement.dataset["kpEditorMatrixOperationHoldPhase"] = row.holdPhase;
    rowElement.style.setProperty(
      "--kp-matrix-operation-row-emphasis",
      row.status === "active" ? "1" : row.status === "resolved" ? "0.72" : "0.36"
    );
    row.contributions.forEach((contribution) => {
      const route = rowElement.querySelector<HTMLElement>(
        `[data-kp-editor-matrix-operation-contribution="${row.semanticIndex}.${contribution.columnIndex}"]`
      );
      route?.style.setProperty(
        "--kp-matrix-operation-route-progress",
        String(row.routeProgress)
      );
      const product = route?.querySelector<HTMLElement>(
        `[data-kp-editor-matrix-operation-product="${row.semanticIndex}.${contribution.columnIndex}"]`
      );
      product?.style.setProperty(
        "--kp-matrix-operation-product-progress",
        String(contribution.productRevealProgress)
      );
    });
    const fold = rowElement.querySelector<HTMLElement>(
      `[data-kp-editor-matrix-operation-fold="${row.semanticIndex}"]`
    );
    if (fold !== null) {
      fold.dataset["kpEditorMatrixOperationFoldPhase"] = row.foldPhase;
      fold.dataset["kpEditorMatrixOperationHoldPhase"] = row.holdPhase;
      fold.style.setProperty(
        "--kp-matrix-operation-gather-progress",
        String(row.gatherProgress)
      );
      fold.style.setProperty(
        "--kp-matrix-operation-collapse-progress",
        String(row.coordinateProgress)
      );
    }
    const output = rowElement.querySelector<HTMLElement>(
      `[data-kp-editor-matrix-operation-output="${row.semanticIndex}"]`
    );
    output?.style.setProperty(
      "--kp-matrix-operation-output-progress",
      String(row.coordinateProgress)
    );
  });
}

function applyMatrixMatrixCompositionChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly direction: "forward" | "rewind";
  readonly choreography: KpMatrixMatrixCompositionChoreography;
  readonly frame: KpMatrixMatrixCompositionChoreographyFrame;
}): void {
  const accessibilityMode = (() => {
    switch (editorAccessibilityMode(input.transitionElement)) {
      case "reduced-motion": return "reduced" as const;
      case "static": return "no-depth" as const;
      default: return "full" as const;
    }
  })();
  const sampled = accessibilityMode === "full"
    ? input.frame
    : sampleKpMatrixMatrixCompositionChoreography({
        choreography: input.choreography,
        progress: input.frame.motion.semanticProgress,
        direction: input.direction,
        accessibilityMode
      });
  input.transitionElement.dataset["kpEditorEquationMatrixMatrixComposition"] =
    input.choreography.id;
  input.transitionElement.dataset["kpEditorEquationMatrixMatrixTraversalOrder"] =
    input.choreography.traversal.participants
      .map((participant) => participant.semanticIndex)
      .join(" ");
  input.transitionElement.dataset["kpEditorEquationMatrixMatrixActiveCell"] =
    sampled.motion.activeCellIndex === undefined
      ? ""
      : String(sampled.motion.activeCellIndex);
  input.transitionElement.dataset["kpEditorEquationMatrixMatrixResolvedThrough"] =
    sampled.motion.resolvedThroughCellIndex === undefined
      ? ""
      : String(sampled.motion.resolvedThroughCellIndex);

  const sourceTokens = [
    ...input.transitionElement.querySelectorAll<HTMLElement>(
      "[data-kp-editor-equation-source] [data-kp-motion-id]"
    )
  ];
  sampled.focusFrames.forEach((focus) => {
    if (focus.frame.attentionProgress <= 0) return;
    const tokens = sourceTokens.filter((token) =>
      focus.plan.semanticEntityIds.some((entityId) =>
        token.dataset["kpMotionId"]?.includes(entityId)
      )
    );
    if (tokens.length === 0) return;
    const binding = bindKpFocusFrameToCss(focus.plan, focus.frame);
    tokens.forEach((token) => {
      token.classList.add(binding.className);
      Object.entries(binding.attributes).forEach(([name, value]) =>
        token.setAttribute(name, value)
      );
      Object.entries(binding.variables).forEach(([name, value]) =>
        token.style.setProperty(name, value)
      );
      token.dataset["kpEditorMatrixMatrixFocusCell"] =
        String(focus.semanticIndex);
    });
  });
  syncMatrixMatrixCompositionOverlay(
    input.transitionElement,
    input.choreography,
    sampled
  );
  const narration = input.transitionElement
    .closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.querySelector<HTMLOutputElement>("[data-kp-editor-animation-narration]");
  if (narration !== null && narration !== undefined) {
    const active = input.choreography.cells.find(
      (cell) => cell.semanticIndex === sampled.motion.activeCellIndex
    );
    narration.replaceChildren(document.createTextNode(
      active === undefined
        ? "Resolved entries persist while the product matrix settles."
        : "Entry " + (active.rowIndex + 1) + "," +
          (active.columnIndex + 1) + ": " +
          active.leftValues
            .map((value, index) =>
              value + " times " + active.rightValues[index]
            )
            .join(" plus ") +
          " equals " + active.result + "."
    ));
  }
}

function syncMatrixMatrixCompositionOverlay(
  transition: HTMLElement,
  choreography: KpMatrixMatrixCompositionChoreography,
  frame: KpMatrixMatrixCompositionChoreographyFrame
): void {
  let overlay = transition.querySelector<HTMLElement>(
    "[data-kp-editor-matrix-matrix-overlay]"
  );
  if (overlay === null) {
    overlay = document.createElement("div");
    overlay.className = "editor-equation-stage__matrix-matrix-overlay";
    overlay.dataset["kpEditorMatrixMatrixOverlay"] = choreography.id;
    overlay.innerHTML = choreography.cells.map((cell) => `
      <span class="editor-equation-stage__matrix-matrix-cell" data-kp-editor-matrix-matrix-cell="${cell.semanticIndex}" data-kp-editor-matrix-matrix-intermediate-object-id="${cell.intermediateObjectId}">
        ${renderLatexToHtml(cell.cellLatex, { displayMode: false })}
      </span>
    `).join("");
    transition.append(overlay);
  }
  const geometryRevision = equationOverlayGeometryRevision(transition);
  const measureGeometry =
    overlay.dataset["kpEditorOverlayGeometryRevision"] !== geometryRevision;
  const transitionRect = measureGeometry
    ? transition.getBoundingClientRect()
    : undefined;
  const sourceInk = measureGeometry
    ? transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source] .katex-display > .katex"
      )?.getBoundingClientRect()
    : undefined;
  choreography.cells.forEach((cell) => {
    const cellFrame = frame.motion.cells.find(
      (candidate) => candidate.semanticIndex === cell.semanticIndex
    )!;
    const element = overlay!.querySelector<HTMLElement>(
      `[data-kp-editor-matrix-matrix-cell="${cell.semanticIndex}"]`
    );
    if (element === null) return;
    if (measureGeometry && transitionRect !== undefined && sourceInk !== undefined) {
      element.style.left = String(Math.max(
        6,
        (transitionRect.width - element.offsetWidth) / 2
      )) + "px";
      element.style.top = String(
        sourceInk.bottom - transitionRect.top + 14
      ) + "px";
    }
    element.style.opacity = String(
      cellFrame.calculationOpacity * frame.motion.sourceOpacity
    );
    element.style.transform =
      "translateY(-50%) translateX(" +
      (5 * (1 - cellFrame.localProgress)) +
      "px)";
    element.dataset["kpEditorMatrixMatrixCellStatus"] = cellFrame.status;
    element.dataset["kpEditorMatrixMatrixResult"] = String(cell.result);
    element.dataset["kpEditorMatrixMatrixRow"] = String(cell.rowIndex);
    element.dataset["kpEditorMatrixMatrixColumn"] = String(cell.columnIndex);
  });
  if (
    measureGeometry &&
    transitionRect !== undefined &&
    sourceInk !== undefined
  ) {
    markEquationOverlayGeometryMeasured(overlay, geometryRevision);
  }
}

function equationOverlayGeometryRevision(transition: HTMLElement): string {
  return transition.closest<HTMLElement>("[data-kp-editor-equation-stage]")
    ?.dataset["kpEditorEquationCacheRevision"] ?? "0";
}

function markEquationOverlayGeometryMeasured(
  overlay: HTMLElement,
  revision: string
): void {
  overlay.dataset["kpEditorOverlayGeometryRevision"] = revision;
  overlay.dataset["kpEditorOverlayGeometryMeasureCount"] = String(
    Number(overlay.dataset["kpEditorOverlayGeometryMeasureCount"] ?? 0) + 1
  );
  const stage = overlay.closest<HTMLElement>("[data-kp-editor-equation-stage]");
  if (stage !== null) {
    stage.dataset["kpEditorEquationOverlayGeometryMeasureCount"] = String(
      Number(
        stage.dataset["kpEditorEquationOverlayGeometryMeasureCount"] ?? 0
      ) + 1
    );
  }
}

function findMotionTokenByEntityId(
  transition: HTMLElement,
  entityId: string
): HTMLElement | undefined {
  return [
    ...transition.querySelectorAll<HTMLElement>(
      "[data-kp-editor-equation-source] [data-kp-motion-id]"
    )
  ].find((token) => token.dataset["kpMotionId"]?.includes(entityId));
}

function renderStage(frame: KpEditorEquationStageFrame): string {
  return `
    <div class="editor-equation-stage" data-kp-editor-equation-stage data-kp-editor-equation-stage-identity-key="${escapeHtml(frame.stageIdentityKey)}" data-kp-editor-equation-content-key="${escapeHtml(frame.contentKey)}" data-kp-editor-equation-material-identity-key="${escapeHtml(frame.materialIdentityKey)}" data-kp-editor-equation-phase-id="${escapeHtml(frame.projection.phaseId)}" data-kp-editor-equation-global-progress="${frame.globalProgress}" data-kp-editor-equation-semantic-progress="${frame.semanticProgress}" data-kp-editor-equation-local-progress="${frame.localProgress}">
      <div class="editor-equation-stage__content" data-kp-editor-equation-content>
        ${renderStageContent(frame)}
      </div>
      <div class="editor-equation-stage__material-layer" data-kp-editor-equation-material-layer aria-hidden="true"></div>
    </div>
  `;
}

function renderStageContent(frame: KpEditorEquationStageFrame): string {
  return `${frame.projection.transitions.map((transition, index) => `
        <article class="editor-equation-stage__transition" data-kp-editor-equation-transition-id="${escapeHtml(transition.id)}" data-kp-editor-equation-transition-index="${index}" data-kp-editor-equation-motif="${frame.motifs[index]?.kind ?? "artifact-replace"}" data-kp-editor-equation-semantic-status="${transition.semanticStatus}" aria-label="${escapeHtml(transition.title)}">
          <div class="editor-equation-stage__layer editor-equation-stage__layer--source" data-kp-editor-equation-source>
            ${renderEquationObjects(transition.source, frame.mathLayout)}
          </div>
          <div class="editor-equation-stage__layer editor-equation-stage__layer--target" data-kp-editor-equation-target>
            ${renderEquationObjects(transition.target, frame.mathLayout)}
          </div>
          <div class="editor-equation-stage__caption">
            <span data-kp-editor-equation-motif-label>${escapeHtml(motifLabel(frame.motifs[index]?.kind ?? "artifact-replace"))}</span>
            <span>${escapeHtml(transition.title)}</span>
            <span data-kp-editor-equation-semantic-diagnostic>${escapeHtml(semanticStatusLabel(transition))}</span>
            ${renderFocusTokens(frame.motifs[index]?.focusLabels ?? [])}
          </div>
        </article>
      `).join("")}
      ${frame.solveX === undefined ? "" : renderSolveXSequence(frame.solveX)}`;
}

function semanticStatusLabel(
  transition: KpEditorEquationRuntimeFrameProjection["transitions"][number]
): string {
  if (transition.semanticStatus === "ready") return "Semantic token motion ready";
  const codes = [...new Set(
    transition.semanticDiagnostics.map((diagnostic) => diagnostic.code)
  )];
  return `Whole-equation fallback: ${codes.join(", ") || "semantic coverage unavailable"}`;
}

function replaceStageContent(
  stage: HTMLElement,
  frame: KpEditorEquationStageFrame
): void {
  const template = document.createElement("template");
  template.innerHTML = renderStageContent(frame);
  const content = stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-content]"
  );
  if (content === null) {
    throw new Error("Equation stage is missing its replaceable content layer.");
  }
  content.replaceChildren(...template.content.childNodes);
  stage.dataset["kpEditorEquationContentKey"] = frame.contentKey;
  stage.dataset["kpEditorEquationMaterialIdentityKey"] =
    frame.materialIdentityKey;
}

function renderEquationObjects(
  objects: readonly KpEditorEquationObjectProjection[],
  mathLayout: KpEditorEquationStageFrame["mathLayout"]
): string {
  return objects.map((object) => {
    const annotated = annotatedLatexForObject(object);
    return `
    <div class="editor-equation-stage__object" data-kp-editor-equation-object-id="${escapeHtml(object.id)}">
      ${annotated === undefined
        ? renderLatexToHtml(object.latex, {
            displayMode: mathLayout === "display"
          })
        : renderSelectorAnnotatedLatexToHtml(annotated, {
            displayMode: mathLayout === "display"
          })}
    </div>
  `;
  }).join("");
}

function applySemanticTokenMotion(input: {
  readonly stage: HTMLElement;
  readonly transitionElement: HTMLElement;
  readonly transitionIndex: number;
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
  readonly frame: KpEditorEquationStageFrame;
}): boolean {
  let precomputed = semanticMotionPlanCache.get(input.stage)?.contentKey === input.frame.contentKey
    ? semanticMotionPlanCache.get(input.stage)?.plans.get(input.transitionIndex)
    : undefined;

  if (precomputed === undefined) {
    const transformation = input.animation.transformations.find(
      (candidate) => candidate.id === input.frame.projection.transitions[input.transitionIndex]?.id
    );
    if (transformation === undefined) return false;
    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: input.animation.bundle
    });
    if (compiled.status !== "semantic" || compiled.ir === undefined) return false;

    const sourceAnnotated = annotatedLatexForStates(compiled.ir.source);
    const targetAnnotated = annotatedLatexForStates(compiled.ir.target);
    if (sourceAnnotated === undefined || targetAnnotated === undefined) return false;
    const displayedSource = input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-equation-source]"
    );
    const displayedTarget = input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-equation-target]"
    );
    if (displayedSource === null || displayedTarget === null) return false;
    const motifKind = input.frame.motifs[input.transitionIndex]?.kind;
    const presentationPolicy = kpEquationPresentationPolicy(input.animation);
    input.transitionElement.dataset["kpEditorEquationPresentationRecipe"] =
      presentationPolicy.recipe;
    input.transitionElement.dataset["kpEditorEquationContinuantRecipe"] =
      presentationPolicy.continuants;
    const identityAbsorptionRoles = identityAbsorptionRoleRecordIds(
      transformation,
      input.animation.bundle
    );
    const annihilationOperationId = witnessedAnnihilationOperationId(
      transformation.transformType
    );
    const witnessedAnnihilationBinding =
      !presentationPolicy.applyWitnessedAnnihilation ||
      annihilationOperationId === undefined
      ? undefined
      : requiredWitnessedAnnihilationRuntime().createBinding({
          operationId: annihilationOperationId,
          transformation,
          bundle: input.animation.bundle,
          cancellationRecordId: requiredCancellationRecordId(transformation)
        });

    // IR remains forward-oriented; rewind swaps the displayed roots and samples
    // semantic progress backward, so both directions share exactly one geometry.
    const geometry = measureKpEquationTransitionGeometry({
      ir: compiled.ir,
      sourceRoot: input.state.direction === "forward" ? displayedSource : displayedTarget,
      targetRoot: input.state.direction === "forward" ? displayedTarget : displayedSource,
      sourceAnnotated,
      targetAnnotated,
      sourceMotionIdsBySelector: bindStructuralMotionIds(
        input.state.direction === "forward" ? displayedSource : displayedTarget,
        compiled.ir.source
      ),
      targetMotionIdsBySelector: bindStructuralMotionIds(
        input.state.direction === "forward" ? displayedTarget : displayedSource,
        compiled.ir.target
      ),
      ...(motifKind === "wrap" || motifKind === "unwrap"
        ? { enclosureChoreographyKind: motifKind }
        : {}),
      ...(input.frame.derivativePower !== undefined
        ? {
            lineageChoreographyKind: "copy-fan-out" as const,
            derivativePowerChoreographyPlan:
              input.frame.derivativePower.plan
          }
        : motifKind === "copy-fan-out" || motifKind === "merge-fan-in" || motifKind === "substitute"
        ? { lineageChoreographyKind: motifKind }
        : {}),
      ...(transformation.transformType === "distributeMultiplication"
        ? { distributionChoreographyKind: "canonical-fan-out" as const }
        : {}),
      ...(transformation.transformType === "factorCommonTerm"
        ? { factoringChoreographyKind: "canonical-fan-in" as const }
        : {}),
      ...(fractionChoreographyKind(transformation.transformType) === undefined
        ? {}
        : {
            fractionChoreographyKind: fractionChoreographyKind(
              transformation.transformType
            )!
          }),
      ...(exponentLawChoreographyKind(transformation.transformType) === undefined
        ? {}
        : {
            exponentLawChoreographyKind: exponentLawChoreographyKind(
              transformation.transformType
            )!
          }),
      ...(identityAbsorptionChoreographyKind(transformation.transformType) === undefined
        ? {}
        : {
            identityAbsorptionChoreographyKind:
              identityAbsorptionChoreographyKind(
                transformation.transformType
              )!
          }),
      ...(identityAbsorptionRoles === undefined
        ? {}
        : { identityAbsorptionRoleRecordIds: identityAbsorptionRoles }),
      ...(transformation.transformType === "multiplyNegativeBothSidesInequality"
        ? { inequalityPivotChoreographyKind: "negative-scale-relation-pivot" as const }
        : {}),
      ...(input.frame.radicalSuccession === undefined
        ? {}
        : { representationalSuccessionKind: "opposite-corner-seed" as const }),
      ...(input.frame.linearRearrangement === undefined
        ? {}
        : {
            linearRearrangementKind:
              input.frame.linearRearrangement.step.kind,
            cancellationPresentationRecipe: presentationPolicy.cancellation,
            zeroWitnessPresentationRecipe: presentationPolicy.zeroWitness,
            successorPresentationRecipe: presentationPolicy.successor,
            depthPresentationRecipe: presentationPolicy.depth,
            continuantPresentationRecipe: presentationPolicy.continuants,
            ...(presentationPolicy.successor === "native-handoff-v1" ||
              input.frame.linearRearrangement.step.successorSynthesisBinding === undefined
              ? {}
              : {
                  successorSynthesisBinding:
                    input.frame.linearRearrangement.step.successorSynthesisBinding
                })
          }),
      ...(witnessedAnnihilationBinding === undefined
        ? {}
        : { witnessedAnnihilationBinding }),
      ...(input.frame.dotProductTraversal === undefined
        ? {}
        : {
            dotProductTraversalPlan:
              input.frame.dotProductTraversal.choreography.rendererPlan
          }),
      ...(input.frame.matrixVectorComposition === undefined
        ? {}
        : {
            matrixVectorCompositionPlan:
              input.frame.matrixVectorComposition.choreography.rendererPlan
          }),
      ...(input.frame.matrixMatrixComposition === undefined
        ? {}
        : {
            matrixMatrixCompositionPlan:
              input.frame.matrixMatrixComposition.choreography.rendererPlan
          })
    });
    precomputed = createKpPrecomputedEquationMotionPlan({
      id: `${input.frame.contentKey}.transition.${input.transitionIndex}`,
      geometry,
      motifKind: motifKind ?? "artifact-replace",
      spacing: editorSpacing(input.stage),
      pathPreference: editorPathPreference(input.stage)
    });
    const existing = semanticMotionPlanCache.get(input.stage);
    const plans = existing?.contentKey === input.frame.contentKey
      ? new Map(existing.plans)
      : new Map<number, KpPrecomputedEquationMotionPlan>();
    plans.set(input.transitionIndex, precomputed);
    semanticMotionPlanCache.set(input.stage, {
      contentKey: input.frame.contentKey,
      plans
    });
  }

  const geometry = precomputed.geometry;
  input.transitionElement.dataset["kpEditorEquationWitnessedAnnihilationActive"] =
    String(geometry.witnessedAnnihilationPlan !== undefined);
  input.transitionElement.dataset["kpEditorEquationSuccessorSynthesisActive"] =
    String(geometry.successorSynthesisPlan !== undefined);

  resetLayerForSemanticMotion(input.transitionElement, "[data-kp-editor-equation-source]");
  resetLayerForSemanticMotion(input.transitionElement, "[data-kp-editor-equation-target]");
  const tokenFrame = createKpEditorSemanticEquationTokenFrame({
    geometry,
    playerState: input.state,
    phaseLocalProgress: input.frame.localProgress,
    precomputedPlan: precomputed,
    accessibilityMode: editorAccessibilityMode(input.stage)
  });
  applyKpEditorSemanticEquationTokenFrame(geometry, tokenFrame);
  syncWitnessedAnnihilationOverlay({
    transition: input.transitionElement,
    geometry,
    frame: tokenFrame.motion.witnessedAnnihilation
  });
  syncIndependentZeroWitnessOverlay({
    transition: input.transitionElement,
    geometry,
    frame: tokenFrame.motion.independentZeroWitness
  });
  if (
    tokenFrame.motion.derivativePower !== undefined &&
    geometry.derivativePowerChoreographyPlan !== undefined
  ) {
    applyDerivativePowerTokenFocus({
      transition: input.transitionElement,
      geometry,
      plan: geometry.derivativePowerChoreographyPlan,
      frame: tokenFrame.motion.derivativePower
    });
  }
  if (tokenFrame.motion.distributionChoreography !== undefined) {
    applyDistributionFactorFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.distributionChoreography
    });
  }
  if (tokenFrame.motion.factoringChoreography !== undefined) {
    applyFactoringFactorFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.factoringChoreography
    });
  }
  if (tokenFrame.motion.fractionChoreography !== undefined) {
    applyFractionRoleFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.fractionChoreography
    });
  }
  if (tokenFrame.motion.exponentLawChoreography !== undefined) {
    applyExponentLawFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.exponentLawChoreography
    });
  }
  if (tokenFrame.motion.identityAbsorptionChoreography !== undefined) {
    applyIdentityAbsorptionFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.identityAbsorptionChoreography
    });
  }
  if (tokenFrame.motion.inequalityPivotChoreography !== undefined) {
    applyInequalityPivotFocus({
      transition: input.transitionElement,
      geometry,
      frame: tokenFrame.motion.inequalityPivotChoreography
    });
  }
  input.transitionElement.dataset["kpEditorEquationSemanticProgress"] =
    String(tokenFrame.semanticProgress);
  input.transitionElement.dataset["kpEditorEquationMotionPlanId"] = precomputed.id;
  input.transitionElement.dataset["kpEditorEquationLayoutPlanRevision"] =
    String(precomputed.layoutPlan.revision);
  input.transitionElement.dataset["kpEditorEquationAuthoringRevision"] =
    input.frame.contentKey.split(":authoring-").at(-1) ?? "0";
  input.transitionElement.dataset["kpEditorEquationPathPlanCount"] =
    String(precomputed.relationPathPlans.size + precomputed.tokenPathPlans.size);
  input.transitionElement.dataset["kpEditorEquationSemanticPreviousCheckpoint"] =
    tokenFrame.semanticTimeline.previousCheckpointId;
  input.transitionElement.dataset["kpEditorEquationSemanticNextCheckpoint"] =
    tokenFrame.semanticTimeline.nextCheckpointId;
  input.transitionElement.dataset["kpEditorEquationAccessibilityMode"] =
    tokenFrame.accessibilityMode;
  const narration = input.stage.closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.querySelector<HTMLOutputElement>("[data-kp-editor-animation-narration]");
  if (narration !== null && narration !== undefined) {
    narration.replaceChildren(document.createTextNode(tokenFrame.narration));
  }
  const choreography = tokenFrame.motion.enclosureChoreography;
  if (choreography === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationEnclosureChoreography"];
    delete input.transitionElement.dataset["kpEditorEquationPersistentTravelProgress"];
    delete input.transitionElement.dataset["kpEditorEquationEnclosureVisibility"];
    delete input.transitionElement.dataset["kpEditorEquationOuterArtifactVisibility"];
  } else {
    input.transitionElement.dataset["kpEditorEquationEnclosureChoreography"] = choreography.kind;
    input.transitionElement.dataset["kpEditorEquationPersistentTravelProgress"] =
      String(choreography.persistentTravelProgress);
    input.transitionElement.dataset["kpEditorEquationEnclosureVisibility"] =
      String(choreography.enclosureVisibility);
    input.transitionElement.dataset["kpEditorEquationOuterArtifactVisibility"] =
      String(choreography.outerArtifactVisibility);
  }
  const lineage = tokenFrame.motion.lineageChoreography;
  if (lineage === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationLineageChoreography"];
    delete input.transitionElement.dataset["kpEditorEquationLineagePathCount"];
    delete input.transitionElement.dataset["kpEditorEquationLineageTransitProgress"];
  } else {
    input.transitionElement.dataset["kpEditorEquationLineageChoreography"] =
      input.frame.motifs[input.transitionIndex]?.kind ?? "copy-fan-out";
    input.transitionElement.dataset["kpEditorEquationLineagePathCount"] =
      String(lineage.descendants.length);
    input.transitionElement.dataset["kpEditorEquationLineageTransitProgress"] =
      String(lineage.phases["transit-descendants"]);
  }
  const succession = tokenFrame.motion.representationalSuccession;
  if (succession === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationRepresentationalSuccession"];
    delete input.transitionElement.dataset["kpEditorEquationContinuantReflowProgress"];
    delete input.transitionElement.dataset["kpEditorEquationSourceGatherProgress"];
    delete input.transitionElement.dataset["kpEditorEquationSuccessionBundle"];
    delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionPlanId"];
    delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionSourcesReady"];
    delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionTargetRecognizable"];
  } else {
    input.transitionElement.dataset["kpEditorEquationRepresentationalSuccession"] =
      succession.kind;
    input.transitionElement.dataset["kpEditorEquationContinuantReflowProgress"] =
      String(succession.continuantReflowProgress);
    input.transitionElement.dataset["kpEditorEquationSourceGatherProgress"] =
      String(succession.sourceGatherProgress);
    input.transitionElement.dataset["kpEditorEquationSuccessionBundle"] =
      `${succession.bundlePoint.x},${succession.bundlePoint.y}`;
    if (succession.materialJunctionPlanId === undefined) {
      delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionPlanId"];
      delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionSourcesReady"];
      delete input.transitionElement.dataset["kpEditorEquationMaterialJunctionTargetRecognizable"];
    } else {
      input.transitionElement.dataset["kpEditorEquationMaterialJunctionPlanId"] =
        succession.materialJunctionPlanId;
      input.transitionElement.dataset["kpEditorEquationMaterialJunctionSourcesReady"] =
        String(succession.allRequiredSourcesReady);
      input.transitionElement.dataset["kpEditorEquationMaterialJunctionTargetRecognizable"] =
        String(succession.targetRecognizable);
    }
  }
  const linearRearrangement = tokenFrame.motion.linearRearrangement;
  if (linearRearrangement === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationLinearRearrangement"];
    delete input.transitionElement.dataset["kpEditorEquationPersistentReflowProgress"];
    delete input.transitionElement.dataset["kpEditorEquationFocalTransitProgress"];
    delete input.transitionElement.dataset["kpEditorEquationMeetProgress"];
    delete input.transitionElement.dataset["kpEditorEquationCollapseProgress"];
    delete input.transitionElement.dataset["kpEditorEquationResultRevealProgress"];
  } else {
    input.transitionElement.dataset["kpEditorEquationLinearRearrangement"] =
      linearRearrangement.kind;
    input.transitionElement.dataset["kpEditorEquationPersistentReflowProgress"] =
      String(linearRearrangement.persistentReflowProgress);
    input.transitionElement.dataset["kpEditorEquationFocalTransitProgress"] =
      String(linearRearrangement.focalTransitProgress);
    input.transitionElement.dataset["kpEditorEquationMeetProgress"] =
      String(linearRearrangement.meetProgress);
    input.transitionElement.dataset["kpEditorEquationCollapseProgress"] =
      String(linearRearrangement.collapseProgress);
    input.transitionElement.dataset["kpEditorEquationResultRevealProgress"] =
      String(linearRearrangement.resultRevealProgress);
  }
  const dotProduct = tokenFrame.motion.dotProductTraversal;
  if (dotProduct === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationDotProductTraversal"];
    delete input.transitionElement.dataset["kpEditorEquationDotProductActProgress"];
    delete input.transitionElement.dataset["kpEditorEquationDotProductResultReveal"];
  } else {
    input.transitionElement.dataset["kpEditorEquationDotProductTraversal"] =
      dotProduct.kind;
    input.transitionElement.dataset["kpEditorEquationDotProductActProgress"] =
      String(dotProduct.actProgress);
    input.transitionElement.dataset["kpEditorEquationDotProductResultReveal"] =
      String(dotProduct.resultRevealProgress);
  }
  const matrixVector = tokenFrame.motion.matrixVectorComposition;
  if (matrixVector === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationMatrixVectorTokenPlan"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixVectorSourceOpacity"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixVectorDurationMs"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixVectorSemanticActionCount"];
  } else {
    input.transitionElement.dataset["kpEditorEquationMatrixVectorTokenPlan"] =
      matrixVector.kind;
    input.transitionElement.dataset["kpEditorEquationMatrixVectorSourceOpacity"] =
      String(matrixVector.sourceOpacity);
    input.transitionElement.dataset["kpEditorEquationMatrixVectorDurationMs"] =
      String(matrixVector.semanticDurationMs);
    input.transitionElement.dataset["kpEditorEquationMatrixVectorSemanticActionCount"] =
      String(matrixVector.semanticActionCount);
  }
  const matrixMatrix = tokenFrame.motion.matrixMatrixComposition;
  if (matrixMatrix === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationMatrixMatrixTokenPlan"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixMatrixSourceOpacity"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixMatrixDurationMs"];
    delete input.transitionElement.dataset["kpEditorEquationMatrixMatrixSemanticActionCount"];
  } else {
    input.transitionElement.dataset["kpEditorEquationMatrixMatrixTokenPlan"] =
      matrixMatrix.kind;
    input.transitionElement.dataset["kpEditorEquationMatrixMatrixSourceOpacity"] =
      String(matrixMatrix.sourceOpacity);
    input.transitionElement.dataset["kpEditorEquationMatrixMatrixDurationMs"] =
      String(matrixMatrix.semanticDurationMs);
    input.transitionElement.dataset["kpEditorEquationMatrixMatrixSemanticActionCount"] =
      String(matrixMatrix.semanticActionCount);
  }
  return true;
}

function applyCanonicalReverseChoreography(input: {
  readonly transitionElement: HTMLElement;
  readonly animation: KpAnimationAsset;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly announce: boolean;
  readonly runtimeCapabilities: KpEditorAnimationPlayerState["runtimeCapabilities"];
}): void {
  const transformation = input.animation.transformations.find(
    (candidate) => candidate.id === input.transformationId
  );
  const plan = transformation === undefined
    ? undefined
    : input.runtimeCapabilities.canonicalReverseChoreography
      ?.planForTransformationType(transformation.transformType);
  if (input.direction !== "rewind" || plan === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationReverseOperationId"];
    delete input.transitionElement.dataset["kpEditorEquationReverseChoreography"];
    delete input.transitionElement.dataset["kpEditorEquationReverseValidity"];
    delete input.transitionElement.dataset["kpEditorEquationReverseCausalEmphasis"];
    delete input.transitionElement.dataset["kpEditorEquationReverseTraversal"];
    return;
  }
  input.transitionElement.dataset["kpEditorEquationReverseOperationId"] =
    plan.sourceOperationId;
  input.transitionElement.dataset["kpEditorEquationReverseChoreography"] =
    plan.choreographyKind;
  input.transitionElement.dataset["kpEditorEquationReverseValidity"] =
    plan.validity;
  input.transitionElement.dataset["kpEditorEquationReverseCausalEmphasis"] =
    plan.causalEmphasis;
  input.transitionElement.dataset["kpEditorEquationReverseTraversal"] =
    plan.traversal;
  if (!input.announce) return;
  const narration = input.transitionElement
    .closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.querySelector<HTMLOutputElement>("[data-kp-editor-animation-narration]");
  narration?.replaceChildren(document.createTextNode(plan.narration));
}

function applyDistributionFactorFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpDistributionChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationDistributionChoreography"] =
    input.frame.planId;
  input.transition.dataset["kpEditorEquationDistributionPhase"] =
    activeDistributionPhase(input.frame);
  input.transition.dataset["kpEditorEquationDistributionAddendReflow"] =
    String(input.frame.addendReflowProgress);
  input.transition.dataset["kpEditorEquationDistributionGroupingOpacity"] =
    String(input.frame.groupingOpacity);
  input.transition.dataset["kpEditorEquationDistributionOwnerSide"] =
    input.frame.fission.ownership.ownerSide;
  input.transition.dataset["kpEditorEquationDistributionOwnerIds"] =
    input.frame.fission.ownership.ownerEntityIds.join(" ");
  input.transition.dataset["kpEditorEquationDistributionTransferEvent"] =
    input.frame.fission.ownership.transferEventId;
  const factorRelation = input.geometry.relations.find(
    (relation) => relation.lifecycle === "split"
  );
  const sourceMotionId = factorRelation?.source?.motionIds[0];
  const sourceFactor = input.geometry.sourceTokens.find(
    (token) => token.motionId === sourceMotionId
  )?.element;
  if (sourceFactor !== undefined) {
    sourceFactor.classList.add("kp-focus-group");
    sourceFactor.dataset["kpEditorDistributionRole"] = "common-factor";
    sourceFactor.style.setProperty(
      "--kp-focus-z",
      `${5 * input.frame.focusStrength}px`
    );
    sourceFactor.style.setProperty(
      "--kp-focus-scale",
      String(1 + (0.04 * input.frame.focusStrength))
    );
    sourceFactor.style.setProperty(
      "--kp-focus-outline-strength",
      String(input.frame.focusStrength)
    );
    sourceFactor.style.setProperty(
      "--kp-focus-shadow-y",
      `${4 * input.frame.focusStrength}px`
    );
    sourceFactor.style.setProperty(
      "--kp-focus-shadow-blur",
      `${12 * input.frame.focusStrength}px`
    );
    sourceFactor.style.setProperty(
      "--kp-focus-shadow-opacity",
      String(0.2 * input.frame.focusStrength)
    );
  }
  factorRelation?.target?.motionIds.forEach((motionId, semanticIndex) => {
    const factorCopy = input.geometry.targetTokens.find(
      (token) => token.motionId === motionId
    )?.element;
    if (factorCopy !== undefined) {
      factorCopy.dataset["kpEditorDistributionRole"] = "factor-copy";
      factorCopy.dataset["kpEditorDistributionSemanticIndex"] =
        String(semanticIndex);
    }
  });
}

function activeDistributionPhase(
  frame: KpDistributionChoreographyFrame
): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ?? (frame.progress >= 1 ? "complete" : "focus-factor");
}

function applyFactoringFactorFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpFactoringChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationFactoringChoreography"] =
    input.frame.planId;
  input.transition.dataset["kpEditorEquationFactoringPhase"] =
    activeFactoringPhase(input.frame);
  input.transition.dataset["kpEditorEquationFactoringAddendCompaction"] =
    String(input.frame.addendCompactionProgress);
  input.transition.dataset["kpEditorEquationFactoringGroupingOpacity"] =
    String(input.frame.groupingOpacity);
  input.transition.dataset["kpEditorEquationFactoringOwnerSide"] =
    input.frame.fusion.ownership.ownerSide;
  input.transition.dataset["kpEditorEquationFactoringOwnerIds"] =
    input.frame.fusion.ownership.ownerEntityIds.join(" ");
  input.transition.dataset["kpEditorEquationFactoringTransferEvent"] =
    input.frame.fusion.ownership.transferEventId;
  const factorRelation = input.geometry.relations.find(
    (relation) => relation.lifecycle === "merge"
  );
  factorRelation?.source?.motionIds.forEach((motionId, semanticIndex) => {
    const factorCopy = input.geometry.sourceTokens.find(
      (token) => token.motionId === motionId
    )?.element;
    if (factorCopy === undefined) return;
    factorCopy.classList.add("kp-focus-group");
    factorCopy.dataset["kpEditorFactoringRole"] = "factor-copy";
    factorCopy.dataset["kpEditorFactoringSemanticIndex"] = String(semanticIndex);
    factorCopy.style.setProperty(
      "--kp-focus-z",
      `${5 * input.frame.focusStrength}px`
    );
    factorCopy.style.setProperty(
      "--kp-focus-scale",
      String(1 + 0.04 * input.frame.focusStrength)
    );
    factorCopy.style.setProperty(
      "--kp-focus-outline-strength",
      String(input.frame.focusStrength)
    );
    factorCopy.style.setProperty(
      "--kp-focus-shadow-y",
      `${4 * input.frame.focusStrength}px`
    );
    factorCopy.style.setProperty(
      "--kp-focus-shadow-blur",
      `${12 * input.frame.focusStrength}px`
    );
    factorCopy.style.setProperty(
      "--kp-focus-shadow-opacity",
      String(0.2 * input.frame.focusStrength)
    );
  });
  const commonFactorMotionId = factorRelation?.target?.motionIds[0];
  const commonFactor = input.geometry.targetTokens.find(
    (token) => token.motionId === commonFactorMotionId
  )?.element;
  if (commonFactor !== undefined) {
    commonFactor.dataset["kpEditorFactoringRole"] = "common-factor";
  }
}

function activeFactoringPhase(frame: KpFactoringChoreographyFrame): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ?? (frame.progress >= 1 ? "complete" : "focus-factor-copies");
}

function fractionChoreographyKind(
  transformType: string
): KpFractionChoreographyKind | undefined {
  switch (transformType) {
    case "splitFractionFactors": return "split-factors";
    case "mergeFractionCommonFactor": return "separate-common-factor";
    case "simplifyUnitFractionFactor": return "simplify-unit-factor";
    default: return undefined;
  }
}

function requiredCancellationRecordId(
  transformation: KpAnimationAsset["transformations"][number]
): string {
  const record = transformation.correspondenceMap?.records.find((candidate) =>
    candidate.relation === "cancelation"
  );
  if (record === undefined) {
    throw new Error(`Transformation ${transformation.id} requires a cancellation record.`);
  }
  return record.id;
}

function witnessedAnnihilationOperationId(
  transformType: string
): string | undefined {
  switch (transformType) {
    case "cancelAdditiveInverses": return "kp.algebra.cancel-additive-inverses";
    case "cancelMultiplicativeInverses": return "kp.algebra.cancel-multiplicative-inverses";
    case "simplifyUnitFractionFactor": return "kp.algebra.simplify-unit-fraction-factor";
    default: return undefined;
  }
}

function requiredWitnessedAnnihilationRuntime() {
  const runtime = kpEquationWitnessedAnnihilationRuntime();
  if (runtime === undefined) {
    throw new Error("The selected capability pack did not register witnessed annihilation.");
  }
  return runtime;
}

function syncWitnessedAnnihilationOverlay(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: ReturnType<typeof createKpEditorSemanticEquationTokenFrame>["motion"]["witnessedAnnihilation"];
}): void {
  const existing = input.transition.querySelector<HTMLElement>(
    "[data-kp-editor-annihilation-witness]"
  );
  if (
    input.frame === undefined ||
    input.geometry.witnessedAnnihilationPlan === undefined
  ) {
    existing?.remove();
    return;
  }
  const source = input.transition.querySelector<HTMLElement>(
    "[data-kp-editor-equation-source]"
  );
  if (source === null) return;
  const witness = existing ?? document.createElement("span");
  if (existing === null) {
    witness.dataset["kpEditorAnnihilationWitness"] = "true";
    witness.innerHTML = renderLatexToHtml(input.frame.witness.latex, {
      displayMode: false
    });
    witness.style.position = "absolute";
    witness.style.pointerEvents = "none";
    witness.style.zIndex = "4";
    witness.style.transformOrigin = "center";
    witness.style.padding = "0.02em 0.16em";
    witness.style.borderRadius = "999px";
    witness.style.background = "rgba(248, 251, 255, 0.86)";
    source.style.position = "relative";
    source.style.overflow = "visible";
    source.append(witness);
  }
  const pose = input.frame.witness.pose;
  const contact = input.geometry.witnessedAnnihilationPlan.contactPoint;
  witness.style.left = `${contact.x}px`;
  witness.style.top = `${contact.y}px`;
  witness.style.opacity = String(pose.opacity);
  witness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) scale(${pose.scale})`;
  witness.style.filter = input.frame.inwardPulse <= 0
    ? "none"
    : `drop-shadow(0 ${2 * input.frame.inwardPulse}px ${5 * input.frame.inwardPulse}px rgba(70, 115, 190, ${0.42 * input.frame.inwardPulse}))`;
  witness.dataset["kpEditorAnnihilationDescriptorId"] =
    input.frame.witness.descriptorId;
  witness.dataset["kpEditorAnnihilationSlotId"] = input.frame.witness.slotId;
  input.transition.dataset["kpEditorAnnihilationPhase"] = input.frame.phase;
  input.transition.dataset["kpEditorAnnihilationWitnessReadable"] =
    String(input.frame.witnessReadable);
  input.transition.dataset["kpEditorAnnihilationCompaction"] =
    String(input.frame.survivorCompactionProgress);
}

function syncIndependentZeroWitnessOverlay(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: ReturnType<typeof createKpEditorSemanticEquationTokenFrame>["motion"]["independentZeroWitness"];
}): void {
  const existing = input.transition.querySelector<HTMLElement>(
    "[data-kp-editor-independent-zero-witness]"
  );
  const plan = input.geometry.independentZeroWitnessPlan;
  if (input.frame === undefined || plan === undefined) {
    existing?.remove();
    delete input.transition.dataset["kpEditorIndependentZeroPhase"];
    delete input.transition.dataset["kpEditorIndependentZeroReadable"];
    return;
  }
  const source = input.transition.querySelector<HTMLElement>(
    "[data-kp-editor-equation-source]"
  );
  if (source === null) return;
  const witness = existing ?? document.createElement("span");
  if (existing === null) {
    witness.className = "editor-equation-stage__independent-zero-witness";
    witness.dataset["kpEditorIndependentZeroWitness"] = "true";
    witness.innerHTML = renderLatexToHtml(plan.latex, { displayMode: false });
    witness.style.position = "absolute";
    witness.style.pointerEvents = "none";
    witness.style.zIndex = "4";
    witness.style.transformOrigin = "center";
    source.style.position = "relative";
    source.style.overflow = "visible";
    source.append(witness);
  }
  const pose = input.frame.pose;
  witness.style.left = `${plan.contactPoint.x}px`;
  witness.style.top = `${plan.contactPoint.y}px`;
  witness.style.opacity = String(pose.opacity);
  witness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) ` +
    `scale(${pose.scale})`;
  input.transition.dataset["kpEditorIndependentZeroPhase"] = input.frame.phase;
  input.transition.dataset["kpEditorIndependentZeroReadable"] =
    String(input.frame.readable);
}

function applyFractionRoleFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpFractionChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationFractionChoreography"] =
    input.frame.operationKind;
  input.transition.dataset["kpEditorEquationFractionPhase"] =
    activeFractionPhase(input.frame);
  input.transition.dataset["kpEditorEquationFractionReflow"] =
    String(input.frame.reflowProgress);
  input.transition.dataset["kpEditorEquationFractionStructuralProgress"] =
    String(input.frame.structuralProgress);
  input.transition.dataset["kpEditorEquationFractionArtifactProgress"] =
    String(input.frame.artifactProgress);
  const focusRelations = input.geometry.relations.filter((relation) => {
    switch (input.frame.operationKind) {
      case "split-factors": return relation.lifecycle === "split";
      case "separate-common-factor": return relation.recordId.startsWith("common-");
      case "simplify-unit-factor": return relation.lifecycle === "cancel";
    }
  });
  const focusMotionIds = new Set(
    focusRelations.flatMap((relation) => relation.source?.motionIds ?? [])
  );
  input.geometry.sourceTokens.forEach((token) => {
    if (!focusMotionIds.has(token.motionId)) return;
    const element = token.element;
    element.classList.add("kp-focus-group");
    element.dataset["kpEditorFractionFocusRole"] = input.frame.operationKind;
    element.style.setProperty("--kp-focus-z", `${5 * input.frame.focusStrength}px`);
    element.style.setProperty(
      "--kp-focus-scale",
      String(1 + 0.035 * input.frame.focusStrength)
    );
    element.style.setProperty(
      "--kp-focus-outline-strength",
      String(input.frame.focusStrength)
    );
    element.style.setProperty(
      "--kp-focus-shadow-y",
      `${3 * input.frame.focusStrength}px`
    );
    element.style.setProperty(
      "--kp-focus-shadow-blur",
      `${10 * input.frame.focusStrength}px`
    );
    element.style.setProperty(
      "--kp-focus-shadow-opacity",
      String(0.18 * input.frame.focusStrength)
    );
  });
}

function activeFractionPhase(frame: KpFractionChoreographyFrame): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ?? (frame.progress >= 1 ? "complete" : "focus-roles");
}

function exponentLawChoreographyKind(
  transformType: string
): KpExponentLawChoreographyKind | undefined {
  switch (transformType) {
    case "lowerExponent": return "peel-one-factor";
    case "unwrapUnitExponent": return "absorb-unit-exponent";
    default: return undefined;
  }
}

function applyExponentLawFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpExponentLawChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationExponentLawChoreography"] =
    input.frame.operationKind;
  input.transition.dataset["kpEditorEquationExponentLawPhase"] =
    activeExponentLawPhase(input.frame);
  input.transition.dataset["kpEditorEquationExponentLawReflow"] =
    String(input.frame.reflowProgress);
  input.transition.dataset["kpEditorEquationExponentLawEmission"] =
    String(input.frame.emissionProgress);
  input.transition.dataset["kpEditorEquationExponentLawChange"] =
    String(input.frame.exponentChangeProgress);
  const focusRelations = input.geometry.relations.filter((relation) =>
    input.frame.operationKind === "peel-one-factor"
      ? relation.lifecycle === "split"
      : relation.lifecycle === "exit"
  );
  const focusMotionIds = new Set(
    focusRelations.flatMap((relation) => relation.source?.motionIds ?? [])
  );
  input.geometry.sourceTokens.forEach((token) => {
    if (!focusMotionIds.has(token.motionId)) return;
    const element = token.element;
    element.classList.add("kp-focus-group");
    element.dataset["kpEditorExponentLawFocusRole"] = input.frame.operationKind;
    element.style.setProperty("--kp-focus-z", `${5 * input.frame.focusStrength}px`);
    element.style.setProperty(
      "--kp-focus-scale",
      String(1 + 0.04 * input.frame.focusStrength)
    );
    element.style.setProperty(
      "--kp-focus-outline-strength",
      String(input.frame.focusStrength)
    );
    element.style.setProperty(
      "--kp-focus-shadow-y",
      `${3 * input.frame.focusStrength}px`
    );
    element.style.setProperty(
      "--kp-focus-shadow-blur",
      `${10 * input.frame.focusStrength}px`
    );
    element.style.setProperty(
      "--kp-focus-shadow-opacity",
      String(0.18 * input.frame.focusStrength)
    );
  });
}

function activeExponentLawPhase(frame: KpExponentLawChoreographyFrame): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ?? (frame.progress >= 1 ? "complete" : "focus-power-role");
}

function applyDerivativePowerTokenFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly plan: KpDerivativePowerChoreographyPlan;
  readonly frame: KpDerivativePowerChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationDerivativePowerChoreography"] =
    input.plan.id;
  input.transition.dataset["kpEditorEquationDerivativePowerPhase"] =
    activeDerivativePowerPhase(input.frame);
  input.transition.dataset["kpEditorEquationDerivativePowerSettlement"] =
    String(input.frame.settlementProgress);
  const exponentRelation = input.geometry.relations.find(
    (relation) => relation.recordId === "exponent-branches"
  );
  const sourceMotionId = exponentRelation?.source?.motionIds[0];
  const sourceExponent = input.geometry.sourceTokens.find(
    (token) => token.motionId === sourceMotionId
  )?.element;
  if (sourceExponent !== undefined) {
    sourceExponent.classList.add("kp-focus-group");
    sourceExponent.dataset["kpEditorDerivativePowerRole"] = "source-exponent";
    sourceExponent.style.setProperty(
      "--kp-focus-z",
      `${6 * input.frame.focus.exponentEmphasis}px`
    );
    sourceExponent.style.setProperty(
      "--kp-focus-scale",
      String(1 + (0.08 * input.frame.focus.exponentEmphasis))
    );
    sourceExponent.style.setProperty(
      "--kp-focus-shadow-y",
      `${5 * input.frame.focus.exponentEmphasis}px`
    );
    sourceExponent.style.setProperty(
      "--kp-focus-shadow-blur",
      `${14 * input.frame.focus.exponentEmphasis}px`
    );
    sourceExponent.style.setProperty(
      "--kp-focus-shadow-opacity",
      String(input.frame.focus.shadowOpacity)
    );
  }
  exponentRelation?.target?.motionIds.forEach((motionId, index) => {
    const selectorId = exponentRelation.target?.selectorIds[index];
    const token = input.geometry.targetTokens.find(
      (candidate) => candidate.motionId === motionId
    )?.element;
    if (token === undefined || selectorId === undefined) return;
    token.dataset["kpEditorDerivativePowerRole"] =
      selectorId === input.plan.exponent.coefficientSelectorId
        ? "coefficient-descendant"
        : "successor-descendant";
  });
}

function activeDerivativePowerPhase(
  frame: KpDerivativePowerChoreographyFrame
): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .at(-1)?.[0];
  if (active !== undefined) return active;
  if (frame.semanticProgress === 0) return "ready";
  if (frame.semanticProgress === 1) return "complete";
  return Object.entries(frame.phases)
    .filter(([, progress]) => progress === 1)
    .at(-1)?.[0] ?? "ready";
}

function editorSpacing(
  stage: HTMLElement
): "compact" | "balanced" | "spacious" {
  const value = stage.closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.dataset["kpEditorAnimationSpacing"];
  return value === "compact" || value === "spacious" ? value : "balanced";
}

function editorAccessibilityMode(
  stage: HTMLElement
): "full-motion" | "reduced-motion" | "static" | "narrated" {
  const value = stage.closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.dataset["kpEditorAnimationAccessibilityMode"];
  return value === "reduced-motion" || value === "static" || value === "narrated"
    ? value
    : "full-motion";
}

function editorPathPreference(
  stage: HTMLElement
): "automatic" | "arc-above" | "arc-below" | "around-left" | "around-right" {
  const value = stage.closest<HTMLElement>("[data-kp-editor-animation-player]")
    ?.dataset["kpEditorAnimationPathPreference"];
  return value === "arc-above" || value === "arc-below" ||
    value === "around-left" || value === "around-right"
    ? value
    : "automatic";
}

function annotatedLatexForStates(
  states: readonly {
    readonly objectId: string;
    readonly latex: string;
    readonly selectors: readonly {
      readonly id: string;
      readonly kind?: string | undefined;
      readonly semanticKind?: string | undefined;
      readonly label?: string | undefined;
    }[];
  }[]
): readonly KpSelectorAnnotatedLatex[] | undefined {
  const annotated = states.map((state) => createKpSolveXSelectorAnnotatedLatex({
    objectId: state.objectId,
    selectorIds: state.selectors.map((selector) => selector.id)
  }) ?? createKpGeneratedLinearSolveSelectorAnnotatedLatex(state)
    ?? createKpFractionCompositionSelectorAnnotatedLatex(state.objectId)
    ?? createKpFractionSelectorAnnotatedLatex(state)
    ?? createKpFunctionWrapSelectorAnnotatedLatex(state)
    ?? createKpDistributionSelectorAnnotatedLatex(state)
    ?? createKpExponentRadicalSelectorAnnotatedLatex(state)
    ?? createKpDerivativeSumSelectorAnnotatedLatex(state)
    ?? createKpAntiderivativePowerSelectorAnnotatedLatex(state)
    ?? createKpDerivativePowerSelectorAnnotatedLatex(state)
    ?? createKpInequalitySelectorAnnotatedLatex(state)
    ?? createKpMatrixSelectorAnnotatedLatex(state)
    ?? createKpGenericSelectorAnnotatedLatex(state));
  return annotated.every((state): state is KpSelectorAnnotatedLatex => state !== undefined)
    ? annotated
    : undefined;
}

function annotatedLatexForObject(
  object: KpEditorEquationObjectProjection
): KpSelectorAnnotatedLatex | undefined {
  return createKpSolveXSelectorAnnotatedLatex({
    objectId: object.id,
    selectorIds: object.selectors.map((selector) => selector.id)
  }) ?? createKpGeneratedLinearSolveSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpFractionCompositionSelectorAnnotatedLatex(
    object.id
  ) ?? createKpFractionSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpFunctionWrapSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpDistributionSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpExponentRadicalSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpDerivativePowerSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpDerivativeSumSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpAntiderivativePowerSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpInequalitySelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpMatrixSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpGenericSelectorAnnotatedLatex({
    objectId: object.id,
    latex: object.latex,
    selectors: object.selectors
  });
}

function bindStructuralMotionIds(
  root: HTMLElement,
  states: readonly {
    readonly objectId: string;
    readonly selectors: readonly { readonly id: string; readonly label?: string | undefined }[];
  }[]
): Readonly<Record<string, string>> {
  const generatedLinearSolve = Object.fromEntries(states.flatMap((state) => {
    const object = root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    return object === null
      ? []
      : Object.entries(bindKpGeneratedLinearSolveStructuralMotionIds({
          root: object,
          state
        }));
  }));
  return {
    ...generatedLinearSolve,
    ...bindKpFractionStructuralMotionIds({ root, states }),
    ...bindKpExponentRadicalStructuralMotionIds({ root, states }),
    ...bindKpMatrixStructuralMotionIds({ root, states })
  };
}

function resetLayerForSemanticMotion(
  transition: HTMLElement,
  selector: string
): void {
  const layer = transition.querySelector<HTMLElement>(selector);
  if (layer === null) return;
  layer.style.opacity = "1";
  layer.style.transform = "none";
  layer.style.filter = "none";
}

function applyLayerMotion(
  layer: HTMLElement | null,
  motion: KpEditorEquationTransitionMotifFrame["source"]
): void {
  if (layer === null) return;
  layer.style.opacity = String(motion.opacity);
  layer.style.transform =
    `translate(${motion.translateX}px, ${motion.translateY}px) rotateY(${motion.rotateY}deg) scale(${motion.scale})`;
  layer.style.filter = motion.blurPx === 0 ? "none" : `blur(${motion.blurPx}px)`;
}

function renderFocusTokens(labels: readonly string[]): string {
  return labels.length === 0
    ? ""
    : `<span class="editor-equation-stage__focus" aria-label="Focused terms">${labels.map((label) =>
        `<span data-kp-editor-equation-focus-token>${escapeHtml(label)}</span>`
      ).join("")}</span>`;
}

function identityAbsorptionChoreographyKind(
  transformType: string
): KpIdentityAbsorptionChoreographyKind | undefined {
  switch (transformType) {
    case "simplify-additive-identity": return "absorb-additive-zero";
    case "simplify-multiplicative-identity": return "absorb-multiplicative-one";
    default: return undefined;
  }
}

function identityAbsorptionRoleRecordIds(
  transformation: KpAnimationAsset["transformations"][number],
  bundle: KpAnimationAsset["bundle"]
): {
  readonly operatorRecordId: string;
  readonly identityRecordId: string;
  readonly anchorRecordId: string;
} | undefined {
  const kind = identityAbsorptionChoreographyKind(transformation.transformType);
  const correspondenceMap = transformation.correspondenceMap;
  const sourceObject = bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  if (kind === undefined || correspondenceMap === undefined || sourceObject === undefined) {
    return undefined;
  }
  const selectorById = new Map(
    sourceObject.selectors.map((selector, index) => [
      selector.id,
      { selector, index }
    ] as const)
  );
  const exits = correspondenceMap.records.filter(
    (record) => record.relation === "removal" && record.sourceSelectorIds.length > 0
  );
  const identityLabel = kind === "absorb-additive-zero" ? "0" : "1";
  const identity = exits.find((record) =>
    record.sourceSelectorIds.some(
      (selectorId) => selectorById.get(selectorId)?.selector.label === identityLabel
    )
  );
  const operator = exits.find((record) =>
    record.sourceSelectorIds.some(
      (selectorId) => selectorById.get(selectorId)?.selector.kind === "operator"
    )
  );
  const identityIndex = identity?.sourceSelectorIds
    .map((selectorId) => selectorById.get(selectorId)?.index)
    .find((index): index is number => index !== undefined);
  if (identity === undefined || operator === undefined || identityIndex === undefined) {
    return undefined;
  }
  const anchor = correspondenceMap.records
    .filter((record) => record.relation === "identity" || record.relation === "role-change")
    .flatMap((record) => record.sourceSelectorIds.map((selectorId) => ({
      record,
      entry: selectorById.get(selectorId)
    })))
    .filter(({ entry }) =>
      entry !== undefined &&
      entry.selector.kind !== "operator" &&
      entry.selector.kind !== "relation"
    )
    .sort((left, right) =>
      Math.abs(left.entry!.index - identityIndex) -
      Math.abs(right.entry!.index - identityIndex)
    )[0]?.record;
  if (anchor === undefined) return undefined;
  return {
    operatorRecordId: operator.id,
    identityRecordId: identity.id,
    anchorRecordId: anchor.id
  };
}

function applyIdentityAbsorptionFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpIdentityAbsorptionChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationIdentityAbsorptionChoreography"] =
    input.frame.operationKind;
  input.transition.dataset["kpEditorEquationIdentityAbsorptionPhase"] =
    activeIdentityAbsorptionPhase(input.frame);
  input.transition.dataset["kpEditorEquationIdentityAbsorptionReflow"] =
    String(input.frame.reflowProgress);
  input.transition.dataset["kpEditorEquationIdentityAbsorptionOperatorFold"] =
    String(input.frame.operatorFoldProgress);
  input.transition.dataset["kpEditorEquationIdentityAbsorptionProgress"] =
    String(input.frame.identityAbsorptionProgress);
  input.geometry.relations
    .filter((relation) => relation.lifecycle === "exit")
    .flatMap((relation) => relation.source?.motionIds ?? [])
    .forEach((motionId) => {
      const element = input.geometry.sourceTokens.find(
        (token) => token.motionId === motionId
      )?.element;
      if (element === undefined) return;
      element.classList.add("kp-focus-group");
      element.dataset["kpEditorIdentityAbsorptionFocusRole"] =
        input.frame.operationKind;
      element.style.setProperty(
        "--kp-focus-z",
        `${5 * input.frame.focusStrength}px`
      );
      element.style.setProperty(
        "--kp-focus-scale",
        String(1 + 0.04 * input.frame.focusStrength)
      );
      element.style.setProperty(
        "--kp-focus-outline-strength",
        String(input.frame.focusStrength)
      );
      element.style.setProperty(
        "--kp-focus-shadow-y",
        `${3 * input.frame.focusStrength}px`
      );
      element.style.setProperty(
        "--kp-focus-shadow-blur",
        `${10 * input.frame.focusStrength}px`
      );
      element.style.setProperty(
        "--kp-focus-shadow-opacity",
        String(0.18 * input.frame.focusStrength)
      );
    });
}

function activeIdentityAbsorptionPhase(
  frame: KpIdentityAbsorptionChoreographyFrame
): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ??
    (frame.progress >= 1 ? "complete" : "focus-identity-bundle");
}

function applyInequalityPivotFocus(input: {
  readonly transition: HTMLElement;
  readonly geometry: KpPrecomputedEquationMotionPlan["geometry"];
  readonly frame: KpInequalityPivotChoreographyFrame;
}): void {
  input.transition.dataset["kpEditorEquationInequalityPivotChoreography"] =
    "negative-scale-relation-pivot";
  input.transition.dataset["kpEditorEquationInequalityPivotPhase"] =
    activeInequalityPivotPhase(input.frame);
  input.transition.dataset["kpEditorEquationInequalitySideScale"] =
    String(input.frame.sideScaleProgress);
  input.transition.dataset["kpEditorEquationInequalityRelationPivot"] =
    String(input.frame.relationPivotProgress);
  const relation = input.geometry.relations.find(
    (candidate) => candidate.recordId === "relation-pivots"
  );
  const focusMotionIds = new Set([
    ...(relation?.source?.motionIds ?? []),
    ...input.geometry.relations
      .filter((candidate) => candidate.recordId.includes("negative-multiplier"))
      .flatMap((candidate) => candidate.target?.motionIds ?? [])
  ]);
  [...input.geometry.sourceTokens, ...input.geometry.targetTokens]
    .filter((token) => focusMotionIds.has(token.motionId))
    .forEach((token) => {
      token.element.classList.add("kp-focus-group");
      token.element.dataset["kpEditorInequalityPivotFocusRole"] =
        token.text.includes("2") ? "negative-cause" : "relation";
      token.element.style.setProperty(
        "--kp-focus-z",
        `${5 * input.frame.focusStrength}px`
      );
      token.element.style.setProperty(
        "--kp-focus-scale",
        String(1 + 0.04 * input.frame.focusStrength)
      );
      token.element.style.setProperty(
        "--kp-focus-outline-strength",
        String(input.frame.focusStrength)
      );
      token.element.style.setProperty(
        "--kp-focus-shadow-y",
        `${3 * input.frame.focusStrength}px`
      );
      token.element.style.setProperty(
        "--kp-focus-shadow-blur",
        `${10 * input.frame.focusStrength}px`
      );
      token.element.style.setProperty(
        "--kp-focus-shadow-opacity",
        String(0.18 * input.frame.focusStrength)
      );
    });
}

function activeInequalityPivotPhase(
  frame: KpInequalityPivotChoreographyFrame
): string {
  const active = Object.entries(frame.phases)
    .filter(([, progress]) => progress > 0 && progress < 1)
    .map(([phaseId]) => phaseId);
  return active.at(-1) ??
    (frame.progress >= 1 ? "complete" : "focus-negative-cause");
}

function motifLabel(kind: KpEditorEquationTransitionMotifFrame["kind"]): string {
  return kind.replaceAll("-", " ");
}

function renderSolveXSequence(frame: KpEditorSolveXSharedPlayerFrame): string {
  return `
    <ol class="editor-equation-stage__sequence" data-kp-editor-solve-x-sequence aria-label="Solve x sequence">
      ${frame.steps.map((step, index) => `
        <li data-kp-editor-solve-x-step="${index}" data-kp-editor-solve-x-step-status="${step.status}"${step.status === "active" ? ' aria-current="step"' : ""}>
          <span>${index + 1}</span>
          ${renderLatexToHtml(step.latex, { displayMode: false })}
        </li>
      `).join("")}
    </ol>
  `;
}

function syncSolveXSequence(
  stage: HTMLElement,
  frame: KpEditorSolveXSharedPlayerFrame | undefined
): void {
  if (frame === undefined) return;

  stage.dataset["kpEditorSolveXVisualProgress"] = String(frame.visualProgress);
  stage.querySelectorAll<HTMLElement>("[data-kp-editor-solve-x-step]")
    .forEach((step, index) => {
      const status = frame.steps[index]?.status;
      if (status === undefined) return;
      step.dataset["kpEditorSolveXStepStatus"] = status;
      if (status === "active") step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
}

function renderUnavailable(slot: HTMLElement, message: string): void {
  slot.innerHTML =
    `<p class="editor-equation-stage__unavailable" data-kp-editor-equation-unavailable>${escapeHtml(message)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
