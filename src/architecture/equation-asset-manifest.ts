import { createKpAnimationAssets } from "../animation/catalog.ts";
import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpAnimationCatalogPackId,
  KpAnimationCatalogPackSourcePath
} from "../animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueProjection
} from "../editor/animation-catalogue-projection.ts";
import {
  createKpAnimationLibraryDisplayCatalog as
    createKpSourceAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry,
  type KpAnimationLibraryDisplayRepresentation
} from "../editor/animation-library-display-catalog-builder.ts";
import {
  compileKpEquationSurfaceAuthorityGraph,
  kpEquationSurfaceAuthorityNodes
} from "./equation-surface-authority-graph.ts";
import {
  compileKpEquationSurfaceDispositionLedger,
  type KpEquationSurfaceDisposition,
  type KpEquationSurfaceDispositionLedger,
  type KpEquationSurfaceMigrationWave
} from "./equation-surface-disposition-ledger.ts";
import {
  compileKpEquationSurfaceInventory,
  type KpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";
import {
  compileKpEquationSurfacePreservationMatrix,
  type KpEquationSurfaceFamilyId,
  type KpEquationSurfacePreservationMatrix
} from "./equation-surface-preservation-matrix.ts";

export interface KpEquationAssetManifest {
  readonly schemaVersion: "kp.equation-asset-manifest.v1";
  readonly kind: "equation-asset-manifest";
  readonly entries: readonly KpEquationAssetManifestEntry[];
}

export interface KpEquationAssetManifestEntry {
  readonly schemaVersion: "kp.equation-asset-manifest-entry.v1";
  readonly assetId: string;
  readonly title: string;
  readonly semanticSource: {
    readonly kind: "catalog-animation-asset";
    readonly sourcePath: "src/animation/catalog.ts";
    readonly primaryDescriptorId: string;
    readonly transformationIds: readonly string[];
  };
  readonly pedagogicalIntent: {
    readonly summary: string;
    readonly tags: readonly string[];
  };
  readonly capabilities: {
    readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
    readonly selectedCapabilityId:
      | "equation-katex"
      | "log-exponent"
      | "logarithm-change-of-base"
      | "log-quotient"
      | "log-product"
      | "operation-evaluation";
    readonly familyId: KpEquationSurfaceFamilyId;
    readonly disposition: KpEquationSurfaceDisposition;
    readonly migrationWave: KpEquationSurfaceMigrationWave;
  };
  readonly lazyLoader: {
    readonly kind: "catalog-pack";
    readonly packId: KpAnimationCatalogPackId;
    readonly loaderSourcePath: "src/animation/catalog-loader.ts";
    readonly packSourcePath: KpAnimationCatalogPackSourcePath;
  };
  readonly staticTruth: {
    readonly sourcePath:
      "src/architecture/equation-surface-preservation-matrix.generated.json";
    readonly route: {
      readonly href: string;
      readonly selectionParameter: "artifact";
    };
    readonly semanticEndpointFingerprints: readonly string[];
    readonly nativeSettlement: {
      readonly slotKind: "equation";
      readonly adapterId: string;
      readonly adapterStatus: "ready";
      readonly endpointAuthority:
        | "semantic-native-katex"
        | "labelled-semantic-stage";
    };
  };
  readonly accessibilityTruth: {
    readonly playerLabel: "descriptor-title-animation-player";
    readonly mathSemantics: "katex-mathml" | "semantic-stage-aria-label";
    readonly reducedMotionAttribute:
      "data-kp-editor-animation-accessibility-mode";
    readonly reducedMotionValue: "reduced-motion";
  };
  readonly catalogue: {
    readonly availability: "playable" | "planned";
    readonly canonicalFormat: "ported" | "partial" | "legacy";
    readonly featured: boolean;
    readonly primaryRepresentationId?: string | undefined;
    readonly representations:
      readonly KpAnimationLibraryDisplayRepresentation[];
  };
}

export class KpEquationAssetManifestError extends Error {
  override readonly name = "KpEquationAssetManifestError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

export function createKpEquationAssetManifest(input: {
  readonly display?: readonly KpAnimationLibraryDisplayEntry[] | undefined;
} = {}): KpEquationAssetManifest {
  const display = input.display ??
    createKpSourceAnimationLibraryDisplayCatalog();
  const catalogue = createKpAnimationCatalogueProjection({ display });
  const inventory = compileKpEquationSurfaceInventory({ catalogue, display });
  const assets = createKpAnimationAssets();
  // Generators must derive every downstream ledger from the same in-memory
  // display snapshot. Falling back to generated display data here creates a
  // circular bootstrap whenever a new equation surface is added.
  const authority = compileKpEquationSurfaceAuthorityGraph({
    inventory,
    assets,
    nodes: kpEquationSurfaceAuthorityNodes
  });
  const preservation = compileKpEquationSurfacePreservationMatrix({
    inventory,
    assets,
    authority
  });
  const disposition = compileKpEquationSurfaceDispositionLedger({
    inventory,
    authority,
    preservation
  });
  return compileKpEquationAssetManifest({
    inventory,
    preservation,
    disposition,
    display
  });
}

export function compileKpEquationAssetManifest(input: {
  readonly inventory: KpEquationSurfaceInventory;
  readonly preservation: KpEquationSurfacePreservationMatrix;
  readonly disposition: KpEquationSurfaceDispositionLedger;
  readonly display: readonly KpAnimationLibraryDisplayEntry[];
}): KpEquationAssetManifest {
  const diagnostics: string[] = [];
  const preservationById = uniqueById(
    input.preservation.entries,
    ({ animationId }) => animationId,
    "preservation",
    diagnostics
  );
  const dispositionById = uniqueById(
    input.disposition.entries,
    ({ animationId }) => animationId,
    "disposition",
    diagnostics
  );
  const displayById = uniqueById(
    input.display,
    ({ animationId }) => animationId,
    "display",
    diagnostics
  );
  const seen = new Set<string>();
  const entries = input.inventory.entries.flatMap((inventory) => {
    if (seen.has(inventory.animationId)) {
      diagnostics.push(`Duplicate inventory asset ${inventory.animationId}.`);
      return [];
    }
    seen.add(inventory.animationId);
    const preservation = preservationById.get(inventory.animationId);
    const disposition = dispositionById.get(inventory.animationId);
    const display = displayById.get(inventory.animationId);
    if (preservation === undefined || disposition === undefined ||
        display === undefined) {
      diagnostics.push(
        `Incomplete manifest sources for ${inventory.animationId}: ` +
        `preservation=${preservation !== undefined}, ` +
        `disposition=${disposition !== undefined}, ` +
        `display=${display !== undefined}.`
      );
      return [];
    }
    return [manifestEntry({ inventory, preservation, disposition, display })];
  });

  for (const [label, ids] of [
    ["preservation", preservationById.keys()],
    ["disposition", dispositionById.keys()]
  ] as const) {
    for (const assetId of ids) {
      if (!seen.has(assetId)) {
        diagnostics.push(`${label} asset ${assetId} is absent from inventory.`);
      }
    }
  }
  if (diagnostics.length > 0) {
    throw new KpEquationAssetManifestError(Object.freeze(diagnostics));
  }
  return Object.freeze({
    schemaVersion: "kp.equation-asset-manifest.v1" as const,
    kind: "equation-asset-manifest" as const,
    entries: Object.freeze(entries)
  });
}

export function projectKpEquationAssetDisplayCatalogue(
  manifest: KpEquationAssetManifest
): readonly KpAnimationLibraryDisplayEntry[] {
  return Object.freeze(manifest.entries.map((entry) => Object.freeze({
    animationId: entry.assetId,
    title: entry.title,
    summary: entry.pedagogicalIntent.summary,
    tags: entry.pedagogicalIntent.tags,
    availability: entry.catalogue.availability,
    canonicalFormat: entry.catalogue.canonicalFormat,
    featured: entry.catalogue.featured,
    ...(entry.catalogue.primaryRepresentationId === undefined
      ? {}
      : {
          primaryRepresentationId:
            entry.catalogue.primaryRepresentationId
        }),
    representations: entry.catalogue.representations
  })));
}

export function deriveKpAnimationDisplayCatalogueFromEquationManifest(input: {
  readonly source: readonly KpAnimationLibraryDisplayEntry[];
  readonly manifest: KpEquationAssetManifest;
}): readonly KpAnimationLibraryDisplayEntry[] {
  const equationById = new Map(
    projectKpEquationAssetDisplayCatalogue(input.manifest).map((entry) => [
      entry.animationId,
      entry
    ])
  );
  return Object.freeze(input.source.map((entry) =>
    equationById.get(entry.animationId) ?? entry
  ));
}

function manifestEntry(input: {
  readonly inventory: KpEquationSurfaceInventory["entries"][number];
  readonly preservation: KpEquationSurfacePreservationMatrix["entries"][number];
  readonly disposition: KpEquationSurfaceDispositionLedger["entries"][number];
  readonly display: KpAnimationLibraryDisplayEntry;
}): KpEquationAssetManifestEntry {
  return Object.freeze({
    schemaVersion: "kp.equation-asset-manifest-entry.v1" as const,
    assetId: input.inventory.animationId,
    title: input.display.title,
    semanticSource: Object.freeze({
      kind: "catalog-animation-asset" as const,
      sourcePath: input.inventory.semanticOwner.sourcePath,
      primaryDescriptorId:
        input.inventory.semanticOwner.primaryDescriptorId,
      transformationIds: Object.freeze(input.preservation.semanticEndpoints
        .map(({ transformationId }) => transformationId))
    }),
    pedagogicalIntent: Object.freeze({
      summary: input.display.summary,
      tags: Object.freeze([...input.display.tags])
    }),
    capabilities: Object.freeze({
      renderTargetKinds: input.inventory.renderTargetKinds,
      selectedCapabilityId:
        input.inventory.catalogueSurface.selectedCapabilityId,
      familyId: input.preservation.familyId,
      disposition: input.disposition.disposition,
      migrationWave: input.disposition.migrationWave
    }),
    lazyLoader: Object.freeze({
      kind: "catalog-pack" as const,
      packId: input.inventory.lazyCapability.packId,
      loaderSourcePath: input.inventory.lazyCapability.loaderSourcePath,
      packSourcePath: input.inventory.lazyCapability.packSourcePath
    }),
    staticTruth: Object.freeze({
      sourcePath:
        "src/architecture/equation-surface-preservation-matrix.generated.json" as const,
      route: input.preservation.route,
      semanticEndpointFingerprints: Object.freeze([
        ...new Set(input.preservation.semanticEndpoints.flatMap((endpoint) => [
          endpoint.transformationFingerprint,
          ...endpoint.source.map(({ semanticFingerprint }) =>
            semanticFingerprint),
          ...endpoint.target.map(({ semanticFingerprint }) =>
            semanticFingerprint)
        ]))
      ]),
      nativeSettlement: input.preservation.nativeSettlement
    }),
    accessibilityTruth: input.preservation.accessibility,
    catalogue: Object.freeze({
      availability: input.display.availability,
      canonicalFormat: input.display.canonicalFormat,
      featured: input.display.featured,
      ...(input.display.primaryRepresentationId === undefined
        ? {}
        : {
            primaryRepresentationId:
              input.display.primaryRepresentationId
          }),
      representations: input.display.representations
    })
  });
}

function uniqueById<T>(
  values: readonly T[],
  identify: (value: T) => string,
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const value of values) {
    const id = identify(value);
    if (byId.has(id)) diagnostics.push(`Duplicate ${label} asset ${id}.`);
    else byId.set(id, value);
  }
  return byId;
}
