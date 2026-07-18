import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpTutorialClaimPacedTimeline,
  sampleKpTutorialClaimPacedTimeline
} from "../src/tutorial/claim-paced-timeline.ts";

test("claim units multiply duration while preserving one shared clock", () => {
  const timeline = compileKpTutorialClaimPacedTimeline({
    id: "timeline.ftc.claim-paced",
    clockId: "clock.ftc.shared",
    millisecondsPerUnit: 600,
    beatsPerUnit: 10,
    paces: [
      {
        id: "pace.whole",
        claimId: "claim.whole",
        checkpointId: "checkpoint.whole",
        units: 1
      },
      {
        id: "pace.finite-strip",
        claimId: "claim.finite-strip",
        checkpointId: "checkpoint.finite-strip",
        units: 3
      }
    ]
  });

  assert.equal(timeline.clockId, "clock.ftc.shared");
  assert.equal(timeline.durationMs, 2400);
  assert.deepEqual(
    timeline.spans.map(({ startProgress, endProgress }) => ({
      startProgress,
      endProgress
    })),
    [
      { startProgress: 0, endProgress: 0.25 },
      { startProgress: 0.25, endProgress: 1 }
    ]
  );
});

test("claim-paced timeline direct sampling is deterministic at boundaries", () => {
  const timeline = compileKpTutorialClaimPacedTimeline({
    id: "timeline.test",
    clockId: "clock.test",
    millisecondsPerUnit: 500,
    beatsPerUnit: 5,
    paces: [
      { id: "pace.a", claimId: "claim.a", checkpointId: "cp.a", units: 1 },
      { id: "pace.b", claimId: "claim.b", checkpointId: "cp.b", units: 1 }
    ]
  });

  assert.deepEqual(sampleKpTutorialClaimPacedTimeline(timeline, 0.5), {
    timelineId: "timeline.test",
    clockId: "clock.test",
    progress: 0.5,
    beat: 5,
    elapsedMs: 500,
    activeClaimId: "claim.b",
    activeCheckpointId: "cp.b",
    localProgress: 0
  });
});
