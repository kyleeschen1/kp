import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  constantForceWorkEnergyAnimationId,
  constantForceWorkEnergyTransformationId,
  createConstantForceWorkEnergyAnimationAsset
} from "../src/animation/constant-force-work-energy-adapter.ts";

test("physics asset keeps graph and diagram semantics in one native target", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const target = animation.renderTargets[0];

  assert.equal(animation.id, constantForceWorkEnergyAnimationId);
  assert.deepEqual(
    animation.bundle.objects.map(({ id, objectType }) => [id, objectType]),
    [
      [
        "model.physics.work-energy.constant-horizontal-net-force",
        "physics-constant-force-work-energy-model"
      ],
      ["graph.physics.work-energy.force-position", "graph-2d"],
      ["axis.physics.work-energy.position", "axis-2d"],
      ["axis.physics.work-energy.force-x", "axis-2d"],
      ["diagram.physics.work-energy.initial", "diagram-scene"],
      ["diagram.physics.work-energy.final", "diagram-scene"],
      [
        "parameter.physics.work-energy.net-force-newtons",
        "physics-force-parameter"
      ],
      ["area.physics.work-energy.accumulated-work", "physics-work-area"],
      ["relation.physics.work-energy.theorem", "physics-work-energy-relation"],
      ["state.physics.work-energy.initial", "physics-work-energy-state"],
      ["state.physics.work-energy.final", "physics-work-energy-state"]
    ]
  );
  assert.equal(target?.kind, "graph");
  assert.equal(target?.metadata?.["graphMotionKind"], "physics-constant-force-work-energy");
  assert.equal(
    target?.metadata?.["initialDiagramId"],
    "diagram.physics.work-energy.initial"
  );
  assert.equal(
    target?.metadata?.["finalDiagramId"],
    "diagram.physics.work-energy.final"
  );
  assert.equal(animation.layout?.kind, "single");
});

test("physics transformation preserves one object, force, area, and theorem lineage", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const transformation = animation.transformations[0]!;
  const correspondence = new Map(
    transformation.correspondence.map((record) => [
      record.sourceSelectorId,
      record
    ])
  );

  assert.equal(transformation.id, constantForceWorkEnergyTransformationId);
  assert.deepEqual(transformation.preserves, ["identity", "role", "structure"]);
  assert.equal(
    correspondence.get("diagram.physics.work-energy.initial.block")
      ?.targetSelectorId,
    "diagram.physics.work-energy.final.block"
  );
  assert.deepEqual(
    correspondence.get("diagram.physics.work-energy.initial.net-force")
      ?.preserves,
    ["identity", "value", "role"]
  );
  assert.equal(
    correspondence.get("area.physics.work-energy.accumulated-work.body")
      ?.targetSelectorId,
    "area.physics.work-energy.accumulated-work.body"
  );
  assert.equal(
    correspondence.get("relation.physics.work-energy.theorem.equation")
      ?.targetSelectorId,
    "relation.physics.work-energy.theorem.equation"
  );
});

test("physics asset closes semantic and seek-rewind references", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);

  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  assert.equal(refs.renderTargetRefs[0]?.kind, "graph");
  assert.ok(
    refs.semanticObjectRefs.some(
      ({ objectId }) => objectId === "diagram.physics.work-energy.final"
    )
  );
});
