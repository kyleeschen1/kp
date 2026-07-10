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
});

test("renderProjectDashboard places the animation layout first", () => {
  const html = renderProjectDashboard(projectDashboardData);
  const animationLayoutIndex = html.indexOf(
    "data-kp-project-dashboard-animation-layout"
  );
  const dataContractIndex = html.indexOf("data-kp-project-dashboard-contract");
  const workSectionIndex = html.indexOf("project-dashboard-work-title");

  assert.notEqual(animationLayoutIndex, -1);
  assert.notEqual(dataContractIndex, -1);
  assert.notEqual(workSectionIndex, -1);
  assert.ok(animationLayoutIndex < dataContractIndex);
  assert.ok(animationLayoutIndex < workSectionIndex);
  assert.match(html, /placeholder="Search rendered forms, animations, objects"/);
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

test("renderProjectDashboard renders work lanes, blockers, children, and related links", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-work-status="active"/);
  assert.match(html, /data-kp-work-status="planned"/);
  assert.match(html, /data-kp-work-status="blocked"/);
  assert.match(html, /data-kp-work-status="done"/);
  assert.match(html, /data-kp-priority="critical"/);
  assert.match(html, /data-kp-blockers/);
  assert.match(html, /Needs shared playhead protocol before graph morph playback can be unified/);
  assert.match(html, /data-kp-child-card="work-project-dashboard-v1-phase-1"/);
  assert.match(html, /href="#report-dashboard-operations"/);

  const phaseChildId = 'data-kp-child-card="work-project-dashboard-v1-phase-1"';
  const topLevelChildId = 'data-kp-project-card="work-project-dashboard-v1-phase-1"';

  assert.equal(html.includes(phaseChildId), true);
  assert.equal(html.includes(topLevelChildId), false);
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
    ["animation-cancelation", "animation-final-crossfade"]
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
    ["visual-donut-surface"]
  );

  const meshGraphResult = filterProjectDashboardData(
    projectDashboardData,
    "msh gr"
  );

  assert.deepEqual(
    meshGraphResult.gallery.map((item) => item.id),
    ["visual-mesh-graph"]
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

  const statusResult = filterProjectDashboardData(projectDashboardData, "blocked");
  assert.deepEqual(
    statusResult.cards.map((card) => card.id),
    ["work-graph-surface-morphs"]
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
      "transform-rename-variable"
    ]
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

test("renderProjectDashboard renders searchable grouped galleries", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "timeline"
  });

  assert.match(html, /data-action="filter-project-dashboard"/);
  assert.match(html, /value="timeline"/);
  assert.match(html, /data-kp-gallery-kind="animation"/);
  assert.match(html, /data-kp-gallery-kind="semantic-transform"/);
  assert.match(html, /data-kp-gallery-kind="notation-transform"/);
  assert.match(html, /data-kp-gallery-kind="visual"/);
  assert.match(html, /data-kp-gallery-kind="semantic-object"/);
  assert.match(html, /data-kp-gallery-kind="protocol-api"/);
  assert.match(html, /Semantic Transformations/);
  assert.match(html, /Notation Transformations/);
  assert.match(html, /Visuals/);
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

test("renderProjectDashboard renders the data contract for dashboard writes", () => {
  const html = renderProjectDashboard(projectDashboardData);

  assert.match(html, /data-kp-project-dashboard-contract/);
  assert.match(html, /Data contract/);
  assert.match(html, /src\/project-dashboard\/data\.ts/);
  assert.match(html, /Browser edits are not persisted in V1/);
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

  assert.equal(dashboardCard?.status, "done");
  assert.equal(reportCardPhase?.status, "done");
  assert.equal(reportCardPhase?.priority, "high");
  assert.ok(reportCardPhase?.tags.includes("codex-update"));
  assert.match(reportCardPhase?.summary ?? "", /report-card themes/);
  assert.equal(browserVerificationPhase?.status, "done");
  assert.ok(browserVerificationPhase?.tags.includes("browser-verification"));
  assert.match(browserVerificationPhase?.summary ?? "", /dashboard round trip/);
});
