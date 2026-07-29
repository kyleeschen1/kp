import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityPresentationPlan,
  type KpExactFractionQuantityPresentationBeat
} from "../src/animation/exact-fraction-quantity-presentation-plan.ts";
import {
  sampleKpFissionFusion
} from "../src/animation/fission-fusion.ts";
import {
  createKpExactFractionQuantityTrace
} from "../src/semantic/exact-fraction-quantity-trace.ts";

test("every exact-quantity beat binds one canonical operation and motif", () => {
  const trace = createKpExactFractionQuantityTrace();
  const plan = createKpExactFractionQuantityPresentationPlan(trace);

  assert.deepEqual(
    plan.beats.map(({ beatId }) => beatId),
    trace.beats.map(({ id }) => id)
  );
  assert.deepEqual(
    plan.beats.map(({ canonicalOperationId }) => canonicalOperationId),
    [
      "kp.core.focus",
      "kp.core.fan-out",
      "kp.core.group",
      "kp.core.merge",
      "kp.core.persist"
    ]
  );
  assert.deepEqual(
    plan.beats.map(({ motif }) => motif.kind),
    [
      "existing",
      "partition-refinement",
      "existing",
      "part-merge",
      "existing"
    ]
  );
});

test("partition refinement uses existing fission with exact atom lineage", () => {
  const refinement = specializedBeat(
    createKpExactFractionQuantityPresentationPlan().beats[1]!,
    "partition-refinement"
  );

  assert.equal(refinement.canonicalOperationId, "kp.core.fan-out");
  assert.equal(refinement.motif.fissionPlan.mode, "fission");
  assert.equal(refinement.motif.fissionPlan.microStaggerSpan, 0);
  assert.equal(refinement.motif.fissionPlan.junctionScale, 1);
  assert.deepEqual(refinement.motif.targetAtomicPartIds, [
    "part.unit-sixth.0",
    "part.unit-sixth.1"
  ]);
  assert.equal(
    refinement.motif.dividerPolicy,
    "reveal-without-area-change"
  );
});

test("part merge uses one simultaneous existing fusion cohort", () => {
  const merge = specializedBeat(
    createKpExactFractionQuantityPresentationPlan().beats[3]!,
    "part-merge"
  );

  assert.equal(merge.canonicalOperationId, "kp.core.merge");
  assert.equal(merge.motif.fusionPlan.mode, "fusion");
  assert.equal(merge.motif.fusionPlan.microStaggerSpan, 0);
  assert.deepEqual(merge.motif.contributorAtomicPartIds, [
    "part.unit-sixth.0",
    "part.unit-sixth.1",
    "part.unit-sixth.2"
  ]);
  assert.equal(merge.motif.mergePolicy, "simultaneous-opaque-fusion");
});

test("persist fission and fusion material never receive interpolated opacity", () => {
  const plan = createKpExactFractionQuantityPresentationPlan();
  const bindings = plan.beats.flatMap(({ paintBindings }) => paintBindings);

  assert.ok(bindings.length > 0);
  assert.ok(bindings.every(({ paintOpacity }) => paintOpacity === 1));
  assert.ok(bindings.every((binding) =>
    binding.ownership === (binding.lifecycle === "persist"
      ? "continuous-owned-paint"
      : "atomic-exclusive-handoff")
  ));
  for (const beat of plan.beats) {
    if (beat.motif.kind === "existing") continue;
    const fissionFusion = beat.motif.kind === "partition-refinement"
      ? beat.motif.fissionPlan
      : beat.motif.fusionPlan;
    for (let index = 0; index <= 100; index += 1) {
      const frame = sampleKpFissionFusion({
        plan: fissionFusion,
        progress: index / 100
      });
      assert.ok(
        [...frame.sources, ...frame.targets].every(({ opacity }) =>
          opacity === 0 || opacity === 1
        )
      );
      assert.ok(
        [...frame.sources, ...frame.targets]
          .filter(({ ownsMaterial }) => ownsMaterial)
          .every(({ opacity }) => opacity === 1)
      );
    }
  }
});

test("presentation binding adds no scheduler, compositor, or geometry category", () => {
  const plan = createKpExactFractionQuantityPresentationPlan();
  const serialized = JSON.stringify(plan);

  assert.deepEqual(plan.lifecycleVocabulary, [
    "persist", "fission", "fusion"
  ]);
  assert.deepEqual(plan.schedulerVocabulary, ["shared-canonical-beat"]);
  assert.ok(plan.beats.every(
    ({ scheduler }) => scheduler === "shared-canonical-beat"
  ));
  assert.equal(serialized.includes("leftPx"), false);
  assert.equal(serialized.includes("topPx"), false);
  assert.equal(serialized.includes("duration"), false);
  assert.equal(serialized.includes("whole-view"), false);
});

function specializedBeat<
  Kind extends "partition-refinement" | "part-merge"
>(
  beat: KpExactFractionQuantityPresentationBeat,
  kind: Kind
): Extract<
  KpExactFractionQuantityPresentationBeat,
  { readonly motif: { readonly kind: Kind } }
> {
  if (beat.motif.kind !== kind) {
    throw new Error(`Expected ${kind}, received ${beat.motif.kind}.`);
  }
  return beat as Extract<
    KpExactFractionQuantityPresentationBeat,
    { readonly motif: { readonly kind: Kind } }
  >;
}
