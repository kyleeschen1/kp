import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOddRootNativeEndpoints
} from "../src/rendering/odd-root-native-endpoints.ts";
import {
  compileKpOddRootMotion
} from "../src/rendering/odd-root-transit-session.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";
import {
  kpOddRootSolveExemplar
} from "../src/semantic/odd-root-solve-exemplar.ts";
import {
  createRootRewriteSceneObservation,
  rootRewritePaint
} from "./helpers/root-rewrite-native-scene-fixture.ts";

test("odd inverse power has one explicit real branch without plus-minus", () => {
  const { operation, states } = kpOddRootSolveExemplar;
  assert.equal(operation.exponentEvidence.parity, "odd");
  assert.equal(operation.solutionSet.multiplicity, 1);
  assert.deepEqual(operation.solutionSet.branches.map(({ sign }) => sign),
    ["unique-real"]);
  assert.equal(operation.target.endpoint.index.provenance, "explicit");
  assert.equal(operation.target.endpoint.index.contentLatex, "3");
  assert.equal(states[1].latex.includes("\\pm"), false);
  assert.equal(states[1].branch.representationEntityId,
    states[1].rootExpression.entityId);
});

test("odd-root endpoints expose native index ink as its own semantic owner", () => {
  const { source, target } = kpOddRootNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "x^{3}=8");
  assert.equal(target.annotated.rawLatex, "x=\\sqrt[3]{8}");
  assert.equal(target.nodes.filter(({ role }) => role === "root-index").length,
    1);
  assert.equal(target.nodes.some(({ occurrence }) =>
    occurrence.entityId.includes("plus-minus")), false);
  assert.equal(target.nodes.find(({ role }) => role === "root-index")
    ?.parentEntityId, "target.odd-root.radical");
});

test("the exponent crosses equality and settles as visible root-index ink", () => {
  const motion = motionPlan();
  const exponent = motion.rendererPlan.tracks.find(({ id }) =>
    id === motion.exponentIndexTrackId);
  assert.ok(exponent);
  assert.equal(exponent.lifecycle, "persist");
  assert.equal(exponent.motionPath?.variant, "arc-above");
  assert.equal(exponent.motionPathSampling,
    "foreground-diagonal-role-transfer");
  assert.equal(exponent.sampleMaterialScale, undefined);
  const radical = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.radicalTrackIds.includes(id));
  assert.ok(radical.length > 0);
  assert.ok(radical.every(({ lifecycle }) => lifecycle === "introduce"));

  const crossing = sampleKpNativeKatexSceneTrackFrames(
    motion.rendererPlan.tracks,
    0.45,
    false
  );
  const exponentFrame = crossing.find(({ trackId }) =>
    trackId === motion.exponentIndexTrackId);
  const relationTrack = motion.rendererPlan.tracks.find(({ sourceAtomId }) =>
    sourceAtomId === "source.paint.2");
  assert.ok(exponentFrame);
  assert.ok(relationTrack);
  const relationFrame = crossing.find(({ trackId }) =>
    trackId === relationTrack.id);
  assert.ok(relationFrame);
  assert.ok(center(exponentFrame.rect).x > center(relationFrame.rect).x);

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
  assert.ok(exponent.targetAtomId);
  assert.deepEqual(
    end.find(({ trackId }) => trackId === exponent.id)?.expectedPaintRect,
    targetByAtom.get(exponent.targetAtomId)?.rect
  );
});

test("odd-root direct seek and reverse sampling are deterministic", () => {
  const motion = motionPlan();
  const tracks = motion.rendererPlan.tracks;
  const first = sampleKpNativeKatexSceneTrackFrames(tracks, 0.37, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 0, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(tracks, 0.37, false),
    first
  );
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/u);
});

function motionPlan() {
  const { source, target } = kpOddRootNativeEndpoints;
  return compileKpOddRootMotion({
    exemplar: kpOddRootSolveExemplar,
    endpoints: kpOddRootNativeEndpoints,
    source: createRootRewriteSceneObservation(source, [
      rootRewritePaint("source.odd-root.x", 8, 24, 10, 20,
        "glyph", "glyph:x"),
      rootRewritePaint("source.odd-root.exponent.three", 21, 8, 7, 12,
        "glyph", "glyph:3"),
      rootRewritePaint("source.odd-root.relation", 37, 24, 12, 20,
        "glyph", "glyph:="),
      rootRewritePaint("source.odd-root.value.eight", 60, 24, 9, 20,
        "glyph", "glyph:8")
    ], "odd-root"),
    target: createRootRewriteSceneObservation(target, [
      rootRewritePaint("target.odd-root.x", 5, 24, 10, 20,
        "glyph", "glyph:x"),
      rootRewritePaint("target.odd-root.relation", 25, 24, 12, 20,
        "glyph", "glyph:="),
      rootRewritePaint("target.odd-root.radical", 49, 15, 24, 31,
        "path", "path:radical"),
      rootRewritePaint("target.odd-root.index.three", 45, 7, 7, 12,
        "glyph", "glyph:3"),
      rootRewritePaint("target.odd-root.radicand.eight", 69, 24, 9, 20,
        "glyph", "glyph:8")
    ], "odd-root")
  });
}

function center(rect: Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
