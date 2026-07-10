import type {
  ProjectCard,
  ProjectDashboardData,
  ProjectDashboardProjectRef,
  ProjectDashboardSampleTarget,
  ProjectDashboardSourceRef,
  ProjectDashboardStatus,
  ProjectGalleryKind,
  ProjectGalleryItem,
  ProjectReportTheme
} from "./model.ts";
import { projectDashboardDataContract } from "./data.ts";
import {
  createKpTheseusDashboardExtensionContribution,
  type KpTheseusDashboardRow
} from "./theseus-adapter.ts";
import {
  PROJECT_DASHBOARD_PRIORITY_ORDER,
  PROJECT_DASHBOARD_STATUS_ORDER,
  PROJECT_GALLERY_KIND_ORDER,
  collectProjectDashboardIds,
  filterProjectDashboardData,
  projectDashboardTextFieldsMatch,
  validateProjectDashboardData
} from "./model.ts";
import {
  katexTransformFixtures,
  summarizeKatexTransformFixtureDiagnostics,
  type KatexTransformFixture
} from "../rendering/katex-transform-fixtures.ts";
import {
  equationAnimationCatalogEntries,
  findEquationAnimationForFixtureId
} from "../editor/equation-animation-catalog.ts";
import {
  apiCatalogGroups,
  apiCatalogItemDetailFields,
  apiCatalogItemSearchFields,
  apiCatalogItemTags,
  type ApiCatalogGroup,
  type ApiCatalogItem
} from "../editor/api-catalog.ts";
import {
  semanticCapabilityPreviewFields,
  semanticCapabilitySearchFields
} from "./capability-preview.ts";

export interface ProjectDashboardRenderOptions {
  readonly query?: string;
  readonly selectedAgendaRowId?: string | undefined;
  readonly selectedKatexFixtureId?: string | undefined;
  readonly tocOnly?: boolean;
}

