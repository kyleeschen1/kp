import assert from "node:assert/strict";
import test from "node:test";

import {
  kpClosedRootEvaluationNativeEndpoints
} from "../src/rendering/closed-root-evaluation-native-endpoints.ts";
import {
  compileKpClosedRootEvaluationMotion
} from "../src/rendering/closed-root-evaluation-transit-session.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";
import {
  kpClosedRootEvaluationExemplar
} from "../src/semantic/closed-root-evaluation-exemplar.ts";
import {
  createRootRewriteSceneObservation,
  rootRewritePaint,
  type KpRootRewriteFixtureRect,
  type KpRootRewritePaintFixture
} from "./helpers/root-rewrite-native-scene-fixture.ts";

test("closed multi-glyph root evaluation carries exact semantic authority", () => {
  const exemplar = kpClosedRootEvaluationExemplar;
  assert.equal(exemplar.plan.operationClass, "closed-evaluation");
  assert.equal(exemplar.plan.execution, "atomic");
  assert.deepEqual(exemplar.plan.dispositions, [{
    kind: "fuse",
    sourceEntityIds: [
      "source.closed-root.radical",
      "source.closed-root.radicand.144"
    ],
    targetEntityIds: ["target.closed-root.value.12"],
    evidenceIds: [
      "evidence.root.sqrt-144.closed-value",
      "evidence.root.sqrt-144.exact-root"
    ]
  }]);
  assert.deepEqual(exemplar.arithmetic.rootValue, {
    index: 2,
    radicand: 144,
    value: 12,
    arithmeticEvidenceId: "evidence.arithmetic.twelve-squared-is-144"
  });
});

test("recursive endpoints preserve exact radical and multi-glyph value syntax", () => {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\sqrt{144}");
  assert.equal(target.annotated.rawLatex, "12");
  assert.deepEqual(source.nodes.map(({ role, occurrence, parentEntityId }) => ({
    role,
    entityId: occurrence.entityId,
    parentEntityId
  })), [{
    role: "radical",
    entityId: "source.closed-root.radical",
    parentEntityId: undefined
  }, {
    role: "radicand",
    entityId: "source.closed-root.radicand.144",
    parentEntityId: "source.closed-root.radical"
  }]);
});

test("every source glyph contracts to one knot before result ink expands", () => {
  const motion = motionPlan();
  const sourceTracks = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.sourceContributorTrackIds.includes(id)
  );
  const resultTracks = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.targetResultTrackIds.includes(id)
  );
  assert.equal(sourceTracks.length, 4);
  assert.equal(resultTracks.length, 2);
  assert.ok(sourceTracks.every(({ lifecycle, timingGroupId,
    intentionalContactGroupId }) => lifecycle === "eliminate" &&
    timingGroupId === motion.fusion.timingGroupId &&
    intentionalContactGroupId === motion.fusion.intentionalContactGroupId));
  assert.ok(resultTracks.every(({ lifecycle, timingGroupId,
    intentionalContactGroupId }) => lifecycle === "introduce" &&
    timingGroupId === motion.fusion.timingGroupId &&
    intentionalContactGroupId === motion.fusion.intentionalContactGroupId));

  const knot = sampleKpNativeKatexSceneTrackFrames(
    motion.rendererPlan.tracks,
    0.5,
    false
  );
  const knotCenters = knot.filter(({ trackId }) =>
    motion.sourceContributorTrackIds.includes(trackId)
  ).map(({ expectedPaintRect }) => {
    assert.ok(expectedPaintRect);
    return center(expectedPaintRect);
  });
  const [firstCenter, ...remainingCenters] = knotCenters;
  assert.ok(firstCenter);
  assert.ok(remainingCenters.every((candidate) =>
    Math.hypot(
      candidate.x - firstCenter.x,
      candidate.y - firstCenter.y
    ) < 0.01
  ));
  assert.ok(sourceTracks.every(({ sampleMaterialScale }) => {
    const scale = sampleMaterialScale?.(0.5) ?? 1;
    return scale > 0 && scale < 0.6;
  }));
  assert.ok(resultTracks.every(({ sampleMaterialScale }) => {
    const scale = sampleMaterialScale?.(0.52) ?? 1;
    return scale > 0 && scale < 0.6;
  }));
});

test("closed evaluation is deterministic and settles at native target ink", () => {
  const motion = motionPlan();
  const tracks = motion.rendererPlan.tracks;
  const direct = sampleKpNativeKatexSceneTrackFrames(tracks, 0.47, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(tracks, 0.47, false),
    direct
  );
  const targetByAtom = new Map(
    motion.rendererPlan.reconciliation.target.atoms.map((atom) =>
      [atom.id, atom] as const
    )
  );
  const end = sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  for (const track of tracks.filter(({ id }) =>
    motion.targetResultTrackIds.includes(id))) {
    assert.ok(track.targetAtomId);
    const frame = end.find(({ trackId }) => trackId === track.id);
    assert.deepEqual(
      frame?.expectedPaintRect,
      targetByAtom.get(track.targetAtomId)?.rect
    );
    assert.equal(frame?.opacity, 1);
  }
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/u);
});

test("fusion fails closed when recursive source paint is incomplete", () => {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  assert.throws(() => compileKpClosedRootEvaluationMotion({
    exemplar: kpClosedRootEvaluationExemplar,
    endpoints: kpClosedRootEvaluationNativeEndpoints,
    source: observation(source, sourcePaint().filter(({ entityId }) =>
      entityId !== "source.closed-root.radical"
    )),
    target: observation(target, targetPaint())
  }), /every source contributor/u);
});

function motionPlan() {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  return compileKpClosedRootEvaluationMotion({
    exemplar: kpClosedRootEvaluationExemplar,
    endpoints: kpClosedRootEvaluationNativeEndpoints,
    source: observation(source, sourcePaint()),
    target: observation(target, targetPaint())
  });
}

type PaintFixture = KpRootRewritePaintFixture;
type Rect = KpRootRewriteFixtureRect;
const paint = rootRewritePaint;

function sourcePaint(): readonly PaintFixture[] {
  return [
    paint("source.closed-root.radical", 6, 8, 16, 34, "path",
      "path:radical"),
    paint("source.closed-root.radicand.144", 25, 18, 8, 20, "glyph",
      "glyph:1"),
    paint("source.closed-root.radicand.144", 35, 18, 9, 20, "glyph",
      "glyph:4"),
    paint("source.closed-root.radicand.144", 46, 18, 9, 20, "glyph",
      "glyph:4")
  ];
}

function targetPaint(): readonly PaintFixture[] {
  return [
    paint("target.closed-root.value.12", 29, 18, 8, 20, "glyph", "glyph:1"),
    paint("target.closed-root.value.12", 39, 18, 8, 20, "glyph", "glyph:2")
  ];
}

function observation(
  endpoint: typeof kpClosedRootEvaluationNativeEndpoints.source,
  fixtures: readonly PaintFixture[]
) {
  return createRootRewriteSceneObservation(endpoint, fixtures, "closed-root");
}

function center(rect: Rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
