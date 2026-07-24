import assert from "node:assert/strict";
import test from "node:test";

import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpEquationPresentationProfileV1
} from "../src/animation/equation-presentation-profile.ts";
import {
  decodeKpEquationPresentationProfile,
  decodeKpLegacyEquationPresentationMetadata,
  kpLegacyEquationPresentationMetadataKeys
} from "../src/animation/equation-presentation-profile-decoder.ts";
import {
  resolveKpCancellationPresentation
} from "../src/rendering/cancellation-presentation-resolver.ts";

test("legacy defaults reproduce semantic-material and continuity profiles", () => {
  const semanticMaterial = decodeKpEquationPresentationProfile({
    animation: createFractionSimplificationAnimationAsset(),
    resolveCancellation: resolveKpCancellationPresentation
  });
  const continuity = decodeKpEquationPresentationProfile({
    animation: createLinearSolveAnimationAsset(),
    resolveCancellation: resolveKpCancellationPresentation
  });

  assert.equal(semanticMaterial.status, "accepted");
  assert.equal(continuity.status, "accepted");
  if (
    semanticMaterial.status !== "accepted" ||
    continuity.status !== "accepted"
  ) return;
  assert.deepEqual(semanticMaterial.profile.payload, {
    kind: "equation-presentation",
    motion: "semantic-material-v2",
    nativeHandoff: "crossfade-v1",
    cancellation: "witnessed-annihilation-v1",
    zeroWitness: "embedded-v1",
    successor: "successor-synthesis-v1",
    depth: "flat-v1",
    continuants: "concurrent-v1"
  });
  assert.deepEqual(continuity.profile.payload, {
    kind: "equation-presentation",
    motion: "continuity-v1",
    nativeHandoff: "atomic-v1",
    cancellation: "counter-orbit-v1",
    zeroWitness: "none",
    successor: "counter-convergence-v1",
    depth: "semantic-depth-v1",
    continuants: "transit-then-reflow-v1",
    branchStrategy: "together"
  });
});

test("all governed legacy keys decode into one typed profile", () => {
  const source = createFractionSimplificationAnimationAsset();
  const result = decodeKpEquationPresentationProfile({
    animation: {
      ...source,
      presentationProfile: undefined,
      metadata: {
        equationMotionPresentationRecipe: "continuity-v1",
        equationNativeHandoffRecipe: "atomic-v1",
        equationCancellationPresentationRecipe: "counter-orbit-v1",
        equationZeroWitnessPresentationRecipe: "independent-zero-v1",
        equationSuccessorPresentationRecipe: "convergence-v1",
        equationDepthPresentationRecipe: "semantic-depth-v1",
        equationContinuantPresentationRecipe: "reserve-then-transit-v1",
        equationBranchPresentationStrategy: "staggered"
      }
    },
    resolveCancellation: resolveKpCancellationPresentation
  });

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.source, "legacy-metadata");
  assert.deepEqual(result.profile.payload, {
    kind: "equation-presentation",
    motion: "continuity-v1",
    nativeHandoff: "atomic-v1",
    cancellation: "counter-orbit-v1",
    zeroWitness: "independent-zero-v1",
    successor: "convergence-v1",
    depth: "semantic-depth-v1",
    continuants: "reserve-then-transit-v1",
    branchStrategy: "staggered"
  });
});

test("invalid legacy diagnostics follow contract order, not object insertion order", () => {
  const metadata = Object.fromEntries(
    [...kpLegacyEquationPresentationMetadataKeys]
      .reverse()
      .map((key) => [key, `invalid.${key}`])
  );
  const result = decodeKpLegacyEquationPresentationMetadata(metadata);

  assert.equal(result.status, "rejected");
  if (result.status !== "rejected") return;
  assert.deepEqual(
    result.diagnostics.map(({ path, code }) => [path, code]),
    kpLegacyEquationPresentationMetadataKeys.map((key) => [
      `$.metadata.${key}`,
      "legacy-value"
    ])
  );
});

test("legacy teaching goals and raw cancellation recipes conflict explicitly", () => {
  const result = decodeKpLegacyEquationPresentationMetadata({
    equationCancellationTeachingGoal: "preserve-flow",
    equationCancellationPresentationRecipe: "counter-orbit-v1"
  });

  assert.deepEqual(result, {
    status: "rejected",
    diagnostics: [{
      path: "$.metadata.equationCancellationPresentationRecipe",
      code: "authority-conflict",
      message:
        "Cancellation authoring cannot combine a teaching goal with a renderer recipe id."
    }]
  });
});

test("typed and legacy profiles cannot both own presentation authority", () => {
  const animation = createFractionSimplificationAnimationAsset();
  const result = decodeKpEquationPresentationProfile({
    animation: {
      ...animation,
      presentationProfile: undefined,
      metadata: {
        ...animation.metadata,
        equationMotionPresentationRecipe: "continuity-v1"
      }
    },
    authoredProfile: createKpEquationPresentationProfileV1({
      payload: {
        kind: "equation-presentation",
        motion: "continuity-v1",
        nativeHandoff: "atomic-v1",
        cancellation: "native-handoff-v1",
        zeroWitness: "none",
        successor: "native-handoff-v1",
        depth: "flat-v1",
        continuants: "concurrent-v1"
      }
    }),
    resolveCancellation: resolveKpCancellationPresentation
  });

  assert.deepEqual(result, {
    status: "rejected",
    diagnostics: [{
      path: "$.presentationProfile",
      code: "authority-conflict",
      message:
        `Animation ${animation.id} cannot combine a typed presentation profile with legacy presentation metadata.`
    }]
  });
});

test("a typed profile passes through without metadata fallback", () => {
  const animation = createFractionSimplificationAnimationAsset();
  const profile = createKpEquationPresentationProfileV1({
    payload: {
      kind: "equation-presentation",
      motion: "continuity-v1",
      nativeHandoff: "atomic-v1",
      cancellation: "native-handoff-v1",
      zeroWitness: "none",
      successor: "native-handoff-v1",
      depth: "flat-v1",
      continuants: "concurrent-v1"
    }
  });
  const result = decodeKpEquationPresentationProfile({
    animation: {
      ...animation,
      presentationProfile: undefined,
      metadata: undefined
    },
    authoredProfile: profile,
    resolveCancellation: resolveKpCancellationPresentation
  });

  assert.deepEqual(result, {
    status: "accepted",
    source: "typed-profile",
    profile,
    diagnostics: []
  });
  assert.equal(
    result.status === "accepted" && result.profile === profile,
    true
  );
});
