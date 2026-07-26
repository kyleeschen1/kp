import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedCanonicalCompoundConstruction,
  sampleKpGovernedCanonicalCompoundConstruction
} from "../src/authoring/canonical-animation-public-api.ts";

test("compound construction preserves every canonical child operation", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction();
  const childOperationIds = compound.children.flatMap(({ construction }) =>
    construction.operations.map(({ transformationId }) => transformationId)
  );

  assert.deepEqual(
    compound.operations.map(({ transformationId }) => transformationId),
    childOperationIds
  );
  assert.deepEqual(
    compound.clock.actions.map(({ canonicalOperationId }) =>
      canonicalOperationId
    ),
    childOperationIds
  );
  assert.deepEqual(
    compound.fullDetail.actions.map(({ canonicalOperationId }) =>
      canonicalOperationId
    ),
    childOperationIds
  );
  assert.equal(new Set(compound.operations.map(({ id }) => id)).size, 4);
  assert.deepEqual(compound.operations.map(({ semanticRank }) => semanticRank), [
    0, 1, 2, 3
  ]);
});

test("compound construction uses one contiguous shared clock", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction();

  assert.equal(compound.clock.kind, "kp-causal-chain-plan");
  assert.equal(compound.clock.presentation, "compressed-context");
  assert.equal(compound.clock.segments[0]?.startMs, 0);
  assert.equal(
    compound.clock.segments.at(-1)?.endMs,
    compound.clock.totalDurationMs
  );
  assert.ok(compound.clock.segments.every((segment, index) =>
    segment.startMs === (
      index === 0 ? 0 : compound.clock.segments[index - 1]!.endMs
    )
  ));
  assert.ok(compound.clock.segments.every(
    ({ durationMs }) => durationMs === 180
  ));
  assert.deepEqual(
    compound.clock.actions.slice(1).map(({ dependsOnActionIds }) =>
      dependsOnActionIds
    ),
    compound.clock.actions.slice(0, -1).map(({ id }) => [id])
  );
});

test("compound direct seek and rewind are state-independent", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction();
  const progress = Array.from({ length: 401 }, (_, index) => index / 400);
  const forward = progress.map((value) =>
    sampleKpGovernedCanonicalCompoundConstruction(compound, value)
  );
  const rewind = [...progress].reverse().map((value) =>
    sampleKpGovernedCanonicalCompoundConstruction(compound, value)
  ).reverse();

  assert.deepEqual(rewind, forward);
  assert.deepEqual(
    sampleKpGovernedCanonicalCompoundConstruction(compound, 0.437),
    sampleKpGovernedCanonicalCompoundConstruction(compound, 0.437)
  );
  assert.equal(forward[0]?.operationIndex, 0);
  assert.equal(forward[0]?.localProgress, 0);
  assert.equal(forward.at(-1)?.operationIndex, 3);
  assert.equal(forward.at(-1)?.localProgress, 1);
  assert.ok(forward.every(({ localProgress, elapsedMs }) =>
    localProgress >= 0 &&
    localProgress <= 1 &&
    Number.isFinite(elapsedMs)
  ));
});

test("compound drill-down is optional and restores its exact parent frame", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction({
    parentProgress: 0.371
  });
  const withoutDrillDown = createKpGovernedCanonicalCompoundConstruction({
    includeDrillDown: false
  });

  assert.ok(compound.drillDown);
  assert.equal(compound.drillDown.parentClock.progress, 0.371);
  assert.equal(compound.drillDown.parentClock.paused, true);
  assert.equal(compound.drillDown.childClock.nested, true);
  assert.deepEqual(
    compound.drillDown.actionIds,
    compound.operations.map(({ id }) => id)
  );
  assert.deepEqual(
    compound.drillDown.restore,
    {
      exact: true,
      elapsedMs: compound.drillDown.parentClock.elapsedMs,
      progress: compound.drillDown.parentClock.progress
    }
  );
  assert.equal(withoutDrillDown.drillDown, undefined);
  assert.throws(
    () => createKpGovernedCanonicalCompoundConstruction({
      parentProgress: Number.NaN
    }),
    /normalized/
  );
});

test("compound artifact adds no scheduler or renderer vocabulary", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction();
  const durableChildren = JSON.stringify(compound.children);
  const sourceKinds = new Set(compound.children.map(
    ({ construction }) => construction.kind
  ));

  assert.deepEqual([...sourceKinds], ["canonical-animation-construction"]);
  for (const forbidden of [
    "renderer-session",
    "sourceElement",
    "\"rect\"",
    "fontRevision",
    "viewportKey",
    "keyframes"
  ]) {
    assert.equal(durableChildren.includes(forbidden), false, forbidden);
  }
  assert.equal(compound.clock.kind, compound.fullDetail.kind);
});
