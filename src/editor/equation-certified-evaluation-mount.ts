import {
  consumeKpEquationEvaluationFamilyTransitionsV2
} from "../domain-ir/equation-evaluation-family-adapter-v2.ts";
import type {
  KpCompiledEquationPresentationPlanV2
} from "../domain-ir/equation-presentation-plan-v2.ts";
import {
  syncKpEquationMaterialLayer,
  type KpEquationMaterialLayerOwnerFrame
} from "../rendering/equation-material-layer-dom.ts";
import {
  createKpCertifiedNativeKatexContributorFusionPlayback,
  kpNativeKatexContributorFusionOpticalProfile
} from
  "../rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import {
  resolveKpSemanticSalience
} from "../animation/semantic-salience-resolver.ts";
import type {
  KpEditorEquationStageHotPathCache
} from "./equation-stage-hot-path-cache.ts";

export interface KpCertifiedEquationEvaluationMountResult {
  readonly status: "inactive" | "mounted";
  readonly transformationId?: string | undefined;
  readonly familyProfileId?: string | undefined;
}

export function kpCertifiedEquationEvaluationTransformationIds(
  plan: KpCompiledEquationPresentationPlanV2
): readonly string[] {
  return consumeKpEquationEvaluationFamilyTransitionsV2({
    plan,
    adapter: {
      id: "adapter.editor.certified-equation-evaluation-identity.v2",
      kind: "equation-evaluation-family-adapter-v2",
      compile: ({ certificate }) => certificate.transformationId
    }
  });
}

/**
 * The generic host projects certified selector ownership into its existing
 * material layer; the shared Native KaTeX mount remains the sole paint sampler.
 */
