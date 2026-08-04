import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLispDwellTimeline,
  defineKpLispInternalTuning,
  KP_LISP_AUTHORED_DWELL_BEATS,
  KP_LISP_DEFAULT_TUNING,
  KP_LISP_TUNING_KEYS,
  parseKpLispInternalTuning,
  sampleKpLispDwellTimeline,
  serializeKpLispInternalTuning
} from "../src/animation/lisp-s-expression-timing.ts";

test("keeps all eight approved tunables bounded and internal-only", () => {
  const tuning = defineKpLispInternalTuning();

  assert.deepEqual(Object.keys(tuning.values), KP_LISP_TUNING_KEYS);
  assert.deepEqual(tuning.values, KP_LISP_DEFAULT_TUNING);
  assert.equal(tuning.visibility, "internal-only");
  assert.equal(tuning.publicControls, false);
  assert.equal(Object.isFrozen(tuning.values), true);
  assert.throws(
    () => defineKpLispInternalTuning({ jostleAmplitude: 1.01 }),
    /between 0 and 1/
  );
  assert.throws(
    () => defineKpLispInternalTuning({ particleDetail: 1.5 }),
    /must be an integer/
  );
  assert.throws(
    () => defineKpLispInternalTuning({ extra: 1 } as never),
    /Unknown Lisp tuning parameter extra/
  );
});

test("round-trips a complete stable internal tuning serialization", () => {
  const tuning = defineKpLispInternalTuning({
    jostleAmplitude: 0.6,
    dwellDuration: 1.8,
    particleDetail: 2
  });
  const serialized = serializeKpLispInternalTuning(tuning);

  assert.equal(serialized.split(";").length, 9);
  assert.deepEqual(parseKpLispInternalTuning(serialized), tuning);
  assert.throws(
    () => parseKpLispInternalTuning(serialized.replace(/;archHeight=[^;]+/, "")),
    /all eight parameters/
  );
  assert.throws(
    () => parseKpLispInternalTuning(serialized.replace("v1", "v2")),
    /Unsupported Lisp tuning/
  );
});

test("gives every authored semantic checkpoint a real dwell plateau", () => {
  const timeline = compileKpLispDwellTimeline();

  assert.equal(timeline.checkpoints.length, KP_LISP_AUTHORED_DWELL_BEATS.length);
  assert.deepEqual(
    [...new Set(timeline.checkpoints.map(({ block }) => block))],
    ["structure", "application", "evaluation"]
  );
  for (const checkpoint of timeline.checkpoints) {
    assert.ok(checkpoint.dwell.end > checkpoint.dwell.start);
    assert.ok(checkpoint.seekProgress > 0 && checkpoint.seekProgress < 1);
    assert.equal(
      sampleKpLispDwellTimeline(timeline, checkpoint.seekProgress).checkpointId,
      checkpoint.id
    );
    assert.equal(
      sampleKpLispDwellTimeline(timeline, checkpoint.seekProgress).phase,
      "dwell"
    );
  }
});

test("makes major holds longer than minor holds and honors tuning", () => {
  const regular = compileKpLispDwellTimeline();
  const slower = compileKpLispDwellTimeline(
    KP_LISP_AUTHORED_DWELL_BEATS,
    defineKpLispInternalTuning({ dwellDuration: 2.4 })
  );
  const durationFor = (
    timeline: typeof regular,
    kind: "minor" | "major"
  ) => {
    const checkpoint = timeline.checkpoints.find(({ dwellKind }) =>
      dwellKind === kind)!;
    return checkpoint.dwell.end - checkpoint.dwell.start;
  };

  assert.ok(durationFor(regular, "major") > durationFor(regular, "minor"));
  assert.ok(slower.duration > regular.duration);
});

test("holds endpoint motion fixed throughout each dwell and seeks directly", () => {
  const timeline = compileKpLispDwellTimeline();
  for (const checkpoint of timeline.checkpoints) {
    for (const time of [checkpoint.dwell.start + 1e-4,
      checkpoint.seekProgress * timeline.duration, checkpoint.dwell.end - 1e-4]) {
      const frame = sampleKpLispDwellTimeline(timeline, time / timeline.duration);
      assert.equal(frame.checkpointId, checkpoint.id);
      assert.equal(frame.phase, "dwell");
      assert.equal(frame.localProgress, 1);
    }
  }
  assert.deepEqual(sampleKpLispDwellTimeline(timeline, 0), {
    checkpointId: "source-readable",
    block: "structure",
    phase: "dwell",
    localProgress: 1
  });
});
