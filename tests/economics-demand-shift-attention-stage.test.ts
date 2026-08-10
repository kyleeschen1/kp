import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpEconomicsDemandShiftAttentionCue,
  projectKpEconomicsDemandShiftAttentionFraming,
  projectKpEconomicsDemandShiftAttentionVisualRoles
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-attention-stage.ts";
import {
  kpEconomicsDemandShiftDeckScenes
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-deck.ts";

test("attention framing projects the canonical deck into four compositions", () => {
  assert.deepEqual(
    kpEconomicsDemandShiftDeckScenes.map((scene) =>
      projectKpEconomicsDemandShiftAttentionFraming(scene)
    ),
    [
      "reading",
      "reading",
      "demonstration",
      "inspect",
      "inspect",
      "quiet-reference"
    ]
  );
});

test("every attention frame has one concise, complete cue", () => {
  for (const scene of kpEconomicsDemandShiftDeckScenes) {
    const cue = projectKpEconomicsDemandShiftAttentionCue(scene);
    assert.match(cue, /\.$/);
    assert.ok(cue.length <= 96, `${scene.id} cue is too long for one stage`);
  }
});

test("attention frames expose only the roles required by their visual claim", () => {
  const byId = Object.fromEntries(kpEconomicsDemandShiftDeckScenes.map(
    (scene) => [
      scene.id,
      projectKpEconomicsDemandShiftAttentionVisualRoles(scene)
    ]
  ));
  assert.deepEqual(byId["orient"], [
    "axes", "axis-labels", "supply", "supply-label", "demand-current",
    "demand-labels", "equilibrium-current"
  ]);
  assert.deepEqual(byId["shift-demand"], [
    "axes", "axis-labels", "supply", "supply-label", "demand-current"
  ]);
  assert.deepEqual(byId["trace-supply"], [
    "axes", "axis-labels", "supply", "supply-label", "equilibrium-current",
    "equilibrium-reference", "supply-trace"
  ]);
  for (const roles of Object.values(byId)) {
    assert.doesNotMatch(roles.join(" "), /\bgrid\b/);
  }
});
