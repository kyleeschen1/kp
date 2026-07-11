import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import {
  collectProjectDashboardIds,
  filterProjectDashboardData,
  groupProjectCardsByStatus,
  groupProjectGalleryItemsByKind,
  validateProjectDashboardData
} from "../src/project-dashboard/model.ts";
import { renderProjectDashboard } from "../src/project-dashboard/render.ts";

test("project dashboard seed data exposes work, gallery, and report records", () => {
  assert.ok(projectDashboardData.cards.length >= 6);
  assert.ok(projectDashboardData.gallery.length >= 11);
  assert.ok(projectDashboardData.reportThemes.length >= 2);
  assert.ok(
    projectDashboardData.cards.some(
      (card) => card.id === "work-rendering-time-protocol"
    )
  );
  assert.ok(
    projectDashboardData.gallery.some(
      (item) => item.id === "animation-cancelation"
    )
  );
  assert.ok(
    projectDashboardData.gallery.some(
      (item) => item.id === "transform-subtract-both-sides"
    )
  );
  assert.ok(
    projectDashboardData.reportThemes.some(
      (theme) => theme.id === "report-animation-protocol"
    )
  );
  assert.ok(
    projectDashboardData.cards.some((card) =>
      card.sourceRefs?.some((sourceRef) =>
        sourceRef.href.includes("src/animation/kernel.ts")
      )
    )
  );
  assert.ok(
    projectDashboardData.gallery.some(
      (item) =>
        item.id === "visual-webgl-graph" &&
        item.sourceRefs?.some((sourceRef) =>
          sourceRef.href.includes("src/rendering/graph-transitions.ts")
        )
    )
  );
});

test("project dashboard ids are unique and related ids resolve", () => {
  const ids = collectProjectDashboardIds(projectDashboardData);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, ids.length);
  assert.deepEqual(validateProjectDashboardData(projectDashboardData), []);
});

test("renderProjectDashboard renders the prototype shell and seeded summaries", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-project-dashboard/);
  assert.match(html, /Project Dashboard/);
  assert.match(html, /data-action="show-editor"/);
  assert.match(html, />Back to Editor</);
  assert.match(html, /Rendering\/time protocol/);
  assert.match(html, /Equation cancelation/);
  assert.match(html, /Animation protocol maturity/);
  assert.match(
    html,
    /<tr class="project-agenda__row"[^>]*data-kp-agenda-row="project-dashboard-contract"/
  );
  assert.match(
    html,
    /<tr class="project-agenda__row"[^>]*data-kp-agenda-row="animation-cancelation"/
  );
  assert.match(
    html,
    /<tr class="project-agenda__row"[^>]*data-kp-agenda-row="report-animation-protocol"/
  );
  assert.doesNotMatch(html, /project-card--row/);
  assert.doesNotMatch(html, /project-dashboard__grid/);
});

test("renderProjectDashboard places validation status beside the title", () => {
  const html = renderProjectDashboard(projectDashboardData);
  const headerStartIndex = html.indexOf('<header class="project-dashboard__header">');
  const headerEndIndex = html.indexOf("</header>", headerStartIndex);
  const statusIndex = html.indexOf("data-kp-project-dashboard-status");

  assert.notEqual(headerStartIndex, -1);
  assert.notEqual(headerEndIndex, -1);
  assert.notEqual(statusIndex, -1);
  assert.ok(headerStartIndex < statusIndex);
  assert.ok(statusIndex < headerEndIndex);
  assert.match(html, /Dashboard data is valid/);
});

test("renderProjectDashboard places global search above agenda sections", () => {
  const html = renderProjectDashboard(projectDashboardData);
  const searchIndex = html.indexOf("data-kp-project-dashboard-search");
  const workSectionIndex = html.indexOf('data-kp-agenda-section="work"');
  const reportsSectionIndex = html.indexOf(
    'data-kp-agenda-section="report-cards"'
  );
  const gallerySectionIndex = html.indexOf(
    'data-kp-agenda-section="object-gallery"'
  );
  const otherSectionIndex = html.indexOf('data-kp-agenda-section="other"');
  const animationSectionIndex = html.indexOf(
    'data-kp-agenda-section="animation-layout"'
  );
  const katexSectionIndex = html.indexOf(
    'data-kp-agenda-section="katex-transforms"'
  );
  const apiSectionIndex = html.indexOf('data-kp-agenda-section="api"');
  const animationLayoutIndex = html.indexOf(
    "data-kp-project-dashboard-animation-layout"
  );

  assert.notEqual(searchIndex, -1);
  assert.notEqual(workSectionIndex, -1);
  assert.notEqual(reportsSectionIndex, -1);
  assert.notEqual(gallerySectionIndex, -1);
  assert.notEqual(otherSectionIndex, -1);
  assert.notEqual(animationSectionIndex, -1);
  assert.notEqual(katexSectionIndex, -1);
  assert.notEqual(apiSectionIndex, -1);
  assert.notEqual(animationLayoutIndex, -1);
  assert.ok(searchIndex < animationLayoutIndex);
  assert.ok(searchIndex < workSectionIndex);
  assert.ok(workSectionIndex < reportsSectionIndex);
  assert.ok(reportsSectionIndex < gallerySectionIndex);
  assert.ok(gallerySectionIndex < animationSectionIndex);
  assert.ok(animationSectionIndex < katexSectionIndex);
  assert.ok(katexSectionIndex < apiSectionIndex);
  assert.ok(apiSectionIndex < otherSectionIndex);
  assert.ok(otherSectionIndex < animationLayoutIndex);
  assert.match(html, /data-action="filter-project-dashboard"/);
  assert.match(html, />Search everything</);
  assert.match(html, /placeholder="Search work, animations, visuals, objects, reports"/);
  assert.match(html, /data-kp-project-dashboard-search-count/);
  assert.match(html, /Showing \d+ of \d+ rows/);
  assert.match(html, /data-action="toggle-project-dashboard-toc"/);
  assert.match(html, />Fold lists into TOC</);
  assert.doesNotMatch(html, /data-kp-animation-sample-search/);
});

