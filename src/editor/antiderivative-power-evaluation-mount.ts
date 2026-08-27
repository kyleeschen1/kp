import {
  isKpAntiderivativePowerEvaluationCohortsPayloadV2,
  type KpAntiderivativePowerEvaluationCohortsPayloadV2
} from "../domain-ir/antiderivative-power-migration-v2.ts";
import {
  consumeKpEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2
} from "../domain-ir/equation-presentation-plan-v2.ts";
import {
  syncKpEquationMaterialLayer,
  type KpEquationMaterialLayerOwnerFrame
} from "../rendering/equation-material-layer-dom.ts";
import {
  createKpCertifiedNativeKatexContributorFusionCohortPlayback,
  kpNativeKatexContributorFusionOpticalProfile
} from
  "../rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import { resolveKpSemanticSalience } from
  "../animation/semantic-salience-resolver.ts";
import type { KpEditorEquationStageHotPathCache } from
  "./equation-stage-hot-path-cache.ts";
import {
  syncKpAntiderivativePowerExplanationRail
} from "./antiderivative-power-explanation-rail.ts";

export interface KpAntiderivativePowerEvaluationMountResult {
  readonly status: "inactive" | "mounted";
  readonly transformationId?: string | undefined;
  readonly cohortIds?: readonly string[] | undefined;
}

/**
 * The specialized host consumes only the compiler payload. It does not infer
 * cohorts from glyph text, geometry, or the antiderivative asset ID.
 */
