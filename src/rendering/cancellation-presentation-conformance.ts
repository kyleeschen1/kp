import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCancellationOperationIdForTransformType
} from "../semantic/cancellation-presentation-authoring.ts";
import { kpEquationPresentationProfile } from "../animation/equation-presentation-policy.ts";

export type KpCancellationCatalogIssueCode =
  | "missing-typed-profile"
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
    const hasTypedProfile = asset.presentationProfile?.domain === "equation";
    if (hasCancellationAuthority && !hasTypedProfile) {
      issues.push(issue(
        asset,
        "missing-typed-profile",
        "Cancellation authority requires a typed equation presentation profile."
      ));
    }
    if (hasCancellationAuthority && hasTypedProfile) {
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
