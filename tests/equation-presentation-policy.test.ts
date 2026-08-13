import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import {
  kpEquationPresentationPolicy,
  kpEquationPresentationProfile
} from "../src/animation/equation-presentation-policy.ts";
import {
  createKpEquationPresentationProfileV1
} from "../src/animation/equation-presentation-profile.ts";
test("canonical linear solve retains semantics but uses the continuity presentation", () => {
  const animation = createLinearSolveAnimationAsset();
  const policy = kpEquationPresentationPolicy(animation);

  assert.equal(policy.recipe, "continuity-v1");
  assert.equal(policy.handoff, "atomic-v1");
  assert.equal(policy.cancellation, "counter-orbit-v1");
  assert.equal(policy.zeroWitness, "none");
  assert.equal(policy.successor, "counter-convergence-v1");
  assert.equal(policy.depth, "semantic-depth-v1");
  assert.equal(policy.continuants, "concurrent-v1");
  assert.equal(
    animation.presentationConstraints?.clearancePlanning,
    "measured-native-notation"
  );
  assert.equal(policy.applyWitnessedAnnihilation, false);
  assert.equal(policy.applySuccessorSynthesis, false);
  assert.ok(animation.transformations.some(
    (transformation) => transformation.transformType === "cancelAdditiveInverses"
  ));
  assert.ok(animation.transformations.some(
    (transformation) => transformation.transformType === "simplifyConstantDifference"
  ));
});

test("other equation assets retain the semantic material presentation", () => {
  const policy = kpEquationPresentationPolicy(
    createFractionSimplificationAnimationAsset()
  );

  assert.equal(policy.recipe, "semantic-material-v2");
  assert.equal(policy.handoff, "crossfade-v1");
  assert.equal(policy.cancellation, "witnessed-annihilation-v1");
  assert.equal(policy.zeroWitness, "embedded-v1");
  assert.equal(policy.successor, "successor-synthesis-v1");
  assert.equal(policy.depth, "flat-v1");
  assert.equal(policy.continuants, "concurrent-v1");
  assert.equal(policy.applyWitnessedAnnihilation, true);
  assert.equal(policy.applySuccessorSynthesis, true);
});

test("presentation motifs can be selected independently without changing semantics", () => {
  const animation = createLinearSolveAnimationAsset();
  const profile = kpEquationPresentationProfile({
    ...animation,
    presentationProfile: createKpEquationPresentationProfileV1({
      payload: {
        ...animation.presentationProfile!.payload,
        cancellation: "counter-orbit-v1",
        zeroWitness: "independent-zero-v1",
        successor: "counter-convergence-v1",
        depth: "semantic-depth-v1",
        continuants: "transit-then-reflow-v1"
      }
    })
  });

  assert.deepEqual(profile, {
    recipe: "continuity-v1",
    handoff: "atomic-v1",
    cancellation: "counter-orbit-v1",
    zeroWitness: "independent-zero-v1",
    successor: "counter-convergence-v1",
    depth: "semantic-depth-v1",
    continuants: "transit-then-reflow-v1"
  });
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(animation.transformations.length, 3);
});

test("an equation surface without a typed profile fails explicitly", () => {
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  assert.throws(() => kpEquationPresentationProfile({
    ...animation,
    presentationProfile: undefined
  }), /no typed equation presentation profile/);
});

test("unknown typed presentation recipes fail at the asset boundary", () => {
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  assert.throws(() => kpEquationPresentationProfile({
    ...animation,
    presentationProfile: {
      ...animation.presentationProfile!,
      payload: {
        ...animation.presentationProfile!.payload,
        successor: "teleport-v9"
      }
    } as typeof animation.presentationProfile
  }), /Unknown equation presentation successor recipe teleport-v9/);
});
