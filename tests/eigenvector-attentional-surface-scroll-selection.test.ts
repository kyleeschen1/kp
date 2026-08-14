import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEigenvectorReadingLineRatio,
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
