import assert from "node:assert/strict";
import test from "node:test";
import {
  applyKpTutorialBranchPatch,
  createKpTutorialExplorationBranch,
  sampleKpTutorialBranchRejoin,
  setKpTutorialBranchLocks
} from "../src/tutorial/exploration-branch.ts";
import { createKpTutorialExplorationState } from "../src/tutorial/exploration-state.ts";

test("branches preserve immutable patch history and parameter locks", () => {
  const root = createKpTutorialExplorationBranch({
    id: "branch.ftc.explore",
    state: createKpTutorialExplorationState({
      id: "state.ftc",
      values: { upperBound: 2, deltaX: 0.5 }
    })
  });
  const changed = applyKpTutorialBranchPatch(root, { upperBound: 3 });
  const locked = setKpTutorialBranchLocks(changed, ["upperBound"]);

  assert.equal(root.patches.length, 0);
  assert.deepEqual(changed.patches, [
    {
      id: "branch.ftc.explore.patch.0",
      sequence: 0,
      values: { upperBound: 3 }
    }
  ]);
  assert.throws(
    () => applyKpTutorialBranchPatch(locked, { upperBound: 1 }),
    /Cannot patch locked tutorial parameters/
  );
});

test("rejoin interpolates live numeric state back to the canonical reference", () => {
  const branch = applyKpTutorialBranchPatch(
    createKpTutorialExplorationBranch({
      id: "branch.ftc.explore",
      state: createKpTutorialExplorationState({
        id: "state.ftc",
        values: { upperBound: 2, deltaX: 0.5 }
      })
    }),
    { upperBound: 3, deltaX: 0.25 }
  );

  assert.deepEqual(sampleKpTutorialBranchRejoin(branch, 0.5).snapshot.values, {
    upperBound: 2.5,
    deltaX: 0.375
  });
  assert.deepEqual(sampleKpTutorialBranchRejoin(branch, 1), {
    branchId: "branch.ftc.explore",
    progress: 1,
    snapshot: {
      id: "branch.ftc.explore.rejoin",
      values: { upperBound: 2, deltaX: 0.5 }
    },
    remainingDiffs: [],
    rejoined: true
  });
});