export function applyKpAntiderivativePowerEvaluationMount(input: {
  readonly stage: HTMLElement;
  readonly plan: KpCompiledEquationPresentationPlanV2;
  readonly activeTransformationIds: readonly string[];
  readonly localProgress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode?:
    | "full-motion"
    | "reduced-motion"
    | "static"
    | "narrated"
    | undefined;
  readonly hotPath: KpEditorEquationStageHotPathCache;
}): KpAntiderivativePowerEvaluationMountResult {
  const entries = consumeKpEquationPresentationPlanV2({
    plan: input.plan,
    adapter: {
      id: "adapter.editor.antiderivative-power-evaluation-cohorts.v2",
      kind: "generic-equation-adapter-v2",
      compile: (transition) => {
        const payloads = transition.domainPayloads.filter(
          isKpAntiderivativePowerEvaluationCohortsPayloadV2
        );
        if (payloads.length > 1) {
          throw new Error(
            `Transition ${transition.id} has duplicate antiderivative cohort payloads.`
          );
        }
        return payloads[0] === undefined
          ? undefined
          : Object.freeze({ transition, payload: payloads[0] });
      }
    }
  }).filter((entry): entry is {
    readonly transition:
      KpCompiledEquationPresentationPlanV2["transitions"][number];
    readonly payload: KpAntiderivativePowerEvaluationCohortsPayloadV2;
  } => entry !== undefined).filter(({ transition }) =>
    input.activeTransformationIds.includes(
      transition.semanticOperation.transformationId
    )
  );
  if (entries.length === 0) {
    clearMountTelemetry(input.stage);
    return Object.freeze({ status: "inactive" as const });
  }
  if (entries.length !== 1) {
    throw new Error(
      "Antiderivative evaluation mount requires one active cohort payload."
    );
  }

  const { transition, payload } = entries[0]!;
  const bindings = payload.cohorts.flatMap(({ cohortId, certificate }) => {
    const topology = certificate.topologyCertificate;
    if (topology.topology !== "contributors-create-result" ||
        topology.cohortId !== cohortId) {
      throw new Error(
        `Antiderivative cohort ${cohortId} lacks contributor-fusion topology.`
      );
    }
    return [
      ...topology.materialInputSelectorIds.map((selectorId) => ({
        cohortId,
        selectorId,
        side: "source" as const,
        contribution: "material-input" as const
      })),
      ...topology.catalystSelectorIds.map((selectorId) => ({
        cohortId,
        selectorId,
        side: "source" as const,
        contribution: "catalyst" as const
      })),
      ...topology.resultSelectorIds.map((selectorId) => ({
        cohortId,
        selectorId,
        side: "target" as const,
        contribution: "successor-target" as const
      }))
    ];
  });
  if (new Set(bindings.map(({ selectorId }) => selectorId)).size !==
      bindings.length) {
    throw new Error("Antiderivative evaluation cohorts must own disjoint paint.");
  }
  const tokens = bindings.map((binding) => ({
    ...binding,
    token: requiredSelectorToken(input.hotPath.motionTokens, binding.selectorId)
  }));
  const semanticProgress = input.direction === "forward"
    ? input.localProgress
    : 1 - input.localProgress;
  const progress = input.accessibilityMode === "static"
    ? semanticProgress < 0.5 ? 0 : 1
    : semanticProgress;
  const fraction = createEvaluationFractionOwnership({
    stage: input.stage,
    tokens,
    progress,
    hotPath: input.hotPath
  });
  const previousStyles = tokens.map(({ token }) => ({
    token,
    opacity: token.style.opacity,
    visibility: token.style.visibility,
    transform: token.style.transform,
    filter: token.style.filter
  }));
  tokens.forEach(({ token }) => {
    token.style.opacity = "1";
    token.style.visibility = "visible";
    token.style.transform = "none";
    token.style.filter = "none";
  });
  const previousFractionStyles = [fraction.source, fraction.target].map(
    (rule) => ({
      rule,
      opacity: rule.style.opacity,
      visibility: rule.style.visibility,
      filter: rule.style.filter
    })
  );
  previousFractionStyles.forEach(({ rule }) => {
    rule.style.opacity = "1";
    rule.style.visibility = "visible";
    rule.style.filter = "none";
  });
  try {
    syncKpEquationMaterialLayer({
      stage: input.stage,
      owners: [
        ...tokens.map(({
          token,
          selectorId,
          cohortId,
          side,
          contribution
        }) => {
          const rect = input.hotPath.motionTokenRects.get(token);
          if (rect === undefined) {
            throw new Error(
              `Antiderivative evaluation selector ${selectorId} has no native geometry.`
            );
          }
          return {
            ownerId: `evaluation-cohort.${cohortId}.${selectorId}`,
            sourceElement: token,
            sourceMotionId: token.dataset["kpMotionId"],
            semanticEntityId: selectorId,
            verifiedOperationCohortId: cohortId,
            rect,
            opacity: 1,
            transform: "none",
            filter: "none",
            fragmentRole: `successor-${side}:${contribution}`
          } satisfies KpEquationMaterialLayerOwnerFrame;
        }),
        ...(fraction.materialOwner === undefined
          ? []
          : [fraction.materialOwner])
      ]
    });
  } finally {
    previousStyles.forEach((previous) => {
      previous.token.style.opacity = previous.opacity;
      previous.token.style.visibility = previous.visibility;
      previous.token.style.transform = previous.transform;
      previous.token.style.filter = previous.filter;
    });
    previousFractionStyles.forEach((previous) => {
      previous.rule.style.opacity = previous.opacity;
      previous.rule.style.visibility = previous.visibility;
      previous.rule.style.filter = previous.filter;
    });
  }
  tokens.forEach(({ token }) => {
    token.style.opacity = "0";
    token.style.visibility = "hidden";
    token.dataset["kpEquationMaterialNativeHidden"] = "true";
  });
  settleFractionRuleOwnership(input.stage, fraction, progress);
  input.stage.dataset["kpAntiderivativeEvaluationFractionMotion"] =
    fraction.motion;
  input.stage.dataset["kpAntiderivativeEvaluationFractionReshapeProgress"] =
    fraction.reshapeProgress.toFixed(4);

  const base = {
    sample: (progress: number) => progress,
    apply: (progress: number) => progress,
    retire: () => undefined
  };
  const playback =
    createKpCertifiedNativeKatexContributorFusionCohortPlayback({
      stage: input.stage,
      base,
      cohorts: payload.cohorts
    });
  playback.apply(progress);
  applyCohortSalience(input.stage, progress);
  const evaluationProfile = kpNativeKatexContributorFusionOpticalProfile;
  syncKpAntiderivativePowerExplanationRail({
    stage: input.stage,
    beatId: progress < evaluationProfile.targetLegibilityStartsAt
      ? "reduce-arithmetic"
      : progress < 1
        ? "recognize-reduction"
        : "final-result",
    presence: 1
  });
  settleNativeEndpoints({ stage: input.stage, tokens, progress });
  input.stage.dataset["kpAntiderivativeEvaluationMount"] = "native-katex";
  input.stage.dataset["kpAntiderivativeEvaluationTransformationId"] =
    transition.semanticOperation.transformationId;
  const cohortIds = Object.freeze(payload.cohorts.map(({ cohortId }) =>
    cohortId));
  return Object.freeze({
    status: "mounted" as const,
    transformationId: transition.semanticOperation.transformationId,
    cohortIds
  });
}

