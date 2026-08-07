import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEconomicsMotionStationPhaseBoundaries,
  kpEconomicsOrdinaryStationPhaseBoundaries,
  projectKpEconomicsStationPhase,
  type KpEconomicsStationPhaseBoundaries
} from
  "../src/tutorial/economics-demand-shift/economics-animation-station-phase.ts";

const ordinaryGeometry = Object.freeze({
  usableBottomPx: 800,
  cuePinStartY: 440,
  cuePinEndY: 360,
  cueExitEndY: 334
});

const motionGeometry = Object.freeze({
  ...ordinaryGeometry,
  cueExitEndY: 334,
  motionScrubEndY: 14,
  motionEndY: -66
});

const boundaries: KpEconomicsStationPhaseBoundaries = Object.freeze({
  approachStartPx: 800,
  readyStartPx: 680,
  scrubStartPx: 560,
  scrubEndPx: 240,
  handoffEndPx: 160
});

const motionInput = Object.freeze({
  passageId: "follow-shift",
  cueKind: "motion" as const,
  boundaries,
  beforeCheckpointId: "market-initial",
  afterCheckpointId: "market-shifted",
  motionBlockId: "demand-shift"
});

test("motion cues project the five phases and one semantic owner", () => {
  const samples = [800, 740, 680, 620, 560, 400, 240, 200, 160].map(
    (anchorPx) => projectKpEconomicsStationPhase({ ...motionInput, anchorPx })
  );

  assert.deepEqual(samples.map(({ phase }) => phase), [
    "approach",
    "approach",
    "ready",
    "ready",
    "scrub",
    "scrub",
    "settle",
    "settle",
    "handoff"
  ]);
  assert.deepEqual(samples.map(({ ownership }) => ownership), [
    "incoming-passage",
    "incoming-passage",
    "active-passage",
    "active-passage",
    "motion-block",
    "motion-block",
    "settled-passage",
    "settled-passage",
    "successor"
  ]);
  assert.deepEqual(samples.map(({ semanticProgress }) => semanticProgress), [
    0, 0, 0, 0, 0, 0.5, 1, 1, 1
  ]);
  assert.equal(samples[5]!.activeMotionBlockId, "demand-shift");
  assert.equal(samples[7]!.checkpointId, "market-shifted");
  assert.equal(samples[8]!.activePassageId, undefined);
});

test("ordinary cues skip scrub without inventing semantic motion", () => {
  const ordinaryInput = {
    ...motionInput,
    cueKind: "ordinary" as const,
    motionBlockId: undefined
  };
  const samples = [740, 620, 400, 160].map((anchorPx) =>
    projectKpEconomicsStationPhase({ ...ordinaryInput, anchorPx })
  );

  assert.deepEqual(samples.map(({ phase }) => phase), [
    "approach", "ready", "settle", "handoff"
  ]);
  assert.deepEqual(samples.map(({ semanticProgress }) => semanticProgress), [
    0, 0, 0, 0
  ]);
  assert.ok(samples.every(({ activeMotionBlockId }) =>
    activeMotionBlockId === undefined
  ));
  assert.ok(samples.every(({ checkpointId }) =>
    checkpointId === "market-initial"
  ));
});

test("ordinary reading hold is a 10vh local corridor independent of cue height", () => {
  const localBoundaries = kpEconomicsOrdinaryStationPhaseBoundaries(
    ordinaryGeometry
  );
  assert.equal(
    localBoundaries.readyStartPx - localBoundaries.scrubStartPx,
    80
  );
  assert.equal(localBoundaries.scrubStartPx, localBoundaries.scrubEndPx);

  const input = {
    ...motionInput,
    cueKind: "ordinary" as const,
    motionBlockId: undefined,
    boundaries: localBoundaries
  };
  const shortCue = { top: 400, bottom: 448 };
  const longCue = { top: 400, bottom: 640 };
  const shortProjection = projectKpEconomicsStationPhase({
    ...input,
    anchorPx: shortCue.top
  });
  const longProjection = projectKpEconomicsStationPhase({
    ...input,
    anchorPx: longCue.top
  });

  assert.deepEqual(shortProjection, longProjection);
  assert.equal(shortProjection.phase, "ready");
  assert.equal(shortProjection.ownership, "active-passage");
  assert.equal(shortProjection.semanticProgress, 0);
  assert.equal(
    projectKpEconomicsStationPhase({ ...input, anchorPx: 360 }).phase,
    "settle"
  );
  assert.equal(
    projectKpEconomicsStationPhase({ ...input, anchorPx: 334 }).phase,
    "handoff"
  );
});

test("motion station reserves 40vh for scrub and 10vh for settlement", () => {
  const localBoundaries = kpEconomicsMotionStationPhaseBoundaries(
    motionGeometry
  );
  assert.equal(localBoundaries.scrubStartPx - localBoundaries.scrubEndPx, 320);
  assert.equal(localBoundaries.scrubEndPx - localBoundaries.handoffEndPx, 80);

  const input = {
    ...motionInput,
    boundaries: localBoundaries
  };
  const projected = projectKpEconomicsStationPhase({
    ...input,
    anchorPx: 170,
    projectedSemanticProgress: 0.72
  });
  assert.equal(projected.phase, "scrub");
  assert.equal(projected.semanticProgress, 0.72);
  assert.equal(projected.activeMotionBlockId, "demand-shift");
  assert.equal(
    projectKpEconomicsStationPhase({ ...input, anchorPx: 14 }).phase,
    "settle"
  );
  assert.equal(
    projectKpEconomicsStationPhase({ ...input, anchorPx: -66 }).phase,
    "handoff"
  );
});

test("station phase projection is monotonic, exactly reversible, and direct", () => {
  const anchors = Array.from({ length: 65 }, (_, index) => 800 - index * 10);
  const forward = anchors.map((anchorPx) =>
    projectKpEconomicsStationPhase({ ...motionInput, anchorPx })
  );
  const reverse = [...anchors].reverse().map((anchorPx) =>
    projectKpEconomicsStationPhase({ ...motionInput, anchorPx })
  );

  for (let index = 1; index < forward.length; index += 1) {
    assert.ok(
      forward[index]!.semanticProgress >= forward[index - 1]!.semanticProgress
    );
  }
  assert.deepEqual(reverse, [...forward].reverse());
  assert.deepEqual(
    projectKpEconomicsStationPhase({ ...motionInput, anchorPx: 400 }),
    projectKpEconomicsStationPhase({ ...motionInput, anchorPx: 400 })
  );
});

test("invalid and zero-span geometry fails closed without NaN state", () => {
  const projection = projectKpEconomicsStationPhase({
    ...motionInput,
    anchorPx: Number.NaN,
    boundaries: {
      approachStartPx: 400,
      readyStartPx: 500,
      scrubStartPx: Number.NaN,
      scrubEndPx: 500,
      handoffEndPx: Number.POSITIVE_INFINITY
    }
  });

  assert.equal(projection.phase, "handoff");
  assert.equal(projection.phaseProgress, 1);
  assert.equal(Number.isFinite(projection.semanticProgress), true);
});