export function renderProjectDashboard(
  data: ProjectDashboardData,
  options: ProjectDashboardRenderOptions = {}
): string {
  const issues = validateProjectDashboardData(data);
  const query = options.query ?? "";
  const tocOnly = options.tocOnly ?? false;
  const renderedData = filterProjectDashboardData(data, query);
  const titles = createTitleLookup(data);
  const visibleIds = new Set(collectProjectDashboardIds(renderedData));
  const hasQuery = query.trim().length > 0;
  const agendaModel = createProjectAgendaModel(data, renderedData, query);
  const selectedAgendaRow = findSelectedAgendaRow(
    agendaModel.sections,
    options.selectedAgendaRowId
  );
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
        ${renderDataStatus(issues)}
        <button class="project-dashboard__back" type="button" data-action="show-editor">Back to Editor</button>
      </header>
      ${renderProjectDashboardSearch(query, agendaModel, tocOnly)}
      ${tocOnly ? "" : renderProjectAgendaPreview(selectedAgendaRow)}
      ${renderProjectAgenda(agendaModel.sections, titles, visibleIds, {
        selectedAgendaRowId: selectedAgendaRow?.id,
        tocOnly
      })}
      ${hasQuery || tocOnly ? "" : renderAnimationLayoutSection(selectedKatexFixture)}
    </section>
  `;
}

export function getProjectDashboardSearchQuery(input: HTMLInputElement): string {
  return input.value;
}

function renderProjectDashboardSearch(
  query: string,
  agendaModel: ProjectAgendaModel,
  tocOnly: boolean
): string {
  return `
    <div class="project-dashboard__toolbar">
      <label class="project-dashboard__search" for="project-dashboard-search">
        <span>Search everything</span>
        <input id="project-dashboard-search" type="search" value="${escapeHtml(query)}" data-action="filter-project-dashboard" data-kp-project-dashboard-search aria-label="Search project dashboard" placeholder="Search work, animations, visuals, objects, reports" />
      </label>
      <div class="project-dashboard__search-footer">
        <p class="project-dashboard__search-count" data-kp-project-dashboard-search-count>Showing ${agendaModel.visibleRowCount} of ${agendaModel.totalRowCount} rows</p>
        <label class="project-dashboard__toc-toggle">
          <input type="checkbox" data-action="toggle-project-dashboard-toc" ${tocOnly ? "checked" : ""} />
          <span>Fold lists into TOC</span>
        </label>
      </div>
    </div>
  `;
}

interface ProjectAgendaRow {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: ProjectDashboardStatus | string;
  readonly detail: string;
  readonly kind: string;
  readonly depth: number;
  readonly tags: readonly string[];
  readonly dataAttributes: readonly [string, string][];
  readonly relatedIds?: readonly string[] | undefined;
  readonly extraHtml?: string;
  readonly previewFields?: readonly ProjectAgendaPreviewField[] | undefined;
  readonly previewLinks?: readonly ProjectAgendaPreviewLink[] | undefined;
  readonly searchFields?: readonly string[] | undefined;
}

interface ProjectAgendaPreviewField {
  readonly label: string;
  readonly value: string;
}

interface ProjectAgendaPreviewLink {
  readonly label: string;
  readonly href: string;
  readonly dataAttributes: readonly [string, string][];
}

interface ProjectAgendaSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly ProjectAgendaRow[];
}

interface ProjectAgendaModel {
  readonly sections: readonly ProjectAgendaSection[];
  readonly visibleRowCount: number;
  readonly totalRowCount: number;
}

interface ProjectAgendaAdapterRows {
  readonly gallery: ReadonlyMap<string, KpTheseusDashboardRow>;
  readonly api: ReadonlyMap<string, KpTheseusDashboardRow>;
}

interface ProjectAuthoringMetadata {
  readonly maturity?: string | undefined;
  readonly coverage?: readonly string[] | undefined;
  readonly projectRefs?: readonly ProjectDashboardProjectRef[] | undefined;
  readonly sourceRefs?: readonly ProjectDashboardSourceRef[] | undefined;
  readonly verification?: readonly string[] | undefined;
  readonly blockers?: readonly string[] | undefined;
}

function renderProjectAgenda(
  sections: readonly ProjectAgendaSection[],
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>,
  options: {
    readonly selectedAgendaRowId: string | undefined;
    readonly tocOnly: boolean;
  }
): string {
  return `
    <div class="project-agenda" data-kp-project-agenda data-kp-agenda-toc="${options.tocOnly ? "true" : "false"}">
      ${sections
        .map((section) =>
          renderAgendaSection(section, titles, visibleIds, options)
        )
        .join("")}
    </div>
  `;
}

function renderAgendaSection(
  section: ProjectAgendaSection,
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>,
  options: {
    readonly selectedAgendaRowId: string | undefined;
    readonly tocOnly: boolean;
  }
): string {
  if (section.rows.length === 0) {
    return "";
  }

  return `
    <section class="project-agenda__section" data-kp-agenda-section="${escapeHtml(section.id)}" aria-labelledby="project-agenda-${escapeHtml(section.id)}-title">
      <div class="project-agenda__section-header">
        <h2 id="project-agenda-${escapeHtml(section.id)}-title">${escapeHtml(section.title)} <span class="project-agenda__count">(${section.rows.length})</span></h2>
      </div>
      ${options.tocOnly ? "" : `
      <table class="project-agenda__table">
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Item</th>
            <th scope="col">Summary</th>
            <th scope="col">Tags</th>
          </tr>
        </thead>
        <tbody>
          ${section.rows
            .map((row) =>
              renderAgendaRow(row, titles, visibleIds, {
                selected: row.id === options.selectedAgendaRowId
              })
            )
            .join("")}
        </tbody>
      </table>
      `}
    </section>
  `;
}

function renderAgendaRow(
  row: ProjectAgendaRow,
  titles: ReadonlyMap<string, string>,
  visibleIds: ReadonlySet<string>,
  options: { readonly selected: boolean }
): string {
  return `
    <tr class="project-agenda__row${options.selected ? " project-agenda__row--selected" : ""}" data-kp-agenda-row="${escapeHtml(row.id)}" data-kp-agenda-kind="${escapeHtml(row.kind)}" data-kp-agenda-status="${escapeHtml(row.status)}" data-kp-agenda-detail="${escapeHtml(row.detail)}" data-kp-agenda-depth="${row.depth}" data-kp-agenda-selected="${options.selected ? "true" : "false"}" ${renderDataAttributes(row.dataAttributes)}>
      <td class="project-agenda__status-cell">
        <span class="project-agenda__status project-agenda__status--${escapeHtml(statusTone(row.status))}">${escapeHtml(row.status)}</span>
      </td>
      <td class="project-agenda__item-cell" style="--kp-agenda-depth: ${row.depth}">
        <button class="project-agenda__select" type="button" data-action="select-project-agenda-row" data-kp-select-agenda-row="${escapeHtml(row.id)}" aria-pressed="${options.selected ? "true" : "false"}">
          <span class="project-agenda__title">${escapeHtml(row.title)}</span>
        </button>
        <span class="project-agenda__detail">${escapeHtml(row.detail)}</span>
      </td>
      <td class="project-agenda__summary-cell">
        <span>${escapeHtml(row.summary)}</span>
        ${row.extraHtml ?? ""}
        ${renderAgendaRelatedLinks(row.relatedIds ?? [], titles, visibleIds)}
      </td>
      <td class="project-agenda__tags-cell">
        ${renderAgendaTags(row.tags)}
      </td>
    </tr>
  `;
}

function renderProjectAgendaPreview(
  row: ProjectAgendaRow | undefined
): string {
  if (row === undefined) {
    return "";
  }

  return `
    <section class="project-agenda-preview" data-kp-project-agenda-preview data-kp-selected-agenda-row="${escapeHtml(row.id)}" aria-labelledby="project-agenda-preview-title">
      <div class="project-agenda-preview__header">
        <div>
          <p class="project-agenda-preview__eyebrow">Selected Row</p>
          <h2 id="project-agenda-preview-title">${escapeHtml(row.title)}</h2>
        </div>
        <span class="project-agenda__status project-agenda__status--${escapeHtml(statusTone(row.status))}">${escapeHtml(row.status)}</span>
      </div>
      <p>${escapeHtml(row.summary)}</p>
      <dl class="project-agenda-preview__fields">
        <div>
          <dt>Kind</dt>
          <dd data-kp-preview-field="Kind">${escapeHtml(row.kind)}</dd>
        </div>
        <div>
          <dt>Detail</dt>
          <dd data-kp-preview-field="Detail">${escapeHtml(row.detail)}</dd>
        </div>
        ${renderPreviewFields(row.previewFields ?? [])}
      </dl>
      ${renderPreviewLinks(row.previewLinks ?? [])}
      <div class="project-agenda-preview__tags">
        ${renderAgendaTags(row.tags)}
      </div>
    </section>
  `;
}

function renderPreviewFields(
  fields: readonly ProjectAgendaPreviewField[]
): string {
  return fields
    .map(
      (field) => `
        <div>
          <dt>${escapeHtml(field.label)}</dt>
          <dd data-kp-preview-field="${escapeHtml(field.label)}">${escapeHtml(field.value)}</dd>
        </div>
      `
    )
    .join("");
}

function renderPreviewLinks(
  links: readonly ProjectAgendaPreviewLink[]
): string {
  if (links.length === 0) {
    return "";
  }

  return `
    <div class="project-agenda-preview__links">
      ${links
        .map(
          (link) => `
            <a
              class="project-agenda-preview__link"
              href="${escapeHtml(link.href)}"
              ${renderDataAttributes(link.dataAttributes)}
            >${escapeHtml(link.label)}</a>
          `
        )
        .join("")}
    </div>
  `;
}

function createProjectAgendaModel(
  fullData: ProjectDashboardData,
  visibleData: ProjectDashboardData,
  query: string
): ProjectAgendaModel {
  const sections = createProjectAgendaSections(visibleData, query);
  const totalRowCount = countAgendaRows(createProjectAgendaSections(fullData, ""));

  return {
    sections,
    visibleRowCount: countAgendaRows(sections),
    totalRowCount
  };
}

function findSelectedAgendaRow(
  sections: readonly ProjectAgendaSection[],
  selectedAgendaRowId: string | undefined
): ProjectAgendaRow | undefined {
  const rows = sections.flatMap((section) => section.rows);

  return (
    rows.find((row) => row.id === selectedAgendaRowId) ??
    rows[0]
  );
}

function createProjectAgendaSections(
  data: ProjectDashboardData,
  query: string
): readonly ProjectAgendaSection[] {
  const adapterRows = createProjectAgendaAdapterRows(data);

  return [
    {
      id: "work",
      title: "Work",
      rows: createWorkAgendaRows(data.cards)
    },
    {
      id: "report-cards",
      title: "Report Cards",
      rows: createReportAgendaRows(data.reportThemes)
    },
    {
      id: "object-gallery",
      title: "Object Gallery",
      rows: createGalleryAgendaRows(data.gallery, adapterRows.gallery)
    },
    {
      id: "animation-layout",
      title: "Animation Layout",
      rows: createAnimationLayoutAgendaRows(query)
    },
    {
      id: "katex-transforms",
      title: "KaTeX Transforms",
      rows: createKatexTransformAgendaRows(query)
    },
    {
      id: "api",
      title: "API",
      rows: createApiAgendaRows(query, adapterRows.api)
    },
    {
      id: "other",
      title: "Other",
      rows: createOtherAgendaRows(query)
    }
  ];
}

function createProjectAgendaAdapterRows(
  data: ProjectDashboardData
): ProjectAgendaAdapterRows {
  const sections =
    createKpTheseusDashboardExtensionContribution(data).sections ?? [];

  return {
    gallery: adapterRowsBySourceId(sections, "kp.gallery", "kp.gallery."),
    api: adapterRowsBySourceId(sections, "kp.api", "kp.api.")
  };
}

function adapterRowsBySourceId(
  sections: readonly { readonly id: string; readonly rows: readonly KpTheseusDashboardRow[] }[],
  sectionId: string,
  rowIdPrefix: string
): ReadonlyMap<string, KpTheseusDashboardRow> {
  const section = sections.find((candidate) => candidate.id === sectionId);
  const rows = section?.rows ?? [];

  return new Map(
    rows.flatMap((row) =>
      row.id.startsWith(rowIdPrefix)
        ? [[row.id.slice(rowIdPrefix.length), row] as const]
        : []
    )
  );
}

function countAgendaRows(sections: readonly ProjectAgendaSection[]): number {
  return sections.reduce((sum, section) => sum + section.rows.length, 0);
}

function createWorkAgendaRows(
  cards: readonly ProjectCard[],
  depth = 0
): readonly ProjectAgendaRow[] {
  return [...cards].sort(compareProjectCardsForAgenda).flatMap((card) => [
    {
      id: card.id,
      title: card.title,
      summary: card.summary,
      status: card.status,
      detail: card.priority,
      kind: "work",
      depth,
      tags: card.tags,
      dataAttributes: [["data-kp-project-card", card.id]],
      relatedIds: card.relatedIds,
      extraHtml: renderAgendaBlockers(card.blockers ?? []),
      previewFields: [
        { label: "Priority", value: card.priority },
        { label: "Category", value: card.category },
        { label: "Blockers", value: (card.blockers ?? []).join(" ") || "None" },
        ...authoringPreviewFields({
          projectRefs: card.projectRefs,
          sourceRefs: card.sourceRefs,
          verification: card.verification
        })
      ],
      searchFields: authoringSearchFields({
        projectRefs: card.projectRefs,
        sourceRefs: card.sourceRefs,
        verification: card.verification
      })
    },
    ...createWorkAgendaRows(card.children ?? [], depth + 1)
  ]);
}

function createReportAgendaRows(
  themes: readonly ProjectReportTheme[]
): readonly ProjectAgendaRow[] {
  return [...themes].sort(compareReportThemesForAgenda).map((theme) => ({
    id: theme.id,
    title: theme.title,
    summary: theme.scope,
    status: theme.status,
    detail: theme.grade ?? "Not reviewed",
    kind: "report",
    depth: 0,
    tags: theme.tags,
    dataAttributes: [["data-kp-project-report-theme", theme.id]],
    relatedIds: theme.relatedIds,
    extraHtml: renderReportAgendaNotes(theme),
    previewFields: [
      { label: "Grade", value: theme.grade ?? "Not reviewed" },
      { label: "Last reviewed", value: theme.lastReviewedOn ?? "Not reviewed" },
      { label: "Risks", value: theme.risks.join(" ") || "None recorded" },
      ...previewProjectRefFields(theme.projectRefs)
    ],
    searchFields: projectRefSearchFields(theme.projectRefs)
  }));
}

function createGalleryAgendaRows(
  items: readonly ProjectGalleryItem[],
  adapterRows: ReadonlyMap<string, KpTheseusDashboardRow>
): readonly ProjectAgendaRow[] {
  return [...items].sort(compareGalleryItemsForAgenda).map((item) => {
    const adapterRow = adapterRows.get(item.id);

    return {
      id: item.id,
      title: item.title,
      summary: item.summary,
      status: item.status,
      detail: formatGalleryKindLabel(item.kind),
      kind: item.kind,
      depth: 0,
      tags: [...item.domains, ...item.tags, ...(item.interfaces ?? [])],
      dataAttributes: [
        ["data-kp-project-gallery-item", item.id],
        ...adapterDataAttributes(adapterRow)
      ],
      relatedIds: item.relatedIds,
      extraHtml: renderAgendaBlockers(item.blockers ?? []),
      previewFields: [
        { label: "Gallery kind", value: formatGalleryKindLabel(item.kind) },
        { label: "Domains", value: item.domains.join(", ") || "None" },
        {
          label: "Interfaces",
          value: (item.interfaces ?? []).join(", ") || "None"
        },
        ...authoringPreviewFields({
          maturity: item.maturity,
          coverage: item.coverage,
          projectRefs: item.projectRefs,
          sourceRefs: item.sourceRefs,
          verification: item.verification,
          blockers: item.blockers
        }),
        ...sampleTargetPreviewFields(item.sampleTargets),
        ...adapterPreviewFields(adapterRow)
      ],
      previewLinks: sampleTargetPreviewLinks(item.sampleTargets),
      searchFields: [
        ...authoringSearchFields({
          maturity: item.maturity,
          coverage: item.coverage,
          projectRefs: item.projectRefs,
          sourceRefs: item.sourceRefs,
          verification: item.verification,
          blockers: item.blockers
        }),
        ...sampleTargetSearchFields(item.sampleTargets),
        ...adapterSearchFields(adapterRow)
      ]
    };
  });
}

function createAnimationLayoutAgendaRows(
  query: string
): readonly ProjectAgendaRow[] {
  return filterAgendaRows(
    equationAnimationCatalogEntries.map((entry) => ({
      id: `animation-layout-${entry.id}`,
      title: entry.label,
      summary: entry.summary,
      status: "active",
      detail: `${entry.beatCount} beats`,
      kind: "animation-layout",
      depth: 0,
      tags: [
        "animation",
        "timeline",
        "equation",
        ...(entry.fixtureId === undefined ? [] : ["katex"])
      ],
      dataAttributes: [
        ["data-kp-agenda-animation-layout", entry.id],
        ["data-kp-equation-animation", entry.id]
      ],
      previewFields: [
        { label: "Animation id", value: entry.id },
        { label: "Beat count", value: String(entry.beatCount) },
        { label: "Duration", value: `${entry.defaultDurationMs}ms` },
        { label: "States", value: String(entry.states.length) },
        ...authoringPreviewFields({
          maturity: "sample-ready animation",
          coverage: [
            `${entry.beatCount} timeline beats`,
            `${entry.states.length} rendered states`,
            entry.fixtureId === undefined ? "operation-authored" : "fixture-backed"
          ],
          sourceRefs: [
            {
              label: "Equation animation catalog",
              href: "src/editor/equation-animation-catalog.ts"
            },
            {
              label: "Equation motion plan",
              href: "src/rendering/equation-motion-plan.ts"
            },
            {
              label: "Equation motion sampler",
              href: "src/rendering/equation-motion-sampler.ts"
            }
          ],
          verification: [
            "tests/equation-motion-plan.test.ts",
            "tests/equation-motion-sampler.test.ts",
            "tests/katex-transition.browser.spec.ts"
          ]
        })
      ],
      previewLinks: [
        liveAnimationPreviewLink(
          entry.id,
          entry.label,
          entry.fixtureId === undefined
            ? []
            : [["data-kp-preview-katex-transform-fixture", entry.fixtureId]]
        )
      ],
      searchFields: [
        entry.id,
        entry.fixtureId ?? "",
        `${entry.states.length} states`,
        `${entry.defaultDurationMs}ms`,
        "src/editor/equation-animation-catalog.ts",
        "src/rendering/equation-motion-plan.ts",
        "tests/katex-transition.browser.spec.ts"
      ]
    })),
    query
  );
}

function createKatexTransformAgendaRows(
  query: string
): readonly ProjectAgendaRow[] {
  return filterAgendaRows(
    katexTransformFixtures.map((fixture) => {
      const linkedAnimation = findEquationAnimationForFixtureId(fixture.id);

      return {
        id: `katex-transform-${fixture.id}`,
        title: fixture.intent,
        summary: fixture.summary,
        status: linkedAnimation === undefined ? "planned" : "active",
        detail: fixture.family,
        kind: "katex-transform",
        depth: 0,
        tags: ["katex", fixture.family, fixture.intent],
        dataAttributes: [["data-kp-agenda-katex-transform", fixture.id]],
        previewFields: [
          { label: "Fixture id", value: fixture.id },
          { label: "Source LaTeX", value: fixture.source.latex },
          { label: "Target LaTeX", value: fixture.target.latex },
          { label: "Linked animation", value: linkedAnimation?.label ?? "None" },
          ...authoringPreviewFields({
            maturity:
              linkedAnimation === undefined
                ? "fixture-only"
                : "animation-linked fixture",
            coverage: katexFixtureCoverage(fixture),
            sourceRefs: [
              {
                label: "KaTeX transform fixtures",
                href: "src/rendering/katex-transform-fixtures.ts"
              },
              ...(linkedAnimation === undefined
                ? []
                : [
                    {
                      label: "Equation animation catalog",
                      href: "src/editor/equation-animation-catalog.ts"
                    }
                  ])
            ],
            verification: [
              "tests/katex-token-snapshot.test.ts",
              "tests/equation-motion-plan.test.ts"
            ],
            blockers:
              linkedAnimation === undefined
                ? ["No linked dashboard animation sample yet."]
                : []
          })
        ],
        previewLinks:
          linkedAnimation === undefined
            ? []
            : [
                liveAnimationPreviewLink(linkedAnimation.id, linkedAnimation.label, [
                  ["data-kp-preview-katex-transform-fixture", fixture.id]
                ])
              ],
        searchFields: [
          fixture.id,
          fixture.source.latex,
          fixture.target.latex,
          linkedAnimation?.label ?? "",
          ...katexFixtureCoverage(fixture),
          "src/rendering/katex-transform-fixtures.ts",
          "tests/katex-token-snapshot.test.ts"
        ]
      };
    }),
    query
  );
}

function liveAnimationPreviewLink(
  animationId: string,
  label: string,
  extraDataAttributes: readonly [string, string][] = []
): ProjectAgendaPreviewLink {
  return {
    label: `Open ${label} sample`,
    href: "#project-dashboard-animation-layout-title",
    dataAttributes: [
      ["data-kp-preview-link", "live-animation"],
      ["data-kp-preview-live-animation", animationId],
      ...extraDataAttributes
    ]
  };
}

function sampleTargetPreviewFields(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly ProjectAgendaPreviewField[] {
  const sampleTargets = targets ?? [];

  return sampleTargets.length === 0
    ? []
    : [
        {
          label: "Sample targets",
          value: sampleTargets.map((target) => target.label).join(", ")
        },
        ...sampleTargets.flatMap(sampleTargetDetailPreviewFields)
      ];
}

function sampleTargetDetailPreviewFields(
  target: ProjectDashboardSampleTarget
): readonly ProjectAgendaPreviewField[] {
  switch (target.kind) {
    case "tutorial-card":
      return [
        { label: "Tutorial card sample", value: target.sampleId },
        { label: "Tutorial card manifest", value: target.manifestId },
        ...(target.sharedClockId === undefined
          ? []
          : [{ label: "Tutorial card clock", value: target.sharedClockId }])
      ];
    case "export-artifact":
      return [
        { label: "Export artifact", value: target.artifactId },
        { label: "Export profile", value: target.profileId },
        { label: "Export manifest", value: target.manifestId },
        { label: "Export payload", value: target.payloadKind }
      ];
    default:
      return [];
  }
}

function sampleTargetPreviewLinks(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly ProjectAgendaPreviewLink[] {
  return (targets ?? []).map(sampleTargetPreviewLink);
}

function sampleTargetPreviewLink(
  target: ProjectDashboardSampleTarget
): ProjectAgendaPreviewLink {
  switch (target.kind) {
    case "equation-animation":
      return liveAnimationPreviewLink(
        target.animationId,
        target.label.replace(/^Open\s+/i, ""),
        target.fixtureId === undefined
          ? []
          : [["data-kp-preview-katex-transform-fixture", target.fixtureId]]
      );
    case "graph-surface-mode":
      return {
        label: target.label,
        href: "#",
        dataAttributes: [
          ["data-kp-preview-link", "graph-surface-mode"],
          ["data-kp-preview-graph-id", target.graphId],
          ["data-kp-preview-graph-surface-mode", target.surfaceMode]
        ]
      };
    case "synchronized-equation-graph": {
      const dataAttributes: [string, string][] = [
        ["data-kp-preview-link", "synchronized-equation-graph"],
        ["data-kp-preview-live-animation", target.animationId],
        ["data-kp-preview-graph-id", target.graphId],
        ["data-kp-preview-shared-clock-id", target.sharedClockId]
      ];

      if (target.layoutId !== undefined) {
        dataAttributes.push(["data-kp-preview-layout-id", target.layoutId]);
      }

      if (target.fixtureId !== undefined) {
        dataAttributes.push([
          "data-kp-preview-katex-transform-fixture",
          target.fixtureId
        ]);
      }

      if (target.surfaceMode !== undefined) {
        dataAttributes.push([
          "data-kp-preview-graph-surface-mode",
          target.surfaceMode
        ]);
      }

      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes
      };
    }
    case "tutorial-card": {
      const dataAttributes: [string, string][] = [
        ["data-kp-preview-link", "tutorial-card"],
        ["data-kp-preview-tutorial-card", target.sampleId],
        ["data-kp-preview-manifest-id", target.manifestId]
      ];

      if (target.layoutId !== undefined) {
        dataAttributes.push(["data-kp-preview-layout-id", target.layoutId]);
      }

      if (target.sharedClockId !== undefined) {
        dataAttributes.push([
          "data-kp-preview-shared-clock-id",
          target.sharedClockId
        ]);
      }

      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes
      };
    }
    case "export-artifact":
      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes: [
          ["data-kp-preview-link", "export-artifact"],
          ["data-kp-preview-export-artifact", target.artifactId],
          ["data-kp-preview-manifest-id", target.manifestId],
          ["data-kp-preview-export-profile", target.profileId],
          ["data-kp-preview-export-payload", target.payloadKind]
        ]
      };
    case "api-catalog-item":
      return {
        label: target.label,
        href: "#project-agenda-api-title",
        dataAttributes: [
          ["data-kp-preview-link", "api-catalog-item"],
          ["data-kp-preview-api-item", target.itemId]
        ]
      };
  }
}

function createApiAgendaRows(
  query: string,
  adapterRows: ReadonlyMap<string, KpTheseusDashboardRow>
): readonly ProjectAgendaRow[] {
  return apiCatalogGroups.flatMap((group) =>
    createApiGroupAgendaRows(group, query, adapterRows)
  );
}

function createApiGroupAgendaRows(
  group: ApiCatalogGroup,
  query: string,
  adapterRows: ReadonlyMap<string, KpTheseusDashboardRow>
): readonly ProjectAgendaRow[] {
  const groupRow: ProjectAgendaRow = {
    id: `api-${group.id}`,
    title: group.title,
    summary: group.summary,
    status: "active",
    detail: "API group",
    kind: "api",
    depth: 0,
    tags: ["api", group.id],
    dataAttributes: [["data-kp-agenda-api-group", group.id]],
    previewFields: [
      { label: "API group", value: group.title },
      { label: "API category", value: group.category },
      { label: "Items", value: String(group.items.length) },
      ...authoringPreviewFields(apiGroupAuthoringMetadata(group))
    ],
    searchFields: authoringSearchFields(apiGroupAuthoringMetadata(group))
  };
  const itemRows: readonly ProjectAgendaRow[] = group.items.map((item) => {
    const adapterRow = adapterRows.get(item.id);

    return {
      id: `api-${item.id}`,
      title: item.title,
      summary: item.summary,
      status: item.status,
      detail: item.kind,
      kind: "api",
      depth: 1,
      tags: ["api", ...apiCatalogItemTags(group, item)],
      dataAttributes: [
        ["data-kp-agenda-api-item", item.id],
        ...adapterDataAttributes(adapterRow)
      ],
      previewFields: [
        ...apiCatalogItemDetailFields(group, item),
        ...semanticCapabilityPreviewFields(group, item),
        ...authoringPreviewFields(apiItemAuthoringMetadata(item)),
        ...adapterPreviewFields(adapterRow)
      ],
      searchFields: [
        ...apiCatalogItemSearchFields(group, item),
        ...semanticCapabilitySearchFields(group, item),
        ...authoringSearchFields(apiItemAuthoringMetadata(item)),
        ...adapterSearchFields(adapterRow)
      ]
    };
  });

  if (query.trim().length === 0) {
    return [groupRow, ...itemRows];
  }

  const matchingRows = itemRows.filter((row) =>
    agendaRowMatchesQuery(row, query)
  );

  return agendaRowMatchesQuery(groupRow, query)
    ? [groupRow, ...matchingRows]
    : matchingRows;
}

function adapterDataAttributes(
  row: KpTheseusDashboardRow | undefined
): readonly [string, string][] {
  return row === undefined ? [] : [["data-kp-agenda-adapter-row", row.id]];
}

function adapterPreviewFields(
  row: KpTheseusDashboardRow | undefined
): readonly ProjectAgendaPreviewField[] {
  return row === undefined ? [] : [{ label: "Adapter row", value: row.id }];
}

function adapterSearchFields(
  row: KpTheseusDashboardRow | undefined
): readonly string[] {
  return row === undefined ? [] : [row.id, row.searchText ?? ""];
}

function apiGroupAuthoringMetadata(
  group: ApiCatalogGroup
): ProjectAuthoringMetadata {
  return {
    maturity: "catalog group",
    coverage: [`${group.items.length} API rows`],
    sourceRefs: [
      {
        label: "API catalog",
        href: "src/editor/api-catalog.ts"
      }
    ],
    verification: [
      "tests/api-catalog.test.ts",
      "tests/project-dashboard.test.ts"
    ]
  };
}

function apiItemAuthoringMetadata(
  item: ApiCatalogItem
): ProjectAuthoringMetadata {
  return {
    maturity: item.status,
    coverage: apiCatalogItemCoverage(item),
    sourceRefs: [
      {
        label: "API catalog",
        href: "src/editor/api-catalog.ts"
      }
    ],
    verification: [
      "tests/api-catalog.test.ts",
      "tests/project-dashboard.test.ts"
    ]
  };
}

function apiCatalogItemCoverage(item: ApiCatalogItem): readonly string[] {
  const details = item.details;

  return [
    `${details?.protocols?.length ?? 0} protocols`,
    `${details?.views?.length ?? 0} views`,
    `${details?.computes?.length ?? 0} computations`
  ];
}

function katexFixtureCoverage(
  fixture: KatexTransformFixture
): readonly string[] {
  return [
    `${fixture.source.tokens.length} source tokens`,
    `${fixture.target.tokens.length} target tokens`,
    `${fixture.expectedStructuralTokens.source.length + fixture.expectedStructuralTokens.target.length} structural artifacts`,
    `${fixture.expectedRoleChanges.length} role changes`
  ];
}

function authoringPreviewFields(
  metadata: ProjectAuthoringMetadata
): readonly ProjectAgendaPreviewField[] {
  return [
    ...(metadata.maturity === undefined
      ? []
      : [{ label: "Maturity", value: metadata.maturity }]),
    ...previewListField("Coverage", metadata.coverage),
    ...previewProjectRefFields(metadata.projectRefs),
    ...previewSourceRefFields(metadata.sourceRefs),
    ...previewListField("Verification", metadata.verification),
    ...previewListField("Authoring blockers", metadata.blockers)
  ];
}

function previewListField(
  label: string,
  values: readonly string[] | undefined
): readonly ProjectAgendaPreviewField[] {
  return values === undefined || values.length === 0
    ? []
    : [{ label, value: values.join(", ") }];
}

function previewSourceRefFields(
  sourceRefs: readonly ProjectDashboardSourceRef[] | undefined
): readonly ProjectAgendaPreviewField[] {
  return sourceRefs === undefined || sourceRefs.length === 0
    ? []
    : [
        {
          label: "Source refs",
          value: sourceRefs
            .map((sourceRef) => `${sourceRef.label}: ${sourceRef.href}`)
            .join(", ")
        }
      ];
}

function authoringSearchFields(
  metadata: ProjectAuthoringMetadata
): readonly string[] {
  return [
    metadata.maturity ?? "",
    ...(metadata.coverage ?? []),
    ...projectRefSearchFields(metadata.projectRefs),
    ...(metadata.sourceRefs ?? []).flatMap((sourceRef) => [
      sourceRef.label,
      sourceRef.href
    ]),
    ...(metadata.verification ?? []),
    ...(metadata.blockers ?? [])
  ];
}

function previewProjectRefFields(
  projectRefs: readonly ProjectDashboardProjectRef[] | undefined
): readonly ProjectAgendaPreviewField[] {
  const refs = projectRefs ?? [];

  return [
    previewProjectRefField("roadmap", "Roadmap refs", refs),
    previewProjectRefField("thread", "Thread refs", refs),
    previewProjectRefField("review", "Review refs", refs),
    previewProjectRefField("decision", "Decision refs", refs),
    previewProjectRefField("theseus", "Theseus refs", refs)
  ].filter((field): field is ProjectAgendaPreviewField => field !== undefined);
}

function previewProjectRefField(
  kind: ProjectDashboardProjectRef["kind"],
  label: string,
  refs: readonly ProjectDashboardProjectRef[]
): ProjectAgendaPreviewField | undefined {
  const matchingRefs = refs.filter((ref) => ref.kind === kind);

  return matchingRefs.length === 0
    ? undefined
    : {
        label,
        value: matchingRefs.map(formatProjectRef).join(", ")
      };
}

function projectRefSearchFields(
  projectRefs: readonly ProjectDashboardProjectRef[] | undefined
): readonly string[] {
  return (projectRefs ?? []).flatMap((projectRef) => [
    projectRef.kind,
    projectRef.label,
    projectRef.href ?? "",
    projectRef.id ?? "",
    projectRef.summary ?? ""
  ]);
}

function formatProjectRef(projectRef: ProjectDashboardProjectRef): string {
  const target = projectRef.href ?? projectRef.id;
  const targetText = target === undefined ? "" : `: ${target}`;
  const summaryText =
    projectRef.summary === undefined ? "" : ` (${projectRef.summary})`;

  return `${projectRef.label}${targetText}${summaryText}`;
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
          target.layoutId ?? "",
          target.sharedClockId,
          target.fixtureId ?? "",
          target.surfaceMode ?? "",
          "sync equation graph shared clock"
        ];
      case "tutorial-card":
        return [
          target.kind,
          target.label,
          target.sampleId,
          target.manifestId,
          target.layoutId ?? "",
          target.sharedClockId ?? "",
          "tutorial card live sample"
        ];
      case "export-artifact":
        return [
          target.kind,
          target.label,
          target.artifactId,
          target.manifestId,
          target.profileId,
          target.payloadKind,
          "iframe export artifact embed"
        ];
      case "api-catalog-item":
        return [target.kind, target.label, target.itemId];
    }
  });
}

function filterAgendaRows(
  rows: readonly ProjectAgendaRow[],
  query: string
): readonly ProjectAgendaRow[] {
  return rows.filter((row) => agendaRowMatchesQuery(row, query));
}

function createDataContractAgendaRow(): ProjectAgendaRow {
  return {
    id: "project-dashboard-contract",
    title: "Data contract",
    summary: "Canonical dashboard write source and Codex update rule.",
    status: "active",
    detail: "V1 source",
    kind: "other",
    depth: 0,
    tags: ["dashboard", "codex", "source"],
    dataAttributes: [
      ["data-kp-project-dashboard-contract", "true"],
      ["data-kp-project-dashboard-contract-card", "true"]
    ],
    searchFields: [
      "Codex completion rule",
      projectDashboardDataContract.sourceFile,
      projectDashboardDataContract.completionRule,
      projectDashboardDataContract.designDocHref,
      ...projectDashboardDataContract.notes
    ],
    previewFields: [
      { label: "Source", value: projectDashboardDataContract.sourceFile },
      { label: "Design", value: projectDashboardDataContract.designDocHref },
      { label: "Write rule", value: projectDashboardDataContract.completionRule }
    ],
    extraHtml: `
      <span class="project-agenda__note">Source: <a href="${escapeHtml(projectDashboardDataContract.sourceFile)}">${escapeHtml(projectDashboardDataContract.sourceFile)}</a></span>
      <span class="project-agenda__note">Codex completion rule: ${escapeHtml(projectDashboardDataContract.completionRule)}</span>
      <span class="project-agenda__note"><a href="${escapeHtml(projectDashboardDataContract.designDocHref)}">Project dashboard V1 write protocol</a></span>
      <span class="project-agenda__note" data-kp-dashboard-contract-notes>${projectDashboardDataContract.notes.map(escapeHtml).join(" ")}</span>
    `
  };
}

function createOtherAgendaRows(query: string): readonly ProjectAgendaRow[] {
  const contractRow = createDataContractAgendaRow();

  return agendaRowMatchesQuery(contractRow, query) ? [contractRow] : [];
}

function agendaRowMatchesQuery(row: ProjectAgendaRow, query: string): boolean {
  return projectDashboardTextFieldsMatch(
    [
      row.id,
      row.title,
      row.summary,
      row.status,
      row.detail,
      row.kind,
      ...row.tags,
      ...(row.searchFields ?? [])
    ],
    query
  );
}

function renderAgendaBlockers(blockers: readonly string[]): string {
  if (blockers.length === 0) {
    return "";
  }

  return `<span class="project-agenda__note project-agenda__note--blocked" data-kp-blockers>${blockers.map(escapeHtml).join(" ")}</span>`;
}

function renderReportAgendaNotes(theme: ProjectReportTheme): string {
  return `
    <span class="project-agenda__note">Grade: ${escapeHtml(theme.grade ?? "Not reviewed")}</span>
    <span class="project-agenda__note">Last reviewed: ${escapeHtml(theme.lastReviewedOn ?? "Not reviewed")}</span>
    <span class="project-agenda__note">Evidence: ${theme.evidence
      .map(
        (entry) =>
          `<a href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`
      )
      .join(", ") || "None recorded"}</span>
    <span class="project-agenda__note">Risks: ${theme.risks.map(escapeHtml).join(" ") || "None recorded"}</span>
    <span class="project-agenda__note">Next Actions: ${theme.recommendedNextActions.map(escapeHtml).join(" ") || "None recorded"}</span>
  `;
}

function renderAgendaRelatedLinks(
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
    <span class="project-agenda__related">
      ${visibleRelatedIds
        .map((relatedId) => {
          const label = titles.get(relatedId) ?? relatedId;

          return `<a href="#${escapeHtml(relatedId)}">${escapeHtml(label)}</a>`;
        })
        .join("")}
    </span>
  `;
}

