import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueProjection,
  type KpAnimationCatalogueEntry,
  type KpAnimationCatalogueProjection
} from "../editor/animation-catalogue-projection.ts";
import {
  createKpAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry,
  type KpAnimationLibraryDisplayRepresentation
} from "../editor/animation-library-display-catalog.ts";

export const kpHistoricalEquationSurfaceBaseline = Object.freeze({
  sourceRef:
    "docs/project/reviews/2026-08-01-animation-catalogue-seam-atlas.md",
  count: 24,
  capturedOn: "2026-08-01"
} as const);

// These are historical deltas, not a second asset registry. Keeping the four
// additions explicit makes the formerly reported 24-surface snapshot
// auditable while the current inventory remains derived from the catalogue.
export const kpPostBaselineEquationSurfaceIds = Object.freeze([
  "animation.generated.linear-solve.linear-68c15d41",
  "animation.generated.cancellation.additive-inverses",
  "animation.algebra.log-exponent.solve-two-power-x",
  "animation.algebra.log-quotient.difference-to-quotient"
] as const);

export interface KpEquationSurfaceInventory {
  readonly schemaVersion: "kp.equation-surface-inventory.v1";
  readonly kind: "equation-surface-inventory";
  readonly baseline: KpEquationSurfaceInventoryBaseline;
  readonly entries: readonly KpEquationSurfaceInventoryEntry[];
}

export interface KpEquationSurfaceInventoryBaseline {
  readonly sourceRef: string;
  readonly capturedOn: string;
  readonly historicalCount: number;
  readonly postBaselineAnimationIds: readonly string[];
  readonly currentCount: number;
  readonly reconciled: true;
}

export interface KpEquationSurfaceInventoryEntry {
  readonly schemaVersion: "kp.equation-surface-inventory-entry.v1";
  readonly animationId: string;
  readonly title: string;
  readonly semanticOwner: {
    readonly kind: "catalog-animation-asset";
    readonly assetId: string;
    readonly primaryDescriptorId: string;
    readonly sourcePath: "src/animation/catalog.ts";
  };
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly catalogueSurface: {
    readonly kind: "equation" | "composite";
    readonly slotKind: "equation";
    readonly selectedCapabilityId:
      | "equation-katex"
      | "log-exponent"
      | "log-quotient"
      | "operation-evaluation";
    readonly rendererAdapterId: string;
    readonly rendererSourcePath: string;
  };
  readonly clockAuthority: {
    readonly ownerId: "editor-animation-player";
    readonly sourcePath: "src/editor/animation-player-controller.ts";
    readonly durationMs?: number | undefined;
    readonly beatCount?: number | undefined;
  };
  readonly lazyCapability: {
    readonly packId: KpAnimationCatalogPackId;
    readonly loaderSourcePath: "src/animation/catalog-loader.ts";
    readonly packSourcePath: string;
  };
  readonly currentPresentationAuthority: {
    readonly canonicalFormat: KpAnimationLibraryDisplayEntry["canonicalFormat"];
    readonly representationId: string;
    readonly representationKind:
      KpAnimationLibraryDisplayRepresentation["kind"];
    readonly href: string;
    readonly sourcePath:
      "src/editor/animation-library-display-catalog-builder.ts";
  };
}

export type KpEquationSurfaceInventoryDiagnosticCode =
  | "duplicate-catalogue-animation-id"
  | "duplicate-display-animation-id"
  | "historical-baseline-mismatch"
  | "missing-display-entry"
  | "missing-primary-representation";

export interface KpEquationSurfaceInventoryDiagnostic {
  readonly code: KpEquationSurfaceInventoryDiagnosticCode;
  readonly animationId?: string | undefined;
  readonly message: string;
}

export class KpEquationSurfaceInventoryError extends Error {
  override readonly name = "KpEquationSurfaceInventoryError";
  readonly diagnostics: readonly KpEquationSurfaceInventoryDiagnostic[];

  constructor(
    diagnostics: readonly KpEquationSurfaceInventoryDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = diagnostics;
  }
}