test("renderProjectDashboard uses h2 section counts above agenda rows", () => {
  const html = renderProjectDashboard(projectDashboardData);
  const workHeaderIndex = html.indexOf("project-agenda-work-title");
  const workTableIndex = html.indexOf('<table class="project-agenda__table">');

  assert.notEqual(workHeaderIndex, -1);
  assert.notEqual(workTableIndex, -1);
  assert.ok(workHeaderIndex < workTableIndex);
  assert.match(
    html,
    /<h2 id="project-agenda-work-title">Work <span class="project-agenda__count">\(\d+\)<\/span><\/h2>/
  );
  assert.match(
    html,
    /<h2 id="project-agenda-api-title">API <span class="project-agenda__count">\(\d+\)<\/span><\/h2>/
  );
  assert.doesNotMatch(html, />\d+ rows<\/span>/);
});

test("renderProjectDashboard renders animation, KaTeX transform, and API agenda rows", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-agenda-section="animation-layout"/);
  assert.match(html, /data-kp-agenda-section="katex-transforms"/);
  assert.match(html, /data-kp-agenda-section="api"/);
  assert.match(html, /data-kp-agenda-row="animation-layout-linear-equation-solve-x"/);
  assert.match(
    html,
    /data-kp-agenda-row="katex-transform-fraction\.make\.inline-to-stacked"/
  );
  assert.match(html, /data-kp-agenda-row="api-semantic-matrix"/);
  assert.match(html, /data-kp-agenda-api-item="semantic-matrix"/);
});

test("renderProjectDashboard backs gallery and API rows with KP adapter ids", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "api-semantic-matrix"
  });

  assert.match(
    html,
    /data-kp-agenda-row="animation-cancelation"[^>]*data-kp-agenda-adapter-row="kp\.gallery\.animation-cancelation"/
  );
  assert.match(
    html,
    /data-kp-agenda-row="api-semantic-matrix"[^>]*data-kp-agenda-adapter-row="kp\.api\.semantic-matrix"/
  );
  assert.match(html, /data-kp-preview-field="Adapter row"/);
});

test("renderProjectDashboard renders a shared selected row preview", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-project-agenda-preview/);
  assert.match(html, /data-kp-selected-agenda-row="work-rendering-time-protocol"/);
  assert.match(html, /Selected Row/);
  assert.match(html, /Rendering\/time protocol/);
  assert.match(html, /Define the shared clock/);
  assert.match(
    html,
    /data-action="select-project-agenda-row"[^>]*data-kp-select-agenda-row="work-rendering-time-protocol"[^>]*aria-pressed="true"/
  );
});

test("renderProjectDashboard surfaces project and Theseus refs in selected preview", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "work-rendering-time-protocol"
  });

  assert.match(
    html,
    /data-kp-preview-field="Roadmap refs"[^>]*>[\s\S]*docs\/project\/roadmap\.md/
  );
  assert.match(
    html,
    /data-kp-preview-field="Thread refs"[^>]*>[\s\S]*docs\/project\/threads\/semantic-runtime\.md/
  );
  assert.match(
    html,
    /data-kp-preview-field="Review refs"[^>]*>[\s\S]*docs\/project\/reviews\/2026-07-10-next-step-review\.md/
  );
  assert.match(
    html,
    /data-kp-preview-field="Decision refs"[^>]*>[\s\S]*decision\.kp\.semantic-animation-runtime-roadmap/
  );
  assert.match(
    html,
    /data-kp-preview-field="Theseus refs"[^>]*>[\s\S]*run-contract\.kp\.semantic-runtime-roadmap-loop-v1/
  );
});

test("renderProjectDashboard selects API rows into the shared preview", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "api-semantic-matrix"
  });

  assert.match(html, /data-kp-project-agenda-preview/);
  assert.match(html, /data-kp-selected-agenda-row="api-semantic-matrix"/);
  assert.match(html, /Matrix/);
  assert.match(html, /Structured row, column, and entry object/);
  assert.match(html, /data-kp-preview-field="API group"/);
  assert.match(html, /data-kp-preview-field="API category"[^>]*>semantic-object</);
  assert.match(html, /data-kp-preview-field="Protocols"[^>]*>toLatex, evaluate, matrixForm</);
  assert.match(html, /data-kp-preview-field="Views"[^>]*>latex, matrix-grid, linear-map</);
  assert.match(html, /data-kp-preview-field="Computes"[^>]*>shape, determinant</);
  assert.match(
    html,
    /data-kp-preview-field="Capabilities"[^>]*>render \(active\), select \(active\), derive \(planned\), execute \(active\)</
  );
  assert.match(
    html,
    /data-kp-preview-field="Derive descriptors"[^>]*>matrix\.linear-map</
  );
  assert.match(
    html,
    /data-kp-preview-field="Derive targets"[^>]*>linear-map</
  );
  assert.match(
    html,
    /data-kp-preview-field="Computation protocols"[^>]*>evaluate, matrixForm</
  );
  assert.match(html, /data-kp-preview-field="Maturity"[^>]*>active</);
  assert.match(
    html,
    /data-kp-preview-field="Coverage"[^>]*>3 protocols, 3 views, 2 computations</
  );
  assert.match(
    html,
    /data-kp-preview-field="Source refs"[^>]*>API catalog: src\/editor\/api-catalog\.ts</
  );
  assert.match(
    html,
    /data-kp-preview-field="Verification"[^>]*>tests\/api-catalog\.test\.ts, tests\/project-dashboard\.test\.ts</
  );
  assert.match(
    html,
    /data-action="select-project-agenda-row"[^>]*data-kp-select-agenda-row="api-semantic-matrix"[^>]*aria-pressed="true"/
  );
});

