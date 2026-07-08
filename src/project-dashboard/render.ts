import type {
  ProjectCard,
  ProjectDashboardData,
  ProjectGalleryItem,
  ProjectReportTheme
} from "./model.ts";
import {
  groupProjectCardsByStatus,
  validateProjectDashboardData
} from "./model.ts";

export function renderProjectDashboard(data: ProjectDashboardData): string {
  const issues = validateProjectDashboardData(data);
  const titles = createTitleLookup(data);

  return `
    <section class="project-dashboard" data-kp-project-dashboard aria-label="Project dashboard prototype">
      <header class="project-dashboard__header">
        <div>
          <p class="eyebrow">Prototype</p>
          <h1>Project Dashboard</h1>
        </div>
        <button class="project-dashboard__back" type="button" data-action="show-editor">Back to Editor</button>
      </header>
      ${renderDataStatus(issues)}
      <div class="project-dashboard__grid">
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-work-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-work-title">Work</h2>
            <span>${data.cards.length} cards</span>
          </div>
          ${renderWorkLanes(data.cards, titles)}
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-gallery-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-gallery-title">Object Gallery</h2>
            <span>${data.gallery.length} items</span>
          </div>
          <div class="project-dashboard__cards">
            ${data.gallery.map((item) => renderGalleryItem(item, titles)).join("")}
          </div>
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-reports-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-reports-title">Report Cards</h2>
            <span>${data.reportThemes.length} themes</span>
          </div>
          <div class="project-dashboard__cards">
            ${data.reportThemes.map((theme) => renderReportTheme(theme, titles)).join("")}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderWorkLanes(
  cards: readonly ProjectCard[],
  titles: ReadonlyMap<string, string>
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
                          renderProjectCard(card, titles, { child: false })
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
      ${renderRelatedLinks(card.relatedIds ?? [], titles)}
      ${renderChildCards(card.children ?? [], titles)}
    </article>
  `;
}

function renderGalleryItem(
  item: ProjectGalleryItem,
  titles: ReadonlyMap<string, string>
): string {
  return `
    <article class="project-card" id="${escapeHtml(item.id)}" data-kp-project-gallery-item="${escapeHtml(item.id)}">
      ${renderMeta(item.status, item.kind)}
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${renderTags([...item.domains, ...item.tags])}
      ${renderRelatedLinks(item.relatedIds ?? [], titles)}
    </article>
  `;
}

function renderReportTheme(
  theme: ProjectReportTheme,
  titles: ReadonlyMap<string, string>
): string {
  return `
    <article class="project-card" id="${escapeHtml(theme.id)}" data-kp-project-report-theme="${escapeHtml(theme.id)}">
      ${renderMeta(theme.status, "report")}
      <h3>${escapeHtml(theme.title)}</h3>
      <p>${escapeHtml(theme.scope)}</p>
      ${renderTags(theme.tags)}
      ${renderRelatedLinks(theme.relatedIds ?? [], titles)}
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
  titles: ReadonlyMap<string, string>
): string {
  if (relatedIds.length === 0) {
    return "";
  }

  return `
    <div class="project-card__related">
      <strong>Related</strong>
      ${relatedIds
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
  titles: ReadonlyMap<string, string>
): string {
  if (children.length === 0) {
    return "";
  }

  return `
    <div class="project-card__children">
      ${children
        .map((child) => renderProjectCard(child, titles, { child: true }))
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
