import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpDistributionAreaExemplarLayout
} from "../src/rendering/distribution-area-exemplar-layout.ts";

test("wide area exemplar preserves left-to-right algebra and geometry", () => {
  const layout = planKpDistributionAreaExemplarLayout({ widthPx: 960 });

  assert.equal(layout.mode, "side-by-side");
  assert.ok(layout.algebra.left < layout.area.left);
  assert.equal(layout.algebra.top, layout.area.top);
  assert.ok(layout.algebra.width >= 280);
  assert.ok(layout.area.width >= 280);
  assert.equal(layout.overflow, "page-flow");
});

test("phone area exemplar stacks into page flow without compressing the diagram", () => {
  const layout = planKpDistributionAreaExemplarLayout({ widthPx: 320 });

  assert.equal(layout.mode, "stacked");
  assert.ok(layout.algebra.top < layout.area.top);
  assert.equal(layout.algebra.width, layout.area.width);
  assert.ok(layout.area.height >= 210);
  assert.equal(layout.container.height, layout.requiredHeightPx);
  assert.equal(layout.overflow, "page-flow");
});

test("layout stays contained across its responsive boundary", () => {
  for (const widthPx of [320, 759, 760, 1280]) {
    const layout = planKpDistributionAreaExemplarLayout({ widthPx, topPx: 40 });
    for (const region of [layout.algebra, layout.area]) {
      assert.ok(region.left >= layout.container.left, `${widthPx}: left`);
      assert.ok(region.top >= layout.container.top, `${widthPx}: top`);
      assert.ok(region.left + region.width <= layout.container.left + layout.container.width, `${widthPx}: right`);
      assert.ok(region.top + region.height <= layout.container.top + layout.container.height, `${widthPx}: bottom`);
    }
  }
});

test("layout rejects widths that cannot preserve readable content", () => {
  assert.throws(
    () => planKpDistributionAreaExemplarLayout({ widthPx: 279 }),
    /at least 280px/
  );
});