test("renderProjectDashboard renders layout object API rows", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "api-layout-pinned-stage"
  });

  assert.match(html, /data-kp-agenda-row="api-layout-split"/);
  assert.match(html, /data-kp-agenda-row="api-layout-overlay"/);
  assert.match(html, /data-kp-agenda-row="api-layout-pinned-stage"/);
  assert.match(html, /data-kp-selected-agenda-row="api-layout-pinned-stage"/);
  assert.match(html, /pinned-stage/);
  assert.match(html, /data-kp-preview-field="API category"[^>]*>layout</);
  assert.match(
    html,
    /data-kp-preview-field="Protocols"[^>]*>render, animate, pin</
  );
  assert.match(
    html,
    /data-kp-preview-field="Preserves"[^>]*>pinned object-time reference, child selector identity</
  );
});

test("renderProjectDashboard selects gallery authoring rows into the shared preview", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "visual-webgl-graph"
  });

  assert.match(html, /data-kp-selected-agenda-row="visual-webgl-graph"/);
  assert.match(html, /data-kp-preview-field="Maturity"[^>]*>active renderer</);
  assert.match(
    html,
    /data-kp-preview-field="Coverage"[^>]*>mesh surface mode, donut surface mode, hyperplane surface mode, shared clock sampler</
  );
  assert.match(
    html,
    /data-kp-preview-field="Source refs"[^>]*>WebGL graph shell: src\/rendering\/graph-webgl\.ts, Graph transition sampler: src\/rendering\/graph-transitions\.ts, Graph semantic objects: src\/semantic\/graph\.ts</
  );
  assert.match(
    html,
    /data-kp-preview-field="Verification"[^>]*>tests\/graph-webgl\.test\.ts, tests\/graph-transitions\.test\.ts, tests\/project-dashboard\.browser\.spec\.ts</
  );
});

test("renderProjectDashboard exposes gallery sample targets as preview links", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "visual-donut-surface"
  });

  assert.match(html, /data-kp-selected-agenda-row="visual-donut-surface"/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open donut graph sample/
  );
  assert.match(html, /data-kp-preview-link="graph-surface-mode"/);
  assert.match(html, /data-kp-preview-graph-id="saddle-orbit-graph"/);
  assert.match(html, /data-kp-preview-graph-surface-mode="donut"/);
});

test("renderProjectDashboard exposes synchronized equation graph sample targets", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "sample-synced-equation-graph-linear-solve"
  });

  assert.match(
    html,
    /data-kp-selected-agenda-row="sample-synced-equation-graph-linear-solve"/
  );
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open synchronized solve sample/
  );
  assert.match(
    html,
    /data-kp-preview-link="synchronized-equation-graph"/
  );
  assert.match(
    html,
    /data-kp-preview-live-animation="linear-equation-solve-x"/
  );
  assert.match(
    html,
    /data-kp-preview-layout-id="layout\.sample\.linear-solve-synchronized-panel"/
  );
  assert.match(html, /data-kp-preview-graph-id="saddle-orbit-graph"/);
  assert.match(html, /data-kp-preview-shared-clock-id="solve-x-shared-clock"/);
});

test("renderProjectDashboard exposes live tutorial card sample targets", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "sample-synced-equation-graph-linear-solve"
  });

  assert.match(html, /data-kp-preview-field="Maturity"[^>]*>active live sample/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>[\s\S]*Open live tutorial card sample/
  );
  assert.match(html, /data-kp-preview-link="tutorial-card"/);
  assert.match(
    html,
    /data-kp-preview-tutorial-card="tutorial\.linear-solve\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-preview-manifest-id="tutorial\.linear-solve\.card"/
  );
  assert.match(
    html,
    /data-kp-preview-field="Tutorial card sample"[^>]*>tutorial\.linear-solve\.card\.live-sample</
  );
  assert.match(
    html,
    /data-kp-preview-field="Tutorial card manifest"[^>]*>tutorial\.linear-solve\.card</
  );
  assert.match(
    html,
    /data-kp-preview-field="Tutorial card clock"[^>]*>solve-x-shared-clock</
  );
  assert.match(html, /src\/tutorial\/linear-solve-card-sample\.ts/);
  assert.match(html, /tests\/linear-solve-tutorial-card-sample\.test\.ts/);
});

test("renderProjectDashboard exposes iframe export artifact sample targets", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "iframe-export-artifact"
  });

  assert.match(html, /data-kp-selected-agenda-row="iframe-export-artifact"/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open iframe export artifact/
  );
  assert.match(html, /data-kp-preview-link="export-artifact"/);
  assert.match(
    html,
    /data-kp-preview-export-artifact="artifact\.linear-solve\.iframe"/
  );
  assert.match(
    html,
    /data-kp-preview-manifest-id="tutorial\.linear-solve\.card"/
  );
  assert.match(
    html,
    /data-kp-preview-export-profile="export\.linear-solve\.iframe"/
  );
  assert.match(
    html,
    /data-kp-preview-field="Export artifact"[^>]*>artifact\.linear-solve\.iframe</
  );
  assert.match(html, /src\/tutorial\/iframe-export-document\.ts/);
  assert.match(html, /tests\/tutorial-card-iframe-document\.test\.ts/);
});

test("renderProjectDashboard exposes static-step export artifact sample targets", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "static-step-export-artifact"
  });

  assert.match(html, /data-kp-selected-agenda-row="static-step-export-artifact"/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open static-step export artifact/
  );
  assert.match(html, /data-kp-preview-link="export-artifact"/);
  assert.match(
    html,
    /data-kp-preview-export-artifact="artifact\.linear-solve\.steps"/
  );
  assert.match(
    html,
    /data-kp-preview-manifest-id="tutorial\.linear-solve\.card"/
  );
  assert.match(
    html,
    /data-kp-preview-export-profile="export\.linear-solve\.steps"/
  );
  assert.match(html, /data-kp-preview-export-payload="json-document"/);
  assert.match(
    html,
    /data-kp-preview-field="Export artifact"[^>]*>artifact\.linear-solve\.steps</
  );
  assert.match(html, /src\/tutorial\/static-step-sequence-renderer\.ts/);
  assert.match(html, /tests\/tutorial-card-static-step-artifact\.test\.ts/);
  assert.match(html, /data-kp-preview-api-item="embed-static-step-export-artifact"/);
});

