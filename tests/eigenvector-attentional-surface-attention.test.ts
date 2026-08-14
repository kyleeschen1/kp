import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorBeatIds } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";
import {
  projectKpEigenvectorAttention,
  projectKpEigenvectorAttentionCss
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-attention.ts";

test("every beat has exactly one focused attentional surface", () => {
  for (const beatId of kpEigenvectorBeatIds) {
    const projection = projectKpEigenvectorAttention(beatId);
    const focusedOwners = Object.values(projection.objects).filter((object) =>
      object.id.startsWith("surface.") &&
      object.surface === projection.owner &&
      object.salience.state.level === "focus"
    );

    assert.equal(focusedOwners.length, 1, beatId);
  }
});

test("interpretive axes remain normal while authored grid stays quiet", () => {
  for (const beatId of kpEigenvectorBeatIds) {
    const objects = projectKpEigenvectorAttention(beatId).objects;
    assert.equal(objects["diagram.axes"]?.salience.state.level, "normal");
    assert.equal(objects["diagram.grid"]?.salience.state.level, "dim");
  }
});

test("diagram, equation, learner, and recall beats transfer ownership", () => {
  assert.equal(projectKpEigenvectorAttention("watch-the-fan").owner, "diagram");
  assert.equal(projectKpEigenvectorAttention("geometry-becomes-equation").owner, "equation");
  assert.equal(projectKpEigenvectorAttention("predict-a-multiple").owner, "learner");
  assert.equal(projectKpEigenvectorAttention("compressed-recall").owner, "recall");
});

test("dark and light paint are projections of the shared salience protocol", () => {
  const dark = projectKpEigenvectorAttentionCss({
    beatId: "one-direction-survives",
    theme: "dark"
  });
  const light = projectKpEigenvectorAttentionCss({
    beatId: "one-direction-survives",
    theme: "light"
  });

  assert.notEqual(dark["--kp-eigen-diagram-v-color"], light["--kp-eigen-diagram-v-color"]);
  assert.equal(dark["--kp-eigen-diagram-v-stroke-scale"], "1.2");
  assert.equal(dark["--kp-eigen-diagram-axes-stroke-scale"], "1");
});

test("absent eigenspace paint remains absent before its reveal", () => {
  const before = projectKpEigenvectorAttention("one-direction-survives");
  const after = projectKpEigenvectorAttention("reveal-the-eigenspace");

  assert.equal(before.objects["diagram.eigenspace"]?.salience.state.level, "absent");
  assert.equal(after.objects["diagram.eigenspace"]?.salience.state.level, "focus");
});
