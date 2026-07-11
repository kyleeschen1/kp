import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  dependencyCapabilityKey
} from "../src/tutorial/dependency-planner.ts";

test("tutorial card dependency planner summarizes manifest dependency phases", () => {
  const plan = createKpTutorialCardDependencyPlan(
    createLinearSolveTutorialCardManifest()
  );

  assert.equal(plan.manifestId, "tutorial.linear-solve.card");
  assert.deepEqual(
    plan.phases.map((phase) => [
      phase.phase,
      phase.loadStage,
      phase.requiredForInitialRender,
      phase.counts
    ]),
    [
      [
        "critical",
        "initial-render",
        true,
        {
          semanticObjectCount: 4,
          transformationCount: 3,
          layoutCount: 1,
          timelineCount: 1,
          capabilityCount: 3,
          capabilityPackageCount: 1,
          assetCount: 0
        }
      ],
      [
        "interactive",
        "interaction",
        false,
        {
          semanticObjectCount: 1,
          transformationCount: 0,
          layoutCount: 1,
          timelineCount: 1,
          capabilityCount: 1,
          capabilityPackageCount: 1,
          assetCount: 0
        }
      ],
      [
        "optional",
        "export",
        false,
        {
          semanticObjectCount: 0,
          transformationCount: 0,
          layoutCount: 0,
          timelineCount: 1,
          capabilityCount: 2,
          capabilityPackageCount: 0,
          assetCount: 0
        }
      ]
    ]
  );
  assert.deepEqual(plan.totals, {
    semanticObjectCount: 5,
    transformationCount: 3,
    layoutCount: 1,
    timelineCount: 1,
    capabilityCount: 6,
    capabilityPackageCount: 2,
    assetCount: 0
  });
  assert.deepEqual(plan.phases[0]?.capabilityPackageIds, [
    "package.kp.equation.render.katex"
  ]);
  assert.deepEqual(plan.phases[0]?.capabilityPackageKeys, [
    "kp.equation:render.katex:equation:*"
  ]);
  assert.deepEqual(plan.phases[1]?.capabilityPackageIds, [
    "package.kp.graph3d.render.webgl.surface-mesh"
  ]);
  assert.deepEqual(plan.phases[1]?.capabilityKeys, [
    "kp.graph:render.webgl:graph-3d:surface.mesh"
  ]);
  assert.equal(
    dependencyCapabilityKey({
      library: "kp.export",
      capability: "encode.gif"
    }),
    "kp.export:encode.gif:*:*"
  );
});
