import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpHermeneuticTutorialModule,
  validateKpHermeneuticTutorialModule,
  type KpHermeneuticTutorialModule
} from "../src/tutorial/hermeneutic-module.ts";

function fixture(): KpHermeneuticTutorialModule {
  return {
    id: "tutorial.test.hermeneutic",
    version: 1,
    title: "Part and whole",
    clockId: "clock.test.shared",
    canonicalSceneIds: ["scene.test.whole"],
    views: [
      {
        id: "view.test.graph",
        kind: "graph",
        semanticObjectIds: ["graph.test"],
        label: "Graph",
        primary: true,
        quietContext: false
      }
    ],
    scenes: [
      {
        id: "scene.test.whole",
        title: "Establish the whole",
        viewIds: ["view.test.graph"],
        checkpointIds: ["checkpoint.test.whole"]
      }
    ],
    checkpoints: [
      {
        id: "checkpoint.test.whole",
        sceneId: "scene.test.whole",
        progress: 0,
        viewIds: ["view.test.graph"],
        label: "Whole"
      }
    ]
  };
}

test("tutorial module preserves one shared clock and referenced structure", () => {
  const module = createKpHermeneuticTutorialModule(fixture());

  assert.equal(module.clockId, "clock.test.shared");
  assert.deepEqual(module.canonicalSceneIds, ["scene.test.whole"]);
  assert.deepEqual(validateKpHermeneuticTutorialModule(module), []);
});

test("tutorial module reports broken scene, checkpoint, and view references", () => {
  const input = fixture();
  const diagnostics = validateKpHermeneuticTutorialModule({
    ...input,
    canonicalSceneIds: ["scene.missing"],
    scenes: [{ ...input.scenes[0]!, viewIds: ["view.missing"] }],
    checkpoints: [
      {
        ...input.checkpoints[0]!,
        sceneId: "scene.missing",
        progress: 1.2
      }
    ]
  });

  assert.deepEqual(
    diagnostics.map((diagnostic) => diagnostic.path),
    [
      "canonicalSceneIds[0]",
      "scenes[0].viewIds[0]",
      "checkpoints[0].sceneId",
      "checkpoints[0].progress"
    ]
  );
});
