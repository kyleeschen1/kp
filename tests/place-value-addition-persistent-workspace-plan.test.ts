import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpPlaceValuePersistentWorkspacePlan,
  compileKpPlaceValuePersistentWorkspacePlan,
  isKpPlaceValuePersistentWorkspaceConformance,
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

test("plan exposes the approved ordered position sequence", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const referenceOperation = plan.operations[0]!;

  assert.equal(plan.implementationScope, "ordered-position-sequence");
  assert.equal(plan.generalizationGate, "approved-reference-exemplar");
  assert.deepEqual(
    plan.operations.map(({ position }) => ({
      sequenceIndex: position.sequenceIndex,
      radix: position.radix,
      exponent: position.exponent
    })),
    [
      { sequenceIndex: 0, radix: 10, exponent: 0 },
      { sequenceIndex: 1, radix: 10, exponent: 1 },
      { sequenceIndex: 2, radix: 10, exponent: 2 }
    ]
  );
  assert.deepEqual(
    referenceOperation.contributionRoutes.map(
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
  assert.equal(referenceOperation.outputs[0]!.route.kind, "converge");
  assert.equal(referenceOperation.outputs[1]!.route.kind, "carry-arch");
  assert.equal(
    referenceOperation.outputs[1]!.handoff.endpoint.semanticEntityId,
    "carry.tens"
  );
  assert.equal(plan.operations[2]!.exchangeBeatId, undefined);
  assert.deepEqual(
    plan.operations[2]!.outputs.map(({ role, route, destination }) => ({
      role,
      route: route.kind,
      destination: destination.semanticEntityId
    })),
    [{
      role: "settled-digit",
      route: "converge",
      destination: "result.hundreds"
    }]
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
  assert.ok(plan.operations.flatMap(({ outputs }) => outputs).map(
    ({ transit }) => transit
  ).every(
    ({ paintPolicy, releasePolicy }) =>
      paintPolicy === "visible-and-opaque-through-route" &&
      releasePolicy === "only-after-native-endpoint-match"
  ));
});

test("workspace plan authority is nominal and copy-resistant", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const conformance = bindKpPlaceValuePersistentWorkspacePlan(plan);

  assert.equal(isKpPlaceValuePersistentWorkspaceConformance(
    conformance
  ), true);
  assert.equal(conformance.traceId, plan.traceId);
  assert.equal(conformance.plan, plan);
  assert.equal(conformance.documentaryPolicy,
    "same-connected-node-full-timeline");
  assert.equal(conformance.routePolicy, "measured-no-teleport");
  assert.equal(conformance.ownershipPolicy, "one-visible-owner");
  assert.equal(
    isKpPlaceValuePersistentWorkspaceConformance({ ...conformance }),
    false
  );
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