test("renderProjectDashboard exposes tutorial browser hardening catalog rows", () => {
  const iframeManifestHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "iframe-asset-manifest"
  });
  const hostedReadinessHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "hosted-artifact-readiness"
  });
  const staticHostRootHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "static-host-fixture-root"
  });
  const traceCardHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "programming-execution-trace-card"
  });
  const comparisonHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "synchronized-comparison-card"
  });

  assert.match(
    iframeManifestHtml,
    /data-kp-preview-api-item="embed-iframe-asset-manifest"/
  );
  assert.match(
    iframeManifestHtml,
    /src\/tutorial\/iframe-asset-manifest\.ts/
  );
  assert.match(
    hostedReadinessHtml,
    /data-kp-preview-api-item="embed-hosted-artifact-readiness"/
  );
  assert.match(
    hostedReadinessHtml,
    /src\/tutorial\/hosted-artifact-readiness\.ts/
  );
  assert.match(
    staticHostRootHtml,
    /data-kp-preview-api-item="embed-static-host-fixture-root"/
  );
  assert.match(
    staticHostRootHtml,
    /tests\/packaged-iframe-smoke\.browser\.spec\.ts/
  );
  assert.match(
    staticHostRootHtml,
    /tests\/packaged-static-step-smoke\.browser\.spec\.ts/
  );
  assert.match(
    traceCardHtml,
    /data-kp-preview-tutorial-card="tutorial\.programming\.add\.execution-trace\.card\.live-sample"/
  );
  assert.match(
    traceCardHtml,
    /tests\/programming-execution-trace-card-smoke\.browser\.spec\.ts/
  );
  assert.match(
    comparisonHtml,
    /data-kp-preview-api-item="embed-synchronized-comparison-card"/
  );
  assert.match(
    comparisonHtml,
    /tests\/synchronized-comparison-card\.browser\.spec\.ts/
  );
});

test("renderProjectDashboard exposes semantic object API sample targets", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "semantic-matrix"
  });

  assert.match(html, /data-kp-selected-agenda-row="semantic-matrix"/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open Matrix API sample/
  );
  assert.match(html, /data-kp-preview-link="api-catalog-item"/);
  assert.match(html, /data-kp-preview-api-item="semantic-matrix"/);
});

test("semantic object gallery rows expose matching API sample targets", () => {
  for (const itemId of [
    "semantic-matrix",
    "semantic-equation",
    "semantic-vector",
    "semantic-source-file"
  ]) {
    const html = renderProjectDashboard(projectDashboardData, {
      selectedAgendaRowId: itemId
    });

    assert.match(html, new RegExp(`data-kp-preview-api-item="${itemId}"`));
  }
});

test("renderProjectDashboard exposes SourceFile implementation metadata", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "semantic-source-file"
  });

  assert.match(html, /data-kp-selected-agenda-row="semantic-source-file"/);
  assert.match(
    html,
    /data-kp-preview-field="Sample targets"[^>]*>Open SourceFile API sample/
  );
  assert.match(html, /data-kp-preview-api-item="semantic-source-file"/);
  assert.match(html, /src\/semantic\/source-file\.ts/);
  assert.match(html, /source range selectors/);
});

test("renderProjectDashboard selects KaTeX transform rows into the shared preview", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "katex-transform-fraction.make.inline-to-stacked"
  });

  assert.match(
    html,
    /data-kp-selected-agenda-row="katex-transform-fraction\.make\.inline-to-stacked"/
  );
  assert.match(html, /makeFraction/);
  assert.match(html, /Source LaTeX/);
  assert.match(html, /Target LaTeX/);
  assert.match(html, /x \/ 3/);
  assert.match(html, /\\frac\{x\}\{3\}/);
  assert.match(html, /data-kp-preview-field="Maturity"[^>]*>animation-linked fixture</);
  assert.match(
    html,
    /data-kp-preview-field="Coverage"[^>]*>\d+ source tokens, \d+ target tokens, \d+ structural artifacts, \d+ role changes</
  );
  assert.match(html, /src\/rendering\/katex-transform-fixtures\.ts/);
});

test("renderProjectDashboard links selected animation rows to live samples", () => {
  const animationHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "animation-layout-linear-equation-solve-x"
  });
  const fixtureHtml = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "katex-transform-fraction.make.inline-to-stacked"
  });

  assert.match(
    animationHtml,
    /data-kp-preview-live-animation="linear-equation-solve-x"/
  );
  assert.match(
    animationHtml,
    /href="#project-dashboard-animation-layout-title"/
  );
  assert.match(
    fixtureHtml,
    /data-kp-preview-live-animation="fixture-fraction-make-inline-to-stacked"/
  );
  assert.match(
    fixtureHtml,
    /data-kp-preview-katex-transform-fixture="fraction\.make\.inline-to-stacked"/
  );
});

test("renderProjectDashboard tags fixture-backed animation links with sample fixture ids", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "animation-layout-fixture-radical-rewrite-power-as-root"
  });

  assert.match(
    html,
    /data-kp-preview-live-animation="fixture-radical-rewrite-power-as-root"/
  );
  assert.match(
    html,
    /data-kp-preview-katex-transform-fixture="radical\.rewrite-power-as-root"/
  );
});

test("renderProjectDashboard can fold agenda rows into a table of contents", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    tocOnly: true
  });

  assert.match(html, /data-kp-project-agenda[^>]*data-kp-agenda-toc="true"/);
  assert.match(
    html,
    /data-action="toggle-project-dashboard-toc"[^>]*checked/
  );
  assert.match(
    html,
    /<h2 id="project-agenda-work-title">Work <span class="project-agenda__count">\(\d+\)<\/span><\/h2>/
  );
  assert.doesNotMatch(html, /data-kp-project-agenda-preview/);
  assert.doesNotMatch(html, /<table class="project-agenda__table">/);
  assert.doesNotMatch(html, /data-kp-agenda-row=/);
});

