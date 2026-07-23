import assert from "node:assert/strict";
import test from "node:test";

import {
  decideKpArtifactPromotion,
  kpGoldEquationAnimationIds,
  resolveKpAnimationPromotionFacet
} from "../src/animation/artifact-promotion.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createSymbolicManipulationFamilyRegistry } from "../src/animation/symbolic-manipulation-family-registry.ts";
import { projectKpAnimationAssetsToEditorDescriptors } from "../src/editor/animation-catalog-projection.ts";
import { renderKpEditorAnimationPlayerShell } from "../src/editor/animation-player-shell.ts";

const completeEvidence = {
  automatedGatesPassed: true,
  humanReviewPassed: true,
  conformancePassed: true,
  canonicalExemplarReviewed: true
} as const;

test("gold equation cohort is small exact and visible in editor metadata", () => {
  assert.deepEqual(kpGoldEquationAnimationIds, [
    "animation.linear-solve.solve-x",
    "animation.generated.radical.square-root-as-power",
    "animation.generated.function-wrap.apply-f",
    "animation.generated.distribution.expand-a-sum",
    "animation.derivative-rules.tangent-graph"
  ]);
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  });
  for (const animationId of kpGoldEquationAnimationIds) {
    const matches = descriptors.filter((descriptor) => descriptor.animationId === animationId);
    assert.ok(matches.length > 0);
    assert.ok(matches.every((descriptor) =>
      descriptor.promotion?.maturity === (
        animationId === "animation.generated.radical.square-root-as-power"
          ? "promoted"
          : "gold"
      )
    ));
    assert.ok(matches.every((descriptor) => descriptor.promotion?.goldCohort === true));
  }
});

test("known compositions can become reviewable through automated gates", () => {
  assert.deepEqual(decideKpArtifactPromotion({
    current: "draft",
    requested: "reviewable",
    novelty: "composition",
    evidence: { ...completeEvidence, humanReviewPassed: false }
  }), {
    kind: "artifact-promotion-decision",
    status: "approved",
    from: "draft",
    to: "reviewable",
    diagnostics: []
  });
});

test("new combinations and primitives stop at explicit exemplar review", () => {
  for (const novelty of ["new-combination", "new-primitive"] as const) {
    const result = decideKpArtifactPromotion({
      current: "reviewable",
      requested: "gold",
      novelty,
      evidence: { ...completeEvidence, canonicalExemplarReviewed: false }
    });
    assert.equal(result.status, "blocked");
    assert.match(result.diagnostics[0] ?? "", /review/i);
  }
});

test("maturity cannot skip checkpoints or self-certify promoted status", () => {
  assert.equal(decideKpArtifactPromotion({
    current: "draft",
    requested: "gold",
    novelty: "composition",
    evidence: completeEvidence
  }).status, "blocked");
  assert.equal(decideKpArtifactPromotion({
    current: "gold",
    requested: "promoted",
    novelty: "composition",
    evidence: { ...completeEvidence, conformancePassed: false }
  }).status, "blocked");
});

test("non-gold catalog entries default to reviewable composition", () => {
  assert.deepEqual(resolveKpAnimationPromotionFacet({ animationId: "animation.other" }), {
    maturity: "reviewable",
    novelty: "composition",
    humanReviewRequired: false,
    goldCohort: false
  });
});

test("editor player exposes independent novelty and maturity facets", () => {
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  });
  const descriptor = descriptors.find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  )!;
  const html = renderKpEditorAnimationPlayerShell({ descriptor });

  assert.match(html, /data-kp-editor-animation-maturity="gold"/);
  assert.match(html, /data-kp-editor-animation-novelty="composition"/);
  assert.match(html, /data-kp-editor-animation-gold-cohort="true"/);
});
