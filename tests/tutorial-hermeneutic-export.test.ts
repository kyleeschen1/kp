import assert from "node:assert/strict";
import test from "node:test";
import { createKpTutorialExplorationBranch } from "../src/tutorial/exploration-branch.ts";
import { createKpTutorialExplorationState } from "../src/tutorial/exploration-state.ts";
import { createKpHermeneuticTutorialExportArtifact } from "../src/tutorial/hermeneutic-export.ts";
import type { KpHermeneuticTutorialModule } from "../src/tutorial/hermeneutic-module.ts";

const module = {
  id: "tutorial.ftc",
  version: 1,
  title: "FTC",
  clockId: "clock.ftc.shared",
  canonicalSceneIds: ["scene.ftc.whole"],
  views: [],
  scenes: [
    {
      id: "scene.ftc.whole",
      title: "Whole",
      viewIds: [],
      checkpointIds: ["checkpoint.ftc.whole"]
    },
    {
      id: "scene.ftc.optional",
      title: "Optional branch",
      viewIds: [],
      checkpointIds: ["checkpoint.ftc.optional"]
    }
  ],
  checkpoints: [
    {
      id: "checkpoint.ftc.whole",
      sceneId: "scene.ftc.whole",
      progress: 0,
      viewIds: [],
      label: "Whole"
    },
    {
      id: "checkpoint.ftc.optional",
      sceneId: "scene.ftc.optional",
      progress: 0.5,
      viewIds: [],
      label: "Optional"
    }
  ]
} satisfies KpHermeneuticTutorialModule;

const branch = createKpTutorialExplorationBranch({
  id: "branch.ftc",
  state: createKpTutorialExplorationState({
    id: "state.ftc",
    values: { upperBound: 2 }
  })
});

test("tutorial exports use the canonical spine and checkpoints by default", () => {
  const artifact = createKpHermeneuticTutorialExportArtifact({
    id: "export.ftc",
    module,
    branches: [branch]
  });

  assert.equal(artifact.canonicalOnly, true);
  assert.deepEqual(artifact.branches, []);
  assert.deepEqual(
    artifact.frames.map(({ checkpointId }) => checkpointId),
    ["checkpoint.ftc.whole"]
  );
});

test("branch export requires explicit opt-in", () => {
  const artifact = createKpHermeneuticTutorialExportArtifact({
    id: "export.ftc.with-branch",
    module,
    includeBranches: true,
    branches: [branch]
  });

  assert.equal(artifact.canonicalOnly, false);
  assert.deepEqual(artifact.branches, [
    { branchId: "branch.ftc", patchIds: [], lockedParameterIds: [] }
  ]);
});