test("groupProjectCardsByStatus groups top-level cards and sorts by priority", () => {
  const groups = groupProjectCardsByStatus([
    {
      id: "active-low",
      title: "Active low",
      category: "todo",
      status: "active",
      priority: "low",
      summary: "Low priority active work.",
      tags: []
    },
    {
      id: "blocked-critical",
      title: "Blocked critical",
      category: "todo",
      status: "blocked",
      priority: "critical",
      summary: "Critical blocked work.",
      tags: []
    },
    {
      id: "active-critical",
      title: "Active critical",
      category: "todo",
      status: "active",
      priority: "critical",
      summary: "Critical active work.",
      tags: [],
      children: [
        {
          id: "child-high",
          title: "Child high",
          category: "todo",
          status: "active",
          priority: "high",
          summary: "Nested child work.",
          tags: []
        }
      ]
    }
  ]);

  assert.deepEqual(
    groups.map((group) => group.status),
    ["active", "planned", "blocked", "done"]
  );
  assert.deepEqual(
    groups.find((group) => group.status === "active")?.cards.map((card) => card.id),
    ["active-critical", "active-low"]
  );
  assert.deepEqual(
    groups.find((group) => group.status === "blocked")?.cards.map((card) => card.id),
    ["blocked-critical"]
  );
});

test("renderProjectDashboard renders work lanes, source refs, children, and related links", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-agenda-status="active"/);
  assert.match(html, /data-kp-agenda-status="planned"/);
  assert.match(html, /data-kp-agenda-status="done"/);
  assert.match(html, /data-kp-agenda-detail="critical"/);
  assert.match(html, /Source refs/);
  assert.match(html, /src\/rendering\/graph-transitions\.ts/);
  assert.match(html, /Verification/);
  assert.match(
    html,
    /data-kp-agenda-row="work-project-dashboard-v1-phase-1"[^>]*data-kp-agenda-depth="1"/
  );
  assert.match(html, /href="#report-dashboard-operations"/);

  assert.match(
    html,
    /<tr class="project-agenda__row"[^>]*data-kp-agenda-row="work-project-dashboard-v1"/
  );
  assert.match(html, /class="project-agenda__title"/);
});

test("groupProjectGalleryItemsByKind groups gallery items by kind", () => {
  const groups = groupProjectGalleryItemsByKind(projectDashboardData.gallery);

  assert.deepEqual(
    groups.map((group) => group.kind),
    [
      "animation",
      "semantic-transform",
      "notation-transform",
      "visual",
      "semantic-object",
      "protocol-api"
    ]
  );
  assert.deepEqual(
    groups
      .find((group) => group.kind === "animation")
      ?.items.map((item) => item.id),
    [
      "animation-cancelation",
      "animation-final-crossfade",
      "sample-synced-equation-graph-linear-solve"
    ]
  );
  assert.deepEqual(
    groups
      .find((group) => group.kind === "visual")
      ?.items.map((item) => item.id),
    [
      "visual-code",
      "visual-donut-surface",
      "visual-hyperplane-slices",
      "visual-mesh-graph",
      "visual-network",
      "visual-table",
      "visual-timeline",
      "visual-webgl-graph"
    ]
  );
  assert.deepEqual(
    groups
      .find((group) => group.kind === "semantic-transform")
      ?.items.map((item) => item.id),
    [
      "transform-cancel-additive-inverse",
      "transform-compute-hessian",
      "transform-compute-jacobian",
      "transform-evaluate-constant-expression",
      "transform-matrix-multiply",
      "transform-rename-variable",
      "transform-subtract-both-sides"
    ]
  );
  assert.deepEqual(
    groups
      .find((group) => group.kind === "notation-transform")
      ?.items.map((item) => item.id),
    [
      "notation-implicit-to-explicit-multiply",
      "notation-inline-to-stacked-fraction",
      "notation-radical-to-exponent"
    ]
  );
});

test("filterProjectDashboardData fuzzy-matches rendered forms", () => {
  const donutResult = filterProjectDashboardData(projectDashboardData, "dnt");

  assert.deepEqual(
    donutResult.gallery.map((item) => item.id),
    ["visual-webgl-graph", "visual-donut-surface"]
  );

  const meshGraphResult = filterProjectDashboardData(
    projectDashboardData,
    "msh surf"
  );

  assert.deepEqual(
    meshGraphResult.gallery.map((item) => item.id),
    ["visual-webgl-graph", "visual-mesh-graph"]
  );

  const syncedResult = filterProjectDashboardData(
    projectDashboardData,
    "syn eq gr"
  );

  assert.deepEqual(
    syncedResult.gallery.map((item) => item.id),
    ["sample-synced-equation-graph-linear-solve"]
  );
});

test("filterProjectDashboardData finds cards and gallery items by text facets", () => {
  const interfaceResult = filterProjectDashboardData(
    projectDashboardData,
    "KpSampler"
  );
  assert.deepEqual(
    interfaceResult.gallery.map((item) => item.id),
    ["gallery-rendering-time-api"]
  );

  const statusResult = filterProjectDashboardData(
    projectDashboardData,
    "graph-transitions.ts"
  );
  assert.deepEqual(
    statusResult.cards.map((card) => card.id),
    ["work-rendering-time-protocol", "work-graph-surface-morphs"]
  );

  const domainResult = filterProjectDashboardData(
    projectDashboardData,
    "linear algebra"
  );
  assert.deepEqual(
    domainResult.gallery.map((item) => item.id),
    ["transform-matrix-multiply", "semantic-matrix", "semantic-vector"]
  );

  const transformResult = filterProjectDashboardData(
    projectDashboardData,
    "SemanticTransformation"
  );
  assert.deepEqual(
    transformResult.gallery.map((item) => item.id),
    [
      "transform-subtract-both-sides",
      "transform-cancel-additive-inverse",
      "transform-evaluate-constant-expression",
      "transform-matrix-multiply",
      "transform-compute-jacobian",
      "transform-compute-hessian",
      "transform-rename-variable",
      "tutorial-card-manifest-v0"
    ]
  );

  const refResult = filterProjectDashboardData(
    projectDashboardData,
    "decision.kp.semantic-animation-runtime-roadmap"
  );
  assert.deepEqual(
    refResult.cards.map((card) => card.id),
    ["work-rendering-time-protocol"]
  );
  assert.ok(
    refResult.gallery.some((item) => item.id === "tutorial-card-manifest-v0")
  );

  const notationResult = filterProjectDashboardData(
    projectDashboardData,
    "NotationTransform"
  );
  assert.deepEqual(
    notationResult.gallery.map((item) => item.id),
    [
      "notation-inline-to-stacked-fraction",
      "notation-radical-to-exponent",
      "notation-implicit-to-explicit-multiply"
    ]
  );
});

