import assert from "node:assert/strict";
import test from "node:test";

import { linearEquationExemplarTheme } from "../src/app-adapters/concept-room-theme.ts";
import {
  createKpDistributionAreaExemplarSvgScene
} from "../src/rendering/distribution-area-exemplar-svg.ts";

test("area SVG scene uses the shared KP theme and KaTeX typography", () => {
  const scene = createKpDistributionAreaExemplarSvgScene();

  assert.equal(scene.themeId, linearEquationExemplarTheme.id);
  assert.ok(scene.labels.every(({ fontFamily }) => fontFamily === "KaTeX_Main"));
  assert.ok(scene.labels.every(({ html }) => html.includes("class=\"katex\"")));
  assert.ok(scene.regions.every(({ fill, stroke }) =>
    fill.includes("--kp-concept-") && stroke === "var(--kp-concept-line)"
  ));
});

test("area SVG scene preserves the exact partition and semantic hooks", () => {
  const scene = createKpDistributionAreaExemplarSvgScene();

  assert.equal(scene.regions[0]!.x, scene.outline.x);
  assert.equal(scene.regions[0]!.width, scene.dividerX - scene.outline.x);
  assert.equal(scene.regions[1]!.x, scene.dividerX);
  assert.equal(
    scene.regions[1]!.x + scene.regions[1]!.width,
    scene.outline.x + scene.outline.width
  );
  assert.deepEqual(scene.labels.map(({ latex }) => latex), ["3", "x", "2", "3x", "6"]);
  assert.ok(scene.labels.every(({ semanticId }) => semanticId.includes("partitioned-rectangle")));
});

test("area SVG scene remains the exact two-region exemplar", () => {
  const scene = createKpDistributionAreaExemplarSvgScene();

  assert.equal(scene.viewBox, "0 0 600 320");
  assert.equal(scene.regions.length, 2);
  assert.match(scene.accessibleText, /height 3.*widths x and 2.*areas 3x and 6/);
});
