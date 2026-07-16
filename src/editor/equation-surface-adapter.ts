import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import { createKpAnimationAssets } from "../animation/catalog.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import {
  measureKpEquationTransitionGeometry,
} from "../rendering/equation-motion-dom.ts";
import { compileKpSemanticEquationTransitionResult } from "../rendering/semantic-equation-transition-compiler.ts";
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
import { createKpSolveXSelectorAnnotatedLatex } from "./solve-x-semantic-latex.ts";
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
  createKpEditorPrecomputedEquationMotionPlan,
  type KpEditorPrecomputedEquationMotionPlan
} from "./precomputed-equation-motion.ts";
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
  createKpLinearRearrangementChoreography,
  sampleKpLinearRearrangementChoreography,
  type KpLinearRearrangementChoreography,
  type KpLinearRearrangementChoreographyFrame,
  type KpLinearRearrangementStep
} from "../animation/linear-rearrangement-choreography.ts";
import {
  createKpDotProductTraversalChoreography,
  sampleKpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreographyFrame
} from "../animation/dot-product-traversal-choreography.ts";
import {
  deriveKpOrganicMotionSignature,
  sampleKpOrganicMotion,
  sampleKpOrganicProgress
} from "../animation/organic-motion-primitives.ts";
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

const animationCatalog = createKpAnimationAssets();
const semanticMotionPlanCache = new WeakMap<HTMLElement, {
  readonly contentKey: string;
  readonly plans: ReadonlyMap<number, KpEditorPrecomputedEquationMotionPlan>;
}>();
const functionWrapChoreographyCache =
  new Map<string, KpFunctionWrapChoreography>();
const radicalSuccessionChoreographyCache =
  new Map<string, KpRadicalSuccessionChoreography>();
const linearRearrangementChoreographyCache =
  new Map<string, KpLinearRearrangementChoreography>();
const dotProductTraversalChoreographyCache =
  new Map<string, KpDotProductTraversalChoreography>();

export interface KpEditorEquationStageFrame {
  readonly stageIdentityKey: string;
  readonly contentKey: string;
  readonly projection: KpEditorEquationRuntimeFrameProjection;
  readonly globalProgress: number;
  readonly semanticProgress: number;
  readonly localProgress: number;
  readonly easedProgress: number;
  readonly motifs: readonly KpEditorEquationTransitionMotifFrame[];
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
}

export function createKpEditorEquationStageFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
  readonly authoringRevision?: number | undefined;
  readonly gestaltChannels?: KpGestaltStyleChannels | undefined;
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
  const stageIdentityKey = projection.animationId;
  const contentKey = `${projection.direction}:${projection.transitions
    .map((transition) => transition.id)
    .join(":")}:authoring-${input.authoringRevision ?? 0}`;

  return {
    stageIdentityKey,
    contentKey,
    projection,
    globalProgress: input.state.progress,
    semanticProgress,
    localProgress,
    easedProgress,
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
    ...(dotProductTraversal === undefined ? {} : { dotProductTraversal })
  };
}

export const kpEditorEquationSurfaceAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.equation.katex",
  slotKind: "equation",
  priority: 0,
  supports(state) {
    return state.surface.slotKinds.includes("equation");
  },
  render({ slot, state }) {
    const animation = animationCatalog.find(
      (candidate) => candidate.id === state.animationId
    );
    if (animation === undefined) {
      renderUnavailable(slot, `Missing equation animation ${state.animationId}.`);
      return;
    }

    const player = slot.closest<HTMLElement>("[data-kp-editor-animation-player]");
    const authoringRevision = Number(
      player?.dataset["kpEditorAnimationAuthoringRevision"] ?? 0
    );
    const gestaltChannels = selectedGestaltChannels(player);
    const frame = createKpEditorEquationStageFrame({
      animation,
      state,
      authoringRevision,
      gestaltChannels
    });
    if (frame.projection.transitions.length === 0) {
      renderUnavailable(
        slot,
        frame.projection.diagnostics[0]?.message ?? "No active equation transition."
      );
      return;
    }

    let stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");

    if (stage?.dataset["kpEditorEquationStageIdentityKey"] !== frame.stageIdentityKey) {
      slot.innerHTML = renderStage(frame);
      stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");
      if (stage !== null) measureStage(stage);
    } else if (stage.dataset["kpEditorEquationContentKey"] !== frame.contentKey) {
      replaceStageContent(stage, frame);
      measureStage(stage);
    }

    if (stage === null) return;

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
      const transitionElement = stage?.querySelector<HTMLElement>(
        `[data-kp-editor-equation-transition-index="${index}"]`
      );
      const motif = frame.motifs[index];
      if (transitionElement === null || transitionElement === undefined || motif === undefined) {
        return;
      }

      transitionElement.dataset["kpEditorEquationMotif"] = motif.kind;
      const semanticMotionApplied = transition.semanticStatus === "ready" &&
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
          transitionElement.querySelector<HTMLElement>("[data-kp-editor-equation-source]"),
          motif.source
        );
        applyLayerMotion(
          transitionElement.querySelector<HTMLElement>("[data-kp-editor-equation-target]"),
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
      transitionElement.querySelectorAll<HTMLElement>("[data-kp-editor-equation-focus-token]")
        .forEach((token) => {
          token.style.setProperty("--kp-editor-equation-focus-progress", String(motif.progress));
        });
    });
    applyGestaltTokenRealization({
      stage,
      state,
      progress: frame.semanticProgress,
      channels: gestaltChannels,
      accessibilityMode:
        player?.dataset["kpEditorAnimationAccessibilityMode"] ?? "full-motion"
    });
    applyEquationMaterialLayer({
      stage,
      animationId: state.animationId,
      semanticProgress: frame.semanticProgress
    });
    applyFocusExperiment(
      stage,
      player?.dataset["kpEditorAnimationFocusExperiment"] ?? "flat"
    );
    if (player !== null) {
      player.dataset["kpEditorAnimationMotionPlanInvalidated"] = "false";
    }
  }
};

