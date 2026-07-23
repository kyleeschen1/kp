import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpAnimationWorkbenchSeedCohort,
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

test("Workbench seed cohort freezes two catalog identities and one planned identity", () => {
  const seeds = createKpAnimationWorkbenchSeedCohort();

  assert.deepEqual(
    seeds.map((seed) => [seed.animationId, seed.expectedPlayability]),
    [
      ["animation.generated.radical.square-root-as-power", "playable"],
      ["animation.derivative-rules.tangent-graph", "playable"],
      ["animation.algebra.quadratic.solution-branching", "planned-only"]
    ]
  );
  assert.deepEqual(
    seeds.map((seed) => seed.source.kind),
    ["catalog", "catalog", "approved-plan"]
  );
});

test("Workbench seed cohort rejects duplicate identities", () => {
  const [radical] = createKpAnimationWorkbenchSeedCohort();
  assert.throws(
    () => assertKpAnimationWorkbenchSeedCohort([radical!, radical!]),
    /Duplicate Workbench seed animation/
  );
});

test("Workbench seed cohort keeps plan-only items non-playable", () => {
  assert.throws(
    () =>
      assertKpAnimationWorkbenchSeedCohort([
        {
          animationId: "animation.algebra.quadratic.solution-branching",
          title: "Quadratic",
          source: {
            kind: "approved-plan",
            sourcePath: "docs/project/reviews/proposal.md"
          },
          expectedPlayability: "playable"
        }
      ]),
    /must remain planned-only/
  );
});
