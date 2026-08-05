import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpEditorGraphSvgViewportModel,
  projectKpEditorGraphAxes
} from "../src/editor/graph-svg-viewport.ts";

test("graph SVG viewport derives dimensions, domains, and zero axes from graph semantics", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === "animation.derivative-rules.tangent-graph"
  );
  assert.ok(animation);
  const viewport = createKpEditorGraphSvgViewportModel(animation);

  assert.equal(viewport.width, 560);
  assert.equal(viewport.height, 380);
  assert.deepEqual(viewport.xDomain, [-2, 3]);
  assert.deepEqual(viewport.yDomain, [-5, 10]);
  assert.ok(viewport.xAxisY > 20 && viewport.xAxisY < 352);
  assert.ok(viewport.yAxisX > 36 && viewport.yAxisX < 540);
});

test("zero-bounded graph axes share one endpoint without crossing tails", () => {
  const projection = projectKpEditorGraphAxes({
    viewport: {
      width: 640,
      height: 420,
      xDomain: [0, 12],
      yDomain: [0, 20],
      xAxisY: 392,
      yAxisX: 36
    },
    xAxisEnd: 556
  });

  assert.equal(projection.originPolicy, "shared-endpoint");
  assert.deepEqual(
    [projection.x.x1, projection.x.y1],
    [projection.y.x1, projection.y.y1]
  );
  assert.deepEqual(projection.x, { x1: 36, y1: 392, x2: 556, y2: 392 });
  assert.deepEqual(projection.y, { x1: 36, y1: 392, x2: 36, y2: 20 });
});

test("signed graph domains retain crossing axes", () => {
  const projection = projectKpEditorGraphAxes({
    viewport: {
      width: 560,
      height: 380,
      xDomain: [-2, 3],
      yDomain: [-5, 10],
      xAxisY: 241.33333333333334,
      yAxisX: 237.6
    }
  });

  assert.equal(projection.originPolicy, "crossing");
  assert.equal(projection.x.x1, 20);
  assert.equal(projection.y.y1, 360);
});

test("generic retained SVG lifecycle has no domain renderer dependency", () => {
  const source = readFileSync(
    new URL(
      "../src/editor/graph-svg-viewport-lifecycle.ts",
      import.meta.url
    ),
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /economics|physics|matrix|derivative|integral|dot-projection|katex/i
  );
  assert.match(source, /KpEditorGraphSvgViewportRenderer/);
  assert.match(source, /createKpEditorGraphSvgViewportLifecycleAdapter/);
});
