import type { KpAnimationAsset } from "./asset.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
import {
  createTransformTreeVisualMotifTimeline,
  type TransformTreeVisualMotifRule,
  type TransformTreeVisualMotifTimeline
} from "../rendering/visual-motif-composition.ts";

export interface CreateKpAnimationAssetVisualMotifTimelineInput<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly id?: string | undefined;
  readonly animation: KpAnimationAsset;
  readonly rules: readonly TransformTreeVisualMotifRule<
    TKind,
    TPrimitiveId,
    TPhaseId
  >[];
}

export interface CheckKpAnimationAssetVisualMotifDefinitionCoverageInput<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly animation: KpAnimationAsset;
  readonly rules: readonly TransformTreeVisualMotifRule<
    TKind,
    TPrimitiveId,
    TPhaseId
  >[];
}

export function createKpAnimationAssetVisualMotifTimeline<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  input: CreateKpAnimationAssetVisualMotifTimelineInput<
    TKind,
    TPrimitiveId,
    TPhaseId
  >
): TransformTreeVisualMotifTimeline<TKind, TPrimitiveId, TPhaseId> {
  return createTransformTreeVisualMotifTimeline({
    id: input.id ?? `${input.animation.id}.visual-motifs`,
    tree: input.animation.transformationTree,
    rules: input.rules
  });
}

export function checkKpAnimationAssetVisualMotifDefinitionCoverage<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  input: CheckKpAnimationAssetVisualMotifDefinitionCoverageInput<
    TKind,
    TPrimitiveId,
    TPhaseId
  >
): KpLawCheckResult {
  const rulesByDefinitionId = createRuleByDefinitionId(input.rules);
  const failures: KpLawFailure[] = [];

  input.animation.transformations.forEach((transformation, index) => {
    if (transformation.definitionId === undefined) {
      return;
    }

    const rule = rulesByDefinitionId.get(transformation.definitionId);

    if (rule === undefined) {
      failures.push({
        path: `transformations[${index}].definitionId`,
        message:
          `Animation ${input.animation.id} transformation ${transformation.id} definition ${transformation.definitionId} must have a visual motif rule.`
      });
      return;
    }

    if (rule.transformationKind !== transformation.transformType) {
      failures.push({
        path: `transformations[${index}].transformType`,
        message:
          `Animation ${input.animation.id} transformation ${transformation.id} definition ${transformation.definitionId} visual motif rule must target transform type ${transformation.transformType}.`
      });
    }
  });

  return {
    lawId: "animation.visual-motif.definition-coverage",
    passed: failures.length === 0,
    failures
  };
}

function createRuleByDefinitionId<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  rules: readonly TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>[]
): ReadonlyMap<
  string,
  TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>
> {
  const ruleByDefinitionId = new Map<
    string,
    TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>
  >();

  rules.forEach((rule) => {
    (rule.definitionIds ?? []).forEach((definitionId) => {
      ruleByDefinitionId.set(definitionId, rule);
    });
  });

  return ruleByDefinitionId;
}
