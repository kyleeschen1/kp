import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpEconomicsDemandShiftHandoffSearch
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-route-handoff.ts";

test("deck handoff preserves theme and selects the semantic passage scene", () => {
  const search = projectKpEconomicsDemandShiftHandoffSearch({
    search: "?view=deck&theme=light&gap=30",
    handoff: {
      blockId: "demand-shift",
      progress: 0.72,
      passageId: "follow-shift",
      anchorViewportTop: 320,
      scrollY: 900
    }
  });
  const parameters = new URLSearchParams(search);

  assert.equal(parameters.get("view"), "deck");
  assert.equal(parameters.get("theme"), "light");
  assert.equal(parameters.get("scene"), "shift-demand");
});

test("non-deck projections retain their requested URL unchanged", () => {
  assert.equal(projectKpEconomicsDemandShiftHandoffSearch({
    search: "?view=reader&theme=dark",
    handoff: {
      blockId: "supply-movement",
      progress: 0.4,
      passageId: "shift-versus-movement",
      scrollY: 1200
    }
  }), "?view=reader&theme=dark");
});
