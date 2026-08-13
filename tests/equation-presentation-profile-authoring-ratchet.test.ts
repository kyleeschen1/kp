import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  kpLegacyEquationPresentationMetadataKeys
} from "../src/animation/equation-presentation-profile-decoder.ts";
import {
  kpCancellationTeachingGoalMetadataKey
} from "../src/semantic/cancellation-presentation-authoring.ts";
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
    ...kpLegacyEquationPresentationMetadataKeys,
    kpCancellationTeachingGoalMetadataKey
  ];
  const violations = createKpAnimationAssets().flatMap((animation) =>
    forbiddenKeys
      .filter((key) => animation.metadata?.[key] !== undefined)
      .map((key) => `${animation.id}:${key}`)
  );

  assert.deepEqual(violations, []);
  assert.ok(
    kpSemanticAnimationCompatibilityLedger
      .filter(({ category }) => category === "presentation-metadata")
      .every(({ authors }) => authors.length === 0)
  );
});
