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
  createKpCertifiedNativeKatexContributorFusionPlayback
} from
  "../rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import type {
  KpEditorEquationStageHotPathCache
} from "./equation-stage-hot-path-cache.ts";

export interface KpCertifiedEquationEvaluationMountResult {
  readonly status: "inactive" | "mounted";
  readonly transformationId?: string | undefined;
  readonly familyProfileId?: string | undefined;
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
  input.stage.dataset["kpCertifiedEvaluationMount"] = "native-katex";
  input.stage.dataset["kpCertifiedEvaluationTransformationId"] =
    certificate.transformationId;
  return Object.freeze({
    status: "mounted" as const,
    transformationId: certificate.transformationId,
    familyProfileId: certificate.familyProfile.id
  });
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
