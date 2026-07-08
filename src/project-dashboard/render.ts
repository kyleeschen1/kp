import type {
  ProjectCard,
  ProjectDashboardData,
  ProjectGalleryKind,
  ProjectGalleryItem,
  ProjectReportTheme
} from "./model.ts";
import {
  collectProjectDashboardIds,
  filterProjectDashboardData,
  groupProjectCardsByStatus,
  groupProjectGalleryItemsByKind,
  validateProjectDashboardData
} from "./model.ts";

export interface ProjectDashboardRenderOptions {
  readonly query?: string;
}

export function renderProjectDashboard(
  data: ProjectDashboardData,
  options: ProjectDashboardRenderOptions = {}
): string {
  const issues = validateProjectDashboardData(data);
  const query = options.query ?? "";
  const renderedData = filterProjectDashboardData(data, query);
  const titles = createTitleLookup(data);
  const visibleIds = new Set(collectProjectDashboardIds(renderedData));

  return `
    <section class="project-dashboard" data-kp-project-dashboard aria-label="Project dashboard prototype">
      <header class="project-dashboard__header">
        <div>
          <p class="eyebrow">Prototype</p>
          <h1>Project Dashboard</h1>
        </div>
        <button class="project-dashboard__back" type="button" data-action="show-editor">Back to Editor</button>
      </header>
      <div class="project-dashboard__toolbar">
        <label class="project-dashboard__search" for="project-dashboard-search">
          <span>Search</span>
          <input id="project-dashboard-search" type="search" value="${escapeHtml(query)}" data-action="filter-project-dashboard" aria-label="Search project dashboard" />
        </label>
      </div>
      ${renderDataStatus(issues)}
      <div class="project-dashboard__grid">
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-work-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-work-title">Work</h2>
            <span>${renderedData.cards.length} cards</span>
          </div>
          ${renderWorkLanes(renderedData.cards, titles, visibleIds)}
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-gallery-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-gallery-title">Object Gallery</h2>
            <span>${renderedData.gallery.length} items</span>
          </div>
          ${renderGalleryGroups(renderedData.gallery, titles, visibleIds)}
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-reports-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-reports-title">Report Cards</h2>
            <span>${renderedData.reportThemes.length} themes</span>
          </div>
          <div class="project-dashboard__cards">
            ${renderedData.reportThemes
              .map((theme) => renderReportTheme(theme, titles, visibleIds))
              .join("")}
          </div>
        </section>
      </div>
    </section>
  `;
}

export function getProjectDashboardSearchQuery(input: HTMLInputElement): string {
  return input.value;
}

function renderWorkLanes(
  cards: readonly ProjectCard[],
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  return `
    <div class="project-dashboard__work-lanes">
      ${groupProjectCardsByStatus(cards)
        .map(
          (group) => `
            <section class="project-work-lane" data-kp-work-status="${escapeHtml(group.status)}" aria-label="${escapeHtml(group.status)} work">
              <div class="project-work-lane__header">
                <h3>${escapeHtml(formatStatusLabel(group.status))}</h3>
                <span>${group.cards.length}</span>
              </div>
              <div class="project-dashboard__cards">
                ${
                  group.cards.length === 0
                    ? `<p class="project-work-lane__empty">No cards</p>`
                    : group.cards
                        .map((card) =>
                          renderProjectCard(card, titles, visibleIds, { child: false })
                        )
                        .join("")
                }
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
}

