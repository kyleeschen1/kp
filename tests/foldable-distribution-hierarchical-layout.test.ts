import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionStaticProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  planKpFoldableDistributionLayout
} from "../src/reader/runtime/foldable-distribution-layout.ts";

function projection(mode: "expanded" | "collapsed") {
  return compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode })
  );
}

test("wide layout keeps every checkpoint on one stable native row", () => {
  const plan = planKpFoldableDistributionLayout({
    projection: projection("expanded"),
    viewport: "wide"
  });

  assert.ok(plan.phases.every(({ policy }) => policy === "single-row"));
  assert.ok(plan.phases.every(({ rows }) => rows.length === 1));
  assert.equal(plan.geometryAuthority, "native-measurement");
  assert.equal(plan.operationSpecificCoordinates, false);
});

test("phone layout stages semantic branches and groups, never pixel routes", () => {
  const plan = planKpFoldableDistributionLayout({
    projection: projection("expanded"),
    viewport: "phone"
  });

  assert.deepEqual(
    plan.phases.map(({ policy }) => policy),
    [
      "semantic-two-row-stage",
      "semantic-two-row-stage",
      "single-row",
      "single-row"
    ]
  );
  assert.ok(plan.phases.slice(0, 2).every(
    ({ lineChangeReason }) =>
      lineChangeReason === "viewport-semantic-staging"
  ));
  assert.equal(JSON.stringify(plan).includes("leftPx"), false);
  assert.equal(JSON.stringify(plan).includes("offset"), false);
});

test("collapsed work uses a single disclosed row without changing phases", () => {
  const expanded = planKpFoldableDistributionLayout({
    projection: projection("expanded"),
    viewport: "phone"
  });
  const collapsed = planKpFoldableDistributionLayout({
    projection: projection("collapsed"),
    viewport: "phone"
  });

  assert.deepEqual(
    expanded.phases.map(({ nodeId }) => nodeId),
    collapsed.phases.map(({ nodeId }) => nodeId)
  );
  assert.deepEqual(
    collapsed.phases.map(({ policy }) => policy),
    [
      "single-row",
      "single-row",
      "single-row",
      "single-row"
    ]
  );
});
