import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import {
  collectProjectDashboardIds,
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
