import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpDotProductTraversalChoreography } from "../src/animation/dot-product-traversal-choreography.ts";
import {
  kpBaseGestaltStyleCatalog,
  kpGeneratedAnimationGestaltDefaults,
  kpGestaltStyleKey,
  kpOrganicSubtleStyle,
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyle,
  kpRestrainedEditorialStyleRef
} from "../src/animation/gestalt-base-styles.ts";
import {
  compileKpGestaltAccessibilityFamily,
  validateKpGestaltAccessibilityFamily
} from "../src/animation/gestalt-accessibility.ts";
import {
  kpEquationDomGestaltRenderer,
  resolveKpGestaltRendererCapabilities
} from "../src/animation/gestalt-renderer-capabilities.ts";
import { resolveKpGestaltStyle } from "../src/animation/gestalt-style-resolution.ts";
import { validateKpGestaltStylePackage } from "../src/animation/gestalt-style.ts";

test("generated animations use an exact organic pin with a compatible restrained substitute", () => {
  assert.deepEqual(
    kpGeneratedAnimationGestaltDefaults.generatedAnimationStyle,
    { id: "kp.organic-subtle", version: "1.0.0" }
  );
  assert.equal(kpGeneratedAnimationGestaltDefaults.defaultFocusProfile, "flat");
  assert.deepEqual(
    kpGeneratedAnimationGestaltDefaults.compatibleViewerSubstitutions,
    [kpOrganicSubtleStyleRef, kpRestrainedEditorialStyleRef]
  );
  assert.deepEqual(
    [...kpBaseGestaltStyleCatalog.keys()],
    [
      "kp.organic-subtle@1.0.0",
      "kp.restrained-editorial@1.0.0"
    ]
  );
  assert.equal(
    kpGestaltStyleKey(kpOrganicSubtleStyleRef),
    "kp.organic-subtle@1.0.0"
  );
});

test("both base styles are complete, renderer-compatible packages", () => {
  for (const style of [
    kpOrganicSubtleStyle,
    kpRestrainedEditorialStyle
  ]) {
    assert.deepEqual(validateKpGestaltStylePackage(style), []);
    assert.equal(style.accessibilityProjectionIds.length, 8);
    assert.equal(style.conformance.fixtureIds.length, 4);
    assert.ok(style.lawIds.length >= 6);
    assert.equal(
      style.adaptation.numericBounds.length,
      15
    );
    assert.equal(
      resolveKpGestaltRendererCapabilities({
        style,
        renderer: kpEquationDomGestaltRenderer
      }).status,
      "compatible"
    );
  }
});

test("style adaptation can tune a family but cannot silently turn it into the other family", () => {
  const organic = resolveKpGestaltStyle({
    pinnedStyle: kpOrganicSubtleStyleRef,
    catalog: kpBaseGestaltStyleCatalog,
    project: {
      id: "project.organic-tuning",
      channels: {
        path: {
          curvature: 0.66,
          diagonalPreference: 0.8,
          oppositeCornerPreference: 0.94
        },
        pacing: { tempo: 0.58, recognitionDwell: 0.58 }
      }
    }
  });
  assert.equal(organic.diagnostics.length, 0);
  assert.equal(organic.channels.path?.curvature, 0.66);

  const rejected = resolveKpGestaltStyle({
    pinnedStyle: kpOrganicSubtleStyleRef,
    catalog: kpBaseGestaltStyleCatalog,
    animation: {
      id: "animation.editorial-by-stealth",
      channels: {
        path: {
          curvature: 0.2,
          diagonalPreference: 0.25,
          oppositeCornerPreference: 0.2
        },
        microMotion: { function: "none", amplitude: 0 }
      }
    }
  });
  assert.equal(rejected.channels.path?.curvature, 0.58);
  assert.equal(rejected.channels.microMotion?.function, "identity-sine");
  assert.ok(rejected.diagnostics.every(
    (diagnostic) =>
      diagnostic.code === "style.adaptation-bound-exceeded" ||
      diagnostic.code === "style.locked-channel"
  ));
});

test("organic and restrained cohorts realize one unchanged semantic choreography", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) =>
      candidate.id ===
      "animation.generated.linear-algebra.dot-product.three-vector"
  )!;
  const choreography = createKpDotProductTraversalChoreography(animation);
  const semanticCohort = {
    planId: choreography.plan.id,
    canonicalOperationId: choreography.plan.semantic.canonicalOperationId,
    phaseIds: choreography.plan.phases.map((phase) => phase.id),
    traversalRanks: choreography.traversal.participants.map(
      (participant) => participant.rank
    ),
    contributionProducts: choreography.contributions.map(
      (contribution) => contribution.product
    )
  };
  const organic = resolveKpGestaltStyle({
    pinnedStyle: kpOrganicSubtleStyleRef,
    catalog: kpBaseGestaltStyleCatalog
  });
  const restrained = resolveKpGestaltStyle({
    pinnedStyle: kpOrganicSubtleStyleRef,
    viewerSubstitution: kpRestrainedEditorialStyleRef,
    catalog: kpBaseGestaltStyleCatalog
  });

  assert.deepEqual(semanticCohort, {
    planId: choreography.plan.id,
    canonicalOperationId: choreography.plan.semantic.canonicalOperationId,
    phaseIds: choreography.plan.phases.map((phase) => phase.id),
    traversalRanks: [0, 1, 2],
    contributionProducts: [4, 10, 18]
  });
  assert.notEqual(organic.fingerprint, restrained.fingerprint);
  assert.notDeepEqual(organic.channels, restrained.channels);
  assert.equal(restrained.pinnedStyle.id, "kp.organic-subtle");
  assert.equal(restrained.selectedStyle.id, "kp.restrained-editorial");
});

test("both base-style accessibility cohorts retain identical phases and traversal", () => {
  const phaseIds = ["orient", "reflow", "act", "settle", "release"];
  const traversalRankIds = ["rank.0", "rank.1", "rank.2"];
  for (const pinnedStyle of [
    kpOrganicSubtleStyleRef,
    kpRestrainedEditorialStyleRef
  ]) {
    const style = resolveKpGestaltStyle({
      pinnedStyle,
      catalog: kpBaseGestaltStyleCatalog
    });
    const family = compileKpGestaltAccessibilityFamily({
      style,
      phaseIds,
      traversalRankIds
    });
    assert.deepEqual(validateKpGestaltAccessibilityFamily(family), []);
    assert.ok(family.projections.every((projection) =>
      JSON.stringify(projection.preservesPhaseIds) ===
        JSON.stringify(phaseIds) &&
      JSON.stringify(projection.preservesTraversalRankIds) ===
        JSON.stringify(traversalRankIds)
    ));
  }
});
