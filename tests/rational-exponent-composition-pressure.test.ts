import assert from "node:assert/strict";
import test from "node:test";

import {
  kpRationalExponentCompositionNativeEndpoints
} from "../src/rendering/rational-exponent-composition-native-endpoints.ts";
import {
  compileKpRationalExponentCompositionMotion
} from "../src/rendering/rational-exponent-composition-transit-session.ts";
import { sampleKpNativeKatexSceneTrackFrames } from
  "../src/rendering/native-katex-scene-track-sampling.ts";
import { kpRationalExponentCompositionExemplar } from
  "../src/semantic/rational-exponent-composition-exemplar.ts";
import {
  createRootRewriteSceneObservation,
  rootRewritePaint
} from "./helpers/root-rewrite-native-scene-fixture.ts";

test("composition fuses notation while preserving leaf semantic identity", () => {
  const exemplar = kpRationalExponentCompositionExemplar;
  assert.equal(exemplar.plan.operationClass, "exponent-index-composition");
  assert.deepEqual(exemplar.plan.dispositions.map(({ kind }) => kind),
    ["persist", "fuse", "consume"]);
  assert.deepEqual(exemplar.correspondence.map(({ relation }) => relation),
    ["identity", "role-change", "role-change", "introduction", "removal"]);
  const [source, target] = exemplar.states;
  assert.equal(source.carrier.semanticId, target.carrier.semanticId);
  assert.equal(source.exponent.semanticId, target.numerator.semanticId);
  assert.equal(source.rootIndex.semanticId, target.denominator.semanticId);
  assert.equal(source.carrier.subtreeId, target.carrier.subtreeId);
});

test("recursive endpoints expose numerator division and denominator separately", () => {
  const { source, target } = kpRationalExponentCompositionNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\sqrt[3]{x^{2}}");
  assert.equal(target.annotated.rawLatex, "x^{2/3}");
  assert.deepEqual(target.nodes.filter(({ occurrence }) => [
    "target.exponent-index.numerator.two",
    "target.exponent-index.division",
    "target.exponent-index.denominator.three"
  ].includes(occurrence.entityId)).map(({ occurrence, role }) =>
    [occurrence.entityId, role]), [
      ["target.exponent-index.numerator.two", "value"],
      ["target.exponent-index.division", "operator"],
      ["target.exponent-index.denominator.three", "value"]
    ]);
});

test("index and exponent settle into one assembled rational exponent", () => {
  const motion = motionPlan();
  const composition = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.compositionTrackIds.includes(id));
  assert.equal(composition.length, 2);
  assert.ok(composition.every(({ lifecycle, semanticMotionUnitId,
    sampleMaterialScale }) => lifecycle === "persist" &&
    semanticMotionUnitId ===
      `motion.${motion.exemplar.id}.exponent-index-composition` &&
    sampleMaterialScale === undefined));
  const division = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.divisionTrackIds.includes(id));
  assert.ok(division.every(({ lifecycle }) => lifecycle === "introduce"));
  const radical = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.radicalTrackIds.includes(id));
  assert.ok(radical.every(({ lifecycle }) => lifecycle === "eliminate"));

  const targetByAtom = new Map(
    motion.rendererPlan.reconciliation.target.atoms.map((atom) =>
      [atom.id, atom] as const
    )
  );
  const end = sampleKpNativeKatexSceneTrackFrames(
    motion.rendererPlan.tracks,
    1,
    false
  );
  for (const track of composition) {
    assert.ok(track.targetAtomId);
    assert.deepEqual(
      end.find(({ trackId }) => trackId === track.id)?.expectedPaintRect,
      targetByAtom.get(track.targetAtomId)?.rect
    );
  }
});

test("composition supports deterministic direct seek and reverse", () => {
  const motion = motionPlan();
  const tracks = motion.rendererPlan.tracks;
  const sample = sampleKpNativeKatexSceneTrackFrames(tracks, 0.43, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 0, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(tracks, 0.43, false),
    sample
  );
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/u);
});

function motionPlan() {
  const { source, target } = kpRationalExponentCompositionNativeEndpoints;
  return compileKpRationalExponentCompositionMotion({
    exemplar: kpRationalExponentCompositionExemplar,
    endpoints: kpRationalExponentCompositionNativeEndpoints,
    source: createRootRewriteSceneObservation(source, [
      rootRewritePaint("source.exponent-index.radical", 6, 12, 24, 32,
        "path", "path:radical"),
      rootRewritePaint("source.exponent-index.root-index.three", 3, 5, 7, 12,
        "glyph", "glyph:3"),
      rootRewritePaint("source.exponent-index.x", 29, 24, 10, 20,
        "glyph", "glyph:x"),
      rootRewritePaint("source.exponent-index.exponent.two", 41, 9, 7, 12,
        "glyph", "glyph:2")
    ], "rational-exponent"),
    target: createRootRewriteSceneObservation(target, [
      rootRewritePaint("target.exponent-index.x", 14, 25, 10, 20,
        "glyph", "glyph:x"),
      rootRewritePaint("target.exponent-index.numerator.two", 30, 6, 7, 11,
        "glyph", "glyph:2"),
      rootRewritePaint("target.exponent-index.division", 38, 10, 5, 12,
        "glyph", "glyph:/"),
      rootRewritePaint("target.exponent-index.denominator.three", 44, 14, 7,
        11, "glyph", "glyph:3")
    ], "rational-exponent")
  });
}
