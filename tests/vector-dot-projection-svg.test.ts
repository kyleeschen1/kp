import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createDotProjectionAnimationAsset
} from "../src/animation/dot-projection-adapter.ts";
import {
  sampleDotProjectionRuntimeFrame
} from "../src/animation/dot-projection-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport.ts";
import {
  kpVectorDotProjectionGraphPresentationProfile,
  renderKpVectorDotProjectionRuntimeContent
} from "../src/rendering/vector-dot-projection-svg.ts";

const animation = createDotProjectionAnimationAsset();
const viewport = createKpEditorGraphSvgViewportModel(animation);

function render(progress: number, direction: "forward" | "rewind" = "forward") {
  const frame = sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    })
  });
  return {
    frame,
    html: renderKpVectorDotProjectionRuntimeContent({ frame, viewport })
  };
}

test("vector view opts into the shared orthographic KaTeX graph language", () => {
  assert.deepEqual(kpVectorDotProjectionGraphPresentationProfile, {
    schemaVersion: "kp.dimensional-continuity-graph-presentation-profile.v1",
    id: "kp.graph.dimensional-continuity.linear-algebra.v1",
    languageId: "kp.graph.dimensional-continuity.v1",
    renderer: "svg",
    projection: "orthographic-xy",
    mathTypography: "katex",
    visualRoles: {
      stable: "teal",
      changing: "rust",
      focal: "ink",
      construction: "quiet-blue",
      plane: "warm"
    }
  });
});

test("vector view uses native KaTeX and stable semantic geometry lineage", () => {
  const { html } = render(3 / 16);

  assert.doesNotMatch(html, /<text(?:\s|>)/);
  assert.match(html, /class="katex"/);
  assert.match(html, /data-kp-vector-dot-projection-beat="component-pair-x"/);
  assert.match(html, /data-kp-vector-component-pair="x" data-kp-vector-component-pair-status="active"/);
  assert.match(html, /data-kp-vector-component-pair="y" data-kp-vector-component-pair-status="pending"/);
  assert.match(html, /data-kp-vector-geometry-id="geometry\.vector\.dot-projection\.left\.component\.x"/);
  assert.match(html, /data-kp-vector-geometry-id="geometry\.vector\.dot-projection\.right\.component\.y"/);
  assert.match(html, /data-kp-vector-geometry-id="geometry\.vector\.dot-projection\.projection\.component\.x"/);
});

test("projection geometry and exact symbolic relation share one runtime frame", () => {
  const { frame, html } = render(11 / 16);

  assert.deepEqual(frame.dropPoint, [3.5, 2.5]);
  assert.match(html, /data-kp-editor-graph-drop-point="3\.5,2\.5"/);
  assert.match(html, /data-kp-editor-graph-dot-product="6"/);
  assert.match(html, /data-kp-vector-dot-projection-beat="projection-drop"/);
  assert.match(html, /data-kp-latex="\\operatorname\{proj\}_\{\\mathbf b\}\(\\mathbf a\)=3\\mathbf b=\(3,3\)"/);
  assert.match(html, /data-kp-editor-graph-projection-point[^>]+r="3\.25"/);
});

test("settlement adds the right-angle witness and exact nonvisual truth", () => {
  const { html } = render(1);

  assert.match(html, /data-kp-vector-right-angle/);
  assert.match(html, /data-kp-vector-nonvisual-summary/);
  assert.match(html, /projection of a onto b is \(3, 3\)/);
  assert.match(html, /perpendicular residual \(1, -1\)/);
  assert.match(html, /data-kp-latex="\\mathbf a=\(3,3\)\+\(1,-1\),\\quad\(1,-1\)\\cdot\\mathbf b=0"/);
});

test("renderer is deterministic under mirrored rewind and owns no vector algebra", () => {
  const forward = render(11 / 16).html;
  const rewind = render(5 / 16, "rewind").html;
  assert.equal(rewind, forward);

  const source = readFileSync(
    new URL("../src/rendering/vector-dot-projection-svg.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /compileKpVectorDotProjectionSemanticModel/);
  assert.doesNotMatch(source, /dotProduct\s*=/);
  assert.doesNotMatch(source, /projectionScale\s*=/);
});
