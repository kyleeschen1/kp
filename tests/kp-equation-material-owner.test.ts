import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpMaterialContinuityPlan
} from "../src/animation/material-continuity.ts";
import {
  createKpEquationMaterialOwnerRegistry,
  sampleKpEquationMaterialOwnerHandoff,
  sampleKpEquationMaterialOwnership
} from "../src/rendering/equation-material-owner.ts";

const plan = createKpMaterialContinuityPlan({
  id: "material-plan.solve",
  materialContinuants: [{
    id: "continuant.solve.x",
    authority: {
      kind: "semantic-continuant",
      continuantId: "semantic.solve.x"
    },
    semanticEntityIds: ["initial.x", "solved.x"],
    sourceMotionIds: ["motion.initial.x"],
    targetMotionIds: ["motion.solved.x"],
    ownership: "stable-owner",
    preserveThrough: [
      "movement",
      "operation-boundary",
      "seek",
      "rewind",
      "renderer-handoff"
    ]
  }],
  fragments: [],
  bundles: [],
  envelopeBridges: []
});

test("material owner registry binds source and target motion to one continuant", () => {
  const registry = createKpEquationMaterialOwnerRegistry(plan);
  assert.equal(
    registry.continuantIdByMotionId.get("motion.initial.x"),
    "continuant.solve.x"
  );
  assert.equal(
    registry.continuantIdByMotionId.get("motion.solved.x"),
    "continuant.solve.x"
  );
  assert.equal(
    registry.materialOwnerIdByContinuantId.get("continuant.solve.x"),
    "material-owner.continuant.solve.x"
  );
});

test("material owner holds visual authority between native endpoints", () => {
  const registry = createKpEquationMaterialOwnerRegistry(plan);
  const continuant = plan.materialContinuants[0]!;
  assert.deepEqual(
    sampleKpEquationMaterialOwnership({
      registry,
      continuant,
      progress: 0,
      direction: "forward"
    }).nativeHandoff,
    "source"
  );
  const middle = sampleKpEquationMaterialOwnership({
    registry,
    continuant,
    progress: 0.5,
    direction: "forward"
  });
  assert.equal(middle.nativeHandoff, "material");
  assert.equal(middle.materialOpacity, 1);
  assert.equal(middle.sourceNativeOpacity, 0);
  assert.equal(middle.targetNativeOpacity, 0);
  assert.equal(
    sampleKpEquationMaterialOwnership({
      registry,
      continuant,
      progress: 1,
      direction: "forward"
    }).nativeHandoff,
    "target"
  );
});

test("material ownership rewind is the exact semantic inverse", () => {
  const registry = createKpEquationMaterialOwnerRegistry(plan);
  const continuant = plan.materialContinuants[0]!;
  const forward = sampleKpEquationMaterialOwnership({
    registry,
    continuant,
    progress: 0.25,
    direction: "forward"
  });
  const rewind = sampleKpEquationMaterialOwnership({
    registry,
    continuant,
    progress: 0.75,
    direction: "rewind"
  });
  assert.deepEqual(rewind, forward);
});

test("neutral handoff policy covers persistent, departing, and arriving owners", () => {
  const persistent = sampleKpEquationMaterialOwnerHandoff({
    ownerId: "owner.x",
    progress: 0.5,
    sourcePresent: true,
    targetPresent: true
  });
  assert.equal(persistent.nativeHandoff, "material");
  assert.equal(persistent.materialOpacity, 1);
  assert.equal(persistent.sourceNativeOpacity, 0);
  assert.equal(persistent.targetNativeOpacity, 0);

  const departing = sampleKpEquationMaterialOwnerHandoff({
    ownerId: "owner.plus-three",
    progress: 0.5,
    sourcePresent: true,
    targetPresent: false
  });
  assert.equal(departing.nativeHandoff, "material");
  assert.equal(departing.materialOpacity, 1);
  assert.equal(departing.targetNativeOpacity, 0);

  const arriving = sampleKpEquationMaterialOwnerHandoff({
    ownerId: "owner.four",
    progress: 1,
    sourcePresent: false,
    targetPresent: true
  });
  assert.equal(arriving.nativeHandoff, "target");
  assert.equal(arriving.materialOpacity, 0);
  assert.equal(arriving.targetNativeOpacity, 1);
});

test("neutral handoff policy rejects unsafe timing windows", () => {
  assert.throws(
    () => sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.x",
      progress: 0.5,
      sourcePresent: true,
      targetPresent: true,
      nativeHandoffFraction: 0
    }),
    /must be within/
  );
});
