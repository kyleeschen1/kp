import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialChoreography } from
  "../src/animation/scheme-factorial-canonical-choreography.ts";
import { projectKpSchemeFactorialMotion } from
  "../src/animation/scheme-factorial-motion-projection.ts";
import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import { sampleKpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-timeline.ts";

function projection(progress: number) {
  return projectKpSchemeFactorialMotion({
    choreography: kpSchemeFactorialChoreography,
    timeline: sampleKpSchemeFactorialTimeline({
      timeline: kpSchemeFactorialTimeline,
      progress
    })
  });
}

test("maps every canonical timeline interval to compiled motion truth", () => {
  const expected = new Map([
    ["definition-seed", ["structural", "binding"]],
    ["first-descent", ["branch", "primitive", "structural", "binding"]],
    ["repeated-descent", ["summary"]],
    ["base-case", ["branch"]],
    ["return-cascade", ["return"]],
    ["result", ["none"]]
  ]);
  for (const interval of kpSchemeFactorialTimeline.intervals) {
    const kinds = new Set(Array.from({ length: 21 }, (_, index) => {
      const local = (index + 0.5) / 21;
      return projection(interval.motion.start +
        (interval.motion.end - interval.motion.start) * local).kind;
    }));
    assert.deepEqual([...kinds], expected.get(interval.motionKind));
  }
});

test("direct seek and rewind project identical canonical motion", () => {
  for (let index = 0; index <= 500; index += 1) {
    const progress = index / 500;
    const forward = projectKpSchemeFactorialMotion({
      choreography: kpSchemeFactorialChoreography,
      timeline: sampleKpSchemeFactorialTimeline({
        timeline: kpSchemeFactorialTimeline,
        progress,
        direction: "forward"
      })
    });
    const rewind = projectKpSchemeFactorialMotion({
      choreography: kpSchemeFactorialChoreography,
      timeline: sampleKpSchemeFactorialTimeline({
        timeline: kpSchemeFactorialTimeline,
        progress,
        direction: "rewind"
      })
    });
    assert.deepEqual(rewind, forward);
  }
});
