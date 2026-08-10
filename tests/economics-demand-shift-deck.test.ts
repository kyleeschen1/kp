import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEconomicsDemandShiftDeckScenes,
  projectKpEconomicsDeckMotionScalar,
  readKpEconomicsDemandShiftDeckSceneIndex,
  writeKpEconomicsDemandShiftDeckScene
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-deck.ts";

test("deck scenes preserve the approved six-beat cumulative motion", () => {
  assert.deepEqual(
    kpEconomicsDemandShiftDeckScenes.map(projectKpEconomicsDeckMotionScalar),
    [0, 0, 1, 1, 2, 2]
  );
  assert.equal(
    new Set(kpEconomicsDemandShiftDeckScenes.map(({ passageId }) => passageId)).size,
    6
  );
});

test("deck URLs resolve ids and ordinal compatibility without replay", () => {
  assert.equal(
    readKpEconomicsDemandShiftDeckSceneIndex("?view=deck&scene=shift-demand"),
    2
  );
  assert.equal(readKpEconomicsDemandShiftDeckSceneIndex("?scene=6"), 5);
  assert.equal(readKpEconomicsDemandShiftDeckSceneIndex("?scene=unknown"), 0);
  assert.equal(
    writeKpEconomicsDemandShiftDeckScene({
      search: "?view=deck&theme=light",
      sceneIndex: 4
    }),
    "?view=deck&theme=light&scene=trace-supply"
  );
  assert.equal(
    writeKpEconomicsDemandShiftDeckScene({
      search: "?view=attention-stage&theme=dark",
      sceneIndex: 2,
      view: "attention-stage"
    }),
    "?view=attention-stage&theme=dark&scene=shift-demand"
  );
});