export function createKpEquationSurfaceInventory():
KpEquationSurfaceInventory {
  return compileKpEquationSurfaceInventory({
    catalogue: createKpAnimationCatalogueProjection(),
    display: createKpAnimationLibraryDisplayCatalog()
  });
}

export function compileKpEquationSurfaceInventory(input: {
  readonly catalogue: KpAnimationCatalogueProjection;
  readonly display: readonly KpAnimationLibraryDisplayEntry[];
}): KpEquationSurfaceInventory {
  const diagnostics: KpEquationSurfaceInventoryDiagnostic[] = [];
  const catalogueById = uniqueByAnimationId(
    input.catalogue.entries,
    "duplicate-catalogue-animation-id",
    diagnostics
  );
  const displayById = uniqueByAnimationId(
    input.display,
    "duplicate-display-animation-id",
    diagnostics
  );
  const equationEntries = [...catalogueById.values()]
    .filter(({ renderTargetKinds }) => renderTargetKinds.includes("equation"))
    .sort((left, right) => left.animationId.localeCompare(right.animationId));

  const entries = equationEntries.flatMap((catalogueEntry) => {
    const displayEntry = displayById.get(catalogueEntry.animationId);
    if (displayEntry === undefined) {
      diagnostics.push({
        code: "missing-display-entry",
        animationId: catalogueEntry.animationId,
        message:
          `Equation animation ${catalogueEntry.animationId} has no display entry.`
      });
      return [];
    }
    const primary = primaryRepresentation(displayEntry, catalogueEntry);
    if (primary === undefined) {
      diagnostics.push({
        code: "missing-primary-representation",
        animationId: catalogueEntry.animationId,
        message:
          `Equation animation ${catalogueEntry.animationId} has no resolvable ` +
          "primary presentation representation."
      });
      return [];
    }
    return [projectInventoryEntry(catalogueEntry, displayEntry, primary)];
  });

  const expectedCount =
    kpHistoricalEquationSurfaceBaseline.count +
    kpPostBaselineEquationSurfaceIds.length;
  const currentIds = new Set(entries.map(({ animationId }) => animationId));
  const missingPostBaselineIds = kpPostBaselineEquationSurfaceIds.filter(
    (animationId) => !currentIds.has(animationId)
  );
  if (entries.length !== expectedCount || missingPostBaselineIds.length > 0) {
    diagnostics.push({
      code: "historical-baseline-mismatch",
      message:
        `The ${kpHistoricalEquationSurfaceBaseline.count}-surface baseline plus ` +
        `${kpPostBaselineEquationSurfaceIds.length} audited additions requires ` +
        `${expectedCount} current equation surfaces; found ${entries.length}` +
        (missingPostBaselineIds.length === 0
          ? "."
          : ` and missed ${missingPostBaselineIds.join(", ")}.`)
    });
  }

  if (diagnostics.length > 0) {
    throw new KpEquationSurfaceInventoryError(Object.freeze(diagnostics));
  }

  return Object.freeze({
    schemaVersion: "kp.equation-surface-inventory.v1" as const,
    kind: "equation-surface-inventory" as const,
    baseline: Object.freeze({
      sourceRef: kpHistoricalEquationSurfaceBaseline.sourceRef,
      capturedOn: kpHistoricalEquationSurfaceBaseline.capturedOn,
      historicalCount: kpHistoricalEquationSurfaceBaseline.count,
      postBaselineAnimationIds: kpPostBaselineEquationSurfaceIds,
      currentCount: entries.length,
      reconciled: true as const
    }),
    entries: Object.freeze(entries)
  });
}

