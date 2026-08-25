import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpAntiderivativePowerChoreography,
  type KpAntiderivativePowerChoreographyPlan
} from "../animation/antiderivative-power-choreography.ts";
import type {
  KpNativeKatexRendererReadyScenePlan,
  KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession
} from "./native-katex-scene-compositor.ts";
import {
  createKpAntiderivativeTemplateInstantiationTrackProjection,
  kpAntiderivativeTemplateInstantiationProfileId
} from "./native-katex-antiderivative-template-instantiation.ts";

export const kpAntiderivativePowerNativeKatexTransitMechanismId =
  "kp.rendering.native-katex.antiderivative-power-material-transit.v1";

export interface KpAntiderivativePowerNativeKatexTransitPlan {
  readonly kind: "antiderivative-power-native-katex-transit-plan";
  readonly mechanismId:
    typeof kpAntiderivativePowerNativeKatexTransitMechanismId;
  readonly templateInstantiationProfileId:
    typeof kpAntiderivativeTemplateInstantiationProfileId;
  readonly choreography: KpAntiderivativePowerChoreographyPlan;
  readonly semanticPaintRelations:
    readonly KpNativeKatexSemanticPaintRelation[];
  readonly requiredSourceSemanticEntityIds: readonly string[];
  readonly requiredTargetSemanticEntityIds: readonly string[];
  readonly introducedTargetSemanticEntityIds: readonly string[];
}

/**
 * The semantic choreography selects paint relations; the compositor remains
 * the sole owner of measured geometry, cloning, motion, and native handoff.
 */
export function createKpAntiderivativePowerNativeKatexTransitPlan(
  animation: KpAnimationAsset
): KpAntiderivativePowerNativeKatexTransitPlan {
  const choreography = createKpAntiderivativePowerChoreography(animation);
  const semanticPaintRelations = Object.freeze([
    Object.freeze({
      id: "paint.antiderivative.integrand-base-persists",
      relation: "persist" as const,
      sourceEntityIds: Object.freeze([
        choreography.persistentBase.sourceSelectorId
      ]),
      targetEntityIds: Object.freeze([
        choreography.persistentBase.targetSelectorId
      ])
    }),
    Object.freeze({
      id: "paint.antiderivative.source-exponent-branches",
      relation: "split" as const,
      sourceEntityIds: Object.freeze([
        choreography.exponentBranch.sourceSelectorId
      ]),
      targetEntityIds: choreography.exponentBranch.targetSelectorIds
    })
  ] satisfies readonly KpNativeKatexSemanticPaintRelation[]);
  const introducedTargetSemanticEntityIds = Object.freeze([
    ...choreography.introducedSelectorIds,
    choreography.fractionStructure.targetSemanticEntityId
  ]);
  return Object.freeze({
    kind: "antiderivative-power-native-katex-transit-plan" as const,
    mechanismId: kpAntiderivativePowerNativeKatexTransitMechanismId,
    templateInstantiationProfileId:
      kpAntiderivativeTemplateInstantiationProfileId,
    choreography,
    semanticPaintRelations,
    requiredSourceSemanticEntityIds: Object.freeze([
      ...choreography.operatorApplication.operatorSelectorIds,
      ...choreography.operatorApplication.argumentSelectorIds
    ]),
    requiredTargetSemanticEntityIds: Object.freeze([
      choreography.persistentBase.targetSelectorId,
      ...choreography.exponentBranch.targetSelectorIds,
      ...introducedTargetSemanticEntityIds
    ]),
    introducedTargetSemanticEntityIds
  });
}

export function compileKpAntiderivativePowerNativeKatexScenePlan(input: {
  readonly plan: KpAntiderivativePowerNativeKatexTransitPlan;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexRendererReadyScenePlan {
  assertEndpointSemanticPaint(
    input.source,
    input.plan.requiredSourceSemanticEntityIds,
    "source"
  );
  assertEndpointSemanticPaint(
    input.target,
    input.plan.requiredTargetSemanticEntityIds,
    "target"
  );
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: input.plan.semanticPaintRelations,
    trackProjection:
      createKpAntiderivativeTemplateInstantiationTrackProjection(
        input.plan.choreography
      ),
    copyFanOutRouting: true
  });
}

export function createKpAntiderivativePowerNativeKatexSceneSession(input: {
  readonly plan: KpAntiderivativePowerNativeKatexTransitPlan;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpCanonicalNativeKatexSceneSession {
  return createKpCanonicalNativeKatexSceneSession(
    compileKpAntiderivativePowerNativeKatexScenePlan(input)
  );
}

function assertEndpointSemanticPaint(
  endpoint: KpNativeKatexRenderedSceneObservation,
  requiredIds: readonly string[],
  label: "source" | "target"
): void {
  if (endpoint.endpoint !== label) {
    throw new Error(
      `Antiderivative Native KaTeX ${label} input received ${endpoint.endpoint}.`
    );
  }
  const observed = new Set(endpoint.atoms.map(({ semanticEntityId }) =>
    semanticEntityId
  ));
  const missing = [...new Set(requiredIds)].filter((id) => !observed.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Antiderivative Native KaTeX ${label} endpoint lacks paint for ` +
      `${missing.join(", ")}.`
    );
  }
}
