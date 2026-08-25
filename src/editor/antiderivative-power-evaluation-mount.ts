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
  try {
    syncKpEquationMaterialLayer({
      stage: input.stage,
      owners: tokens.map(({
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
      })
    });
  } finally {
    previousStyles.forEach((previous) => {
      previous.token.style.opacity = previous.opacity;
      previous.token.style.visibility = previous.visibility;
      previous.token.style.transform = previous.transform;
      previous.token.style.filter = previous.filter;
    });
  }
  tokens.forEach(({ token }) => {
    token.style.opacity = "0";
    token.style.visibility = "hidden";
    token.dataset["kpEquationMaterialNativeHidden"] = "true";
  });

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
  const progress = input.direction === "forward"
    ? input.localProgress
    : 1 - input.localProgress;
  playback.apply(progress);
  applyCohortSalience(input.stage, progress);
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

function clearMountTelemetry(stage: HTMLElement): void {
  delete stage.dataset["kpAntiderivativeEvaluationMount"];
  delete stage.dataset["kpAntiderivativeEvaluationTransformationId"];
}
