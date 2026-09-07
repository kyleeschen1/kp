import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  KP_SURFACE_CONTOUR_MODEL_SCHEMA,
  KP_SURFACE_CONTOUR_SCORE_SCHEMA,
  createKpSurfaceContourModel,
  createKpSurfaceContourScore,
  evaluateKpSurfaceContourHeight,
  interpolateKpSurfaceContourProjection,
  kpSurfaceContourEntityIds,
  kpSurfaceContourIdentityId,
  projectKpSurfaceContourBeat,
  sampleKpSurfaceContourLevelSet
} from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";
import {
  createKpSurfaceContourStageAuthority,
  kpSurfaceContourFitContract,
  renderKpSurfaceContourStage
} from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { kpStageFitRectContains } from
  "../src/rendering/stage-fit-contract.ts";
import {
  KP_SURFACE_CONTOUR_KINETIC_FIGURE_PATH,
  isKpSurfaceContourKineticFigureRoute
} from "../src/experiments/kinetic-figure-surface-contour/kinetic-figure-surface-contour-route.ts";
import { validateKpCrossViewCorrespondenceMap } from
  "../src/tutorial/cross-view-correspondence.ts";

test("surface-contour model preserves one exact level-set identity", () => {
  const model = createKpSurfaceContourModel();
  assert.equal(model.schemaVersion, KP_SURFACE_CONTOUR_MODEL_SCHEMA);
  assert.deepEqual(validateKpCrossViewCorrespondenceMap(model.correspondence), []);
  assert.equal(model.correspondence.identities[0]?.id,
    kpSurfaceContourIdentityId);
  assert.deepEqual(model.correspondence.identities[0]?.memberIds, [
    "member.calculus.surface-contour.intersection-3d",
    "member.calculus.surface-contour.contour-2d"
  ]);
});

test("sampled 3D intersections satisfy the same equation as the 2D contour", () => {
  for (const level of [0.8, 1.6, 2.35, 4]) {
    const points = sampleKpSurfaceContourLevelSet({ level, sampleCount: 65 });
    assert.equal(points.length, 65);
    for (const point of points) {
      assert.ok(Math.abs(evaluateKpSurfaceContourHeight(point.x, point.y) -
        level) < 1e-10);
      assert.equal(point.z, level);
    }
    assert.ok(Math.hypot(
      points[0]!.x - points.at(-1)!.x,
      points[0]!.y - points.at(-1)!.y
    ) < 1e-10);
  }
});

test("six semantic beats separate orientation, slicing, transmission, and interpretation", () => {
  const model = createKpSurfaceContourModel();
  const score = createKpSurfaceContourScore(model);
  assert.equal(score.schemaVersion, KP_SURFACE_CONTOUR_SCORE_SCHEMA);
  assert.deepEqual(score.beats.map(({ slug }) => slug), [
    "read-the-surface",
    "choose-a-height",
    "find-the-intersection",
    "project-the-contour",
    "vary-the-level",
    "read-the-map"
  ]);
  const transmission = score.beats[3]!;
  assert.equal(transmission.attentionAct, "transmit-representation");
  assert.deepEqual(score.beats.map(({ representation }) => representation), [
    "surface-3d",
    "surface-3d",
    "surface-3d",
    "top-down-level-set",
    "contour-map",
    "contour-map"
  ]);
  assert.deepEqual(transmission.targetEntityIds, [
    kpSurfaceContourEntityIds.intersection3d
  ]);
});

test("projection is deterministic for direct seek and interpolates one shared level", () => {
  const score = createKpSurfaceContourScore();
  const from = projectKpSurfaceContourBeat(score, 3);
  const to = projectKpSurfaceContourBeat(score, 4);
  assert.deepEqual(projectKpSurfaceContourBeat(score, 4), to);
  const midpoint = interpolateKpSurfaceContourProjection({
    from,
    to,
    progress: 0.5
  });
  assert.equal(midpoint.level, (from.level + to.level) / 2);
  assert.equal(midpoint.viewProgress, 1);
  assert.equal(midpoint.mapProgress, 0.5);
  assert.equal(
    midpoint.entities[kpSurfaceContourEntityIds.intersection3d].presence,
    midpoint.entities[kpSurfaceContourEntityIds.contour2d].presence
  );
  assert.equal(
    midpoint.entities[kpSurfaceContourEntityIds.intersection3d].attention,
    midpoint.entities[kpSurfaceContourEntityIds.contour2d].attention
  );
});

test("stage uses one continuous Graph3D owner and KaTeX-only labels", () => {
  const model = createKpSurfaceContourModel();
  const authority = createKpSurfaceContourStageAuthority();
  const html = renderKpSurfaceContourStage({
    model,
    authority
  });
  assert.match(html, /data-kp-type="graph-3d"/u);
  assert.match(html, /class="katex"/u);
  assert.doesNotMatch(html, /<text(?:\s|>)/u);
  assert.match(html, /data-kp-surface-contour-view="continuous"/u);
  assert.match(html, /data-kp-stage-fit-contract="kp.stage-fit-contract.v1"/u);
  assert.doesNotMatch(html, /kp-surface-contour-stage__views/u);
  assert.equal(html.match(new RegExp(
    `data-kp-semantic-identity="${kpSurfaceContourIdentityId}"`, "gu"
  ))?.length, 1);
  assert.equal(authority.fitContract, kpSurfaceContourFitContract);
  assert.equal(authority.fitPlan.status, "fitted");
  assert.equal(kpStageFitRectContains(
    authority.fitPlan.safeRect,
    authority.fitPlan.sweptBounds,
    0.75
  ), true);
  assert.ok(authority.graph3d.camera.scale < 46);
  assert.ok(authority.graphTopDown.camera.scale > authority.graph3d.camera.scale);
});

test("surface-contour route is standalone and slash-stable", async () => {
  assert.equal(KP_SURFACE_CONTOUR_KINETIC_FIGURE_PATH,
    "/experiments/kinetic-figure/surface-contour/");
  assert.equal(isKpSurfaceContourKineticFigureRoute(
    "/experiments/kinetic-figure/surface-contour"), true);
  assert.equal(isKpSurfaceContourKineticFigureRoute(
    "/experiments/kinetic-figure/surface-contour/"), true);
  const html = await readFile(
    "experiments/kinetic-figure/surface-contour/index.html",
    "utf8"
  );
  assert.match(html, /kinetic-figure-surface-contour-page\.ts/u);
});

test("surface-contour standalone and embedded hosts share one Focus Deck card", () => {
  const source = readFileSync(
    "src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry.ts",
    "utf8"
  );
  assert.match(source, /export function renderKpSurfaceContourFocusCard/u);
  assert.match(source, /export function mountKpSurfaceContourFocusCard/u);
  assert.match(source, /renderKpFocusDeckScaffold\(/u);
  assert.match(source, /renderKpSurfaceContourFocusCard\(input\)/u);
  assert.equal((source.match(/renderKpSurfaceContourStage\(/gu) ?? []).length, 1);
});