function renderGalleryGroups(
  items: readonly ProjectGalleryItem[],
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  return `
    <div class="project-dashboard__gallery-groups">
      ${groupProjectGalleryItemsByKind(items)
        .map(
          (group) => `
            <section class="project-gallery-group" data-kp-gallery-kind="${escapeHtml(group.kind)}" aria-label="${escapeHtml(formatGalleryKindLabel(group.kind))}">
              <div class="project-gallery-group__header">
                <h3>${escapeHtml(formatGalleryKindLabel(group.kind))}</h3>
                <span>${group.items.length}</span>
              </div>
              <div class="project-dashboard__cards">
                ${
                  group.items.length === 0
                    ? `<p class="project-work-lane__empty">No items</p>`
                    : group.items
                        .map((item) => renderGalleryItem(item, titles, visibleIds))
                        .join("")
                }
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDataStatus(issues: readonly string[]): string {
  if (issues.length === 0) {
    return `<p class="project-dashboard__status project-dashboard__status--ok">Dashboard data is valid</p>`;
  }

  return `
    <ul class="project-dashboard__status project-dashboard__status--error">
      ${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}
    </ul>
  `;
}

function renderProjectCard(
  card: ProjectCard,
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>,
  options: { readonly child: boolean }
): string {
  const dataAttribute = options.child
    ? `data-kp-child-card="${escapeHtml(card.id)}"`
    : `data-kp-project-card="${escapeHtml(card.id)}"`;

  return `
    <article class="project-card${options.child ? " project-card--child" : ""}" id="${escapeHtml(card.id)}" ${dataAttribute} data-kp-priority="${escapeHtml(card.priority)}">
      ${renderMeta(card.status, card.priority)}
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.summary)}</p>
      ${renderBlockers(card.blockers ?? [])}
      ${renderTags(card.tags)}
      ${renderRelatedLinks(card.relatedIds ?? [], titles, visibleIds)}
      ${renderChildCards(card.children ?? [], titles, visibleIds)}
    </article>
  `;
}

function renderGalleryItem(
  item: ProjectGalleryItem,
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  return `
    <article class="project-card" id="${escapeHtml(item.id)}" data-kp-project-gallery-item="${escapeHtml(item.id)}">
      ${renderMeta(item.status, item.kind)}
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${renderTags([...item.domains, ...item.tags])}
      ${renderInterfaces(item.interfaces ?? [])}
      ${renderRelatedLinks(item.relatedIds ?? [], titles, visibleIds)}
    </article>
  `;
}

function renderReportTheme(
  theme: ProjectReportTheme,
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  return `
    <article class="project-card" id="${escapeHtml(theme.id)}" data-kp-project-report-theme="${escapeHtml(theme.id)}">
      ${renderMeta(theme.status, "report")}
      <h3>${escapeHtml(theme.title)}</h3>
      <p>${escapeHtml(theme.scope)}</p>
      ${renderTags(theme.tags)}
      ${renderRelatedLinks(theme.relatedIds ?? [], titles, visibleIds)}
    </article>
  `;
}

function renderMeta(status: string, detail: string): string {
  return `
    <div class="project-card__meta">
      <span class="project-card__status">${escapeHtml(status)}</span>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}

function renderTags(tags: readonly string[]): string {
  if (tags.length === 0) {
    return "";
  }

  return `
    <div class="project-card__tags">
      ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderInterfaces(interfaces: readonly string[]): string {
  if (interfaces.length === 0) {
    return "";
  }

  return `
    <div class="project-card__interfaces">
      <strong>Interfaces</strong>
      ${interfaces.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
    </div>
  `;
}

function renderBlockers(blockers: readonly string[]): string {
  if (blockers.length === 0) {
    return "";
  }

  return `
    <div class="project-card__blockers" data-kp-blockers>
      <strong>Blockers</strong>
      <ul>
        ${blockers.map((blocker) => `<li>${escapeHtml(blocker)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderRelatedLinks(
  relatedIds: readonly string[],
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  const visibleRelatedIds = relatedIds.filter((relatedId) =>
    visibleIds.has(relatedId)
  );

  if (visibleRelatedIds.length === 0) {
    return "";
  }

  return `
    <div class="project-card__related">
      <strong>Related</strong>
      ${visibleRelatedIds
        .map((relatedId) => {
          const label = titles.get(relatedId) ?? relatedId;

          return `<a href="#${escapeHtml(relatedId)}">${escapeHtml(label)}</a>`;
        })
        .join("")}
    </div>
  `;
}

function renderChildCards(
  children: readonly ProjectCard[],
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>
): string {
  if (children.length === 0) {
    return "";
  }

  return `
    <div class="project-card__children">
      ${children
        .map((child) =>
          renderProjectCard(child, titles, visibleIds, { child: true })
        )
        .join("")}
    </div>
  `;
}

function createTitleLookup(data: ProjectDashboardData): ReadonlyMap<string, string> {
  const titles = new Map<string, string>();

  for (const card of flattenCards(data.cards)) {
    titles.set(card.id, card.title);
  }

  for (const item of data.gallery) {
    titles.set(item.id, item.title);
  }

  for (const theme of data.reportThemes) {
    titles.set(theme.id, theme.title);
  }

  return titles;
}

function flattenCards(cards: readonly ProjectCard[]): readonly ProjectCard[] {
  return cards.flatMap((card) => [card, ...flattenCards(card.children ?? [])]);
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatGalleryKindLabel(kind: ProjectGalleryKind): string {
  switch (kind) {
    case "animation":
      return "Animation Types";
    case "visual":
      return "Visuals";
    case "semantic-object":
      return "Semantic Objects";
    case "protocol-api":
      return "Protocol/API";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
