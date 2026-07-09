import type {
  ProjectCard,
  ProjectDashboardData,
  ProjectGalleryKind,
  ProjectGalleryItem,
  ProjectReportTheme
} from "./model.ts";
import { projectDashboardDataContract } from "./data.ts";
import {
  collectProjectDashboardIds,
  filterProjectDashboardData,
  groupProjectCardsByStatus,
  groupProjectGalleryItemsByKind,
  validateProjectDashboardData
} from "./model.ts";
import {
  katexTransformFixtures,
  summarizeKatexTransformFixtureDiagnostics,
  type KatexTransformFixture
} from "../rendering/katex-transform-fixtures.ts";
import { findEquationAnimationForFixtureId } from "../editor/equation-animation-catalog.ts";

export interface ProjectDashboardRenderOptions {
  readonly query?: string;
  readonly selectedKatexFixtureId?: string | undefined;
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
  const selectedKatexFixture = selectKatexFixture(
    options.selectedKatexFixtureId
  );

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
      ${renderDataContract()}
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
          ${renderKatexTransformFixtureGallery(selectedKatexFixture)}
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

function renderKatexTransformFixtureGallery(
  selectedFixture: KatexTransformFixture
): string {
  const diagnostics =
    summarizeKatexTransformFixtureDiagnostics(selectedFixture);
  const linkedAnimation = findEquationAnimationForFixtureId(selectedFixture.id);

  return `
    <section class="project-fixture-gallery" data-kp-katex-fixture-gallery aria-labelledby="project-katex-fixture-gallery-title">
      <div class="project-fixture-gallery__header">
        <div>
          <h3 id="project-katex-fixture-gallery-title">KaTeX Transform Fixtures</h3>
          <p>Semantic transform cases for awkward equation geometry.</p>
        </div>
        <span>${katexTransformFixtures.length} fixtures</span>
      </div>
      <div class="project-fixture-gallery__body">
        <div class="project-fixture-gallery__list" aria-label="KaTeX transform fixture list">
          ${katexTransformFixtures
            .map((fixture) => renderKatexFixtureButton(fixture, selectedFixture))
            .join("")}
        </div>
        <article
          class="project-fixture-gallery__sample"
          data-kp-katex-fixture-sample
          data-kp-selected-katex-transform-fixture="${escapeHtml(selectedFixture.id)}"
          ${linkedAnimation === undefined ? "" : `data-kp-linked-equation-animation="${escapeHtml(linkedAnimation.id)}"`}
        >
          ${renderMeta(selectedFixture.family, selectedFixture.intent)}
          <h3>${escapeHtml(selectedFixture.id)}</h3>
          <p>${escapeHtml(selectedFixture.summary)}</p>
          ${renderLinkedEquationAnimation(linkedAnimation)}
          <dl class="project-fixture-gallery__stats">
            <div>
              <dt>Source tokens</dt>
              <dd>${diagnostics.sourceTokenCount}</dd>
            </div>
            <div>
              <dt>Target tokens</dt>
              <dd>${diagnostics.targetTokenCount}</dd>
            </div>
            <div>
              <dt>Artifacts</dt>
              <dd>${diagnostics.sourceStructuralTokenCount} -> ${diagnostics.targetStructuralTokenCount}</dd>
            </div>
            <div>
              <dt>Role changes</dt>
              <dd>${diagnostics.roleChangeCount}</dd>
            </div>
          </dl>
          <div class="project-fixture-gallery__latex">
            <div>
              <strong>Source</strong>
              <code>${escapeHtml(selectedFixture.source.latex)}</code>
            </div>
            <div>
              <strong>Target</strong>
              <code>${escapeHtml(selectedFixture.target.latex)}</code>
            </div>
          </div>
          ${renderKatexFixtureRoleChanges(selectedFixture)}
        </article>
      </div>
    </section>
  `;
}

function renderLinkedEquationAnimation(
  linkedAnimation:
    | ReturnType<typeof findEquationAnimationForFixtureId>
    | undefined
): string {
  if (linkedAnimation === undefined) {
    return `<p class="project-fixture-gallery__empty">No editor animation linked yet.</p>`;
  }

  return `
    <div class="project-fixture-gallery__animation-link" data-kp-linked-equation-animation-summary>
      <strong>Editor animation available</strong>
      <span>${escapeHtml(linkedAnimation.label)}</span>
    </div>
  `;
}

function renderKatexFixtureButton(
  fixture: KatexTransformFixture,
  selectedFixture: KatexTransformFixture
): string {
  return `
    <button
      class="project-fixture-gallery__button"
      type="button"
      data-action="select-katex-transform-fixture"
      data-kp-katex-transform-fixture="${escapeHtml(fixture.id)}"
      aria-pressed="${fixture.id === selectedFixture.id ? "true" : "false"}"
    >
      <span>${escapeHtml(formatFixtureFamilyLabel(fixture.family))}</span>
      <strong>${escapeHtml(fixture.intent)}</strong>
    </button>
  `;
}

function renderKatexFixtureRoleChanges(
  fixture: KatexTransformFixture
): string {
  if (fixture.expectedRoleChanges.length === 0) {
    return `<p class="project-fixture-gallery__empty">No semantic role changes recorded for this fixture.</p>`;
  }

  return `
    <div class="project-fixture-gallery__roles">
      <strong>Role changes</strong>
      <ul>
        ${fixture.expectedRoleChanges
          .map(
            (change) => `
              <li>
                ${escapeHtml(change.sourceText)}:
                ${escapeHtml(change.sourceRole)} -> ${escapeHtml(change.targetRole)}
              </li>
            `
          )
          .join("")}
      </ul>
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

function renderDataContract(): string {
  return `
    <section class="project-dashboard__section project-dashboard__contract" data-kp-project-dashboard-contract aria-labelledby="project-dashboard-contract-title">
      <div class="project-dashboard__section-header">
        <h2 id="project-dashboard-contract-title">Data contract</h2>
        <span>V1 source</span>
      </div>
      <article class="project-card project-card--contract">
        <div class="project-card__interfaces">
          <strong>Canonical source</strong>
          <a href="${escapeHtml(projectDashboardDataContract.sourceFile)}">${escapeHtml(projectDashboardDataContract.sourceFile)}</a>
        </div>
        <div class="project-card__interfaces">
          <strong>Codex completion rule</strong>
          <span>${escapeHtml(projectDashboardDataContract.completionRule)}</span>
        </div>
        <div class="project-card__blockers" data-kp-dashboard-contract-notes>
          <strong>V1 notes</strong>
          <ul>
            ${projectDashboardDataContract.notes
              .map((note) => `<li>${escapeHtml(note)}</li>`)
              .join("")}
          </ul>
        </div>
        <div class="project-card__related">
          <strong>Design</strong>
          <a href="${escapeHtml(projectDashboardDataContract.designDocHref)}">Project dashboard V1 write protocol</a>
        </div>
      </article>
    </section>
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
    <article class="project-card project-card--report" id="${escapeHtml(theme.id)}" data-kp-project-report-theme="${escapeHtml(theme.id)}">
      ${renderMeta(theme.status, theme.grade ?? "Not reviewed")}
      <h3>${escapeHtml(theme.title)}</h3>
      <p>${escapeHtml(theme.scope)}</p>
      ${renderReportReviewSummary(theme)}
      ${renderReportQuestions(theme.questions)}
      ${renderReportEvidence(theme.evidence)}
      ${renderReportList("Risks", theme.risks)}
      ${renderReportList("Next Actions", theme.recommendedNextActions)}
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

function renderReportReviewSummary(theme: ProjectReportTheme): string {
  return `
    <dl class="project-report__summary">
      <div>
        <dt>Grade</dt>
        <dd>${escapeHtml(theme.grade ?? "Not reviewed")}</dd>
      </div>
      <div>
        <dt>Last reviewed</dt>
        <dd>${escapeHtml(theme.lastReviewedOn ?? "Not reviewed")}</dd>
      </div>
    </dl>
  `;
}

function renderReportQuestions(questions: readonly string[]): string {
  return renderReportList("Questions", questions);
}

function renderReportEvidence(
  evidence: readonly ProjectReportTheme["evidence"][number][]
): string {
  if (evidence.length === 0) {
    return `
      <div class="project-report__section">
        <strong>Evidence</strong>
        <p>No evidence recorded</p>
      </div>
    `;
  }

  return `
    <div class="project-report__section">
      <strong>Evidence</strong>
      <ul>
        ${evidence
          .map(
            (entry) =>
              `<li><a href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a></li>`
          )
          .join("")}
      </ul>
    </div>
  `;
}

function renderReportList(label: string, items: readonly string[]): string {
  if (items.length === 0) {
    return `
      <div class="project-report__section">
        <strong>${escapeHtml(label)}</strong>
        <p>None recorded</p>
      </div>
    `;
  }

  return `
    <div class="project-report__section">
      <strong>${escapeHtml(label)}</strong>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
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
    case "semantic-transform":
      return "Semantic Transformations";
    case "notation-transform":
      return "Notation Transformations";
    case "visual":
      return "Visuals";
    case "semantic-object":
      return "Semantic Objects";
    case "protocol-api":
      return "Protocol/API";
  }
}

function formatFixtureFamilyLabel(family: string): string {
  return family
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function selectKatexFixture(selectedFixtureId: string | undefined): KatexTransformFixture {
  const fallback = katexTransformFixtures[0];

  if (fallback === undefined) {
    throw new Error("Expected at least one KaTeX transform fixture.");
  }

  return (
    katexTransformFixtures.find((fixture) => fixture.id === selectedFixtureId) ??
    fallback
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
