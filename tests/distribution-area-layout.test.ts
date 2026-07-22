import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDistributionAreaLayoutSnapshot,
  createKpDistributionAreaWidthLayoutSnapshot,
  type KpDistributionAreaAnchorMeasurement,
  type KpDistributionAreaStateId
} from "../src/reader/renderers/distribution-area-layout.ts";

const suffixes: Readonly<Record<KpDistributionAreaStateId, readonly string[]>> = {
  factored: ["factor.3", "left-paren", "term.x", "plus", "term.2", "right-paren"],
  distributed: ["left.factor.3", "left.term.x", "plus", "right.factor.3", "right.times", "right.term.2"],
  expanded: ["left.factor.3", "left.term.x", "plus", "right.product.6"]
};

function measurements(): KpDistributionAreaAnchorMeasurement[] {
  let index = 0;
  return (Object.entries(suffixes) as Array<[KpDistributionAreaStateId, readonly string[]]>).flatMap(
    ([stateId, stateSuffixes]) => stateSuffixes.map((suffix) => {
      index += 1;
      return {
        stateId,
        selectorId: `exemplar.state.${stateId}.${suffix}`,
        lineage: suffix.includes("factor.3") ? "factor.3" : suffix,
        rect: { left: 100 + index * 7, top: 50, width: 12, height: 20 }
      };
    })
  );
}

test("distribution layout normalizes every semantic anchor to the algebra root", () => {
  const layout = createKpDistributionAreaLayoutSnapshot({
    revision: 2,
    rootRect: { left: 100, top: 40, width: 400, height: 160 },
    measurements: measurements()
  });

  assert.equal(layout.anchors.length, 16);
  assert.equal(layout.viewport.width, 400);
  assert.equal(layout.anchor("factored", "factor.3").rect.top, 10);
  assert.equal(layout.anchor("expanded", "right.product.6").center.y, 20);
});

test("distribution layout rejects incomplete topology instead of guessing", () => {
  assert.throws(() => createKpDistributionAreaLayoutSnapshot({
    revision: 0,
    rootRect: { left: 0, top: 0, width: 400, height: 160 },
    measurements: measurements().slice(0, -1)
  }), /expanded anchor for right\.product\.6/);
});

test("distribution width layout requires one measured source and target topology", () => {
  const ids = ["source.x", "source.plus", "source.two", "target.x", "target.two"];
  const measurements = ids.map((selectorId, index) => ({
    stateId: "factored" as const,
    selectorId,
    lineage: selectorId,
    rect: { left: 110 + index * 18, top: 55, width: 10, height: 18 }
  }));
  const layout = createKpDistributionAreaWidthLayoutSnapshot({
    revision: 4,
    rootRect: { left: 100, top: 40, width: 400, height: 220 },
    measurements
  });

  assert.equal(layout.anchor("source.x").center.x, 15);
  assert.equal(layout.anchor("target.two").center.y, 24);
  assert.throws(() => createKpDistributionAreaWidthLayoutSnapshot({
    revision: 4,
    rootRect: { left: 100, top: 40, width: 400, height: 220 },
    measurements: measurements.slice(0, -1)
  }), /expected anchor target\.two/);
});
