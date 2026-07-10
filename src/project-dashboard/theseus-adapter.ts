import {
  apiCatalogGroups,
  apiCatalogItemDetailFields,
  apiCatalogItemSearchFields,
  apiCatalogItemTags
} from "../editor/api-catalog.ts";
import {
  semanticCapabilityPreviewFields,
  semanticCapabilitySearchFields
} from "./capability-preview.ts";
import { projectDashboardData } from "./data.ts";
import type {
  ProjectDashboardData,
  ProjectDashboardSampleTarget,
  ProjectDashboardSourceRef,
  ProjectGalleryItem
} from "./model.ts";

// Keep this structural until Theseus publishes browser-safe package types.
export interface KpTheseusDashboardPreviewField {
  readonly label: string;
  readonly value: string;
}

export interface KpTheseusDashboardPreview {
  readonly fields: readonly KpTheseusDashboardPreviewField[];
}

export interface KpTheseusDashboardRow {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly status: string;
  readonly summary: string;
  readonly tags?: readonly string[];
  readonly preview?: KpTheseusDashboardPreview;
  readonly searchText?: string;
}

export interface KpTheseusDashboardSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly KpTheseusDashboardRow[];
}

export interface KpTheseusDashboardHealthItem {
  readonly id: string;
  readonly label: string;
  readonly status: "ok" | "info" | "warning" | "error";
  readonly summary?: string;
}

export interface KpTheseusDashboardExtensionContribution {
  readonly sections?: readonly KpTheseusDashboardSection[];
  readonly health?: readonly KpTheseusDashboardHealthItem[];
}