function renderAgendaTags(tags: readonly string[]): string {
  if (tags.length === 0) {
    return `<span class="project-agenda__tag project-agenda__tag--muted" data-kp-agenda-tag-tone="muted">none</span>`;
  }

  return tags
    .map((tag) => {
      const tone = tagTone(tag);

      return `<span class="project-agenda__tag project-agenda__tag--${escapeHtml(tone)}" data-kp-agenda-tag-tone="${escapeHtml(tone)}">${escapeHtml(tag)}</span>`;
    })
    .join("");
}

function renderDataAttributes(
  attributes: readonly [string, string][]
): string {
  return attributes
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(" ");
}

function compareProjectCardsForAgenda(
  left: ProjectCard,
  right: ProjectCard
): number {
  const statusDelta =
    PROJECT_DASHBOARD_STATUS_ORDER.indexOf(left.status) -
    PROJECT_DASHBOARD_STATUS_ORDER.indexOf(right.status);

  if (statusDelta !== 0) {
    return statusDelta;
  }

  const priorityDelta =
    PROJECT_DASHBOARD_PRIORITY_ORDER.indexOf(left.priority) -
    PROJECT_DASHBOARD_PRIORITY_ORDER.indexOf(right.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return left.title.localeCompare(right.title);
}

function compareReportThemesForAgenda(
  left: ProjectReportTheme,
  right: ProjectReportTheme
): number {
  const statusDelta =
    PROJECT_DASHBOARD_STATUS_ORDER.indexOf(left.status) -
    PROJECT_DASHBOARD_STATUS_ORDER.indexOf(right.status);

  if (statusDelta !== 0) {
    return statusDelta;
  }

  return left.title.localeCompare(right.title);
}

function compareGalleryItemsForAgenda(
  left: ProjectGalleryItem,
  right: ProjectGalleryItem
): number {
  const kindDelta =
    PROJECT_GALLERY_KIND_ORDER.indexOf(left.kind) -
    PROJECT_GALLERY_KIND_ORDER.indexOf(right.kind);

  if (kindDelta !== 0) {
    return kindDelta;
  }

  return left.title.localeCompare(right.title);
}

function statusTone(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "blocked":
      return "blocked";
    case "done":
      return "done";
    case "planned":
      return "planned";
    case "proposed":
      return "planned";
    default:
      return "muted";
  }
}

