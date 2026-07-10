import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardManifest,
  createLinearSolveTutorialCardManifest
} from "../src/tutorial/card-manifest.ts";
import {
  createKpTutorialCardRuntimeContext,
  resolveKpTutorialCardRuntimeRef
} from "../src/tutorial/card-runtime.ts";

test("tutorial card runtime context indexes manifest references", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const context = createKpTutorialCardRuntimeContext(manifest);

  assert.equal(context.manifestId, "tutorial.linear-solve.card");
  assert.equal(context.manifest.id, "tutorial.linear-solve.card");
  assert.equal(context.rootLayout?.id, "layout.sample.linear-solve-synchronized-panel");
  assert.equal(context.sharedTimeline?.id, "timeline.linear-solve.shared");
  assert.equal(context.semanticObjectsById.get("equation.linear-solve.initial")?.objectType, "equation");
  assert.equal(
    context.transformationsById.get("transform.linear-solve.subtract-both-sides-3")?.kind,
    "equation.subtract-both-sides"
  );
  assert.equal(context.layoutsById.get("layout.sample.linear-solve-synchronized-panel")?.kind, "synchronized-panel");
  assert.equal(context.timelinesById.get("timeline.linear-solve.shared")?.beatCount, 50);
  assert.equal(context.exportProfilesById.get("export.linear-solve.card")?.kind, "interactive-card");
  assert.equal(context.checksById.get("check.linear-solve.sampleable-timeline")?.kind, "sampleable-timeline");
  assert.equal(context.capabilityDependencies.length, 6);
  assert.deepEqual(context.diagnostics, []);
});

test("tutorial card runtime context resolves typed refs", () => {
  const context = createKpTutorialCardRuntimeContext(
    createLinearSolveTutorialCardManifest()
  );

  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "semantic-object",
      id: "saddle-orbit-graph"
    })?.value.objectType,
    "graph-3d"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "transformation",
      id: "transform.linear-solve.cancel-left-additive-inverse"
    })?.value.kind,
    "equation.cancel"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "layout",
      id: "layout.sample.linear-solve-synchronized-panel"
    })?.value.sharedClockId,
    "solve-x-shared-clock"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "timeline",
      id: "timeline.linear-solve.shared"
    })?.value.reversible,
    true
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "export-profile",
      id: "export.linear-solve.iframe"
    })?.value.target,
    "browser"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "capability",
      library: "kp.graph",
      capability: "render.webgl",
      objectType: "graph-3d",
      mode: "surface.mesh"
    })?.value.capability,
    "render.webgl"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, { kind: "fallback" })?.value.strategy,
    "static-snapshot"
  );
  assert.equal(
    resolveKpTutorialCardRuntimeRef(context, {
      kind: "semantic-object",
      id: "missing"
    }),
    undefined
  );
});

test("tutorial card runtime context carries manifest validation diagnostics", () => {
  const validManifest = createLinearSolveTutorialCardManifest();
  const invalidManifest = createKpTutorialCardManifest({
    ...validManifest,
    rootLayoutId: "layout.missing",
    dependencies: {
      ...validManifest.dependencies,
      critical: {
        ...validManifest.dependencies.critical,
        timelineIds: ["timeline.missing"]
      }
    }
  });

  const context = createKpTutorialCardRuntimeContext(invalidManifest);

  assert.equal(context.rootLayout, undefined);
  assert.equal(context.sharedTimeline?.id, "timeline.linear-solve.shared");
  assert.ok(
    context.diagnostics.some(
      (diagnostic) =>
        diagnostic.path === "rootLayoutId" &&
        diagnostic.message.includes("layout.missing")
    )
  );
  assert.ok(
    context.diagnostics.some(
      (diagnostic) =>
        diagnostic.path === "dependencies.critical.timelineIds[0]" &&
        diagnostic.message.includes("timeline.missing")
    )
  );
});
