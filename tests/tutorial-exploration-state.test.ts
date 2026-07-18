import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpTutorialExplorationState,
  diffKpTutorialExplorationState,
  updateKpTutorialLiveState
} from "../src/tutorial/exploration-state.ts";

test("live exploration changes without mutating the authored reference", () => {
  const initial = createKpTutorialExplorationState({
    id: "state.ftc",
    values: { upperBound: 2, deltaX: 0.5 }
  });
  const changed = updateKpTutorialLiveState(initial, {
    upperBound: 2.5,
    deltaX: 0.25
  });

  assert.deepEqual(initial.reference.values, { upperBound: 2, deltaX: 0.5 });
  assert.deepEqual(changed.reference.values, initial.reference.values);
  assert.deepEqual(changed.live.values, { upperBound: 2.5, deltaX: 0.25 });
  assert.deepEqual(diffKpTutorialExplorationState(changed), [
    { parameterId: "upperBound", referenceValue: 2, liveValue: 2.5 },
    { parameterId: "deltaX", referenceValue: 0.5, liveValue: 0.25 }
  ]);
});

test("live exploration rejects parameters outside the shared model", () => {
  const state = createKpTutorialExplorationState({
    id: "state.ftc",
    values: { upperBound: 2 }
  });

  assert.throws(
    () => updateKpTutorialLiveState(state, { invented: 3 }),
    /Unknown tutorial parameters: invented/
  );
});