function createEvaluationFractionOwnership(input: {
  readonly stage: HTMLElement;
  readonly tokens: readonly {
    readonly side: "source" | "target";
    readonly token: HTMLElement;
  }[];
  readonly progress: number;
  readonly hotPath: KpEditorEquationStageHotPathCache;
}): {
  readonly source: HTMLElement;
  readonly target: HTMLElement;
  readonly motion: "native" | "transform-only";
  readonly reshapeProgress: number;
  readonly materialOwner?: KpEquationMaterialLayerOwnerFrame | undefined;
} {
  const endpointRoot = (side: "source" | "target"): HTMLElement => {
    const token = input.tokens.find((candidate) => candidate.side === side)
      ?.token;
    const root = token?.closest<HTMLElement>(
      `[data-kp-editor-equation-${side}], [data-endpoint="${side}"]`
    );
    if (root === null || root === undefined || !input.stage.contains(root)) {
      throw new Error(
        `Antiderivative evaluation lacks its ${side} fraction endpoint.`
      );
    }
    return root;
  };
  const fractionRule = (
    root: HTMLElement,
    side: "source" | "target"
  ): HTMLElement => {
    const rules = [...root.querySelectorAll<HTMLElement>(".frac-line")];
    if (rules.length !== 1) {
      throw new Error(
        `Antiderivative evaluation requires one ${side} fraction rule; ` +
        `found ${rules.length}.`
      );
    }
    return rules[0]!;
  };
  const source = fractionRule(endpointRoot("source"), "source");
  const target = fractionRule(endpointRoot("target"), "target");
  source.dataset["kpAntiderivativeEvaluationFractionNative"] = "source";
  target.dataset["kpAntiderivativeEvaluationFractionNative"] = "target";
  if (input.progress <= 0) {
    return { source, target, motion: "native", reshapeProgress: 0 };
  }
  if (input.progress >= 1) {
    return { source, target, motion: "native", reshapeProgress: 1 };
  }
  const sourceRect = input.hotPath.structuralPaintRects.get(source);
  const targetRect = input.hotPath.structuralPaintRects.get(target);
  if (sourceRect === undefined || targetRect === undefined) {
    throw new Error(
      "Antiderivative evaluation fraction rules lack cached native geometry."
    );
  }
  const profile = kpNativeKatexContributorFusionOpticalProfile;
  const reshapeProgress = smoothstep(
    profile.targetLegibilityStartsAt,
    profile.targetExpansionEndsAt,
    input.progress
  );
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const translateX = (targetCenterX - sourceCenterX) * reshapeProgress;
  const translateY = (targetCenterY - sourceCenterY) * reshapeProgress;
  const scaleX = interpolate(
    1,
    targetRect.width / sourceRect.width,
    reshapeProgress
  );
  return {
    source,
    target,
    motion: "transform-only",
    reshapeProgress,
    materialOwner: {
      ownerId: "evaluation-structure.antiderivative-power.fraction-rule",
      sourceElement: source,
      // Keep the structural owner's layout box stable. Width/position writes
      // made a thin rule rasterize in visible steps during slow playback;
      // compositor translation and horizontal scale preserve one crisp owner.
      rect: sourceRect,
      opacity: 1,
      transform:
        `translate3d(${translateX.toFixed(6)}px, ` +
        `${translateY.toFixed(6)}px, 0) scaleX(${scaleX.toFixed(6)})`,
      filter: "none",
      semanticDepth: "live",
      fragmentRole: "rule:persistent-evaluation-fraction"
    }
  };
}

function settleFractionRuleOwnership(
  stage: HTMLElement,
  fraction: {
    readonly source: HTMLElement;
    readonly target: HTMLElement;
  },
  progress: number
): void {
  const nativeSide = progress <= 0
    ? "source"
    : progress >= 1
      ? "target"
      : undefined;
  for (const [side, rule] of [
    ["source", fraction.source],
    ["target", fraction.target]
  ] as const) {
    const ownsPaint = side === nativeSide;
    rule.style.opacity = ownsPaint ? "1" : "0";
    rule.style.visibility = ownsPaint ? "visible" : "hidden";
    rule.style.filter = "none";
    if (ownsPaint) {
      delete rule.dataset["kpEquationMaterialNativeHidden"];
    } else {
      rule.dataset["kpEquationMaterialNativeHidden"] = "true";
    }
  }
  stage.dataset["kpAntiderivativeEvaluationFractionOwner"] =
    nativeSide === undefined ? "material" : `${nativeSide}-native`;
}