export interface KpTheseusDashboardExtensionMetadata {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface KpTheseusDashboardExtensionPayload {
  readonly extension: KpTheseusDashboardExtensionMetadata;
  readonly contribution: KpTheseusDashboardExtensionContribution;
}

export const KP_THESEUS_DASHBOARD_EXTENSION: KpTheseusDashboardExtensionMetadata = {
  id: "kp",
  title: "Kinetic Press",
  summary:
    "Adds KP animation, object, visual, and API rows to a Theseus dashboard.",
  tags: ["kp", "animation", "semantic-objects", "dashboard"]
};

export function createKpTheseusDashboardExtensionPayload(
  data: ProjectDashboardData = projectDashboardData
): KpTheseusDashboardExtensionPayload {
  return {
    extension: KP_THESEUS_DASHBOARD_EXTENSION,
    contribution: createKpTheseusDashboardExtensionContribution(data)
  };
}

export function createKpTheseusDashboardExtensionContribution(
  data: ProjectDashboardData = projectDashboardData
): KpTheseusDashboardExtensionContribution {
  return {
    sections: [
      createKpGallerySection(data),
      createKpApiSection()
    ],
    health: [createKpDashboardExtensionHealth(data)]
  };
}

function createKpGallerySection(
  data: ProjectDashboardData
): KpTheseusDashboardSection {
  return {
    id: "kp.gallery",
    title: "KP Gallery",
    rows: data.gallery.map(galleryItemRow)
  };
}

function createKpApiSection(): KpTheseusDashboardSection {
  return {
    id: "kp.api",
    title: "KP API",
    rows: apiCatalogGroups.flatMap((group) =>
      group.items.map((item): KpTheseusDashboardRow => ({
        id: `kp.api.${item.id}`,
        title: item.title,
        kind: "api",
        status: item.status,
        summary: item.summary,
        tags: uniqueStrings(["kp", "api", group.id, ...apiCatalogItemTags(group, item)]),
        preview: {
          fields: [
            ...apiCatalogItemDetailFields(group, item),
            ...semanticCapabilityPreviewFields(group, item),
            { label: "Maturity", value: item.status },
            {
              label: "Coverage",
              value: apiCatalogCoverage(item).join(", ")
            },
            {
              label: "Source refs",
              value: sourceRefsText([
                { label: "API catalog", href: "src/editor/api-catalog.ts" }
              ])
            },
            {
              label: "Verification",
              value: "tests/api-catalog.test.ts, tests/project-dashboard.test.ts"
            }
          ]
        },
        searchText: [
          ...apiCatalogItemSearchFields(group, item),
          ...semanticCapabilitySearchFields(group, item),
          ...apiCatalogCoverage(item),
          "src/editor/api-catalog.ts",
          "tests/api-catalog.test.ts",
          "tests/project-dashboard.test.ts"
        ].join(" ")
      }))
    )
  };
}

function galleryItemRow(item: ProjectGalleryItem): KpTheseusDashboardRow {
  return {
    id: `kp.gallery.${item.id}`,
    title: item.title,
    kind: item.kind === "protocol-api" ? "api" : "object",
    status: item.status,
    summary: item.summary,
    tags: [
      "kp",
      item.kind,
      ...item.domains,
      ...item.tags,
      ...(item.interfaces ?? [])
    ],
    preview: {
      fields: [
        { label: "Gallery kind", value: item.kind },
        { label: "Domains", value: item.domains.join(", ") || "None" },
        {
          label: "Interfaces",
          value: (item.interfaces ?? []).join(", ") || "None"
        },
        ...(item.maturity === undefined
          ? []
          : [{ label: "Maturity", value: item.maturity }]),
        ...(item.coverage === undefined
          ? []
          : [{ label: "Coverage", value: item.coverage.join(", ") }]),
        ...(item.sourceRefs === undefined
          ? []
          : [{ label: "Source refs", value: sourceRefsText(item.sourceRefs) }]),
        ...(item.verification === undefined
          ? []
          : [{ label: "Verification", value: item.verification.join(", ") }]),
        ...(item.blockers === undefined || item.blockers.length === 0
          ? []
          : [{ label: "Authoring blockers", value: item.blockers.join(", ") }]),
        ...(item.sampleTargets === undefined || item.sampleTargets.length === 0
          ? []
          : [
              {
                label: "Sample targets",
                value: sampleTargetsText(item.sampleTargets)
              }
            ])
      ]
    },
    searchText: [
      item.id,
      item.kind,
      ...item.domains,
      ...item.tags,
      ...(item.interfaces ?? []),
      item.maturity ?? "",
      ...(item.coverage ?? []),
      ...(item.sourceRefs ?? []).flatMap((sourceRef) => [
        sourceRef.label,
        sourceRef.href
      ]),
      ...(item.verification ?? []),
      ...(item.blockers ?? []),
      ...sampleTargetSearchFields(item.sampleTargets)
    ].join(" ")
  };
}

function createKpDashboardExtensionHealth(
  data: ProjectDashboardData
): KpTheseusDashboardHealthItem {
  const apiRowCount = apiCatalogGroups.reduce(
    (count, group) => count + group.items.length,
    0
  );

  return {
    id: "kp-dashboard-extension",
    label: "KP dashboard extension",
    status: "ok",
    summary: `${data.gallery.length} gallery rows and ${apiRowCount} API rows exported.`
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function apiCatalogCoverage(
  item: (typeof apiCatalogGroups)[number]["items"][number]
): readonly string[] {
  const details = item.details;

  return [
    `${details?.protocols?.length ?? 0} protocols`,
    `${details?.views?.length ?? 0} views`,
    `${details?.computes?.length ?? 0} computations`
  ];
}

function sourceRefsText(
  sourceRefs: readonly ProjectDashboardSourceRef[]
): string {
  return sourceRefs
    .map((sourceRef) => `${sourceRef.label}: ${sourceRef.href}`)
    .join(", ");
}

function sampleTargetsText(
  targets: readonly ProjectDashboardSampleTarget[]
): string {
  return targets.map((target) => target.label).join(", ");
}

function sampleTargetSearchFields(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly string[] {
  return (targets ?? []).flatMap((target) => {
    switch (target.kind) {
      case "equation-animation":
        return [
          target.kind,
          target.label,
          target.animationId,
          target.fixtureId ?? ""
        ];
      case "graph-surface-mode":
        return [target.kind, target.label, target.graphId, target.surfaceMode];
      case "synchronized-equation-graph":
        return [
          target.kind,
          target.label,
          target.animationId,
          target.graphId,
          target.sharedClockId,
          target.fixtureId ?? "",
          target.surfaceMode ?? "",
          "sync equation graph shared clock"
        ];
      case "api-catalog-item":
        return [target.kind, target.label, target.itemId];
    }
  });
}