export function applyKpCertifiedEquationEvaluationMount(input: {
  readonly stage: HTMLElement;
  readonly plan: KpCompiledEquationPresentationPlanV2;
  readonly activeTransformationIds: readonly string[];
  readonly localProgress: number;
  readonly direction: "forward" | "rewind";
  readonly hotPath: KpEditorEquationStageHotPathCache;
}): KpCertifiedEquationEvaluationMountResult {
  const certified = consumeKpEquationEvaluationFamilyTransitionsV2({
    plan: input.plan,
    adapter: {
      id: "adapter.editor.generic-equation-certified-evaluation.v2",
      kind: "equation-evaluation-family-adapter-v2",
      compile: (entry) => entry
    }
  }).filter(({ certificate }) =>
    input.activeTransformationIds.includes(certificate.transformationId)
  );
  if (certified.length === 0) {
    clearMountTelemetry(input.stage);
    return Object.freeze({ status: "inactive" as const });
  }
  if (certified.length !== 1) {
    throw new Error(
      "Generic equation evaluation mount requires one active certificate."
    );
  }

  const { certificate } = certified[0]!;
  if (certificate.topologyCertificate.topology !==
      "contributors-create-result") {
    throw new Error(
      `Generic equation evaluation cannot mount ${certificate.topologyCertificate.topology}.`
    );
  }
  const topology = certificate.topologyCertificate;
  const bindings = [
    ...topology.materialInputSelectorIds.map((selectorId) => ({
      selectorId,
      side: "source" as const,
      contribution: "material-input" as const
    })),
    ...topology.catalystSelectorIds.map((selectorId) => ({
      selectorId,
      side: "source" as const,
      contribution: "catalyst" as const
    })),
    ...topology.resultSelectorIds.map((selectorId) => ({
      selectorId,
      side: "target" as const,
      contribution: "successor-target" as const
    }))
  ];
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
  // Clone stable endpoint ink, not presentation residue from the previous
  // semantic sampler. Cached rectangles remain the native geometry authority.
  tokens.forEach(({ token }) => {
    token.style.opacity = "1";
    token.style.visibility = "visible";
    token.style.transform = "none";
    token.style.filter = "none";
  });
  try {
    syncKpEquationMaterialLayer({
      stage: input.stage,
      owners: tokens.map(({ token, selectorId, side, contribution }) => {
        const rect = input.hotPath.motionTokenRects.get(token);
        if (rect === undefined) {
          throw new Error(
            `Certified evaluation selector ${selectorId} has no native geometry.`
          );
        }
        return {
          ownerId:
            `evaluation-family.${certificate.transformationId}.${selectorId}`,
          sourceElement: token,
          sourceMotionId: token.dataset["kpMotionId"],
          semanticEntityId: selectorId,
          verifiedOperationCohortId: certificate.authorityId,
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
  const playback = createKpCertifiedNativeKatexContributorFusionPlayback({
    stage: input.stage,
    base,
    certificate
  });
  const progress = input.direction === "forward"
    ? input.localProgress
    : 1 - input.localProgress;
  playback.apply(progress);
  applyCertifiedEvaluationSalience({
    stage: input.stage,
    progress
  });
  settleCertifiedEvaluationNativeEndpoint({
    stage: input.stage,
    tokens,
    progress
  });
  input.stage.dataset["kpCertifiedEvaluationMount"] = "native-katex";
  input.stage.dataset["kpCertifiedEvaluationTransformationId"] =
    certificate.transformationId;
  return Object.freeze({
    status: "mounted" as const,
    transformationId: certificate.transformationId,
    familyProfileId: certificate.familyProfile.id
  });
}

function settleCertifiedEvaluationNativeEndpoint(input: {
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
    delete input.stage.dataset["kpCertifiedEvaluationNativeSettlement"];
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
  input.stage.dataset["kpCertifiedEvaluationNativeSettlement"] = nativeSide;
}

function applyCertifiedEvaluationSalience(input: {
  readonly stage: HTMLElement;
  readonly progress: number;
}): void {
  const profile = kpNativeKatexContributorFusionOpticalProfile;
  // Attention precedes the visible rewrite, releases during the ink knot,
  // then acknowledges the result before returning to neutral at settlement.
  const sourceStrength = 1 - smoothstep(
    profile.gatherStartsAt,
    profile.compressionStartsAt,
    input.progress
  );
  const targetStrength = smoothstep(
    profile.targetLegibilityStartsAt,
    profile.targetExpansionEndsAt,
    input.progress
  ) * (1 - smoothstep(
    profile.targetExpansionEndsAt,
    1,
    input.progress
  ));
  applyCohortSalience(input.stage, "source", sourceStrength);
  applyCohortSalience(input.stage, "target", targetStrength);
  input.stage.dataset["kpCertifiedEvaluationSaliencePhase"] =
    input.progress < profile.gatherStartsAt
      ? "orient"
      : input.progress < profile.targetLegibilityStartsAt
        ? "change"
        : input.progress < 1
          ? "recognize"
          : "settled";
}

function applyCohortSalience(
  stage: HTMLElement,
  side: "source" | "target",
  strength: number
): void {
  const salience = resolveKpSemanticSalience({
    baseLevel: "normal",
    identityFamily: "neutral",
    presence: 1,
    signals: strength > 0.01 ? ["focused"] : []
  });
  const formattedStrength = strength.toFixed(4);
  stage.querySelectorAll<HTMLElement>(
    `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
  ).forEach((owner) => {
    owner.dataset["kpCertifiedEvaluationSalienceRole"] = `${side}-cohort`;
    owner.dataset["kpSemanticSalienceLevel"] = salience.state.level;
    owner.dataset["kpSemanticIdentityFamily"] =
      salience.state.identityFamily;
    owner.style.setProperty(
      "--kp-certified-evaluation-salience-strength",
      formattedStrength
    );
    // Brightness changes paint only, so native KaTeX measurement and the
    // family-owned transform remain untouched.
    owner.style.filter = `brightness(${(1 + 0.1 * strength).toFixed(4)})`;
  });
}

function smoothstep(start: number, end: number, value: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const progress = (value - start) / (end - start);
  return progress * progress * (3 - 2 * progress);
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
      `Certified evaluation requires one native token for ${selectorId}; found ${matches.length}.`
    );
  }
  return matches[0]!;
}

function clearMountTelemetry(stage: HTMLElement): void {
  delete stage.dataset["kpCertifiedEvaluationMount"];
  delete stage.dataset["kpCertifiedEvaluationTransformationId"];
}
