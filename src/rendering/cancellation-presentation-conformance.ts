import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCancellationOperationIdForTransformType
} from "../semantic/cancellation-presentation-authoring.ts";
import {
  inspectKpLegacyEquationPresentationMetadataPresence
} from "../animation/equation-presentation-profile-decoder.ts";
import { kpEquationPresentationProfile } from "./equation-presentation-policy.ts";

export type KpCancellationCatalogIssueCode =
  | "raw-recipe-authority"
  | "missing-teaching-goal"
  | "orphaned-teaching-goal"
  | "unresolved-policy";

export interface KpCancellationCatalogIssue {
  readonly animationId: string;
  readonly code: KpCancellationCatalogIssueCode;
  readonly message: string;
}

export function checkKpCancellationPresentationCatalog(
  assets: readonly KpAnimationAsset[]
): readonly KpCancellationCatalogIssue[] {
  const issues: KpCancellationCatalogIssue[] = [];
  for (const asset of assets) {
    const hasCancellationAuthority = asset.transformations.some((transformation) =>
      kpCancellationOperationIdForTransformType(transformation.transformType) !== undefined
    );
    const presence = inspectKpLegacyEquationPresentationMetadataPresence(
      asset.metadata
    );
    const hasTeachingGoal = presence.teachingGoalPresent;
    const hasRawCancellationRecipe = presence.presentKeys.includes(
      "equationCancellationPresentationRecipe"
    );
    if (hasRawCancellationRecipe) {
      issues.push(issue(asset, "raw-recipe-authority", "Raw cancellation recipe ids are forbidden in catalog assets."));
    }
    if (hasCancellationAuthority && !hasTeachingGoal) {
      issues.push(issue(asset, "missing-teaching-goal", "Cancellation authority requires an inferred teaching goal."));
    }
    if (!hasCancellationAuthority && hasTeachingGoal) {
      issues.push(issue(asset, "orphaned-teaching-goal", "A cancellation teaching goal requires semantic cancellation authority."));
    }
    if (hasCancellationAuthority && hasTeachingGoal) {
      try {
        kpEquationPresentationProfile(asset);
      } catch (error) {
        issues.push(issue(
          asset,
          "unresolved-policy",
          error instanceof Error ? error.message : String(error)
        ));
      }
    }
  }
  return Object.freeze(issues);
}

function issue(
  asset: KpAnimationAsset,
  code: KpCancellationCatalogIssueCode,
  message: string
): KpCancellationCatalogIssue {
  return Object.freeze({ animationId: asset.id, code, message });
}