function settleNativeEndpoints(input: {
  readonly stage: HTMLElement;
  readonly tokens: readonly {
    readonly side: "source" | "target";
    readonly token: HTMLElement;
  }[];
  readonly progress: number;
}): void {
  const nativeSide = input.progress <= 0
    ? "source"
    : input.progress >= 1
      ? "target"
      : undefined;
  if (nativeSide === undefined) {
    delete input.stage.dataset["kpAntiderivativeEvaluationNativeSettlement"];
    return;
  }
  input.tokens.forEach(({ side, token }) => {
    const ownsPaint = side === nativeSide;
    token.style.opacity = ownsPaint ? "1" : "0";
    token.style.visibility = ownsPaint ? "visible" : "hidden";
    token.style.transform = "none";
    token.style.filter = "none";
    if (ownsPaint) {
      delete token.dataset["kpEquationMaterialNativeHidden"];
    } else {
      token.dataset["kpEquationMaterialNativeHidden"] = "true";
    }
  });
  input.stage.querySelectorAll<HTMLElement>(
    '[data-kp-equation-material-fragment-role^="successor-"]'
  ).forEach((owner) => {
    owner.style.opacity = "0";
    owner.style.visibility = "hidden";
  });
  input.stage.dataset["kpAntiderivativeEvaluationNativeSettlement"] =
    nativeSide;
}

function applyCohortSalience(stage: HTMLElement, progress: number): void {
  const profile = kpNativeKatexContributorFusionOpticalProfile;
  const sourceStrength = 1 - smoothstep(
    profile.gatherStartsAt,
    profile.compressionStartsAt,
    progress
  );
  const targetStrength = smoothstep(
    profile.targetLegibilityStartsAt,
    profile.targetExpansionEndsAt,
    progress
  ) * (1 - smoothstep(profile.targetExpansionEndsAt, 1, progress));
  for (const [side, strength] of [
    ["source", sourceStrength],
    ["target", targetStrength]
  ] as const) {
    const salience = resolveKpSemanticSalience({
      baseLevel: "normal",
      identityFamily: "neutral",
      presence: 1,
      signals: strength > 0.01 ? ["focused"] : []
    });
    stage.querySelectorAll<HTMLElement>(
      `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
    ).forEach((owner) => {
      owner.dataset["kpCertifiedEvaluationSalienceRole"] = `${side}-cohort`;
      owner.dataset["kpSemanticSalienceLevel"] = salience.state.level;
      owner.dataset["kpSemanticIdentityFamily"] = salience.state.identityFamily;
      owner.style.setProperty(
        "--kp-certified-evaluation-salience-strength",
        strength.toFixed(4)
      );
      owner.style.filter =
        `brightness(${(1 + 0.1 * strength).toFixed(4)})`;
    });
  }
  stage.dataset["kpCertifiedEvaluationSaliencePhase"] =
    progress < profile.gatherStartsAt
      ? "orient"
      : progress < profile.targetLegibilityStartsAt
        ? "change"
        : progress < 1
          ? "recognize"
          : "settled";
}

function requiredSelectorToken(
  tokens: readonly HTMLElement[],
  selectorId: string
): HTMLElement {
  const matches = tokens.filter((token) =>
    token.dataset["kpMotionId"]?.endsWith(selectorId) === true
  );
  if (matches.length !== 1) {
    throw new Error(
      `Antiderivative evaluation requires one native token for ${selectorId}; found ${matches.length}.`
    );
  }
  return matches[0]!;
}

function smoothstep(start: number, end: number, value: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const progress = (value - start) / (end - start);
  return progress * progress * (3 - 2 * progress);
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clearMountTelemetry(stage: HTMLElement): void {
  stage.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-evaluation-fraction-native]"
  ).forEach((rule) => {
    delete rule.dataset["kpAntiderivativeEvaluationFractionNative"];
    delete rule.dataset["kpEquationMaterialNativeHidden"];
    rule.style.removeProperty("opacity");
    rule.style.removeProperty("visibility");
    rule.style.removeProperty("filter");
  });
  delete stage.dataset["kpAntiderivativeEvaluationMount"];
  delete stage.dataset["kpAntiderivativeEvaluationTransformationId"];
  delete stage.dataset["kpAntiderivativeEvaluationFractionOwner"];
  delete stage.dataset["kpAntiderivativeEvaluationFractionMotion"];
  delete stage.dataset["kpAntiderivativeEvaluationFractionReshapeProgress"];
}
