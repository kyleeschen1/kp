import {
  type EquationTokenLifecycle,
  type EquationTransition
} from "../math/equation-transform.ts";

export type EasingName = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface EquationMotionPlan {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly tokens: readonly EquationMotionToken[];
  readonly tracks: readonly EquationMotionTrack[];
}

export interface EquationMotionToken {
  readonly id: string;
  readonly lifecycle: EquationTokenLifecycle;
  readonly label: string;
  readonly sourceMotionId?: string | undefined;
  readonly targetMotionId?: string | undefined;
  readonly sourceLatex?: string | undefined;
  readonly targetLatex?: string | undefined;
}

export interface EquationMotionTrack {
  readonly tokenId: string;
  readonly lifecycle: EquationTokenLifecycle;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly from: MotionPose;
  readonly to: MotionPose;
}

export interface MotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

type LifecycleTiming = {
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly from: MotionPose;
  readonly to: MotionPose;
};

export function createEquationMotionPlan(
  transition: EquationTransition
): EquationMotionPlan {
  validateUniqueTokenIdentity(transition.tokens);
  const tokens = transition.tokens.map((transitionToken) => {
    if (
      transitionToken.sourceMotionId === undefined &&
      transitionToken.targetMotionId === undefined
    ) {
      throw new Error(
        `Motion token ${transitionToken.id} has no sourceMotionId or targetMotionId`
      );
    }
    validateLifecycleEndpoints(transitionToken);

    return {
      id: transitionToken.id,
      lifecycle: transitionToken.lifecycle,
      label: transitionToken.label,
      ...(transitionToken.sourceMotionId === undefined
        ? {}
        : { sourceMotionId: transitionToken.sourceMotionId }),
      ...(transitionToken.targetMotionId === undefined
        ? {}
        : { targetMotionId: transitionToken.targetMotionId }),
      ...(transitionToken.sourceLatex === undefined
        ? {}
        : { sourceLatex: transitionToken.sourceLatex }),
      ...(transitionToken.targetLatex === undefined
        ? {}
        : { targetLatex: transitionToken.targetLatex })
    };
  });
  validateAnnotationCoverage(transition, tokens);

  return {
    sourceLatex: transition.sourceLatex,
    targetLatex: transition.targetLatex,
    tokens,
    tracks: tokens.map((token) => trackForToken(token))
  };
}

function validateUniqueTokenIdentity(
  tokens: readonly EquationTransition["tokens"][number][]
): void {
  const tokenIds = new Set<string>();
  const sourceMotionIds = new Set<string>();
  const targetMotionIds = new Set<string>();

  for (const token of tokens) {
    if (tokenIds.has(token.id)) {
      throw new Error(`Duplicate equation motion token id ${token.id}`);
    }
    tokenIds.add(token.id);

    if (token.sourceMotionId !== undefined) {
      if (sourceMotionIds.has(token.sourceMotionId)) {
        throw new Error(`Duplicate source motion id ${token.sourceMotionId}`);
      }
      sourceMotionIds.add(token.sourceMotionId);
    }

    if (token.targetMotionId !== undefined) {
      if (targetMotionIds.has(token.targetMotionId)) {
        throw new Error(`Duplicate target motion id ${token.targetMotionId}`);
      }
      targetMotionIds.add(token.targetMotionId);
    }
  }
}

function validateLifecycleEndpoints(
  token: EquationTransition["tokens"][number]
): void {
  const hasSource = token.sourceMotionId !== undefined;
  const hasTarget = token.targetMotionId !== undefined;

  switch (token.lifecycle) {
    case "persist":
    case "move":
    case "group-wrap":
    case "group-unwrap":
      if (!hasSource || !hasTarget) {
        throw new Error(
          `Motion token ${token.id} lifecycle ${token.lifecycle} requires both sourceMotionId and targetMotionId`
        );
      }
      return;
    case "enter":
    case "inverse-enter":
      if (hasSource || !hasTarget) {
        throw new Error(
          `Motion token ${token.id} lifecycle ${token.lifecycle} requires only targetMotionId`
        );
      }
      return;
    case "exit":
    case "cancel":
    case "simplify-into":
      if (!hasSource || hasTarget) {
        throw new Error(
          `Motion token ${token.id} lifecycle ${token.lifecycle} requires only sourceMotionId`
        );
      }
      return;
    default:
      return assertNever(token.lifecycle);
  }
}

