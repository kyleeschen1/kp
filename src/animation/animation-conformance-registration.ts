import type { KpAnimationAsset } from "./asset.ts";
import type { KpAnimationCatalogPackId } from "./catalog-loader.ts";
import type { KpAnimationPolicyEpochId } from
  "../architecture/animation-policy-epoch.ts";
import {
  kpAnimationConformanceRegistrationDeclarations
} from "../generated/animation-conformance-registrations.generated.ts";

export type KpAnimationConformanceRegistrationGapCode =
  | "manifest-generation-missing"
  | "migration-deferred"
  | "unsupported-conformance";

export type KpAnimationConformanceRegistrationDeclaration =
  | {
      readonly kind: "manifest-ref";
      readonly assetId: string;
      readonly packId: KpAnimationCatalogPackId;
      readonly manifestId: string;
      readonly policyEpochId: KpAnimationPolicyEpochId;
      readonly disposition: "conformant" | "compatibility" | "unsupported";
    }
  | {
      readonly kind: "typed-gap";
      readonly assetId: string;
      readonly packId: KpAnimationCatalogPackId;
      readonly code: KpAnimationConformanceRegistrationGapCode;
      readonly reason: string;
    };

export interface KpConformanceRegisteredAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly conformanceRegistrations:
    readonly KpAnimationConformanceRegistrationDeclaration[];
}

export function registerKpAnimationPackConformance(input: {
  readonly packId: KpAnimationCatalogPackId;
  readonly catalog: readonly KpAnimationAsset[];
  readonly declarations?:
    readonly KpAnimationConformanceRegistrationDeclaration[] | undefined;
}): KpConformanceRegisteredAnimationPack {
  const declarations = input.declarations ??
    kpAnimationConformanceRegistrationDeclarations;
  const byAssetId = new Map(declarations.map((declaration) =>
    [declaration.assetId, declaration]
  ));
  const registrations = input.catalog.map((asset) => {
    const declaration = byAssetId.get(asset.id);
    if (declaration === undefined) {
      throw new Error(
        `Animation ${asset.id} must register a conformance manifest or typed gap.`
      );
    }
    // Comparison and composite packs may carry child assets owned by another
    // lazy pack; conformance follows the asset, while the requested root is
    // checked against the active pack by the catalogue loader.
    return declaration;
  });
  return Object.freeze({
    catalog: input.catalog,
    conformanceRegistrations: Object.freeze(registrations)
  });
}
