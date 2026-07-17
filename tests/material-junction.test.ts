import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpMaterialJunctionPlan,
  sampleKpMaterialJunction
} from "../src/animation/material-junction.ts";

test("material junction bundles annotations at an operation-selected anchor", () => {
  const plan = fixturePlan();
  assert.equal(plan.sourceBundle.members.length, 2);
  assert.equal(plan.targetBundle.members.length, 2);
  assert.deepEqual(plan.junction, { x: 240, y: 60 });
  assert.equal(plan.pathFamily, "opposite-corner");
  assert.equal(plan.ownershipMode, "fission-fusion");
});

test("all required sources must arrive before target material is seeded", () => {
  const plan = fixturePlan();
  const early = sampleKpMaterialJunction({ plan, progress: 0.6 });
  assert.equal(early.allRequiredSourcesReady, false);
  assert.ok(early.targets.every((target) => target.revealProgress === 0));
  assert.ok(early.sources.every((source) => source.pose.scale >= 0.38));

  const ready = sampleKpMaterialJunction({ plan, progress: 0.7 });
  assert.equal(ready.allRequiredSourcesReady, true);
  assert.ok(ready.targets.every((target) => target.revealProgress > 0));
});

test("sources persist until recognition and native handoff never creates a gap", () => {
  const plan = fixturePlan();
  for (let index = 0; index <= 100; index += 1) {
    const frame = sampleKpMaterialJunction({
      plan,
      progress: index / 100,
      targetGeometryResidualPx: { hook: 0, overbar: 0 }
    });
    const visibleMaterial = Math.max(
      ...frame.sources.map((source) => source.pose.opacity),
      ...frame.targets.map((target) =>
        target.materialPose.opacity + target.nativeOpacity
      )
    );
    assert.ok(visibleMaterial > 0, `No material owner at ${index / 100}.`);
    if (!frame.targetRecognizable) {
      assert.ok(frame.sources.every((source) => source.pose.opacity === 1));
    }
  }
});

test("native settlement waits for refined geometry and ends at exact native pose", () => {
  const plan = fixturePlan();
  const stale = sampleKpMaterialJunction({
    plan,
    progress: 1,
    targetGeometryResidualPx: { hook: 1, overbar: 0 }
  });
  assert.equal(stale.nativeGeometryReady, false);
  assert.ok(stale.targets.every((target) => target.nativeOpacity === 0));
  assert.ok(stale.targets.every((target) => target.materialPose.opacity === 1));

  const settled = sampleKpMaterialJunction({
    plan,
    progress: 1,
    targetGeometryResidualPx: { hook: 0.1, overbar: 0.1 }
  });
  assert.equal(settled.phase, "settled");
  assert.ok(settled.sources.every((source) => source.pose.opacity === 0));
  assert.ok(settled.targets.every((target) =>
    target.nativeOpacity === 1 &&
    target.materialPose.opacity === 0 &&
    target.materialPose.x === 0 &&
    target.materialPose.y === 0 &&
    target.materialPose.scale === 1
  ));
});

test("material junction rejects unmeasured and unlineaged annotations", () => {
  assert.throws(() => createKpMaterialJunctionPlan({
    id: "junction.invalid",
    ownershipMode: "continuant",
    sourceAnnotations: [annotation("source", 0)],
    targetAnnotations: [annotation("target", 0)],
    lineages: [{
      id: "lineage.invalid",
      sourceAnnotationIds: ["source"],
      targetAnnotationIds: ["missing"]
    }],
    measurements: {
      source: { left: 0, top: 0, width: 10, height: 10 },
      target: { left: 20, top: 0, width: 10, height: 10 }
    },
    anchorPolicy: "shared-centroid",
    pathFamily: "arc-above"
  }), /references missing target missing/);

  assert.throws(() => createKpMaterialJunctionPlan({
    id: "junction.invalid-tolerance",
    ownershipMode: "continuant",
    sourceAnnotations: [annotation("source", 0)],
    targetAnnotations: [annotation("target", 0)],
    lineages: [{
      id: "lineage.valid",
      sourceAnnotationIds: ["source"],
      targetAnnotationIds: ["target"]
    }],
    measurements: {
      source: { left: 0, top: 0, width: 10, height: 10 },
      target: { left: 20, top: 0, width: 10, height: 10 }
    },
    anchorPolicy: "shared-centroid",
    pathFamily: "arc-above",
    geometryTolerancePx: 0
  }), /positive finite number/);
});

function fixturePlan() {
  return createKpMaterialJunctionPlan({
    id: "junction.radical-like",
    ownershipMode: "fission-fusion",
    sourceAnnotations: [annotation("numerator", 0), annotation("denominator", 1)],
    targetAnnotations: [annotation("hook", 0), annotation("overbar", 1)],
    lineages: [{
      id: "lineage.notation",
      sourceAnnotationIds: ["numerator", "denominator"],
      targetAnnotationIds: ["hook", "overbar"]
    }],
    measurements: {
      numerator: { left: 20, top: 10, width: 12, height: 10 },
      denominator: { left: 20, top: 34, width: 12, height: 10 },
      hook: { left: 200, top: 40, width: 10, height: 20 },
      overbar: { left: 210, top: 40, width: 30, height: 4 }
    },
    anchorPolicy: "target-opposite-corner",
    pathFamily: "opposite-corner"
  });
}

function annotation(id: string, propagationRank: number) {
  return {
    id,
    semanticRole: id,
    selectorIds: [`selector.${id}`],
    propagationRank
  };
}
