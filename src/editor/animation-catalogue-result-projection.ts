import type {
  KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import {
  writeKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";
import {
  searchKpAnimationCatalogueEntries
} from "./animation-catalogue-search.ts";

export interface KpAnimationCatalogueResultRow {
  readonly entry: KpAnimationCatalogueEntry;
  readonly selected: boolean;
  readonly href: string;
  readonly domainLabel: string;
  readonly healthStatus: KpAnimationCatalogueHealth["status"];
  readonly healthLabel: string;
  readonly healthEvidence: "selected-host" | "pending";
}

export function projectKpAnimationCatalogueResultRows(input: {
  readonly entries: readonly KpAnimationCatalogueEntry[];
  readonly selectedAnimationId: string;
  readonly selectedHealth: KpAnimationCatalogueHealth;
  readonly query?: string | undefined;
}): readonly KpAnimationCatalogueResultRow[] {
  if (input.selectedHealth.animationId !== input.selectedAnimationId) {
    throw new Error(
      `Catalogue result health ${input.selectedHealth.animationId} does not ` +
      `match selection ${input.selectedAnimationId}.`
    );
  }
  return Object.freeze(searchKpAnimationCatalogueEntries({
    entries: input.entries,
    query: input.query ?? "",
    selectedAnimationId: input.selectedAnimationId
  }).map((entry) => {
    const selected = entry.animationId === input.selectedAnimationId;
    const healthStatus = selected ? input.selectedHealth.status : "review";
    return Object.freeze({
      entry,
      selected,
      href: `/${writeKpAnimationCatalogueRoute("", {
        artifactId: entry.animationId
      })}`,
      domainLabel: formatKpAnimationCatalogueDomainLabel(entry),
      healthStatus,
      healthLabel: formatKpAnimationCatalogueHealthLabel(healthStatus),
      healthEvidence: selected ? "selected-host" as const : "pending" as const
    });
  }));
}

export function formatKpAnimationCatalogueDomainLabel(
  entry: KpAnimationCatalogueEntry
): string {
  return titleCase(entry.domains[0] ?? entry.packId);
}

export function formatKpAnimationCatalogueHealthLabel(
  status: KpAnimationCatalogueHealth["status"]
): string {
  return `${status[0]?.toUpperCase()}${status.slice(1)}`;
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.length === 0
      ? part
      : `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
