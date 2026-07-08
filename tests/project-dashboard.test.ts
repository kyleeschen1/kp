import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import {
  collectProjectDashboardIds,
  groupProjectCardsByStatus,
  validateProjectDashboardData
} from "../src/project-dashboard/model.ts";
import { renderProjectDashboard } from "../src/project-dashboard/render.ts";

test("project dashboard seed data exposes work, gallery, and report records", () => {
  assert.ok(projectDashboardData.cards.length >= 6);
  assert.ok(projectDashboardData.gallery.length >= 4);
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