test("renderProjectDashboard searches all dashboard data", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "dnt"
  });

  assert.match(html, /data-action="filter-project-dashboard"/);
  assert.match(html, /value="dnt"/);
  assert.match(html, /Showing 2 of \d+ rows/);
  assert.match(html, /data-kp-agenda-row="visual-donut-surface"/);
  assert.match(html, /data-kp-agenda-row="visual-webgl-graph"/);
  assert.doesNotMatch(html, /data-kp-agenda-row="visual-mesh-graph"/);
  assert.doesNotMatch(html, /data-kp-agenda-row="work-project-dashboard-v1"/);
  assert.doesNotMatch(html, /data-kp-agenda-row="report-dashboard-operations"/);
  assert.doesNotMatch(html, /data-kp-agenda-section="work"/);
  assert.doesNotMatch(html, /data-kp-project-dashboard-animation-layout/);
});

test("renderProjectDashboard searches synthetic agenda rows", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "codex completion rule"
  });

  assert.match(html, /data-kp-agenda-section="other"/);
  assert.match(html, /data-kp-agenda-row="project-dashboard-contract"/);
  assert.match(html, /Codex completion rule/);
  assert.doesNotMatch(html, /data-kp-agenda-section="work"/);
  assert.doesNotMatch(html, /data-kp-agenda-section="report-cards"/);
  assert.doesNotMatch(html, /data-kp-agenda-section="object-gallery"/);
  assert.doesNotMatch(html, /data-kp-project-dashboard-animation-layout/);
});

test("renderProjectDashboard searches semantic capability advertisements", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "matrix.linear-map"
  });

  assert.match(html, /Showing 1 of \d+ rows/);
  assert.match(html, /data-kp-agenda-row="api-semantic-matrix"/);
  assert.match(
    html,
    /data-kp-preview-field="Derive descriptors"[^>]*>matrix\.linear-map</
  );
  assert.doesNotMatch(html, /data-kp-agenda-row="api-semantic-equation"/);
});

test("renderProjectDashboard exposes tutorial card manifest protocol row", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "tutorial-card-manifest-v0"
  });

  assert.match(html, /data-kp-agenda-row="tutorial-card-manifest-v0"/);
  assert.match(html, /Tutorial card manifest v0/);
  assert.match(html, /data-kp-preview-field="Maturity"[^>]*>active TS API/);
  assert.match(
    html,
    /data-kp-preview-field="Coverage"[^>]*>[\s\S]*export profiles/
  );
  assert.match(html, /src\/tutorial\/card-manifest\.ts/);
  assert.match(html, /tests\/tutorial-card-manifest\.test\.ts/);
});

test("renderProjectDashboard renders agenda rows with colored statuses and tags", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "timeline"
  });

  assert.match(html, /data-kp-agenda-section="object-gallery"/);
  assert.match(html, /data-kp-agenda-row="visual-timeline"/);
  assert.match(html, /data-kp-agenda-kind="visual"/);
  assert.match(html, /project-agenda__status project-agenda__status--planned/);
  assert.match(html, /data-kp-agenda-tag-tone="project"/);
  assert.match(html, /Timeline/);
  assert.match(html, /scroll clock/);
  assert.doesNotMatch(html, /Equation cancelation/);
});

test("renderProjectDashboard renders KaTeX transform fixture selection UI", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedKatexFixtureId: "radical.rewrite-power-as-root"
  });

  assert.match(html, /data-kp-katex-fixture-gallery/);
  assert.match(html, /KaTeX Transform Fixtures/);
  assert.match(html, /data-action="select-katex-transform-fixture"/);
  assert.match(
    html,
    /data-kp-katex-transform-fixture="fraction\.make\.inline-to-stacked"/
  );
  assert.match(
    html,
    /data-kp-katex-transform-fixture="radical\.rewrite-power-as-root"[^>]*aria-pressed="true"/
  );
  assert.match(html, /data-kp-katex-fixture-sample/);
  assert.match(
    html,
    /data-kp-selected-katex-transform-fixture="radical\.rewrite-power-as-root"/
  );
  assert.match(
    html,
    /data-kp-linked-equation-animation="fixture-radical-rewrite-power-as-root"/
  );
  assert.match(html, /Editor animation available/);
  assert.match(html, /rewritePowerAsRoot/);
  assert.match(html, /Power notation becomes radical notation/);
});

test("project dashboard report themes include reviewed and unreviewed assessment fields", () => {
  const animationTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-animation-protocol"
  );
  const programmingTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-programming-readiness"
  );

  assert.equal(animationTheme?.grade, "B-");
  assert.equal(animationTheme?.lastReviewedOn, "2026-07-08");
  assert.ok(animationTheme?.evidence.some((entry) => entry.href.includes("rendering-time-protocol")));
  assert.ok(animationTheme?.risks.some((risk) => risk.includes("Graph playback")));
  assert.ok(
    animationTheme?.recommendedNextActions.some((action) =>
      action.includes("shared playhead")
    )
  );

  assert.equal(programmingTheme?.grade, undefined);
  assert.equal(programmingTheme?.lastReviewedOn, undefined);
  assert.ok(programmingTheme?.risks.some((risk) => risk.includes("code-domain")));
});

