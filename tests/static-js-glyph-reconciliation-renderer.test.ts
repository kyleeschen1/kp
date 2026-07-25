import assert from "node:assert/strict";
import test from "node:test";

import { createKpStaticJsGlyphPlayback } from "../src/animation/static-js-glyph-reconciliation-renderer.ts";
import type { KpBoundedClearanceSchedule } from "../src/animation/bounded-glyph-clearance-scheduler.ts";

const schedule: KpBoundedClearanceSchedule = {
  kind: "bounded-glyph-clearance-schedule",
  operationCount: 3,
  usedOperationSpecificPolicy: false,
  motions: [{
    matchId: "match.x",
    status: "clearance-route",
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: -10 },
      { x: 20, y: -10 },
      { x: 20, y: 0 }
    ],
    sourceStyleFingerprint: "math|400|16",
    targetStyleFingerprint: "math|400|16"
  }]
};

test("static-JS playback is deterministic under seek and rewind", () => {
  const applied: Array<{ x: number; y: number }> = [];
  const playback = createKpStaticJsGlyphPlayback({
    schedule,
    durationMs: 600,
    host: {
      supportedMatchIds: new Set(["match.x"]),
      apply(frame) { applied.push({ x: frame.x, y: frame.y }); }
    }
  });

  assert.deepEqual(playback.seek(0)[0], {
    matchId: "match.x", x: 0, y: 0, opacity: 1, settled: false
  });
  const middle = playback.seek(0.5)[0]!;
  assert.deepEqual(playback.seek(1)[0], {
    matchId: "match.x", x: 20, y: 0, opacity: 1, settled: false
  });
  assert.deepEqual(playback.seek(0.5)[0], middle);
  assert.equal(applied.length, 4);
});

test("static-JS settle fallback is an explicit checkpoint crossfade", () => {
  const playback = createKpStaticJsGlyphPlayback({
    schedule: {
      ...schedule,
      motions: [{
        ...schedule.motions[0]!,
        status: "settle",
        waypoints: [{ x: 20, y: 0 }]
      }]
    },
    durationMs: 300,
    host: {
      supportedMatchIds: new Set(["match.x"]),
      apply() {}
    }
  });

  assert.equal(playback.sample(0.49)[0]?.opacity, 0);
  assert.equal(playback.sample(0.5)[0]?.opacity, 1);
  assert.equal(playback.sample(0.5)[0]?.settled, true);
});

test("static-JS seam rejects missing host bindings", () => {
  assert.throws(
    () => createKpStaticJsGlyphPlayback({
      schedule,
      durationMs: 300,
      host: { supportedMatchIds: new Set(), apply() {} }
    }),
    /lacks match/
  );
});
