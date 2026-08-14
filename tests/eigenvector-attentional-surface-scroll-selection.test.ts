import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEigenvectorReadingLineRatio,
  kpEigenvectorScrubDistanceRatio,
  projectKpEigenvectorScrollPosition,
  selectKpEigenvectorBeatAtReadingLine
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-scroll-selection.ts";

test("the last passage to cross the reading line owns the state", () => {
  const beatId = selectKpEigenvectorBeatAtReadingLine({
    readingLineY: 560,
    passages: [
      { beatId: "most-vectors-turn", top: -100 },
      { beatId: "watch-the-fan", top: 510 },
      { beatId: "one-direction-survives", top: 880 }
    ]
  });

  assert.equal(kpEigenvectorReadingLineRatio, 0.56);
  assert.equal(beatId, "watch-the-fan");
});

test("the first and last passages stay selected at document boundaries", () => {
  const passages = [
    { beatId: "most-vectors-turn" as const, top: 700 },
    { beatId: "watch-the-fan" as const, top: 1000 },
    { beatId: "compressed-recall" as const, top: 1300 }
  ];

  assert.equal(
    selectKpEigenvectorBeatAtReadingLine({ passages, readingLineY: 560 }),
    "most-vectors-turn"
  );
  assert.equal(
    selectKpEigenvectorBeatAtReadingLine({
      passages: passages.map((passage) => ({
        ...passage,
        top: passage.top - 1800
      })),
      readingLineY: 560
    }),
    "compressed-recall"
  );
});

test("selection is independent of callback frequency and passage height", () => {
  const passages = [
    { beatId: "most-vectors-turn" as const, top: -600 },
    { beatId: "watch-the-fan" as const, top: -10 },
    { beatId: "one-direction-survives" as const, top: 590 }
  ];

  assert.equal(
    selectKpEigenvectorBeatAtReadingLine({ passages, readingLineY: 560 }),
    "watch-the-fan"
  );
  assert.equal(
    selectKpEigenvectorBeatAtReadingLine({ passages, readingLineY: 560 }),
    "watch-the-fan"
  );
});

test("empty static documents fail closed to the first endpoint", () => {
  assert.equal(
    selectKpEigenvectorBeatAtReadingLine({ passages: [], readingLineY: 560 }),
    "most-vectors-turn"
  );
});

test("crossing the visible seam begins one bounded scroll transition", () => {
  const passages = [
    { beatId: "most-vectors-turn" as const, top: -100 },
    { beatId: "watch-the-fan" as const, top: 560 },
    { beatId: "one-direction-survives" as const, top: 900 }
  ];
  const start = projectKpEigenvectorScrollPosition({
    passages,
    readingLineY: 560,
    scrubDistance: 220
  });
  const middle = projectKpEigenvectorScrollPosition({
    passages: passages.map((passage) => ({
      ...passage,
      top: passage.top - 110
    })),
    readingLineY: 560,
    scrubDistance: 220
  });
  const finish = projectKpEigenvectorScrollPosition({
    passages: passages.map((passage) => ({
      ...passage,
      top: passage.top - 220
    })),
    readingLineY: 560,
    scrubDistance: 220
  });

  assert.equal(kpEigenvectorScrubDistanceRatio, 0.22);
  assert.deepEqual(start, {
    fromBeatId: "most-vectors-turn",
    toBeatId: "watch-the-fan",
    progress: 0,
    settled: false
  });
  assert.equal(middle.progress, 0.5);
  assert.equal(finish.progress, 1);
  assert.equal(finish.settled, true);
});

test("scroll progress reverses from geometry without replay state", () => {
  const projectAtTop = (top: number) => projectKpEigenvectorScrollPosition({
    passages: [
      { beatId: "most-vectors-turn", top: -200 },
      { beatId: "watch-the-fan", top }
    ],
    readingLineY: 560,
    scrubDistance: 220
  });

  assert.equal(projectAtTop(450).progress, 0.5);
  assert.deepEqual(projectAtTop(500), projectAtTop(500));
  assert.equal(projectAtTop(560).progress, 0);
});

test("reduced motion projects a crossed seam directly to its endpoint", () => {
  const projection = projectKpEigenvectorScrollPosition({
    passages: [
      { beatId: "most-vectors-turn", top: -100 },
      { beatId: "watch-the-fan", top: 559 }
    ],
    readingLineY: 560,
    scrubDistance: 220,
    reducedMotion: true
  });

  assert.equal(projection.progress, 1);
  assert.equal(projection.settled, true);
});