function applyEquationMaterialLayer(input: {
  readonly stage: HTMLElement;
  readonly animationId: string;
  readonly semanticProgress: number;
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
    return;
  }
  const tokens = [
    ...input.stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
  ];
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
    const opacity = Number.parseFloat(getComputedStyle(token).opacity);
    const existing = candidates.get(ownerId);
    if (existing === undefined || opacity > existing.opacity) {
      candidates.set(ownerId, { token, opacity });
    }
  }
  const stageRect = input.stage.getBoundingClientRect();
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners: [...candidates.entries()].map(([ownerId, candidate]) => {
      const rect = candidate.token.getBoundingClientRect();
      return {
        ownerId,
        sourceElement: candidate.token,
        rect: {
          left: rect.left - stageRect.left,
          top: rect.top - stageRect.top,
          width: rect.width,
          height: rect.height
        },
        opacity: candidate.opacity,
        transform: "none"
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
  const radical = input.stage.querySelector<HTMLElement>(
    '[data-kp-editor-equation-target] [data-kp-motion-id*=".radical.radical-symbol"]'
  );
  const sourceBase = input.stage.querySelector<HTMLElement>(
    '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.base"]'
  );
  const targetBase = input.stage.querySelector<HTMLElement>(
    '[data-kp-editor-equation-target] [data-kp-motion-id*=".radical.radicand"]'
  );
  if (
    radical === null ||
    sourceBase === null ||
    targetBase === null ||
    input.semanticProgress <= 0 ||
    input.semanticProgress >= 1
  ) {
    syncKpEquationMaterialLayer({ stage: input.stage, owners: [] });
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

  if (input.semanticProgress >= 0.42 && input.semanticProgress < 0.92) {
    const hookProgress = intervalProgress(
      input.semanticProgress,
      0.42,
      0.78
    );
    const overbarProgress = intervalProgress(
      input.semanticProgress,
      0.52,
      0.86
    );
    const radicalRect = radical.getBoundingClientRect();
    const rect = {
      left: radicalRect.left - stageRect.left,
      top: radicalRect.top - stageRect.top,
      width: radicalRect.width,
      height: radicalRect.height
    };
    owners.push(
      {
        ownerId: "radical-rewrite.root-notation.hook",
        sourceElement: radical,
        rect,
        opacity: hookProgress,
        transform:
          `translate(0px, ${2 * (1 - hookProgress)}px) scale(${0.9 + hookProgress * 0.1})`,
        clipPath: "inset(0 58% 0 0)",
        fragmentRole: "radical-hook"
      },
      {
        ownerId: "radical-rewrite.root-notation.overbar",
        sourceElement: radical,
        rect,
        opacity: overbarProgress,
        transform:
          `translate(${-4 * (1 - overbarProgress)}px, ${-2 * (1 - overbarProgress)}px) scale(${0.92 + overbarProgress * 0.08})`,
        clipPath: "inset(0 0 66% 28%)",
        fragmentRole: "radical-overbar"
      }
    );
    radical.style.opacity = "0";
    radical.dataset["kpEquationMaterialNativeHidden"] = "true";
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

function intervalProgress(
  progress: number,
  start: number,
  end: number
): number {
  if (end <= start) return progress >= end ? 1 : 0;
  const p = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return p * p * (3 - 2 * p);
}

function linearMaterialOwnerId(motionId: string): string | undefined {
  const roles = [
    "lhs.x",
    "lhs.plus3",
    "lhs.minus3",
    "equals",
    "rhs.7",
    "rhs.minus3",
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
    group.dataset["kpFocusProfile"] = mode === "elevated" ? "elevated" : "flat";
    group.style.setProperty(
      "--kp-focus-z",
      mode === "elevated" ? `${12 * attention}px` : "0px"
    );
    group.style.setProperty(
      "--kp-focus-scale",
      mode === "elevated" ? String(1 + 0.018 * attention) : "1"
    );
    group.style.setProperty(
      "--kp-focus-outline-strength",
      mode === "elevated" ? "0" : String(0.55 * attention)
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
}): void {
  const fullMotion = input.accessibilityMode === "full-motion";
  const amplitude = fullMotion
    ? (input.channels.microMotion?.amplitude ?? 0) * 9
    : 0;
  const deformation = fullMotion
    ? (input.channels.deformation?.tokenCeiling ?? 0) * 0.35
    : 0;
  const realizationProgress = sampleKpOrganicProgress({
    progress: input.progress,
    character: input.channels.acceleration?.character ?? "restrained"
  });
  input.stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
    .forEach((token) => {
      const identityId = token.dataset["kpMotionId"];
      if (identityId === undefined) return;
      const sample = sampleKpOrganicMotion({
        signature: deriveKpOrganicMotionSignature({
          identityId,
          motifId: "editor-equation.gestalt",
          motionFieldId: input.state.animationId
        }),
        progress: realizationProgress,
        // Progress is already direction-normalized at the stage boundary.
        // Mirroring again here would give rewind a different material pose.
        direction: "forward",
        microMotionAmplitude: Math.min(1, amplitude),
        deformationCeiling: Math.min(1, deformation)
      });
      token.style.translate = `${sample.x}px ${sample.y}px`;
      token.style.scale = `${sample.scaleAlong} ${sample.scaleAcross}`;
      token.dataset["kpEditorGestaltTokenRealization"] =
        input.channels.acceleration?.character ?? "restrained";
    });
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
    : '[data-kp-editor-equation-source] [data-kp-motion-id*=".radical.radical-symbol"]';
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
            `${contribution.leftValue} \\times ${contribution.rightValue} = ${contribution.product}`,
            { displayMode: false }
          )}
        </span>
      `).join("")}
      <span class="editor-equation-stage__dot-product-accumulation" data-kp-editor-dot-product-accumulation></span>
    `;
    transition.append(overlay);
  }
  const transitionRect = transition.getBoundingClientRect();
  const sourceRoot = transition.querySelector<HTMLElement>(
    "[data-kp-editor-equation-source] [data-kp-editor-equation-object-id]"
  )?.getBoundingClientRect();
  choreography.contributions.forEach((contribution) => {
    const contributionFrame = frame.motion.contributions.find(
      (candidate) => candidate.semanticIndex === contribution.semanticIndex
    )!;
    const element = overlay!.querySelector<HTMLElement>(
      `[data-kp-editor-dot-product-contribution="${contribution.semanticIndex}"]`
    );
    const left = findMotionTokenByEntityId(
      transition,
      contribution.leftSelectorId
    );
    const right = findMotionTokenByEntityId(
      transition,
      contribution.rightSelectorId
    );
    if (
      element === null ||
      left === undefined ||
      right === undefined ||
      sourceRoot === undefined
    ) {
      return;
    }
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const pairY =
      (leftRect.top + leftRect.height / 2 +
        rightRect.top + rightRect.height / 2) / 2 -
      transitionRect.top;
    element.style.left = `${sourceRoot.right - transitionRect.left + 14}px`;
    element.style.top = `${pairY}px`;
    element.style.opacity = String(contributionFrame.productOpacity);
    element.style.transform =
      `translateY(-50%) scale(${contributionFrame.productScale})`;
    element.dataset["kpEditorDotProductContributionStatus"] =
      contributionFrame.status;
    element.dataset["kpEditorDotProductSemanticIndex"] =
      String(contribution.semanticIndex);
  });
  const accumulation = overlay.querySelector<HTMLElement>(
    "[data-kp-editor-dot-product-accumulation]"
  );
  if (accumulation === null || sourceRoot === undefined) return;
  if (
    accumulation.dataset["kpEditorDotProductAccumulationLatex"] !==
    frame.motion.accumulationLatex
  ) {
    accumulation.dataset["kpEditorDotProductAccumulationLatex"] =
      frame.motion.accumulationLatex;
    accumulation.innerHTML = frame.motion.accumulationLatex === ""
      ? ""
      : renderLatexToHtml(frame.motion.accumulationLatex, {
          displayMode: false
        });
  }
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
  accumulation.style.opacity = String(frame.motion.accumulationOpacity);
  accumulation.style.transform = "translateX(-50%)";
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
    <div class="editor-equation-stage" data-kp-editor-equation-stage data-kp-editor-equation-stage-identity-key="${escapeHtml(frame.stageIdentityKey)}" data-kp-editor-equation-content-key="${escapeHtml(frame.contentKey)}" data-kp-editor-equation-phase-id="${escapeHtml(frame.projection.phaseId)}" data-kp-editor-equation-global-progress="${frame.globalProgress}" data-kp-editor-equation-semantic-progress="${frame.semanticProgress}" data-kp-editor-equation-local-progress="${frame.localProgress}">
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
            ${renderEquationObjects(transition.source)}
          </div>
          <div class="editor-equation-stage__layer editor-equation-stage__layer--target" data-kp-editor-equation-target>
            ${renderEquationObjects(transition.target)}
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
}

function renderEquationObjects(
  objects: readonly KpEditorEquationObjectProjection[]
): string {
  return objects.map((object) => {
    const annotated = annotatedLatexForObject(object);
    return `
    <div class="editor-equation-stage__object" data-kp-editor-equation-object-id="${escapeHtml(object.id)}">
      ${annotated === undefined
        ? renderLatexToHtml(object.latex)
        : renderSelectorAnnotatedLatexToHtml(annotated)}
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
      ...(motifKind === "copy-fan-out" || motifKind === "merge-fan-in" || motifKind === "substitute"
        ? { lineageChoreographyKind: motifKind }
        : {}),
      ...(input.frame.radicalSuccession === undefined
        ? {}
        : { representationalSuccessionKind: "opposite-corner-seed" as const }),
      ...(input.frame.linearRearrangement === undefined
        ? {}
        : {
            linearRearrangementKind:
              input.frame.linearRearrangement.step.kind
          }),
      ...(input.frame.dotProductTraversal === undefined
        ? {}
        : {
            dotProductTraversalPlan:
              input.frame.dotProductTraversal.choreography.rendererPlan
          })
    });
    precomputed = createKpEditorPrecomputedEquationMotionPlan({
      id: `${input.frame.contentKey}.transition.${input.transitionIndex}`,
      geometry,
      motifKind: motifKind ?? "artifact-replace",
      spacing: editorSpacing(input.stage),
      pathPreference: editorPathPreference(input.stage)
    });
    const existing = semanticMotionPlanCache.get(input.stage);
    const plans = existing?.contentKey === input.frame.contentKey
      ? new Map(existing.plans)
      : new Map<number, KpEditorPrecomputedEquationMotionPlan>();
    plans.set(input.transitionIndex, precomputed);
    semanticMotionPlanCache.set(input.stage, {
      contentKey: input.frame.contentKey,
      plans
    });
  }

  const geometry = precomputed.geometry;

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
  } else {
    input.transitionElement.dataset["kpEditorEquationRepresentationalSuccession"] =
      succession.kind;
    input.transitionElement.dataset["kpEditorEquationContinuantReflowProgress"] =
      String(succession.continuantReflowProgress);
    input.transitionElement.dataset["kpEditorEquationSourceGatherProgress"] =
      String(succession.sourceGatherProgress);
    input.transitionElement.dataset["kpEditorEquationSuccessionBundle"] =
      `${succession.bundlePoint.x},${succession.bundlePoint.y}`;
  }
  const linearRearrangement = tokenFrame.motion.linearRearrangement;
  if (linearRearrangement === undefined) {
    delete input.transitionElement.dataset["kpEditorEquationLinearRearrangement"];
    delete input.transitionElement.dataset["kpEditorEquationPersistentReflowProgress"];
    delete input.transitionElement.dataset["kpEditorEquationMeetProgress"];
    delete input.transitionElement.dataset["kpEditorEquationCollapseProgress"];
    delete input.transitionElement.dataset["kpEditorEquationResultRevealProgress"];
  } else {
    input.transitionElement.dataset["kpEditorEquationLinearRearrangement"] =
      linearRearrangement.kind;
    input.transitionElement.dataset["kpEditorEquationPersistentReflowProgress"] =
      String(linearRearrangement.persistentReflowProgress);
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
  return true;
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
  }) ?? createKpFractionSelectorAnnotatedLatex(state)
    ?? createKpFunctionWrapSelectorAnnotatedLatex(state)
    ?? createKpDistributionSelectorAnnotatedLatex(state)
    ?? createKpExponentRadicalSelectorAnnotatedLatex(state)
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
  }) ?? createKpFractionSelectorAnnotatedLatex({
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
  return {
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

function measureStage(stage: HTMLElement): void {
  stage.querySelectorAll<HTMLElement>(".editor-equation-stage__transition")
    .forEach((transition) => {
      const source = transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source]"
      );
      const target = transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-target]"
      );
      if (source === null || target === null) return;

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      transition.dataset["kpEditorEquationSourceWidth"] = String(sourceRect.width);
      transition.dataset["kpEditorEquationSourceHeight"] = String(sourceRect.height);
      transition.dataset["kpEditorEquationTargetWidth"] = String(targetRect.width);
      transition.dataset["kpEditorEquationTargetHeight"] = String(targetRect.height);
    });
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
