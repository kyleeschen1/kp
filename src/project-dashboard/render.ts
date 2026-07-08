import type {
  ProjectCard,
  ProjectDashboardData,
  ProjectGalleryItem,
  ProjectReportTheme
} from "./model.ts";
import { validateProjectDashboardData } from "./model.ts";

export function renderProjectDashboard(data: ProjectDashboardData): string {
  const issues = validateProjectDashboardData(data);

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
          <div class="project-dashboard__cards">
            ${data.cards.map(renderProjectCard).join("")}
          </div>
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-gallery-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-gallery-title">Object Gallery</h2>
            <span>${data.gallery.length} items</span>
          </div>
          <div class="project-dashboard__cards">
            ${data.gallery.map(renderGalleryItem).join("")}
          </div>
        </section>
        <section class="project-dashboard__section" aria-labelledby="project-dashboard-reports-title">
          <div class="project-dashboard__section-header">
            <h2 id="project-dashboard-reports-title">Report Cards</h2>
            <span>${data.reportThemes.length} themes</span>
          </div>
          <div class="project-dashboard__cards">
            ${data.reportThemes.map(renderReportTheme).join("")}
          </div>
        </section>
      </div>
    </section>
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

function renderProjectCard(card: ProjectCard): string {
  return `
    <article class="project-card" id="${escapeHtml(card.id)}" data-kp-project-card="${escapeHtml(card.id)}">
      ${renderMeta(card.status, card.priority)}
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.summary)}</p>
      ${renderTags(card.tags)}
      ${renderChildCards(card.children ?? [])}
    </article>
  `;
}

function renderGalleryItem(item: ProjectGalleryItem): string {
  return `
    <article class="project-card" id="${escapeHtml(item.id)}" data-kp-project-gallery-item="${escapeHtml(item.id)}">
      ${renderMeta(item.status, item.kind)}
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${renderTags([...item.domains, ...item.tags])}
    </article>
  `;
}

function renderReportTheme(theme: ProjectReportTheme): string {
  return `
    <article class="project-card" id="${escapeHtml(theme.id)}" data-kp-project-report-theme="${escapeHtml(theme.id)}">
      ${renderMeta(theme.status, "report")}
      <h3>${escapeHtml(theme.title)}</h3>
      <p>${escapeHtml(theme.scope)}</p>
      ${renderTags(theme.tags)}
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

function renderChildCards(children: readonly ProjectCard[]): string {
  if (children.length === 0) {
    return "";
  }

  return `
    <div class="project-card__children">
      ${children.map(renderProjectCard).join("")}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