function projectInventoryEntry(
  catalogue: KpAnimationCatalogueEntry,
  display: KpAnimationLibraryDisplayEntry,
  primary: KpAnimationLibraryDisplayRepresentation
): KpEquationSurfaceInventoryEntry {
  const context = catalogue.relatedContexts.find(({ id }) => id === primary.id);
  const href = context?.href ?? primary.href;
  const surfaceAuthority = equationSurfaceAuthority(catalogue.animationId);
  return Object.freeze({
    schemaVersion: "kp.equation-surface-inventory-entry.v1" as const,
    animationId: catalogue.animationId,
    title: catalogue.title,
    semanticOwner: Object.freeze({
      kind: "catalog-animation-asset" as const,
      assetId: catalogue.animationId,
      primaryDescriptorId: catalogue.primaryDescriptorId,
      sourcePath: "src/animation/catalog.ts" as const
    }),
    renderTargetKinds: catalogue.renderTargetKinds,
    catalogueSurface: Object.freeze({
      kind: catalogue.renderTargetKinds.length === 1
        ? "equation" as const
        : "composite" as const,
      slotKind: "equation" as const,
      ...surfaceAuthority
    }),
    clockAuthority: Object.freeze({
      ownerId: "editor-animation-player" as const,
      sourcePath: "src/editor/animation-player-controller.ts" as const,
      ...(catalogue.durationMs === undefined
        ? {}
        : { durationMs: catalogue.durationMs }),
      ...(catalogue.beatCount === undefined
        ? {}
        : { beatCount: catalogue.beatCount })
    }),
    lazyCapability: Object.freeze({
      packId: catalogue.packId,
      loaderSourcePath: "src/animation/catalog-loader.ts" as const,
      packSourcePath: `src/animation/catalog-packs/${catalogue.packId}.ts`
    }),
    currentPresentationAuthority: Object.freeze({
      canonicalFormat: display.canonicalFormat,
      representationId: primary.id,
      representationKind: primary.kind,
      href,
      sourcePath:
        "src/editor/animation-library-display-catalog-builder.ts" as const
    })
  });
}

function equationSurfaceAuthority(animationId: string):
Pick<
  KpEquationSurfaceInventoryEntry["catalogueSurface"],
  "selectedCapabilityId" | "rendererAdapterId" | "rendererSourcePath"
> {
  if (animationId.startsWith("animation.operation-evaluation.")) {
    return Object.freeze({
      selectedCapabilityId: "operation-evaluation" as const,
      rendererAdapterId:
        "editor-animation-surface.operation-evaluation.canonical-native-katex",
      rendererSourcePath:
        "src/editor/operation-evaluation-surface-adapter.ts"
    });
  }
  if (animationId === "animation.algebra.log-exponent.solve-two-power-x") {
    return Object.freeze({
      selectedCapabilityId: "log-exponent" as const,
      rendererAdapterId:
        "editor-animation-surface.log-exponent.canonical-native-katex",
      rendererSourcePath: "src/editor/log-exponent-surface-adapter.ts"
    });
  }
  if (
    animationId ===
      "animation.algebra.log-quotient.difference-to-quotient"
  ) {
    return Object.freeze({
      selectedCapabilityId: "log-quotient" as const,
      rendererAdapterId:
        "editor-animation-surface.log-quotient.canonical-native-katex",
      rendererSourcePath: "src/editor/log-quotient-surface-adapter.ts"
    });
  }
  return Object.freeze({
    selectedCapabilityId: "equation-katex" as const,
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  });
}

function primaryRepresentation(
  display: KpAnimationLibraryDisplayEntry,
  catalogue: KpAnimationCatalogueEntry
): KpAnimationLibraryDisplayRepresentation | undefined {
  const preferredId = display.primaryRepresentationId;
  if (preferredId === undefined) return undefined;
  if (!catalogue.relatedContexts.some(({ id }) => id === preferredId)) {
    return undefined;
  }
  return display.representations.find(({ id }) => id === preferredId);
}

function uniqueByAnimationId<T extends { readonly animationId: string }>(
  values: readonly T[],
  code: Extract<
    KpEquationSurfaceInventoryDiagnosticCode,
    "duplicate-catalogue-animation-id" | "duplicate-display-animation-id"
  >,
  diagnostics: KpEquationSurfaceInventoryDiagnostic[]
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.animationId)) {
      diagnostics.push({
        code,
        animationId: value.animationId,
        message: `Duplicate equation inventory source id ${value.animationId}.`
      });
      continue;
    }
    byId.set(value.animationId, value);
  }
  return byId;
}
