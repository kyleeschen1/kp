import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveKpOrganicMotionSignature,
  sampleKpOrganicMotion,
  sampleKpOrganicProgress
} from "../src/animation/organic-motion-primitives.ts";

const source = deriveKpOrganicMotionSignature({
  identityId: "factor.a",
  lineageEdgeId: "lineage.factor.distributes",
  motifId: "copy-fan-out",
  motionFieldId: "field.distribution"
});

test("organic signatures and samples are deterministic under direct seek", () => {
  assert.deepEqual(
    deriveKpOrganicMotionSignature({
      identityId: "factor.a",
      lineageEdgeId: "lineage.factor.distributes",
      motifId: "copy-fan-out",
      motionFieldId: "field.distribution"
    }),
    source
  );
  const first = sampleKpOrganicMotion({
    signature: source,
    progress: 0.43,
    microMotionAmplitude: 0.12,
    deformationCeiling: 0.08
  });
  const second = sampleKpOrganicMotion({
    signature: source,
    progress: 0.43,
    microMotionAmplitude: 0.12,
    deformationCeiling: 0.08
  });
  assert.deepEqual(first, second);
});

test("micro-motion and deformation are exactly neutral at stable endpoints", () => {
  for (const progress of [0, 1]) {
    assert.deepEqual(
      sampleKpOrganicMotion({
        signature: source,
        progress,
        microMotionAmplitude: 0.2,
        deformationCeiling: 0.15
      }),
      {
        semanticProgress: progress,
        x: 0,
        y: 0,
        scaleAlong: 1,
        scaleAcross: 1,
        envelope: 0
      }
    );
  }
});

test("rewind samples the exact mirrored semantic pose", () => {
  const forward = sampleKpOrganicMotion({
    signature: source,
    progress: 0.31,
    microMotionAmplitude: 0.12,
    deformationCeiling: 0.08
  });
  const rewind = sampleKpOrganicMotion({
    signature: source,
    progress: 0.69,
    direction: "rewind",
    microMotionAmplitude: 0.12,
    deformationCeiling: 0.08
  });
  assert.deepEqual(rewind, forward);
});

test("lineage descendants inherit group correlation with branch variation", () => {
  const left = deriveKpOrganicMotionSignature({
    identityId: "factor.a.left-copy",
    lineageEdgeId: "lineage.factor.distributes",
    branchIndex: 0,
    motifId: "copy-fan-out",
    motionFieldId: "field.distribution"
  });
  const right = deriveKpOrganicMotionSignature({
    identityId: "factor.a.right-copy",
    lineageEdgeId: "lineage.factor.distributes",
    branchIndex: 1,
    motifId: "copy-fan-out",
    motionFieldId: "field.distribution"
  });
  assert.equal(left.phase, right.phase);
  assert.equal(left.groupCorrelation, right.groupCorrelation);
  assert.notEqual(left.xBias, right.xBias);
});

test("organic progress curves remain bounded with exact endpoints", () => {
  for (const character of ["restrained", "organic", "editorial"] as const) {
    assert.equal(sampleKpOrganicProgress({ progress: 0, character }), 0);
    assert.equal(sampleKpOrganicProgress({ progress: 1, character }), 1);
    for (let index = 0; index <= 100; index += 1) {
      const value = sampleKpOrganicProgress({
        progress: index / 100,
        character
      });
      assert.ok(value >= 0 && value <= 1);
    }
  }
});
