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
          capabilityPackageCount: 3,
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
          capabilityPackageCount: 2,
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
    capabilityPackageCount: 5,
    assetCount: 0
  });
  assert.deepEqual(plan.phases[0]?.capabilityPackageIds, [
    "package.kp.equation.render.katex",
    "package.kp.equation.transform.semantic",
    "package.kp.equation.animate.motion-plan"
  ]);
  assert.deepEqual(plan.phases[0]?.capabilityPackageKeys, [
    "kp.equation:render.katex:equation:*",
    "kp.equation:transform.semantic:equation:*",
    "kp.equation:animate.motion-plan:equation:*"
  ]);
  assert.deepEqual(plan.phases[1]?.capabilityPackageIds, [
    "package.kp.graph3d.render.webgl.surface-mesh",
    "package.kp.graph3d.animate.surface-mode"
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

test("tutorial card dependency planner reports capability package diagnostics", () => {
  const plan = createKpTutorialCardDependencyPlan({
    id: "tutorial.diagnostics",
    title: "Diagnostics",
    version: 1,
    rootLayoutId: "layout.root",
    semanticObjectRefs: [
      { objectId: "equation.missing-type" },
      { objectId: "object.unknown-type", objectType: "unknown-object" }
    ],
    transformationRefs: [],
    layoutRefs: [
      {
        id: "layout.root",
        kind: "row",
        rootLayoutId: "layout.root",
        childIds: []
      }
    ],
    timelineRefs: [],
    checks: [],
    exportProfiles: [],
    dependencies: {
      critical: {
        semanticObjectIds: ["equation.missing-type", "object.unknown-type"],
        transformationIds: [],
        layoutIds: ["layout.root"],
        timelineIds: [],
        capabilities: []
      }
    },
    fallback: {
      strategy: "text-only",
      preservesLayout: false
    }
  });

  assert.deepEqual(plan.phases[0]?.capabilityPackageIds, []);
  assert.deepEqual(plan.phases[0]?.diagnostics, [
    {
      path: "dependencies.critical.semanticObjectIds[0]",
      message:
        "Semantic object equation.missing-type has no objectType; capability package planning skipped it."
    },
    {
      path: "dependencies.critical.semanticObjectIds[1].objectType",
      message: "Unknown semantic object type unknown-object."
    }
  ]);
  assert.deepEqual(plan.diagnostics, plan.phases[0]?.diagnostics);
});

test("tutorial card dependency planner includes SourceFile capability packages", () => {
  const plan = createKpTutorialCardDependencyPlan({
    id: "tutorial.programming.source-file",
    title: "SourceFile programming sample",
    version: 1,
    rootLayoutId: "layout.programming.source-file",
    semanticObjectRefs: [
      {
        objectId: "source-file.programming.add",
        objectType: "source-file"
      }
    ],
    transformationRefs: [],
    layoutRefs: [
      {
        id: "layout.programming.source-file",
        kind: "row",
        rootLayoutId: "layout.programming.source-file",
        childIds: []
      }
    ],
    timelineRefs: [],
    checks: [],
    exportProfiles: [],
    dependencies: {
      critical: {
        semanticObjectIds: ["source-file.programming.add"],
        transformationIds: [],
        layoutIds: ["layout.programming.source-file"],
        timelineIds: [],
        capabilities: []
      }
    },
    fallback: {
      strategy: "text-only",
      preservesLayout: false
    }
  });

  assert.deepEqual(plan.phases[0]?.capabilityPackageIds, [
    "package.kp.source-file.render.code-panel",
    "package.kp.source-file.select.range",
    "package.kp.source-file.animate.execution-trace"
  ]);
  assert.deepEqual(plan.phases[0]?.capabilityPackageKeys, [
    "kp.source-file:render.code-panel:source-file:*",
    "kp.source-file:select.range:source-file:*",
    "kp.source-file:animate.execution-trace:source-file:trace"
  ]);
  assert.equal(plan.totals.capabilityPackageCount, 3);
});
