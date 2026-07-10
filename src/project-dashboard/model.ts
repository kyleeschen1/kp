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
  | "semantic-transform"
  | "notation-transform"
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
  readonly grade?: string;
  readonly lastReviewedOn?: string;
  readonly scope: string;
  readonly questions: readonly string[];
  readonly evidence: readonly ProjectReportEvidence[];
  readonly risks: readonly string[];
  readonly recommendedNextActions: readonly string[];
  readonly tags: readonly string[];
  readonly relatedIds?: readonly string[];
}

export interface ProjectReportEvidence {
  readonly label: string;
  readonly href: string;
}

export interface ProjectDashboardData {
  readonly cards: readonly ProjectCard[];
  readonly gallery: readonly ProjectGalleryItem[];
  readonly reportThemes: readonly ProjectReportTheme[];
}

export interface ProjectCardStatusGroup {
  readonly status: ProjectDashboardStatus;
  readonly cards: readonly ProjectCard[];
}

export interface ProjectGalleryKindGroup {
  readonly kind: ProjectGalleryKind;
  readonly items: readonly ProjectGalleryItem[];
}

export const PROJECT_DASHBOARD_STATUS_ORDER: readonly ProjectDashboardStatus[] = [
  "active",
  "planned",
  "blocked",
  "done"
];

export const PROJECT_DASHBOARD_PRIORITY_ORDER: readonly ProjectDashboardPriority[] = [
  "critical",
  "high",
  "medium",
  "low"
];

export const PROJECT_GALLERY_KIND_ORDER: readonly ProjectGalleryKind[] = [
  "animation",
  "semantic-transform",
  "notation-transform",
  "visual",
  "semantic-object",
  "protocol-api"
];

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

export function groupProjectCardsByStatus(
  cards: readonly ProjectCard[]
): readonly ProjectCardStatusGroup[] {
  return PROJECT_DASHBOARD_STATUS_ORDER.map((status) => ({
    status,
    cards: [...cards.filter((card) => card.status === status)].sort(
      compareProjectCards
    )
  }));
}

export function groupProjectGalleryItemsByKind(
  items: readonly ProjectGalleryItem[]
): readonly ProjectGalleryKindGroup[] {
  return PROJECT_GALLERY_KIND_ORDER.map((kind) => ({
    kind,
    items: [...items.filter((item) => item.kind === kind)].sort(
      compareProjectGalleryItems
    )
  }));
}

export function filterProjectDashboardData(
  data: ProjectDashboardData,
  query: string
): ProjectDashboardData {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return data;
  }

  return {
    cards: filterCards(data.cards, normalizedQuery),
    gallery: data.gallery.filter((item) => galleryItemMatches(item, normalizedQuery)),
    reportThemes: data.reportThemes.filter((theme) =>
      reportThemeMatches(theme, normalizedQuery)
    )
  };
}

export function projectDashboardTextFieldsMatch(
  fields: readonly string[],
  query: string
): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return textFieldsMatch(fields, normalizedQuery);
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

function compareProjectCards(left: ProjectCard, right: ProjectCard): number {
  const priorityDelta =
    PROJECT_DASHBOARD_PRIORITY_ORDER.indexOf(left.priority) -
    PROJECT_DASHBOARD_PRIORITY_ORDER.indexOf(right.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return left.title.localeCompare(right.title);
}

function compareProjectGalleryItems(
  left: ProjectGalleryItem,
  right: ProjectGalleryItem
): number {
  return left.title.localeCompare(right.title);
}

function filterCards(
  cards: readonly ProjectCard[],
  normalizedQuery: string
): readonly ProjectCard[] {
  return cards.flatMap((card) => {
    const matchingChildren = filterCards(card.children ?? [], normalizedQuery);

    if (cardMatches(card, normalizedQuery)) {
      return [
        matchingChildren.length > 0
          ? { ...card, children: matchingChildren }
          : card
      ];
    }

    if (matchingChildren.length > 0) {
      return [{ ...card, children: matchingChildren }];
    }

    return [];
  });
}

function cardMatches(card: ProjectCard, normalizedQuery: string): boolean {
  return textFieldsMatch(
    [
      card.id,
      card.title,
      card.category,
      card.status,
      card.priority,
      card.summary,
      ...card.tags,
      ...(card.blockers ?? [])
    ],
    normalizedQuery
  );
}

function galleryItemMatches(
  item: ProjectGalleryItem,
  normalizedQuery: string
): boolean {
  return textFieldsMatch(
    [
      item.id,
      item.title,
      item.kind,
      item.status,
      item.summary,
      ...item.tags,
      ...item.domains,
      ...(item.interfaces ?? [])
    ],
    normalizedQuery
  );
}

function reportThemeMatches(
  theme: ProjectReportTheme,
  normalizedQuery: string
): boolean {
  return textFieldsMatch(
    [
      theme.id,
      theme.title,
      theme.status,
      theme.grade ?? "",
      theme.lastReviewedOn ?? "",
      theme.scope,
      ...theme.questions,
      ...theme.evidence.flatMap((entry) => [entry.label, entry.href]),
      ...theme.risks,
      ...theme.recommendedNextActions,
      ...theme.tags
    ],
    normalizedQuery
  );
}

function textFieldsMatch(
  fields: readonly string[],
  normalizedQuery: string
): boolean {
  const normalizedFields = fields.map(normalizeSearchText);

  if (normalizedFields.some((field) => field.includes(normalizedQuery))) {
    return true;
  }

  const terms = normalizedQuery.split(" ").filter((term) => term.length > 0);

  return terms.every((term) =>
    normalizedFields.some((field) => fuzzyTermMatches(field, term))
  );
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function fuzzyTermMatches(field: string, term: string): boolean {
  if (term.length < 3) {
    return field.includes(term);
  }

  let fieldIndex = 0;
  let firstMatch = -1;
  let lastMatch = -1;

  for (const character of term) {
    const nextIndex = field.indexOf(character, fieldIndex);

    if (nextIndex === -1) {
      return false;
    }

    if (firstMatch === -1) {
      firstMatch = nextIndex;
    }

    lastMatch = nextIndex;
    fieldIndex = nextIndex + 1;
  }

  const span = lastMatch - firstMatch + 1;
  const maxSpan = term.length + Math.max(2, Math.floor(term.length / 2));
  const wordLength = containingWordLength(field, firstMatch, lastMatch);

  return span <= maxSpan && wordLength <= term.length + 4;
}

function containingWordLength(
  field: string,
  firstMatch: number,
  lastMatch: number
): number {
  let start = firstMatch;
  let end = lastMatch;

  while (start > 0 && isSearchWordCharacter(field[start - 1] ?? "")) {
    start -= 1;
  }

  while (end + 1 < field.length && isSearchWordCharacter(field[end + 1] ?? "")) {
    end += 1;
  }

  return end - start + 1;
}

function isSearchWordCharacter(character: string): boolean {
  return /[a-z0-9]/.test(character);
}
