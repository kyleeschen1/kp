import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  kpSemanticAnimationCompatibilityLedger
} from "../src/architecture/semantic-animation-compatibility-ledger.ts";

test("every concrete equation surface selects a typed presentation profile", () => {
  const equationAssets = createKpAnimationAssets().filter((animation) =>
    animation.renderTargets.some(({ kind }) => kind === "equation")
  );

  assert.equal(equationAssets.length, 25);
  assert.deepEqual(
    equationAssets
      .filter(({ presentationProfile }) => presentationProfile === undefined)
      .map(({ id }) => id),
    []
  );
  assert.ok(equationAssets.every(
    ({ presentationProfile }) => presentationProfile?.domain === "equation"
  ));
});

test("concrete assets cannot author legacy equation presentation metadata", () => {
  const forbiddenKeys = [
    "equationMotionPresentationRecipe",
    "equationNativeHandoffRecipe",
    "equationCancellationPresentationRecipe",
    "equationZeroWitnessPresentationRecipe",
    "equationSuccessorPresentationRecipe",
    "equationDepthPresentationRecipe",
    "equationContinuantPresentationRecipe",
    "equationBranchPresentationStrategy",
    "equationCancellationTeachingGoal"
  ];
  const violations = createKpAnimationAssets().flatMap((animation) =>
    forbiddenKeys
      .filter((key) => animation.metadata?.[key] !== undefined)
      .map((key) => `${animation.id}:${key}`)
  );

  assert.deepEqual(violations, []);
  assert.ok(
    kpSemanticAnimationCompatibilityLedger.every(
      ({ contractKey }) => !forbiddenKeys.includes(contractKey ?? "")
    )
  );

  const base = createKpAnimationAssets().find((animation) =>
    animation.renderTargets.some(({ kind }) => kind === "equation")
  )!;
  assert.match(
    validateKpAnimationAsset({
      ...base,
      metadata: {
        ...base.metadata,
        equationMotionPresentationRecipe: "continuity-v1"
      }
    })[0]?.message ?? "",
    /unsupported; author presentationProfile instead/
  );
});
