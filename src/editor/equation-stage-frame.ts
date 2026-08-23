import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  compileKpDerivativeDecrementChoreography,
  sampleKpDerivativeDecrementChoreography,
  type KpDerivativeDecrementChoreographyFrame,
  type KpDerivativeDecrementChoreographyPlan
} from "../animation/derivative-decrement-choreography.ts";
import {
  compileKpDerivativePowerChoreography,
  sampleKpDerivativePowerChoreography,
  type KpDerivativePowerChoreographyFrame,
  type KpDerivativePowerChoreographyPlan
} from "../animation/derivative-power-choreography.ts";
import {
  sampleKpBridgedChoreographySequence,
  type KpBridgedChoreographyFrame
} from "../animation/choreography-envelope-bridge.ts";
import {
  createKpDotProductTraversalChoreography,
  sampleKpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreography,
  type KpDotProductTraversalChoreographyFrame
} from "../animation/dot-product-traversal-choreography.ts";
import {
  kpEquationLinearRearrangementActivatesLegacySurface
} from "../animation/equation-linear-rearrangement-kind.ts";
import {
  findKpEquationStructuralChoreographyDeclaration
} from "../animation/equation-structural-choreography-declarations.ts";
import {
  sampleKpAnimationEpistemicBranch,
  type KpEpistemicBranchRuntimeFrame
} from "../animation/epistemic-branch-runtime.ts";
import {
  createKpFunctionWrapChoreography,
  sampleKpFunctionWrapChoreography,
  type KpFunctionWrapChoreography,
  type KpFunctionWrapChoreographyFrame
} from "../animation/function-wrap-choreography.ts";
import type { KpGestaltStyleChannels } from "../animation/gestalt-style.ts";
import {
  createKpLinearRearrangementChoreography,
  sampleKpLinearRearrangementChoreography,
  type KpLinearRearrangementChoreographyFrame,
  type KpLinearRearrangementStep
} from "../animation/linear-rearrangement-choreography.ts";
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
  createKpMatrixVectorCompositionChoreography,
  sampleKpMatrixVectorCompositionChoreography,
  type KpMatrixVectorCompositionChoreography,
  type KpMatrixVectorCompositionChoreographyFrame
} from "../animation/matrix-vector-composition-choreography.ts";
import {
  createKpRadicalSuccessionChoreography,
  sampleKpRadicalSuccessionChoreography,
  type KpRadicalSuccessionChoreography,
  type KpRadicalSuccessionChoreographyFrame
} from "../animation/radical-succession-choreography.ts";
import {
  findKpWaveBEquationStructuralDeclaration
} from "../domain-ir/equation-surface-family-declarations.ts";
import {
  resolveKpDerivativePowerRuleSemanticRoles
} from "../semantic/derivative-power-rule-semantics.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  projectKpEditorEquationRuntimeFrame,
  type KpEditorEquationRuntimeFrameProjection
} from "./equation-runtime-frame-projection.ts";
import {
  createKpEditorEquationTransitionMotifFrame,
  type KpEditorEquationTransitionMotifFrame
} from "./equation-transition-motifs.ts";
import {
  createKpEditorSolveXSharedPlayerFrame,
  type KpEditorSolveXSharedPlayerFrame
} from "./solve-x-shared-player.ts";

const functionWrapChoreographyCache =
  new Map<string, KpFunctionWrapChoreography>();
const radicalSuccessionChoreographyCache =
  new Map<string, KpRadicalSuccessionChoreography>();
const linearRearrangementChoreographyCache =
  new Map<string, ReturnType<typeof createKpLinearRearrangementChoreography>>();
const dotProductTraversalChoreographyCache =
  new Map<string, KpDotProductTraversalChoreography>();
const matrixVectorCompositionChoreographyCache =
  new Map<string, KpMatrixVectorCompositionChoreography>();
const matrixLinearMapPlanCache = new Map<string, KpMatrixLinearMapPlan>();
const matrixMatrixCompositionChoreographyCache =
  new Map<string, KpMatrixMatrixCompositionChoreography>();
const derivativePowerChoreographyCache =
  new Map<string, KpDerivativePowerChoreographyPlan>();
const derivativeDecrementChoreographyCache =
  new Map<string, KpDerivativeDecrementChoreographyPlan>();

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
  readonly derivativeDecrement?: {
    readonly plan: KpDerivativeDecrementChoreographyPlan;
    readonly frame: KpDerivativeDecrementChoreographyFrame;
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
  const description = describeKpAnimationAssetTransformationTree(
    input.animation
  );
  const phaseCount = input.state.direction === "forward"
    ? description.forwardPhases.length
    : description.rewindPhases.length;
  const localProgress = phaseCount <= 1
    ? input.state.progress
    : Math.min(
        1,
        Math.max(
          0,
          input.state.progress * phaseCount -
            input.state.runtimeFrame.phase.phaseIndex
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
  const derivativeDecrement = createDerivativeDecrementFrame(
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
    ...(derivativePower === undefined ? {} : { derivativePower }),
    ...(derivativeDecrement === undefined ? {} : { derivativeDecrement })
  };
}

function createRadicalSuccessionFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  progress: number
): KpEditorEquationStageFrame["radicalSuccession"] {
  if (
    !animation.transformations.some(
      (transformation) =>
        findKpEquationStructuralChoreographyDeclaration(
          transformation.transformType
        )?.channel === "radical-succession"
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
      (transformation) =>
        findKpEquationStructuralChoreographyDeclaration(
          transformation.transformType
        )?.channel === "function-wrap"
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
    (transformation) => kpEquationLinearRearrangementActivatesLegacySurface(
      transformation.transformType
    )
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
        findKpEquationStructuralChoreographyDeclaration(
          transformation.transformType
        )?.channel === "dot-product-traversal"
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
        findKpEquationStructuralChoreographyDeclaration(
          transformation.transformType
        )?.channel === "matrix-vector-composition"
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
    findKpWaveBEquationStructuralDeclaration(animation.id)
      ?.structuralAugmentationId ===
      "structural-augmentation.matrix-vector-rank6-linear-map.v1"
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
        findKpEquationStructuralChoreographyDeclaration(
          transformation.transformType
        )?.channel === "matrix-matrix-composition"
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

function createDerivativeDecrementFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  transformationId: string | undefined,
  progress: number
): KpEditorEquationStageFrame["derivativeDecrement"] {
  if (animation.id !==
      "animation.generated.calculus.derivative.power-rule-x-cubed") {
    return undefined;
  }
  const transformation = animation.transformations.find(
    (candidate) => candidate.id === transformationId &&
      candidate.transformType === "simplifyConstantDifference"
  );
  if (transformation === undefined) return undefined;
  let plan = derivativeDecrementChoreographyCache.get(transformation.id);
  if (plan === undefined) {
    plan = compileKpDerivativeDecrementChoreography({
      id: `choreography.${transformation.id}.decrement-resolution`,
      transformation,
      bundle: animation.bundle
    });
    derivativeDecrementChoreographyCache.set(transformation.id, plan);
  }
  return {
    plan,
    frame: sampleKpDerivativeDecrementChoreography({
      plan,
      progress,
      direction: state.direction
    })
  };
}
