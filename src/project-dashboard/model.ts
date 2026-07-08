export type ProjectDashboardCategory =
  | "todo"
  | "animation"
  | "visual"
  | "semantic-object"
  | "ts-api"
  | "layout"
  | "style"
  | "report-card";

export type ProjectDashboardStatus =
  | "planned"
  | "active"
  | "blocked"
  | "done";

export type ProjectDashboardPriority = "critical" | "high" | "medium" | "low";

export type ProjectGalleryKind =
  | "animation"
  | "visual"
  | "semantic-object"
  | "protocol-api";

export interface ProjectCard {
  readonly id: string;
  readonly title: string;
  readonly category: ProjectDashboardCategory;
  readonly status: ProjectDashboardStatus;
  readonly priority: ProjectDashboardPriority;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly blockers?: readonly string[];
  readonly children?: readonly ProjectCard[];
  readonly relatedIds?: readonly string[];
}

export interface ProjectGalleryItem {
  readonly id: string;
  readonly title: string;
  readonly kind: ProjectGalleryKind;
  readonly status: ProjectDashboardStatus;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly domains: readonly string[];
  readonly interfaces?: readonly string[];
  readonly relatedIds?: readonly string[];
}

export interface ProjectReportTheme {
  readonly id: string;
  readonly title: string;
  readonly status: ProjectDashboardStatus;
  readonly scope: string;
  readonly questions: readonly string[];
  readonly tags: readonly string[];
  readonly relatedIds?: readonly string[];
}

export interface ProjectDashboardData {
  readonly cards: readonly ProjectCard[];
  readonly gallery: readonly ProjectGalleryItem[];
  readonly reportThemes: readonly ProjectReportTheme[];
}

export function collectProjectDashboardIds(
  data: ProjectDashboardData
): readonly string[] {
  return [
    ...collectCardIds(data.cards),
    ...data.gallery.map((item) => item.id),
    ...data.reportThemes.map((theme) => theme.id)
  ];
}

export function validateProjectDashboardData(
  data: ProjectDashboardData
): readonly string[] {
  const ids = collectProjectDashboardIds(data);
  const knownIds = new Set(ids);
  const issues: string[] = [];

  for (const id of ids) {
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) {
      issues.push(`Duplicate project dashboard id: ${id}`);
    }
  }

  for (const card of flattenCards(data.cards)) {
    validateRelatedIds(card.id, card.relatedIds, knownIds, issues);
  }

  for (const item of data.gallery) {
    validateRelatedIds(item.id, item.relatedIds, knownIds, issues);
  }

  for (const theme of data.reportThemes) {
    validateRelatedIds(theme.id, theme.relatedIds, knownIds, issues);
  }

  return issues;
}

function collectCardIds(cards: readonly ProjectCard[]): readonly string[] {
  return cards.flatMap((card) => [
    card.id,
    ...collectCardIds(card.children ?? [])
  ]);
}

function flattenCards(cards: readonly ProjectCard[]): readonly ProjectCard[] {
  return cards.flatMap((card) => [card, ...flattenCards(card.children ?? [])]);
}

function validateRelatedIds(
  sourceId: string,
  relatedIds: readonly string[] | undefined,
  knownIds: ReadonlySet<string>,
  issues: string[]
): void {
  for (const relatedId of relatedIds ?? []) {
    if (!knownIds.has(relatedId)) {
      issues.push(`${sourceId} references missing related id: ${relatedId}`);
    }
  }
}