test("project dashboard includes semantic animation readiness checklist theme", () => {
  const readinessTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-semantic-animation-readiness"
  );

  assert.equal(readinessTheme?.title, "Semantic animation readiness");
  assert.equal(readinessTheme?.status, "active");
  assert.equal(readinessTheme?.grade, "C");
  assert.ok(
    readinessTheme?.questions.some((question) =>
      question.includes("semantic source and target objects")
    )
  );
  assert.ok(
    readinessTheme?.questions.some((question) =>
      question.includes("sampled at arbitrary progress and rewound")
    )
  );
  assert.ok(
    readinessTheme?.evidence.some((entry) =>
      entry.href.includes("katex-transform-taxonomy-design")
    )
  );
  assert.ok(
    readinessTheme?.recommendedNextActions.some((action) =>
      action.includes("Run this checklist")
    )
  );
});

test("project dashboard includes semantic runtime readiness report card", () => {
  const runtimeTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-semantic-runtime-readiness"
  );

  assert.equal(runtimeTheme?.title, "Semantic runtime readiness");
  assert.equal(runtimeTheme?.status, "active");
  assert.equal(runtimeTheme?.grade, "A-");
  assert.equal(runtimeTheme?.lastReviewedOn, "2026-07-11");
  assert.ok(
    runtimeTheme?.scope.includes(
      "live tutorial cards with synchronized equation and graph panels"
    )
  );
  assert.ok(
    runtimeTheme?.questions.some((question) =>
      question.includes("sample arbitrary progress")
    )
  );
  assert.ok(
    runtimeTheme?.questions.some((question) =>
      question.includes("layout composition")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/card-html-shell.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/export-profile-resolver.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/export-artifact-catalog.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/static-step-sequence-renderer.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/programming-card-sample.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/graph-parent-timeline-diagnostic.ts")
    )
  );
  assert.ok(
    runtimeTheme?.evidence.some((entry) =>
      entry.href.includes(
        "docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md"
      )
    )
  );
  assert.ok(
    runtimeTheme?.risks.some((risk) =>
      risk.includes("GIF and video encoders are still profile metadata")
    )
  );
  assert.ok(
    runtimeTheme?.recommendedNextActions.some((action) =>
      action.includes("Close the export/embed loop")
    )
  );
  assert.deepEqual(runtimeTheme?.relatedIds, [
    "work-rendering-time-protocol",
    "gallery-rendering-time-api",
    "sample-synced-equation-graph-linear-solve",
    "tutorial-card-manifest-v0",
    "iframe-export-artifact",
    "static-step-export-artifact",
    "semantic-source-file"
  ]);
});

test("project dashboard includes tutorial launch readiness report card", () => {
  const launchTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-tutorial-launch-readiness"
  );

  assert.equal(launchTheme?.title, "Tutorial launch readiness");
  assert.equal(launchTheme?.status, "active");
  assert.equal(launchTheme?.grade, "A-");
  assert.equal(launchTheme?.lastReviewedOn, "2026-07-11");
  assert.ok(
    launchTheme?.questions.some((question) =>
      question.includes("browser-reachable")
    )
  );
  assert.ok(
    launchTheme?.questions.some((question) =>
      question.includes("deterministic progress")
    )
  );
  assert.ok(
    launchTheme?.questions.some((question) =>
      question.includes("nonblank panel content")
    )
  );
  assert.ok(
    launchTheme?.evidence.some((entry) =>
      entry.href.includes("tests/tutorial-launch-smoke.browser.spec.ts")
    )
  );
  assert.ok(
    launchTheme?.evidence.some((entry) =>
      entry.href.includes("tests/tutorial-card-seek-smoke.browser.spec.ts")
    )
  );
  assert.ok(
    launchTheme?.evidence.some((entry) =>
      entry.href.includes("tests/tutorial-panel-nonblank-smoke.browser.spec.ts")
    )
  );
  assert.ok(
    launchTheme?.risks.some((risk) => risk.includes("smoke-level"))
  );
  assert.ok(
    launchTheme?.recommendedNextActions.some((action) =>
      action.includes("Close the browser hardening loop")
    )
  );
  assert.deepEqual(launchTheme?.relatedIds, [
    "report-semantic-runtime-readiness",
    "sample-synced-equation-graph-linear-solve",
    "iframe-export-artifact",
    "static-step-export-artifact",
    "semantic-source-file",
    "iframe-asset-manifest",
    "programming-execution-trace-card",
    "synchronized-comparison-card"
  ]);
});

test("project dashboard includes hosted package readiness report card", () => {
  const hostedTheme = projectDashboardData.reportThemes.find(
    (theme) => theme.id === "report-hosted-package-readiness"
  );

  assert.equal(hostedTheme?.title, "Hosted package readiness");
  assert.equal(hostedTheme?.status, "active");
  assert.equal(hostedTheme?.grade, "B+");
  assert.equal(hostedTheme?.lastReviewedOn, "2026-07-11");
  assert.ok(
    hostedTheme?.scope.includes(
      "static-hosted iframe and static-step tutorial artifacts"
    )
  );
  assert.ok(
    hostedTheme?.questions.some((question) =>
      question.includes("relative asset paths")
    )
  );
  assert.ok(
    hostedTheme?.questions.some((question) =>
      question.includes("fallback metadata")
    )
  );
  assert.ok(
    hostedTheme?.evidence.some((entry) =>
      entry.href.includes("src/tutorial/static-host-fixture-root.ts")
    )
  );
  assert.ok(
    hostedTheme?.evidence.some((entry) =>
      entry.href.includes("tests/packaged-iframe-smoke.browser.spec.ts")
    )
  );
  assert.ok(
    hostedTheme?.evidence.some((entry) =>
      entry.href.includes("tests/packaged-static-step-smoke.browser.spec.ts")
    )
  );
  assert.ok(
    hostedTheme?.risks.some((risk) =>
      risk.includes("production deployment smoke")
    )
  );
  assert.ok(
    hostedTheme?.recommendedNextActions.some((action) =>
      action.includes("parent-timeline frame sampling")
    )
  );
  assert.deepEqual(hostedTheme?.relatedIds, [
    "hosted-artifact-readiness",
    "static-host-fixture-root",
    "iframe-export-artifact",
    "static-step-export-artifact",
    "report-tutorial-launch-readiness"
  ]);
});