function tagTone(tag: string): string {
  const normalized = tag.toLowerCase();

  if (/(math|equation|katex|calculus|linear algebra|matrix|vector)/.test(normalized)) {
    return "math";
  }

  if (/(graph|webgl|surface|mesh|donut|timeline|visual)/.test(normalized)) {
    return "visual";
  }

  if (/(programming|code|rust|typescript|api)/.test(normalized)) {
    return "programming";
  }

  if (/(project|dashboard|report|codex|protocol)/.test(normalized)) {
    return "project";
  }

  if (/(blocked|risk|critical|cancelation)/.test(normalized)) {
    return "attention";
  }

  return "muted";
}

function renderAnimationLayoutSection(
  selectedKatexFixture: KatexTransformFixture
): string {
  return `
    <section class="project-dashboard__section project-dashboard__animation-layout" data-kp-project-dashboard-animation-layout aria-labelledby="project-dashboard-animation-layout-title">
      <div class="project-dashboard__section-header">
        <h2 id="project-dashboard-animation-layout-title">Animation Layout</h2>
        <span>KaTeX fixtures</span>
      </div>
      ${renderKatexTransformFixtureGallery(selectedKatexFixture)}
    </section>
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
    return `<p class="project-dashboard__status project-dashboard__status--ok" data-kp-project-dashboard-status>Dashboard data is valid</p>`;
  }

  return `
    <ul class="project-dashboard__status project-dashboard__status--error" data-kp-project-dashboard-status>
      ${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}
    </ul>
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
