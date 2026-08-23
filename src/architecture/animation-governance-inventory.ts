import type {
  KpAnimationAsset,
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import {
  resolveKpAnimationPromotionLineage,
  type KpArtifactMaturity
} from "../animation/artifact-promotion.ts";
import type {
  KpAnimationCatalogueEntry,
  KpAnimationCatalogueHumanDisposition,
  KpAnimationCatalogueProjection
} from "../editor/animation-catalogue-projection.ts";
import type {
  KpEditorAnimationDescriptor
} from "../editor/animation-descriptor.ts";
import {
  dispatchKpEditorAnimationSurface,
  type KpEditorAnimationSurfaceKind,
  type KpEditorAnimationSurfaceSlotKind
} from "../editor/animation-surface-dispatch.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities,
  type KpEditorSelectedSurfaceCapability
} from "../editor/selected-surface-capability.ts";
import type {
  KpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../editor/selected-surface-capability-declarations.ts";
import {
  findKpEquationGovernanceV2Migration
} from "../domain-ir/equation-governance-v2-migrations.ts";
import {
  findKpEquationGovernanceV2Classification
} from "../domain-ir/equation-governance-v2-classifications.ts";

export type KpAnimationGovernanceDomain =
  | "equation"
  | "graph"
  | "programming"
  | "diagram";

export type KpAnimationGovernanceBypassCode =
  | "adapter-unclassified"
  | "diagnostic-equation-authority-rejected"
  | "equation-grammar-v2-missing"
  | "equation-profile-implicit"
  | "specialized-equation-adapter-direct"
  | "typography-policy-implicit"
  | "unsupported-surface";

export interface KpAnimationGovernanceInventory {
  readonly schemaVersion: "kp.animation-governance-inventory.v1";
  readonly kind: "animation-governance-inventory";
  readonly summary: {
    readonly assetCount: number;
    readonly equationAssetCount: number;
    readonly bypassedAssetCount: number;
    readonly unsupportedAssetCount: number;
  };
  readonly entries: readonly KpAnimationGovernanceInventoryEntry[];
}

export interface KpAnimationGovernanceInventoryEntry {
  readonly schemaVersion: "kp.animation-governance-inventory-entry.v1";
  readonly assetId: string;
  readonly title: string;
  readonly packId: KpAnimationCatalogPackId;
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly domains: readonly KpAnimationGovernanceDomain[];
  readonly surface: {
    readonly kind: KpEditorAnimationSurfaceKind;
    readonly slotKinds: readonly KpEditorAnimationSurfaceSlotKind[];
  };
  readonly renderer: {
    readonly capabilityIds: readonly KpEditorSelectedSurfaceCapability[];
    readonly adapterIds: readonly string[];
    readonly authority:
      | "selected-capability-declarations"
      | "selected-capabilities-and-base-adapters"
      | "base-adapters"
      | "unclassified";
  };
  readonly presentationProfile:
    | {
        readonly status: "declared";
        readonly schemaVersion: string;
        readonly domain: "equation";
        readonly recipeIds: readonly string[];
      }
    | { readonly status: "implicit" | "not-applicable" };
  readonly typography: {
    readonly flow: "host-css";
    readonly mathStyle:
      | "adapter-local-implicit"
      | "governance-policy-v2"
      | "renderer-domain"
      | "not-applicable";
    readonly opticalScale:
      | "adapter-local-implicit"
      | "governance-policy-v2"
      | "renderer-domain"
      | "not-applicable";
  };
  readonly motifs: {
    readonly familyIds: readonly string[];
    readonly semanticTransformTypes: readonly string[];
    readonly presentationRecipeIds: readonly string[];
  };
  readonly review: {
    readonly humanDisposition: KpAnimationCatalogueHumanDisposition;
    readonly maturity: KpArtifactMaturity;
    readonly evidenceSourceIds: readonly string[];
  };
  readonly bypasses: readonly KpAnimationGovernanceBypassCode[];
}

export class KpAnimationGovernanceInventoryError extends Error {
  override readonly name = "KpAnimationGovernanceInventoryError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

export function compileKpAnimationGovernanceInventory(input: {
  readonly assets: readonly KpAnimationAsset[];
  readonly catalogue: KpAnimationCatalogueProjection;
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly capabilityDeclarations:
    KpEditorSelectedSurfaceCapabilityDeclarationSet;
}): KpAnimationGovernanceInventory {
  const diagnostics: string[] = [];
  const assetsById = uniqueBy(input.assets, ({ id }) => id, "asset", diagnostics);
  const catalogueById = uniqueBy(
    input.catalogue.entries,
    ({ animationId }) => animationId,
    "catalogue entry",
    diagnostics
  );
  const descriptorsById = uniqueBy(
    input.descriptors,
    ({ id }) => id,
    "descriptor",
    diagnostics
  );

  const entries = [...catalogueById.values()].flatMap((catalogue) => {
    const asset = assetsById.get(catalogue.animationId);
    const descriptor = descriptorsById.get(catalogue.primaryDescriptorId);
    if (asset === undefined || descriptor === undefined) {
      diagnostics.push(
        `Loadable ${catalogue.animationId} is not statically classifiable: ` +
        `asset=${asset !== undefined}, descriptor=${descriptor !== undefined}.`
      );
      return [];
    }
    return [compileEntry({
      asset,
      catalogue,
      descriptor,
      declarations: input.capabilityDeclarations,
      diagnostics
    })];
  });

  for (const assetId of assetsById.keys()) {
    if (!catalogueById.has(assetId)) {
      diagnostics.push(`Asset ${assetId} is absent from the loadable catalogue.`);
    }
  }
  if (diagnostics.length > 0) {
    throw new KpAnimationGovernanceInventoryError(Object.freeze(diagnostics));
  }

  const ordered = Object.freeze(entries.sort((left, right) =>
    left.assetId.localeCompare(right.assetId)
  ));
  return Object.freeze({
    schemaVersion: "kp.animation-governance-inventory.v1" as const,
    kind: "animation-governance-inventory" as const,
    summary: Object.freeze({
      assetCount: ordered.length,
      equationAssetCount: ordered.filter(({ domains }) =>
        domains.includes("equation")
      ).length,
      bypassedAssetCount: ordered.filter(({ bypasses }) =>
        bypasses.length > 0
      ).length,
      unsupportedAssetCount: ordered.filter(({ surface }) =>
        surface.kind === "unsupported"
      ).length
    }),
    entries: ordered
  });
}

function compileEntry(input: {
  readonly asset: KpAnimationAsset;
  readonly catalogue: KpAnimationCatalogueEntry;
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly declarations: KpEditorSelectedSurfaceCapabilityDeclarationSet;
  readonly diagnostics: string[];
}): KpAnimationGovernanceInventoryEntry {
  const surface = dispatchKpEditorAnimationSurface(input.descriptor);
  const capabilityIds = deriveKpEditorSelectedSurfaceCapabilities({
    animationId: input.asset.id,
    slotKinds: surface.slotKinds
  });
  const selectedAdapterIds = capabilityIds.flatMap((capabilityId) =>
    input.declarations.find(capabilityId).adapterIds
  );
  const baseAdapterIds = surface.slotKinds.flatMap((slotKind) =>
    slotKind === "diagram"
      ? ["editor-animation-surface.diagram.svg"]
      : []
  );
  const adapterIds = unique([...selectedAdapterIds, ...baseAdapterIds]);
  const domains = unique(surface.slotKinds.map(domainForSlot));
  const governanceV2 = findKpEquationGovernanceV2Migration(input.asset.id);
  const classification = findKpEquationGovernanceV2Classification(
    input.asset.id
  );
  const bypasses: KpAnimationGovernanceBypassCode[] = [];
  if (surface.kind === "unsupported") bypasses.push("unsupported-surface");
  if (surface.slotKinds.length > 0 && adapterIds.length === 0) {
    bypasses.push("adapter-unclassified");
    input.diagnostics.push(
      `Loadable ${input.asset.id} has supported slots ` +
      `${surface.slotKinds.join(", ")} but no statically declared adapter.`
    );
  }
  if (domains.includes("equation")) {
    if (classification?.disposition === "diagnostic-authority-rejected") {
      bypasses.push("diagnostic-equation-authority-rejected");
    } else if (governanceV2 === undefined) {
      bypasses.push("equation-grammar-v2-missing", "typography-policy-implicit");
    } else if (!adapterIds.includes(governanceV2.adapterId)) {
      input.diagnostics.push(
        `Governance-v2 migration ${input.asset.id} requires undeclared adapter ` +
        `${governanceV2.adapterId}.`
      );
    }
    if (input.asset.presentationProfile === undefined) {
      bypasses.push("equation-profile-implicit");
    }
    if (governanceV2 === undefined &&
        capabilityIds.some((id) => id !== "equation-katex")) {
      bypasses.push("specialized-equation-adapter-direct");
    }
  }

  const presentationRecipeIds = input.asset.presentationProfile === undefined
    ? []
    : Object.values(input.asset.presentationProfile.payload)
      .filter((value): value is string => typeof value === "string")
      .filter((value) => value !== "equation-presentation");
  const promotion = resolveKpAnimationPromotionLineage({
    animationId: input.asset.id,
    novelty: input.descriptor.promotion?.novelty
  });
  return Object.freeze({
    schemaVersion: "kp.animation-governance-inventory-entry.v1" as const,
    assetId: input.asset.id,
    title: input.asset.title,
    packId: input.catalogue.packId,
    renderTargetKinds: Object.freeze([...input.catalogue.renderTargetKinds]),
    domains: Object.freeze(domains),
    surface: Object.freeze({
      kind: surface.kind,
      slotKinds: Object.freeze([...surface.slotKinds])
    }),
    renderer: Object.freeze({
      capabilityIds: Object.freeze([...capabilityIds]),
      adapterIds: Object.freeze(adapterIds),
      authority: rendererAuthority(capabilityIds, baseAdapterIds, adapterIds)
    }),
    presentationProfile: input.asset.presentationProfile === undefined
      ? Object.freeze({
          status: domains.includes("equation")
            ? "implicit" as const
            : "not-applicable" as const
        })
      : Object.freeze({
          status: "declared" as const,
          schemaVersion: input.asset.presentationProfile.schemaVersion,
          domain: input.asset.presentationProfile.domain,
          recipeIds: Object.freeze(presentationRecipeIds)
        }),
    typography: Object.freeze({
      flow: "host-css" as const,
      mathStyle: domains.includes("equation")
        ? governanceV2 === undefined
          ? "adapter-local-implicit" as const
          : "governance-policy-v2" as const
        : domains.some((domain) => domain === "graph")
          ? "renderer-domain" as const
          : "not-applicable" as const,
      opticalScale: domains.includes("equation")
        ? governanceV2 === undefined
          ? "adapter-local-implicit" as const
          : "governance-policy-v2" as const
        : domains.length > 0
          ? "renderer-domain" as const
          : "not-applicable" as const
    }),
    motifs: Object.freeze({
      familyIds: Object.freeze([...input.catalogue.familyIds]),
      semanticTransformTypes: Object.freeze(unique(
        input.asset.transformations.map(({ transformType }) => transformType)
      )),
      presentationRecipeIds: Object.freeze(presentationRecipeIds)
    }),
    review: Object.freeze({
      humanDisposition: input.catalogue.humanDisposition,
      maturity: promotion.facet.maturity,
      evidenceSourceIds: Object.freeze([...promotion.evidenceSourceIds])
    }),
    bypasses: Object.freeze(unique(bypasses))
  });
}

function domainForSlot(
  slotKind: KpEditorAnimationSurfaceSlotKind
): KpAnimationGovernanceDomain {
  return slotKind;
}

function rendererAuthority(
  capabilities: readonly KpEditorSelectedSurfaceCapability[],
  baseAdapterIds: readonly string[],
  adapterIds: readonly string[]
): KpAnimationGovernanceInventoryEntry["renderer"]["authority"] {
  if (adapterIds.length === 0) return "unclassified";
  if (capabilities.length > 0 && baseAdapterIds.length > 0) {
    return "selected-capabilities-and-base-adapters";
  }
  if (capabilities.length > 0) return "selected-capability-declarations";
  return "base-adapters";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function uniqueBy<T>(
  values: readonly T[],
  id: (value: T) => string,
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    const key = id(value);
    if (result.has(key)) diagnostics.push(`Duplicate ${label} ${key}.`);
    result.set(key, value);
  }
  return result;
}
