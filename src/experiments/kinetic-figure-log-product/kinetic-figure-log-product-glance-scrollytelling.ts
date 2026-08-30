import {
  kpLogProductKineticFigureStateIds,
  type KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";
import type {
  KpTutorialMotionCorridor
} from "../../tutorial/kp-tutorial-motion.ts";

export type KpLogProductGlanceScrollytellingPhase =
  | "orient"
  | "locate"
  | "rule"
  | "focus-release"
  | "focus-between"
  | "focus-reception"
  | "source-release"
  | "armed"
  | "rewrite"
  | "settled"
  | "result-reception"
  | "inspect";

export type KpLogProductGlanceScrollytellingAttentionOwner =
  | "source-passage"
  | "stage"
  | "target-passage"
  | "handoff";

export type KpLogProductGlanceScrollytellingEdgeId =
  | "edge.log-product.whole-to-product"
  | "edge.log-product.product-to-rule"
  | "edge.log-product.rule-to-result";

export interface KpLogProductGlanceScrollytellingProjection {
  readonly travel: number;
  readonly animationProgress: number;
  readonly stateId: KpLogProductKineticFigureStateId;
  readonly urlStateId: KpLogProductKineticFigureStateId;
  readonly edgeId?: KpLogProductGlanceScrollytellingEdgeId | undefined;
  readonly phase: KpLogProductGlanceScrollytellingPhase;
  readonly attentionOwner:
    KpLogProductGlanceScrollytellingAttentionOwner;
  readonly stageSalience: number;
  readonly productMarkSalience: number;
  readonly passageSalience: Readonly<
    Record<KpLogProductKineticFigureStateId, number>
  >;
}

/**
 * The URL names the conceptual role presented to readers. The retained
 * `transform` state remains an implementation-compatible model ID, while its
 * public Glance address says what the paragraph actually teaches: the rule.
 */
export const kpLogProductGlanceScrollytellingUrlIds: Readonly<
  Record<KpLogProductKineticFigureStateId, string>
> = Object.freeze({
  whole: "passage.log-product.whole",
  product: "passage.log-product.product",
  transform: "passage.log-product.rule",
  result: "passage.log-product.result"
});

/** The paragraph's first line and the equation share this optical reading line. */
export const kpLogProductGlanceScrollytellingReadingLineViewportRatio = 0.36;

/**
 * Registrations still enter the shared page coordinator through a bounded
 * corridor. Glance motion itself is projected between measured paragraph
 * landings, so pacing no longer changes the endpoint's reading position.
 */
export const kpLogProductGlanceScrollytellingCorridor:
  KpTutorialMotionCorridor = Object.freeze({
  startViewportRatio: 0.82,
  endViewportRatio: 0.18,
  keyframes: Object.freeze([
    Object.freeze({ travel: 0, progress: 0 }),
    Object.freeze({ travel: 1, progress: 1 })
  ])
});

const emptyPassageSalience = Object.freeze({
  whole: 0,
  product: 0,
  transform: 0,
  result: 0
});

const landingSnapTolerance = 0.002;

export function readKpLogProductGlanceScrollytellingUrlState(
  hash: string
): KpLogProductKineticFigureStateId | undefined {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  return (Object.entries(kpLogProductGlanceScrollytellingUrlIds) as Array<
    [KpLogProductKineticFigureStateId, string]
  >).find(([, urlId]) => urlId === normalized)?.[0];
}

export function projectKpLogProductGlanceScrollytellingNode(
  stateId: KpLogProductKineticFigureStateId,
  travel = 0
): KpLogProductGlanceScrollytellingProjection {
  const phase = stateId === "whole"
    ? "orient" as const
    : stateId === "product"
      ? "locate" as const
      : stateId === "transform"
        ? "rule" as const
        : "inspect" as const;
  return freezeProjection({
    travel: clamp(travel),
    animationProgress: stateId === "result" ? 1 : 0,
    stateId,
    urlStateId: stateId,
    phase,
    attentionOwner: stateId === "result"
      ? "target-passage"
      : "source-passage",
    stageSalience: 0,
    productMarkSalience: stateId === "product" ? 1 : 0,
    passageSalience: {
      ...emptyPassageSalience,
      [stateId]: 1
    }
  });
}

export function projectKpLogProductGlanceScrollytellingEdge(input: {
  readonly sourceStateId: KpLogProductKineticFigureStateId;
  readonly targetStateId: KpLogProductKineticFigureStateId;
  readonly progress: number;
}): KpLogProductGlanceScrollytellingProjection {
  const sourceIndex = kpLogProductKineticFigureStateIds.indexOf(
    input.sourceStateId
  );
  if (
    sourceIndex < 0 ||
    kpLogProductKineticFigureStateIds[sourceIndex + 1] !== input.targetStateId
  ) {
    throw new Error(
      `Glance Scrollytelling edges must join adjacent states: ` +
      `${input.sourceStateId} -> ${input.targetStateId}`
    );
  }
  const travel = clamp(input.progress);
  if (travel <= 0) {
    return projectKpLogProductGlanceScrollytellingNode(
      input.sourceStateId,
      travel
    );
  }
  if (travel >= 1) {
    return projectKpLogProductGlanceScrollytellingNode(
      input.targetStateId,
      travel
    );
  }
  if (input.targetStateId === "result") {
    return projectRewriteEdge(travel);
  }
  return projectFocusEdge({
    sourceStateId: input.sourceStateId,
    targetStateId: input.targetStateId,
    travel
  });
}

export function projectKpLogProductGlanceScrollytellingScroll(input: {
  readonly scrollY: number;
  readonly landingScrollY: Readonly<
    Record<KpLogProductKineticFigureStateId, number>
  >;
}): KpLogProductGlanceScrollytellingProjection {
  const scrollY = Number.isFinite(input.scrollY) ? input.scrollY : 0;
  const landings = kpLogProductKineticFigureStateIds.map((stateId) => ({
    stateId,
    scrollY: input.landingScrollY[stateId]
  }));
  for (let index = 1; index < landings.length; index += 1) {
    if (landings[index]!.scrollY <= landings[index - 1]!.scrollY) {
      throw new Error("Glance Scrollytelling landings must be ordered.");
    }
  }
  if (scrollY <= landings[0]!.scrollY) {
    return projectKpLogProductGlanceScrollytellingNode("whole");
  }
  for (let index = 1; index < landings.length; index += 1) {
    const source = landings[index - 1]!;
    const target = landings[index]!;
    if (scrollY <= target.scrollY) {
      const progress = (scrollY - source.scrollY) /
        (target.scrollY - source.scrollY);
      // Browser scroll positions are pixel-quantized while paragraph geometry
      // can be fractional. A tiny semantic snap keeps a landed paragraph at
      // its node instead of leaking into an adjacent edge by a subpixel.
      if (progress <= landingSnapTolerance) {
        return projectKpLogProductGlanceScrollytellingNode(source.stateId);
      }
      if (progress >= 1 - landingSnapTolerance) {
        return projectKpLogProductGlanceScrollytellingNode(target.stateId, 1);
      }
      return projectKpLogProductGlanceScrollytellingEdge({
        sourceStateId: source.stateId,
        targetStateId: target.stateId,
        progress
      });
    }
  }
  return projectKpLogProductGlanceScrollytellingNode("result", 1);
}

function projectFocusEdge(input: {
  readonly sourceStateId: KpLogProductKineticFigureStateId;
  readonly targetStateId: KpLogProductKineticFigureStateId;
  readonly travel: number;
}): KpLogProductGlanceScrollytellingProjection {
  const edgeId = input.targetStateId === "product"
    ? "edge.log-product.whole-to-product" as const
    : "edge.log-product.product-to-rule" as const;
  if (input.travel < 0.2) {
    return focusEdgeProjection({
      ...input,
      edgeId,
      phase: "focus-release",
      attentionOwner: "source-passage",
      sourceSalience: 1,
      targetSalience: 0
    });
  }
  if (input.travel < 0.45) {
    return focusEdgeProjection({
      ...input,
      edgeId,
      phase: "focus-release",
      attentionOwner: "handoff",
      sourceSalience: 1 - smoothstep((input.travel - 0.2) / 0.25),
      targetSalience: 0
    });
  }
  if (input.travel < 0.55) {
    return focusEdgeProjection({
      ...input,
      edgeId,
      phase: "focus-between",
      attentionOwner: "handoff",
      sourceSalience: 0,
      targetSalience: 0
    });
  }
  if (input.travel < 0.8) {
    return focusEdgeProjection({
      ...input,
      edgeId,
      phase: "focus-reception",
      attentionOwner: "handoff",
      sourceSalience: 0,
      targetSalience: smoothstep((input.travel - 0.55) / 0.25)
    });
  }
  return projectKpLogProductGlanceScrollytellingNode(
    input.targetStateId,
    input.travel
  );
}

function focusEdgeProjection(input: {
  readonly sourceStateId: KpLogProductKineticFigureStateId;
  readonly targetStateId: KpLogProductKineticFigureStateId;
  readonly travel: number;
  readonly edgeId: KpLogProductGlanceScrollytellingEdgeId;
  readonly phase: KpLogProductGlanceScrollytellingPhase;
  readonly attentionOwner:
    KpLogProductGlanceScrollytellingAttentionOwner;
  readonly sourceSalience: number;
  readonly targetSalience: number;
}): KpLogProductGlanceScrollytellingProjection {
  const targetHasMoreSalience = input.targetSalience > input.sourceSalience;
  return freezeProjection({
    travel: input.travel,
    animationProgress: 0,
    stateId: targetHasMoreSalience
      ? input.targetStateId
      : input.sourceStateId,
    urlStateId: input.sourceStateId,
    edgeId: input.edgeId,
    phase: input.phase,
    attentionOwner: input.attentionOwner,
    stageSalience: 0,
    productMarkSalience: input.sourceStateId === "product"
      ? input.sourceSalience
      : input.targetStateId === "product"
        ? input.targetSalience
        : 0,
    passageSalience: {
      ...emptyPassageSalience,
      [input.sourceStateId]: input.sourceSalience,
      [input.targetStateId]: input.targetSalience
    }
  });
}

function projectRewriteEdge(
  travel: number
): KpLogProductGlanceScrollytellingProjection {
  // The edge, not either paragraph, owns the rewrite. Stable plateaus on
  // both sides prevent motion from competing with the prose that explains it.
  if (travel < 0.2) {
    const progress = smoothstep(travel / 0.2);
    return rewriteEdgeProjection({
      travel,
      phase: "source-release",
      attentionOwner: "handoff",
      animationProgress: 0,
      sourceSalience: 1 - progress,
      targetSalience: 0,
      stageSalience: progress
    });
  }
  if (travel < 0.3) {
    return rewriteEdgeProjection({
      travel,
      phase: "armed",
      attentionOwner: "stage",
      animationProgress: 0,
      sourceSalience: 0,
      targetSalience: 0,
      stageSalience: 1
    });
  }
  if (travel < 0.7) {
    return rewriteEdgeProjection({
      travel,
      phase: "rewrite",
      attentionOwner: "stage",
      animationProgress: smoothstep((travel - 0.3) / 0.4),
      sourceSalience: 0,
      targetSalience: 0,
      stageSalience: 1
    });
  }
  if (travel < 0.8) {
    return rewriteEdgeProjection({
      travel,
      phase: "settled",
      attentionOwner: "stage",
      animationProgress: 1,
      sourceSalience: 0,
      targetSalience: 0,
      stageSalience: 1
    });
  }
  const progress = smoothstep((travel - 0.8) / 0.2);
  return freezeProjection({
    travel,
    animationProgress: 1,
    stateId: "result",
    urlStateId: "transform",
    edgeId: "edge.log-product.rule-to-result",
    phase: "result-reception",
    attentionOwner: "handoff",
    stageSalience: 1 - progress,
    productMarkSalience: 0,
    passageSalience: {
      ...emptyPassageSalience,
      result: progress
    }
  });
}

function rewriteEdgeProjection(input: {
  readonly travel: number;
  readonly phase: KpLogProductGlanceScrollytellingPhase;
  readonly attentionOwner:
    KpLogProductGlanceScrollytellingAttentionOwner;
  readonly animationProgress: number;
  readonly sourceSalience: number;
  readonly targetSalience: number;
  readonly stageSalience: number;
}): KpLogProductGlanceScrollytellingProjection {
  return freezeProjection({
    ...input,
    stateId: "transform",
    urlStateId: "transform",
    edgeId: "edge.log-product.rule-to-result",
    productMarkSalience: 0,
    passageSalience: {
      ...emptyPassageSalience,
      transform: input.sourceSalience,
      result: input.targetSalience
    }
  });
}

function freezeProjection(
  frame: KpLogProductGlanceScrollytellingProjection
): KpLogProductGlanceScrollytellingProjection {
  return Object.freeze({
    ...frame,
    passageSalience: Object.freeze({ ...frame.passageSalience })
  });
}

function smoothstep(value: number): number {
  const clamped = clamp(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
