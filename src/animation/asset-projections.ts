import {
  createKpAnimationAsset,
  validateKpAnimationAsset,
  type KpAnimationAsset,
  type KpAnimationAssetCheckRef,
  type KpAnimationAssetDashboardMetadata,
  type KpAnimationAssetExportTarget,
  type KpAnimationAssetLayoutNode,
  type KpAnimationAssetPresentationProfile,
  type KpAnimationAssetRenderTarget,
  type KpAnimationAssetTimeline
} from "./asset.ts";
import type {
  KpAssetBundle,
  KpAssetMetadataValue
} from "../semantic/asset.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import type {
  EditableSemanticTransformationTree
} from "../semantic/transformation-composition.ts";

export interface KpAnimationAssetIdentityProjection {
  readonly id: string;
  readonly kind: "animation-asset";
  readonly title: string;
  readonly version: 1;
}

export interface KpSemanticAnimationAssetProjection {
  readonly kind: "semantic-animation-asset-projection";
  readonly identity: KpAnimationAssetIdentityProjection;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly transformationTree: EditableSemanticTransformationTree;
  readonly timeline?: KpAnimationAssetTimeline | undefined;
  readonly checks: readonly KpAnimationAssetCheckRef[];
}

export interface KpAnimationPresentationAssetProjection {
  readonly kind: "animation-presentation-asset-projection";
  readonly identity: KpAnimationAssetIdentityProjection;
  readonly layout?: KpAnimationAssetLayoutNode | undefined;
  readonly renderTargets: readonly KpAnimationAssetRenderTarget[];
  readonly presentationProfile?: KpAnimationAssetPresentationProfile | undefined;
}

export interface KpAnimationProductManifestProjection {
  readonly kind: "animation-product-manifest-projection";
  readonly identity: KpAnimationAssetIdentityProjection;
  readonly exportTargets: readonly KpAnimationAssetExportTarget[];
  readonly dashboard?: KpAnimationAssetDashboardMetadata | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAnimationAssetProjections {
  readonly identity: KpAnimationAssetIdentityProjection;
  readonly semanticAnimation: KpSemanticAnimationAssetProjection;
  readonly presentation: KpAnimationPresentationAssetProjection;
  readonly productManifest: KpAnimationProductManifestProjection;
}

export const kpAnimationAssetProjectionFieldOwnership = Object.freeze({
  identity: Object.freeze(["id", "kind", "title", "version"]),
  semanticAnimation: Object.freeze([
    "bundle",
    "transformations",
    "transformationTree",
    "timeline",
    "checks"
  ]),
  presentation: Object.freeze([
    "layout",
    "renderTargets",
    "presentationProfile"
  ]),
  productManifest: Object.freeze([
    "exportTargets",
    "dashboard",
    "metadata"
  ])
} as const);

export function projectKpAnimationAsset(
  asset: KpAnimationAsset
): KpAnimationAssetProjections {
  const issues = validateKpAnimationAsset(asset);
  if (issues.length > 0) {
    throw new Error(
      `Cannot project invalid animation ${asset.id}: ${issues[0]!.message}`
    );
  }
  const identity = Object.freeze({
    id: asset.id,
    kind: asset.kind,
    title: asset.title,
    version: asset.version
  });

  return Object.freeze({
    identity,
    semanticAnimation: Object.freeze({
      kind: "semantic-animation-asset-projection" as const,
      identity,
      bundle: asset.bundle,
      transformations: asset.transformations,
      transformationTree: asset.transformationTree,
      ...(asset.timeline === undefined ? {} : { timeline: asset.timeline }),
      checks: asset.checks
    }),
    presentation: Object.freeze({
      kind: "animation-presentation-asset-projection" as const,
      identity,
      ...(asset.layout === undefined ? {} : { layout: asset.layout }),
      renderTargets: asset.renderTargets,
      ...(asset.presentationProfile === undefined
        ? {}
        : { presentationProfile: asset.presentationProfile })
    }),
    productManifest: Object.freeze({
      kind: "animation-product-manifest-projection" as const,
      identity,
      exportTargets: asset.exportTargets,
      ...(asset.dashboard === undefined ? {} : { dashboard: asset.dashboard }),
      ...(asset.metadata === undefined ? {} : { metadata: asset.metadata })
    })
  });
}

export function recomposeKpAnimationAsset(
  projections: KpAnimationAssetProjections
): KpAnimationAsset {
  assertSharedIdentity(projections);
  const identity = projections.identity;

  return createKpAnimationAsset({
    id: identity.id,
    title: identity.title,
    bundle: projections.semanticAnimation.bundle,
    transformations: projections.semanticAnimation.transformations,
    transformationTree: projections.semanticAnimation.transformationTree,
    ...(projections.semanticAnimation.timeline === undefined
      ? {}
      : { timeline: projections.semanticAnimation.timeline }),
    ...(projections.presentation.layout === undefined
      ? {}
      : { layout: projections.presentation.layout }),
    renderTargets: projections.presentation.renderTargets,
    checks: projections.semanticAnimation.checks,
    exportTargets: projections.productManifest.exportTargets,
    ...(projections.productManifest.dashboard === undefined
      ? {}
      : { dashboard: projections.productManifest.dashboard }),
    ...(projections.presentation.presentationProfile === undefined
      ? {}
      : {
          presentationProfile:
            projections.presentation.presentationProfile
        }),
    ...(projections.productManifest.metadata === undefined
      ? {}
      : { metadata: projections.productManifest.metadata })
  });
}

function assertSharedIdentity(projections: KpAnimationAssetProjections): void {
  const identity = projections.identity;
  if (
    projections.semanticAnimation.identity !== identity ||
    projections.presentation.identity !== identity ||
    projections.productManifest.identity !== identity
  ) {
    throw new Error(
      "Animation asset projections must share one identity projection."
    );
  }
  if (
    identity.kind !== "animation-asset" ||
    identity.version !== 1 ||
    identity.id.length === 0 ||
    identity.title.length === 0
  ) {
    throw new Error("Animation asset projection identity is invalid.");
  }
}
