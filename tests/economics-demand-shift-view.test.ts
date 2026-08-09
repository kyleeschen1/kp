import assert from "node:assert/strict";
import test from "node:test";

import {
  readKpEconomicsDemandShiftView,
  writeKpEconomicsDemandShiftView
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-view.ts";

test("economics views prefer canonical view URLs while preserving legacy layouts", () => {
  assert.equal(readKpEconomicsDemandShiftView(""), "reader");
  assert.equal(readKpEconomicsDemandShiftView("?view=deck"), "deck");
  assert.equal(
    readKpEconomicsDemandShiftView("?layout=animation-station"),
    "animation-station"
  );
  assert.equal(
    readKpEconomicsDemandShiftView("?view=reader&layout=two-column-scroll"),
    "reader"
  );
});

test("view links retain durable theme choices and clear projection-only state", () => {
  assert.equal(
    writeKpEconomicsDemandShiftView({
      search: "?layout=two-column-scroll&scrub=motion-bridge&gap=42&theme=light",
      view: "deck"
    }),
    "?theme=light&view=deck"
  );
  assert.equal(
    writeKpEconomicsDemandShiftView({
      search: "?view=deck&scene=shift-demand&theme=light",
      view: "reader"
    }),
    "?view=reader&theme=light"
  );
});