function validateAnnotationCoverage(
  transition: EquationTransition,
  tokens: readonly EquationMotionToken[]
) {
  const sourceAnnotationIds = new Set(
    transition.sourceAnnotations.map((annotation) => annotation.motionId)
  );
  const targetAnnotationIds = new Set(
    transition.targetAnnotations.map((annotation) => annotation.motionId)
  );
  const sourceMotionIds = new Set(
    tokens.flatMap((token) =>
      token.sourceMotionId === undefined ? [] : [token.sourceMotionId]
    )
  );
  const targetMotionIds = new Set(
    tokens.flatMap((token) =>
      token.targetMotionId === undefined ? [] : [token.targetMotionId]
    )
  );

  for (const token of tokens) {
    if (
      token.sourceMotionId !== undefined &&
      !sourceAnnotationIds.has(token.sourceMotionId)
    ) {
      throw new Error(
        `Source lifecycle token ${token.id} references unannotated motion id ${token.sourceMotionId}`
      );
    }

    if (
      token.targetMotionId !== undefined &&
      !targetAnnotationIds.has(token.targetMotionId)
    ) {
      throw new Error(
        `Target lifecycle token ${token.id} references unannotated motion id ${token.targetMotionId}`
      );
    }
  }

  for (const annotation of transition.sourceAnnotations) {
    if (!sourceMotionIds.has(annotation.motionId)) {
      throw new Error(
        `Source motion id ${annotation.motionId} has no lifecycle token`
      );
    }
  }

  for (const annotation of transition.targetAnnotations) {
    if (!targetMotionIds.has(annotation.motionId)) {
      throw new Error(
        `Target motion id ${annotation.motionId} has no lifecycle token`
      );
    }
  }
}

function trackForToken(token: EquationMotionToken): EquationMotionTrack {
  const timing = timingForLifecycle(token.lifecycle);

  return {
    tokenId: token.id,
    lifecycle: token.lifecycle,
    start: timing.start,
    end: timing.end,
    easing: timing.easing,
    from: clonePose(timing.from),
    to: clonePose(timing.to)
  };
}

function timingForLifecycle(lifecycle: EquationTokenLifecycle): LifecycleTiming {
  switch (lifecycle) {
    case "persist":
      return {
        start: 0,
        end: 1,
        easing: "linear",
        from: identityPose(),
        to: identityPose()
      };
    case "cancel":
      return {
        start: 0.05,
        end: 0.35,
        easing: "ease-in",
        from: identityPose(),
        to: hiddenPose()
      };
    case "inverse-enter":
      return {
        start: 0.2,
        end: 0.55,
        easing: "ease-out",
        from: hiddenPose(),
        to: identityPose()
      };
    case "simplify-into":
      return {
        start: 0.05,
        end: 0.45,
        easing: "ease-in-out",
        from: identityPose(),
        to: fadeOutPose()
      };
    case "enter":
      return {
        start: 0.35,
        end: 0.75,
        easing: "ease-out",
        from: fadeInPose(),
        to: identityPose()
      };
    case "exit":
    case "move":
    case "group-wrap":
    case "group-unwrap":
      return {
        start: 0,
        end: 1,
        easing: "ease-in-out",
        from: identityPose(),
        to: identityPose()
      };
    default:
      return assertNever(lifecycle);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled equation token lifecycle: ${value}`);
}

function identityPose(): MotionPose {
  return { opacity: 1, x: 0, y: 0, scale: 1 };
}

function hiddenPose(): MotionPose {
  return { opacity: 0, x: 0, y: 0, scale: 0.82 };
}

function fadeOutPose(): MotionPose {
  return { opacity: 0, x: 0, y: 0, scale: 1 };
}

function fadeInPose(): MotionPose {
  return { opacity: 0, x: 0, y: 0, scale: 1 };
}

function clonePose(pose: MotionPose): MotionPose {
  return { ...pose };
}
