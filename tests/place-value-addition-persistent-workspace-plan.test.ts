import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpPlaceValuePersistentWorkspacePlan,
  compileKpPlaceValuePersistentWorkspacePlan,
  isKpPlaceValuePersistentWorkspacePlan
} from "../src/animation/place-value-addition-persistent-workspace.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../src/reader/compiler/place-value-addition-visual-reference.ts";

test("persistent workspace plan closes every native cell and trace beat", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const expectedEntities = [
    ...reference.primaryStage.initialCells.map(({ id }) => id),
    ...reference.primaryStage.carrySlots.map(({ id }) => id),
    ...reference.primaryStage.resultSlots.map(({ id }) => id),
    reference.primaryStage.underline.id
  ];

  assert.equal(isKpPlaceValuePersistentWorkspacePlan(plan), true);
  assert.deepEqual(plan.nativeEntityIds, expectedEntities);
  assert.equal(new Set(plan.nativeEntityIds).size, 13);
  assert.deepEqual(
    plan.beatIds,
    reference.beats.map(({ id }) => id)
  );
  assert.equal(plan.lifetimes.length, plan.nativeEntityIds.length);
  assert.ok(plan.lifetimes.every(
    ({ startPermille, endPermille, nodePolicy }) =>
      startPermille === 0 &&
      endPermille === 1_000 &&
      nodePolicy === "same-connected-node"
  ));
});

test("first plan exposes only the approved ones operation", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();

  assert.equal(plan.implementationScope, "ones-cycle-only");
  assert.equal(plan.generalizationGate, "human-ones-checkpoint");
  assert.deepEqual(
    plan.onesOperation.contributionRoutes.map(
      ({ materialEntityId, kind, to }) => ({
        materialEntityId,
        kind,
        target: to.semanticEntityId
      })
    ),
    [
      {
        materialEntityId: "digit.first.ones",
        kind: "converge",
        target: "evaluation.ones.total"
      },
      {
        materialEntityId: "digit.second.ones",
        kind: "converge",
        target: "evaluation.ones.total"
      }
    ]
  );
  assert.equal(plan.onesOperation.result.route.kind, "converge");
  assert.equal(plan.onesOperation.carry.route.kind, "carry-arch");
  assert.equal(
    plan.onesOperation.carry.handoff.endpoint.semanticEntityId,
    "carry.tens"
  );
  assert.equal(
    "tensOperation" in plan || "hundredsOperation" in plan,
    false
  );
});

test("workspace plan contains policy and lineage but no geometry", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const encoded = JSON.stringify(plan);

  assert.equal(/"(?:x|y|left|top|width|height|offset|scale)":/u.test(
    encoded
  ), false);
  assert.ok(plan.regions.every(
    ({ geometryAuthority }) =>
      geometryAuthority === "connected-native-paint"
  ));
  assert.ok([
    plan.onesOperation.result.transit,
    plan.onesOperation.carry.transit
  ].every(
    ({ paintPolicy, releasePolicy }) =>
      paintPolicy === "visible-and-opaque-through-route" &&
      releasePolicy === "only-after-native-endpoint-match"
  ));
});

test("workspace plan authority is nominal and copy-resistant", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();

  assert.equal(bindKpPlaceValuePersistentWorkspacePlan(plan), plan.traceId);
  assert.equal(
    isKpPlaceValuePersistentWorkspacePlan({ ...plan }),
    false
  );
  assert.throws(
    () => bindKpPlaceValuePersistentWorkspacePlan(
      { ...plan } as typeof plan
    ),
    /copied persistent workspace/u
  );
});
