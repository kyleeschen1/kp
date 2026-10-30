import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import test from "node:test";
import { projectVision } from "../src/project-dashboard/vision-data.ts";
import { validateProjectVision, visionNeedsReview } from "../src/project-dashboard/vision-model.ts";
import { renderProjectVision } from "../src/project-dashboard/vision-render.ts";
import { projectDashboardDataContract } from "../src/project-dashboard/data.ts";

test("vision retains scoped evidence and exactly one recommended outcome", () => {
  assert.deepEqual(validateProjectVision(projectVision), []);
  const sources = [projectVision.productSource,
    ...projectVision.areas.flatMap(area => [area.evidence, area.outcome.source]),
    ...projectVision.completed.map(outcome => outcome.source),
    ...projectVision.changes.map(change => change.source)];
  for (const source of sources) assert.ok(existsSync(source.href), source.href);
  assert.ok(projectVision.completed.length > 0, "Keep completed work visible");
  assert.match(projectDashboardDataContract.completionRule, /Theseus owns execution progress/);
  assert.match(projectDashboardDataContract.completionRule, /not a live task queue/);
});

test("a missing or competing recommendation cannot silently become the next plan", () => {
  const none = { ...projectVision, areas: projectVision.areas.map(area => ({ ...area, horizon: "later" as const })) };
  const all = { ...projectVision, areas: projectVision.areas.map(area => ({ ...area, horizon: "next" as const })) };
  for (const candidate of [none, all]) {
    assert.match(validateProjectVision(candidate).join(" "), /exactly one/);
    assert.throws(() => renderProjectVision(candidate), /Invalid project vision/);
  }
});

test("finish conditions, exclusions, identities and sources are required", () => {
  const first = projectVision.areas[0];
  assert.ok(first);
  const missingFinish = { ...projectVision, areas: [{ ...first, outcome: { ...first.outcome, finish: "" } }] };
  const missingExclusion = { ...projectVision, areas: [{ ...first, outcome: { ...first.outcome, excludes: "" } }] };
  const duplicate = { ...projectVision, areas: [first, first] };
  const badSource = { ...projectVision, productSource: { label: "Bad source", href: "docs/project/../../secret.md" as const } };
  for (const candidate of [missingFinish, missingExclusion, duplicate, badSource]) {
    assert.notEqual(validateProjectVision(candidate).length, 0);
  }
});

test("a pivot retains its previous direction, rationale and valid chronology", () => {
  const change = projectVision.changes[0];
  assert.ok(change);
  for (const changes of [[], [{ ...change, before: "" }], [{ ...change, reason: "" }],
    [{ ...change, on: "2026-02-30" }], [{ ...change, on: "2027-01-01" }]]) {
    assert.notEqual(validateProjectVision({ ...projectVision, changes }).length, 0);
  }
  assert.notEqual(validateProjectVision({ ...projectVision, changes: [...projectVision.changes].reverse() }).length, 0);
});

test("snapshot age is visible rather than silently claiming live status", () => {
  assert.equal(visionNeedsReview("2026-10-29", new Date("2026-11-04T23:00:00Z")), false);
  assert.equal(visionNeedsReview("2026-10-29", new Date("2026-11-05T00:00:00Z")), true);
  assert.equal(visionNeedsReview("2026-10-29", new Date("2026-10-28T23:00:00Z")), true);
  const eightDaysAfterReview = new Date(Date.parse(`${projectVision.reviewedOn}T00:00:00Z`) + 8 * 86_400_000);
  const html = renderProjectVision(projectVision, eightDaysAfterReview);
  assert.match(html, /data-kp-vision-freshness="review-due"/);
  assert.match(html, /Review due/);
  assert.match(html, /not an active run/);
  assert.match(html, /not the current commitment queue/);
});

test("source-derived prose is escaped without preventing native disclosures and links", () => {
  const html = renderProjectVision({ ...projectVision, northStar: '<img src=x onerror="alert(1)">' });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /<details>/);
  assert.match(html, /href="\/docs\/project\//);
});
