import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorGraphSvgViewportModel } from "../src/editor/graph-svg-viewport.ts";

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
