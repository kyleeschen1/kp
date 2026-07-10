import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardManifest,
  createLinearSolveTutorialCardManifest,
  validateKpTutorialCardManifest
} from "../src/tutorial/card-manifest.ts";

test("linear solve tutorial card manifest describes the portable capsule", () => {
  const manifest = createLinearSolveTutorialCardManifest();

  assert.equal(manifest.id, "tutorial.linear-solve.card");
  assert.equal(manifest.version, 1);
  assert.equal(manifest.rootLayoutId, "layout.sample.linear-solve-synchronized-panel");
  assert.deepEqual(
    manifest.semanticObjectRefs.map((ref) => [ref.objectId, ref.objectType]),
    [
      ["equation.linear-solve.initial", "equation"],
      ["equation.linear-solve.after-subtract", "equation"],
      ["equation.linear-solve.left-simplified", "equation"],
      ["equation.linear-solve.solved", "equation"],
      ["saddle-orbit-graph", "graph-3d"]
    ]
  );
  assert.deepEqual(
    manifest.transformationRefs.map((ref) => [
      ref.kind,
      ref.sourceObjectIds,
      ref.targetObjectIds,
      ref.preserves
    ]),
    [
      [
        "equation.subtract-both-sides",
        ["equation.linear-solve.initial"],
        ["equation.linear-solve.after-subtract"],
        ["structure", "value"]
      ],
      [
        "equation.cancel",
        ["equation.linear-solve.after-subtract"],
        ["equation.linear-solve.left-simplified"],
        ["value"]
      ],
      [
        "equation.simplify",
        ["equation.linear-solve.left-simplified"],
        ["equation.linear-solve.solved"],
        ["value"]
      ]
    ]
  );
  assert.deepEqual(
    manifest.layoutRefs.map((layout) => [
      layout.id,
      layout.kind,
      layout.rootLayoutId,
      layout.sharedClockId
    ]),
    [
      [
        "layout.sample.linear-solve-synchronized-panel",
        "synchronized-panel",
        "layout.linear-solve.root",
        "solve-x-shared-clock"
      ]
    ]
  );
  assert.deepEqual(
    manifest.timelineRefs.map((timeline) => [
      timeline.id,
      timeline.kind,
      timeline.clockId,
      timeline.layoutId,
      timeline.beatCount
    ]),
    [
      [
        "timeline.linear-solve.shared",
        "layout-shared-clock",
        "solve-x-shared-clock",
        "layout.sample.linear-solve-synchronized-panel",
        50
      ]
    ]
  );
  assert.ok(
    manifest.checks.some(
      (check) =>
        check.kind === "sampleable-timeline" &&
        check.targetIds.includes("timeline.linear-solve.shared")
    )
  );
  assert.deepEqual(
    manifest.exportProfiles.map((profile) => profile.kind),
    ["interactive-card", "iframe", "gif", "step-sequence"]
  );
  assert.deepEqual(manifest.dependencies.critical.timelineIds, [
    "timeline.linear-solve.shared"
  ]);
  assert.ok(
    manifest.dependencies.critical.capabilities.some(
      (capability) =>
        capability.library === "kp.layout" &&
        capability.capability === "sample.synchronized-panel"
    )
  );
  assert.equal(manifest.fallback.strategy, "static-snapshot");
  assert.equal(manifest.fallback.preservesLayout, true);
});

test("tutorial card manifest validation catches broken cross references", () => {
  const validManifest = createLinearSolveTutorialCardManifest();
  assert.deepEqual(validateKpTutorialCardManifest(validManifest), []);

  const invalidManifest = createKpTutorialCardManifest({
    ...validManifest,
    semanticObjectRefs: validManifest.semanticObjectRefs.slice(0, 1),
    dependencies: {
      ...validManifest.dependencies,
      critical: {
        ...validManifest.dependencies.critical,
        timelineIds: ["timeline.missing"],
        layoutIds: ["layout.missing"]
      }
    }
  });

  const diagnostics = validateKpTutorialCardManifest(invalidManifest);

  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.path === "transformationRefs[0].targetObjectIds[0]" &&
        diagnostic.message.includes("undeclared semantic object")
    )
  );
  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.path === "dependencies.critical.timelineIds[0]" &&
        diagnostic.message.includes("undeclared timeline")
    )
  );
  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.path === "dependencies.critical.layoutIds[0]" &&
        diagnostic.message.includes("undeclared layout")
    )
  );
});

test("createKpTutorialCardManifest clones nested arrays", () => {
  const semanticObjectRefs = [
    { objectId: "equation.one", objectType: "equation" }
  ];
  const exportProfiles = [
    {
      id: "export.card",
      kind: "interactive-card" as const,
      target: "browser" as const,
      settings: { autoplay: false, maxWidthPx: 420 }
    }
  ];
  const manifest = createKpTutorialCardManifest({
    id: "tutorial.clone-test",
    title: "Clone test",
    version: 1,
    rootLayoutId: "layout.root",
    semanticObjectRefs,
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
    exportProfiles,
    dependencies: {
      critical: {
        semanticObjectIds: ["equation.one"],
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

  semanticObjectRefs[0] = {
    objectId: "equation.mutated",
    objectType: "equation"
  };
  const firstExportProfile = exportProfiles[0];
  assert.ok(firstExportProfile);
  firstExportProfile.settings.maxWidthPx = 960;

  assert.equal(manifest.semanticObjectRefs[0]?.objectId, "equation.one");
  assert.deepEqual(manifest.exportProfiles[0]?.settings, {
    autoplay: false,
    maxWidthPx: 420
  });
});
