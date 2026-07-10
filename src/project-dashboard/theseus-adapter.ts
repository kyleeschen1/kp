import { apiCatalogGroups } from "../editor/api-catalog.ts";
import { projectDashboardData } from "./data.ts";
import type { ProjectDashboardData, ProjectGalleryItem } from "./model.ts";

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
        tags: ["kp", "api", group.id, ...item.tags],
        preview: {
          fields: [
            { label: "API group", value: group.title },
            { label: "API id", value: item.id },
            { label: "API kind", value: item.kind },
            { label: "API status", value: item.status }
          ]
        },
        searchText: [item.id, group.title, group.summary, item.kind].join(" ")
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
        }
      ]
    },
    searchText: [
      item.id,
      item.kind,
      ...item.domains,
      ...item.tags,
      ...(item.interfaces ?? [])
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
