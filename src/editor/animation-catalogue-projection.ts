import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import {
  isKpVerifiedVectorDotProjectionReleaseApproval,
  kpVerifiedVectorDotProjectionReleaseApproval
} from "../architecture/vector-dot-projection-release-approval.ts";
import type {
  KpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import type {
  KpSymbolicManipulationDomain
} from "../animation/symbolic-manipulation-family.ts";
import {
  createKpAnimationCatalogueLoadableRegistry,
  type KpAnimationCatalogueLoadableRegistryEntry
} from "./animation-catalogue-loadable-registry.ts";
import {
  createKpAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry,
  type KpAnimationLibraryDisplayRepresentationKind
} from "./animation-library-display-catalog.ts";
import { createKpEditorAnimationLibrary } from "./animation-library.ts";
import type {
  KpEditorAnimationControlKind,
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export interface KpAnimationCatalogueRelatedContext {
  readonly id: string;
  readonly label: string;
  readonly kind: KpAnimationLibraryDisplayRepresentationKind;
  readonly href: string;
  readonly role: "canonical-host" | "projection" | "diagnostic";
}

export type KpAnimationCatalogueHumanDisposition =
  | "unreviewed"
  | "keep"
  | "repair"
  | "canonical-port"
  | "merge"
  | "retire";

export interface KpAnimationCatalogueEntry {
  readonly schemaVersion: "kp.animation-catalogue-entry.v1";
  readonly kind: "animation-catalogue-entry";
  readonly animationId: string;
  readonly primaryDescriptorId: string;
  readonly packId: KpAnimationCatalogPackId;
  readonly title: string;
  readonly summary: string;
  readonly humanDisposition: KpAnimationCatalogueHumanDisposition;
  readonly domains: readonly KpSymbolicManipulationDomain[];
  readonly familyIds: readonly string[];
  readonly sampleIds: readonly string[];
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly controlKinds: readonly KpEditorAnimationControlKind[];
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly tags: readonly string[];
  readonly searchTerms: readonly string[];
  readonly relatedContexts: readonly KpAnimationCatalogueRelatedContext[];
}

export interface KpAnimationCatalogueProjection {
  readonly schemaVersion: "kp.animation-catalogue-projection.v1";
  readonly kind: "animation-catalogue-projection";
  readonly entries: readonly KpAnimationCatalogueEntry[];
}

export function createKpAnimationCatalogueProjection(input: {
  readonly loadable?:
    readonly KpAnimationCatalogueLoadableRegistryEntry[] | undefined;
  readonly descriptors?: readonly KpEditorAnimationDescriptor[] | undefined;
  readonly display?: readonly KpAnimationLibraryDisplayEntry[] | undefined;
} = {}): KpAnimationCatalogueProjection {
  const descriptors = input.descriptors ?? createKpEditorAnimationLibrary();
  const loadable = input.loadable ??
    createKpAnimationCatalogueLoadableRegistry(descriptors);
  const display = input.display ?? createKpAnimationLibraryDisplayCatalog();
  const descriptorsById = uniqueById(descriptors, "descriptor");
  const descriptorsByAnimationId = groupByAnimationId(descriptors);
  const displayByAnimationId = uniqueByAnimationId(display, "display entry");
  const seenAnimationIds = new Set<string>();

  const entries = loadable.map((loadableEntry) => {
    if (seenAnimationIds.has(loadableEntry.animationId)) {
      throw new Error(
        `Duplicate loadable catalogue animation id: ${loadableEntry.animationId}`
      );
    }
    seenAnimationIds.add(loadableEntry.animationId);
    const primary = descriptorsById.get(loadableEntry.primaryDescriptorId);
    if (
      primary === undefined ||
      primary.animationId !== loadableEntry.animationId
    ) {
      throw new Error(
        `Loadable animation ${loadableEntry.animationId} requires primary ` +
        `descriptor ${loadableEntry.primaryDescriptorId}.`
      );
    }
    const relatedDescriptors = descriptorsByAnimationId.get(
      loadableEntry.animationId
    ) ?? [];
    const relatedContexts = projectRelatedContexts(
      displayByAnimationId.get(loadableEntry.animationId)
    );
    const humanDisposition =
      loadableEntry.animationId ===
        kpVerifiedVectorDotProjectionReleaseApproval.animationId &&
      isKpVerifiedVectorDotProjectionReleaseApproval(
        kpVerifiedVectorDotProjectionReleaseApproval
      )
        ? kpVerifiedVectorDotProjectionReleaseApproval.catalogueDisposition
        : "unreviewed" as const;

    return Object.freeze({
      schemaVersion: "kp.animation-catalogue-entry.v1" as const,
      kind: "animation-catalogue-entry" as const,
      animationId: loadableEntry.animationId,
      primaryDescriptorId: loadableEntry.primaryDescriptorId,
      packId: loadableEntry.packId,
      title: primary.title,
      summary: primary.summary,
      // Catalogue health cannot imply a disposition. The one reviewed vector
      // result comes from nominal approval evidence; every other row remains
      // an explicit human unknown.
      humanDisposition,
      domains: freezeUnique(
        relatedDescriptors.flatMap(({ domain }) =>
          domain === undefined ? [] : [domain]
        )
      ),
      familyIds: freezeUnique(
        relatedDescriptors.flatMap(({ familyId }) =>
          familyId === undefined ? [] : [familyId]
        )
      ),
      sampleIds: freezeUnique(
        relatedDescriptors.flatMap(({ sampleId }) =>
          sampleId === undefined ? [] : [sampleId]
        )
      ),
      renderTargetKinds: freezeUnique(primary.renderTargetKinds),
      controlKinds: freezeUnique(primary.controlKinds),
      ...(primary.durationMs === undefined
        ? {}
        : { durationMs: primary.durationMs }),
      ...(primary.beatCount === undefined
        ? {}
        : { beatCount: primary.beatCount }),
      tags: freezeUnique(
        relatedDescriptors.flatMap(({ tags }) => tags)
      ),
      searchTerms: freezeUnique([
        loadableEntry.animationId,
        primary.title,
        primary.summary,
        humanDisposition,
        ...relatedDescriptors.flatMap(({ tags }) => tags),
        ...relatedDescriptors.map(({ title }) => title),
        ...relatedDescriptors.flatMap(({ familyId, sampleId }) => [
          ...(familyId === undefined ? [] : [familyId]),
          ...(sampleId === undefined ? [] : [sampleId])
        ]),
        ...relatedContexts.flatMap(({ id, label, kind }) => [id, label, kind])
      ]),
      relatedContexts
    });
  });

  return Object.freeze({
    schemaVersion: "kp.animation-catalogue-projection.v1" as const,
    kind: "animation-catalogue-projection" as const,
    entries: Object.freeze(
      entries.sort((left, right) =>
        left.animationId.localeCompare(right.animationId)
      )
    )
  });
}

function projectRelatedContexts(
  entry: KpAnimationLibraryDisplayEntry | undefined
): readonly KpAnimationCatalogueRelatedContext[] {
  if (entry === undefined) return Object.freeze([]);
  const contexts = uniqueById(entry.representations, "related context");
  return Object.freeze(
    [...contexts.values()]
      .sort((left, right) =>
        left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label)
      )
      .map((context) => Object.freeze({
        id: context.id,
        label: context.label,
        kind: context.kind,
        href: explicitLegacyViewHref(context.href),
        role: context.role
      }))
  );
}

function explicitLegacyViewHref(href: string): string {
  if (!href.startsWith("/?animation=") || href.includes("view=")) return href;
  // The empty-query route is now the catalogue, so old editor projections
  // must name their preserved host instead of relying on the former default.
  return `${href}&view=editor`;
}

function uniqueById<T extends { readonly id: string }>(
  entries: readonly T[],
  label: string
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      throw new Error(`Duplicate animation catalogue ${label} id: ${entry.id}`);
    }
    byId.set(entry.id, entry);
  }
  return byId;
}

function uniqueByAnimationId<
  T extends { readonly animationId: string }
>(entries: readonly T[], label: string): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const entry of entries) {
    if (byId.has(entry.animationId)) {
      throw new Error(
        `Duplicate animation catalogue ${label} animation id: ` +
        entry.animationId
      );
    }
    byId.set(entry.animationId, entry);
  }
  return byId;
}

function groupByAnimationId(
  descriptors: readonly KpEditorAnimationDescriptor[]
): ReadonlyMap<string, readonly KpEditorAnimationDescriptor[]> {
  const groups = new Map<string, KpEditorAnimationDescriptor[]>();
  for (const descriptor of descriptors) {
    const group = groups.get(descriptor.animationId) ?? [];
    group.push(descriptor);
    groups.set(descriptor.animationId, group);
  }
  return groups;
}

function freezeUnique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}
