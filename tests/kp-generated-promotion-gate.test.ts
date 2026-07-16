import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  evaluateKpChoreographyQuality,
  type KpChoreographyQualitySample
} from "../src/animation/choreography-quality.ts";
import {
  auditKpGeneratedAnimationCatalog,
  gateKpGeneratedAnimationPromotion,
  kpGeneratedPromotionHumanReviewRubric,
  type KpGeneratedPromotionEvidence
} from "../src/animation/generated-promotion-gate.ts";
import {
  kpBaseGestaltStyleCatalog,
  kpOrganicSubtleStyle,
  kpOrganicSubtleStyleRef
} from "../src/animation/gestalt-base-styles.ts";
import {
  kpEquationDomGestaltRenderer,
  resolveKpGestaltRendererCapabilities
} from "../src/animation/gestalt-renderer-capabilities.ts";
import { resolveKpGestaltStyle } from "../src/animation/gestalt-style-resolution.ts";

const animation = createKpAnimationAssets().find(
  (candidate) => candidate.id === "animation.generated.substitute-three"
)!;

test("new generated output promotes only with complete governed evidence", () => {
  const result = gateKpGeneratedAnimationPromotion({
    animation,
    evidence: completeEvidence()
  });
  assert.equal(result.status, "promoted");
  assert.equal(result.promotable, true);
  assert.deepEqual(result.diagnostics, []);
});

test("raw motion, incompatible style, and incomplete review return typed repairs", () => {
  const base = completeEvidence();
  const result = gateKpGeneratedAnimationPromotion({
    animation,
    evidence: {
      ...base,
      authoring: {
        semanticOnly: false,
        rawMotionFieldPaths: ["draft.motion.keyframes"]
      },
      style: {
        ...base.style,
        pinnedStyle: { id: "kp.organic-subtle", version: "^1.0.0" },
        resolvedFingerprint: "missing",
        packageCompatibility: {
          ...base.style.packageCompatibility,
          status: "incompatible",
          gaps: [{
            kind: "gestalt-capability-gap",
            capabilityId: "motion.path.arc",
            rendererId: "renderer.missing",
            reason: "missing-required-capability",
            promotable: false,
            message: "missing arc"
          }]
        }
      },
      accessibility: { projectionIds: ["projection.full"], valid: false },
      humanReview: {
        ...base.humanReview,
        "typographic-integrity": "pending"
      }
    }
  });
  assert.equal(result.status, "blocked");
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "promotion.authoring.raw-motion",
      "promotion.style.unpinned",
      "promotion.style.fingerprint",
      "promotion.style.incompatible",
      "promotion.accessibility.incomplete",
      "promotion.human-review.incomplete"
    ]
  );
  assert.ok(result.diagnostics.every((diagnostic) => diagnostic.repair.length > 30));
});

test("the existing generated catalog remains visible under warning-first audit", () => {
  const catalog = createKpAnimationAssets();
  const audit = auditKpGeneratedAnimationCatalog(catalog);
  assert.ok(audit.length > 3);
  assert.ok(audit.some((entry) =>
    entry.animationId === "animation.generated.add-zero"
  ));
  assert.ok(audit.every((entry) =>
    entry.status === "legacy-warning" &&
    entry.promotable === false &&
    entry.diagnostics[0]?.code === "promotion.legacy.unaudited"
  ));
  assert.ok(catalog.some((candidate) => candidate.id === animation.id));
});

function completeEvidence(): KpGeneratedPromotionEvidence {
  const resolved = resolveKpGestaltStyle({
    pinnedStyle: kpOrganicSubtleStyleRef,
    catalog: kpBaseGestaltStyleCatalog
  });
  return {
    authoring: { semanticOnly: true, rawMotionFieldPaths: [] },
    choreography: {
      compiled: true,
      quality: evaluateKpChoreographyQuality({
        samples: calmQualitySamples()
      })
    },
    style: {
      pinnedStyle: kpOrganicSubtleStyleRef,
      resolvedFingerprint: resolved.fingerprint,
      packageCompatibility: resolveKpGestaltRendererCapabilities({
        style: kpOrganicSubtleStyle,
        renderer: kpEquationDomGestaltRenderer
      })
    },
    accessibility: {
      projectionIds: [
        "projection.full",
        "projection.reduced",
        "projection.static",
        "projection.narrated",
        "projection.high-contrast",
        "projection.no-depth",
        "projection.keyboard",
        "projection.rewind"
      ],
      valid: true
    },
    humanReview: Object.fromEntries(
      kpGeneratedPromotionHumanReviewRubric.map((criterion) => [
        criterion,
        "passed"
      ])
    ) as KpGeneratedPromotionEvidence["humanReview"]
  };
}

function calmQualitySamples(): readonly KpChoreographyQualitySample[] {
  return [
    qualitySample(0, {}),
    qualitySample(0.4, {
      focusReadiness: 1,
      reflowProgress: 1,
      actProgress: 0.2
    }),
    qualitySample(0.8, {
      focusReadiness: 1,
      reflowProgress: 1,
      actProgress: 1,
      stableCheckpoint: true
    }),
    qualitySample(1, {
      focusReadiness: 1,
      reflowProgress: 1,
      actProgress: 1,
      stableCheckpoint: true
    })
  ];
}

function qualitySample(
  progress: number,
  overrides: Partial<KpChoreographyQualitySample>
): KpChoreographyQualitySample {
  return {
    progress,
    focusReadiness: 0,
    explanatorySalience: 1,
    reflowProgress: 0,
    actProgress: 0,
    governedReflowActOverlap: false,
    eliminationProgress: 0,
    causeLegibility: 1,
    groupSeparation: 0,
    maximumGroupSeparation: 1,
    residualTransform: 0,
    residualDeformation: 0,
    speed: 0,
    materialContinuity: 1,
    stableCheckpoint: false,
    ...overrides
  };
}