test("renderProjectDashboard renders report card evidence, risks, review metadata, and next actions", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-project-report-theme="report-animation-protocol"/);
  assert.match(html, /Grade/);
  assert.match(html, /B-/);
  assert.match(html, /Last reviewed/);
  assert.match(html, /2026-07-08/);
  assert.match(html, /Evidence/);
  assert.match(html, /href="docs\/superpowers\/specs\/2026-07-08-rendering-time-protocol-design\.md"/);
  assert.match(html, /Risks/);
  assert.match(html, /Graph playback still needs the shared playhead contract/);
  assert.match(html, /Next Actions/);
  assert.match(html, /Adapt graph surface morphs to the shared playhead/);
  assert.match(html, /Programming object readiness/);
  assert.match(html, /Not reviewed/);
});

test("renderProjectDashboard selects semantic runtime readiness report card", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "report-semantic-runtime-readiness"
  });

  assert.match(
    html,
    /data-kp-selected-agenda-row="report-semantic-runtime-readiness"/
  );
  assert.match(html, /Semantic runtime readiness/);
  assert.match(html, /data-kp-preview-field="Grade"[^>]*>A-/);
  assert.match(
    html,
    /data-kp-preview-field="Risks"[^>]*>[\s\S]*GIF and video encoders/
  );
  assert.match(html, /src\/tutorial\/export-profile-resolver\.ts/);
});

test("renderProjectDashboard selects tutorial launch readiness report card", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "report-tutorial-launch-readiness"
  });

  assert.match(
    html,
    /data-kp-selected-agenda-row="report-tutorial-launch-readiness"/
  );
  assert.match(html, /Tutorial launch readiness/);
  assert.match(html, /data-kp-preview-field="Grade"[^>]*>A-/);
  assert.match(html, /tests\/tutorial-card-seek-smoke\.browser\.spec\.ts/);
});

test("renderProjectDashboard renders the data contract for dashboard writes", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-project-dashboard-contract/);
  assert.match(html, /Data contract/);
  assert.match(html, /src\/project-dashboard\/data\.ts/);
  assert.match(html, /Browser edits are not persisted in V1/);
  assert.match(html, /Authoring metadata should point rows back to source refs/);
  assert.match(html, /Codex completion rule/);
  assert.match(
    html,
    /href="docs\/superpowers\/specs\/2026-07-08-project-dashboard-v1-design\.md"/
  );
});

test("renderProjectDashboard keeps KaTeX operator visual tuning off the dashboard", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.doesNotMatch(html, /data-kp-visual-tuning/);
  assert.doesNotMatch(html, /data-action="set-katex-operator-scale"/);
  assert.doesNotMatch(html, /data-role="katex-operator-scale-output"/);
});

test("project dashboard v1 card records completed Codex phase updates", () => {
  const dashboardCard = projectDashboardData.cards.find(
    (card) => card.id === "work-project-dashboard-v1"
  );
  const reportCardPhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-4"
  );
  const browserVerificationPhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-6"
  );
  const authoringCatalogPhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-7"
  );
  const liveSamplePhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-8"
  );
  const sampleTargetPhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-9"
  );
  const apiSampleTargetPhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-10"
  );
  const apiSampleCoveragePhase = dashboardCard?.children?.find(
    (card) => card.id === "work-project-dashboard-v1-phase-11"
  );

  assert.equal(dashboardCard?.status, "done");
  assert.equal(reportCardPhase?.status, "done");
  assert.equal(reportCardPhase?.priority, "high");
  assert.ok(reportCardPhase?.tags.includes("codex-update"));
  assert.match(reportCardPhase?.summary ?? "", /report-card themes/);
  assert.equal(browserVerificationPhase?.status, "done");
  assert.ok(browserVerificationPhase?.tags.includes("browser-verification"));
  assert.match(browserVerificationPhase?.summary ?? "", /dashboard round trip/);
  assert.equal(authoringCatalogPhase?.status, "done");
  assert.ok(authoringCatalogPhase?.tags.includes("authoring-catalog"));
  assert.ok(
    authoringCatalogPhase?.sourceRefs?.some((sourceRef) =>
      sourceRef.href.includes("src/project-dashboard/render.ts")
    )
  );
  assert.equal(liveSamplePhase?.status, "done");
  assert.ok(liveSamplePhase?.tags.includes("live-samples"));
  assert.ok(
    liveSamplePhase?.sourceRefs?.some((sourceRef) =>
      sourceRef.href.includes("src/main.ts")
    )
  );
  assert.equal(sampleTargetPhase?.status, "done");
  assert.ok(sampleTargetPhase?.tags.includes("sample-targets"));
  assert.ok(
    sampleTargetPhase?.sourceRefs?.some((sourceRef) =>
      sourceRef.href.includes("src/project-dashboard/model.ts")
    )
  );
  assert.equal(apiSampleTargetPhase?.status, "done");
  assert.ok(apiSampleTargetPhase?.tags.includes("api-samples"));
  assert.ok(
    apiSampleTargetPhase?.sourceRefs?.some((sourceRef) =>
      sourceRef.href.includes("tests/project-dashboard.browser.spec.ts")
    )
  );
  assert.equal(apiSampleCoveragePhase?.status, "done");
  assert.ok(apiSampleCoveragePhase?.tags.includes("api-samples"));
  assert.ok(
    apiSampleCoveragePhase?.sourceRefs?.some((sourceRef) =>
      sourceRef.href.includes("tests/project-dashboard.test.ts")
    )
  );
});
