import assert from "node:assert/strict";
import test from "node:test";

import type { KpAnimationAsset } from "../src/animation/asset.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../src/animation/equation-cancellation-presentation.ts";
import {
  kpExistingEquationCancellationTransformationIds
} from "../src/animation/existing-equation-cancellation-presentation.ts";
import {
  createDivideBothSidesEquationAnimationAsset
} from "../src/animation/divide-both-sides-equation-adapter.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  decideKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";

const animations = [
  createLinearSolveAnimationAsset(),
  createFractionalLinearEquationAnimationAsset(),
  createDivideBothSidesEquationAnimationAsset()
] as const;

test("every existing cancellation family owns one verified role-complete plan", () => {
  const discovered = discoverCancellations(animations);
  assert.deepEqual(
    discovered.map(({ transformation }) => transformation.id).sort(),
    [...kpExistingEquationCancellationTransformationIds].sort()
  );

  for (const { transformation } of discovered) {
    const plan = compileKpEquationCancellationPresentationPlan(
      transformation
    );
    assert.equal(plan?.planKind, "inverse-cancellation");
    if (plan === undefined) continue;
    assert.equal(plan.inverseBundleIds.length, 2);

    const correspondenceIds = new Set(
      transformation.correspondenceMap!.records.flatMap((record) => [
        ...record.sourceSelectorIds,
        ...record.targetSelectorIds
      ])
    );
    const plannedIds = new Set(plan.roles.bundles.flatMap(
      ({ semanticEntityIds }) => semanticEntityIds
    ));
    assert.deepEqual(
      [...plannedIds].sort(),
      [...correspondenceIds].sort(),
      `${transformation.id} must classify every semantic selector exactly once.`
    );
  }
});

test("existing cancellation plans retain identical role authority on rewind", () => {
  for (const { animation, transformation } of discoverCancellations(
    animations
  )) {
    const forward = decideKpEquationOperationChoreography({
      animation,
      transformation,
      motifKind: "cancelation",
      direction: "forward"
    });
    const rewind = decideKpEquationOperationChoreography({
      animation,
      transformation,
      motifKind: "cancelation",
      direction: "rewind"
    });
    assert.equal(forward.status, "verified");
    assert.equal(rewind.status, "verified");
    if (forward.status !== "verified" || rewind.status !== "verified") {
      continue;
    }
    assert.equal(forward.choreography.kind, "counter-orbit-cancellation");
    assert.equal(rewind.choreography.kind, "counter-orbit-cancellation");
    if (
      forward.choreography.kind !== "counter-orbit-cancellation" ||
      rewind.choreography.kind !== "counter-orbit-cancellation"
    ) {
      continue;
    }
    assert.deepEqual(
      rewind.choreography.operationPresentationPlan,
      forward.choreography.operationPresentationPlan
    );
    assert.deepEqual(
      rewind.choreography.semanticEntityIds,
      forward.choreography.semanticEntityIds
    );
  }
});

test("teacher-zero fan-in cannot acquire inverse-cancellation authority", () => {
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  const transformation = animation.transformations.find(
    ({ id }) => id === "transform.linear-solve.expose-left-zero"
  )!;
  assert.equal(
    compileKpEquationCancellationPresentationPlan(transformation),
    undefined
  );
});

function discoverCancellations(
  subjects: readonly KpAnimationAsset[]
) {
  return subjects.flatMap((animation) =>
    animation.transformations
      .filter((transformation) =>
        transformation.correspondenceMap?.records.some(
          ({ relation }) => relation === "cancelation"
        )
      )
      .map((transformation) => ({ animation, transformation }))
  );
}
