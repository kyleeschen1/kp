import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionProjection, requireKpAuthoredDistributionNativeAnimation } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { findKpRegisteredOperationPresentationPlan, type KpVerifiedDistributionPresentationPlan } from "../src/animation/operation-presentation-plan-types.ts";
import { createKpFractionDistributionCoherentMotion } from "../src/rendering/fraction-distribution-coherent-motion.ts";
import { sampleKpCanonicalNativeKatexCopyFanOutMotion } from "../src/animation/copy-fan-out-motion-profile.ts";
import { sampleKpNativeKatexSceneTrackFrames } from "../src/rendering/native-katex-scene-track-sampling.ts";

function fixture() {
  const authored = createKpAuthoredDistributionProjection();
  const animation = requireKpAuthoredDistributionNativeAnimation(authored.projection);
  const plan = findKpRegisteredOperationPresentationPlan(animation.transformations[0]!) as KpVerifiedDistributionPresentationPlan;
  const projection = createKpFractionDistributionCoherentMotion([plan])!;
  const bundles = plan.roles.bundles.filter(bundle => bundle.role.endsWith("material"));
  const source = { atoms: bundles[0]!.semanticEntityIds.map((id, index) => ({ id: `source.${index}`, semanticEntityId: id })) };
  const target = { atoms: bundles.slice(1).flatMap((bundle, branch) => bundle.semanticEntityIds.map((id, index) => ({ id: `target.${branch}.${index}`, semanticEntityId: id }))) };
  const tracks = bundles.slice(1).flatMap((_, branch) => [0, 1, 2].map(part => ({
    id: `track.${branch}.${part}`, componentId: `component.${part}`, lifecycle: "split",
    sourceAtomId: `source.${part}`, targetAtomId: `target.${branch}.${part}`, visualAtomId: `source.${part}`,
    paintKind: part === 2 ? "rule" : "glyph", sizingMode: "rect", startOpacity: 1, endOpacity: 1,
    startRect: { left: 0, top: part * 12, width: 10, height: 8 },
    endRect: { left: 70 + branch * 90, top: part * 12, width: 10, height: 8 }
  })));
  // Synthetic measured paint tests the projection law; browser checks own
  // realized KaTeX evidence. Semantic bundle authority comes from the real author.
  const input = { source, target, tracks } as unknown as Parameters<typeof projection.project>[0];
  return { projection, input };
}

test("both fraction copies depart together with continuous eased travel and exact endpoints", () => {
  const { projection, input } = fixture();
  const tracks = projection.project(input);
  const sample = tracks[0]!.sampleProgress!;
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000;
    const value = sample(progress);
    assert.ok(value >= previous && value <= 1);
    for (const track of tracks) assert.equal(track.sampleProgress!(progress), value);
    previous = value;
  }
  assert.ok(tracks[3]!.sampleProgress!(.1) > 0, "the second fraction cannot wait for a peel-off beat");
  assert.equal(sampleKpCanonicalNativeKatexCopyFanOutMotion(.1).followerProgress, 0, "the generic motif remains staggered");
  assert.ok(sample(1e-6) / 1e-6 < .001, "departure still begins at rest");
  assert.equal(sample(0), 0); assert.equal(sample(1), 1);
});

test("coherent factor transport preserves primitive identity, local shape and reverse samples", () => {
  const { projection, input } = fixture();
  const tracks = projection.project(input);
  assert.deepEqual(tracks.map(track => track.id), input.tracks.map(track => track.id));
  assert.equal(new Set(tracks.map(track => track.semanticMotionUnitId)).size, 2);
  for (const progress of [0, .2, .5, .8, 1, .8, .5, .2, 0]) {
    const frames = sampleKpNativeKatexSceneTrackFrames(tracks, progress, false);
    for (const branch of [0, 1]) {
      const parts = frames.slice(branch * 3, branch * 3 + 3);
      parts.forEach((part, index) => {
        assert.ok(Math.abs(part.rect.left - parts[0]!.rect.left) < 1e-8);
        assert.ok(Math.abs(part.rect.top - parts[0]!.rect.top - index * 12) < 1e-8);
      });
    }
  }
});

test("coherent fraction rejects missing native parts and absent bounded authority", () => {
  const { projection, input } = fixture();
  assert.throws(() => projection.project({ ...input, tracks: input.tracks.slice(1) }), /incomplete-native-bundle/);
  assert.throws(() => createKpFractionDistributionCoherentMotion([]), /authority-gap/);
});
