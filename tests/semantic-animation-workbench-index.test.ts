import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "../src/editor/semantic-animation-workbench-catalog-adapter.ts";
import {
  createKpCanonicalAnimationIdentity
} from "../src/editor/semantic-animation-workbench-identity.ts";
import {
  compileKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-index.ts";
import {
  projectKpAnimationRepresentations
} from "../src/editor/semantic-animation-workbench-representation-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

function inputs() {
  const seeds = createKpAnimationWorkbenchSeedCohort();
  const descriptors = createKpEditorAnimationLibrary();
  const catalogEntries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds
  });
  return {
    seeds,
    catalogEntries,
    plannedIdentities: [
      createKpCanonicalAnimationIdentity({ seed: seeds[2]! })
    ],
    representations: projectKpAnimationRepresentations({
      catalogEntries,
      descriptors
    }),
    roadmap: [
      {
        animationId: seeds[0]!.animationId,
        state: "now" as const,
        sourceId: "plan.workbench"
      },
      {
        animationId: seeds[1]!.animationId,
        state: "now" as const,
        sourceId: "plan.workbench"
      },
      {
        animationId: seeds[2]!.animationId,
        state: "next" as const,
        sourceId: "run.workbench#s22"
      }
    ],
    theseus: [
      {
        animationId: seeds[0]!.animationId,
        execution: "complete" as const,
        controlIds: ["action.radical"],
        diagnostics: []
      },
      {
        animationId: seeds[1]!.animationId,
        execution: "complete" as const,
        controlIds: ["action.derivative"],
        diagnostics: []
      },
      {
        animationId: seeds[2]!.animationId,
        execution: "not-scheduled" as const,
        controlIds: ["run.workbench#s22"],
        diagnostics: []
      }
    ]
  };
}

test("canonical index includes one deterministic entry per animation", () => {
  const input = inputs();
  const index = compileKpSemanticAnimationWorkbenchIndex(input);
  const reversed = compileKpSemanticAnimationWorkbenchIndex({
    ...input,
    catalogEntries: [...input.catalogEntries].reverse(),
    representations: [...input.representations].reverse(),
    roadmap: [...input.roadmap].reverse(),
    theseus: [...input.theseus].reverse()
  });

  assert.equal(index.valid, true);
  assert.deepEqual(index, reversed);
  assert.equal(
    new Set(index.entries.map((entry) => entry.identity.animationId)).size,
    index.entries.length
  );
  assert.equal(
    index.entries.length,
    input.catalogEntries.length + input.plannedIdentities.length
  );
});

test("seed cohort keeps independent lifecycle authority facets", () => {
  const input = inputs();
  const index = compileKpSemanticAnimationWorkbenchIndex(input);
  const byId = new Map(
    index.entries.map((entry) => [entry.identity.animationId, entry])
  );
  const radical = byId.get(input.seeds[0]!.animationId)!;
  const derivative = byId.get(input.seeds[1]!.animationId)!;
  const quadratic = byId.get(input.seeds[2]!.animationId)!;

  assert.deepEqual(radical.lifecycle, {
    schemaVersion: "kp.animation-lifecycle-facets.v1",
    roadmap: "now",
    execution: "complete",
    maturity: "promoted",
    approval: "approved",
    review: "unreviewed",
    verification: "unknown",
    playability: "playable"
  });
  assert.equal(derivative.lifecycle.maturity, "approved");
  assert.equal(derivative.lifecycle.approval, "approved");
  assert.equal(quadratic.lifecycle.maturity, "proposed");
  assert.equal(quadratic.lifecycle.playability, "planned-only");
  assert.equal(quadratic.representations.length, 0);
});

test("canonical index reports orphans and conflicts without silent resolution", () => {
  const input = inputs();
  const index = compileKpSemanticAnimationWorkbenchIndex({
    ...input,
    roadmap: [
      ...input.roadmap,
      {
        animationId: input.seeds[0]!.animationId,
        state: "later",
        sourceId: "plan.stale"
      }
    ],
    theseus: [
      ...input.theseus,
      {
        animationId: "animation.orphan",
        execution: "active",
        controlIds: ["action.orphan"],
        diagnostics: []
      }
    ]
  });

  assert.equal(index.valid, false);
  assert.deepEqual(
    index.diagnostics.map((diagnostic) => diagnostic.code).sort(),
    ["duplicate-roadmap-state", "orphan-theseus"]
  );
  const radical = index.entries.find(
    (entry) => entry.identity.animationId === input.seeds[0]!.animationId
  )!;
  assert.equal(radical.lifecycle.roadmap, "untracked");
  assert.equal(radical.diagnostics[0]!.code, "duplicate-roadmap-state");
});
