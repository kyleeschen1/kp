import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpMaterialContinuityPlan
} from "../src/animation/material-continuity.ts";
import {
  createKpEquationMaterialOwnerRegistry,
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
