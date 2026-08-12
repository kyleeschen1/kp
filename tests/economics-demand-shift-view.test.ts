import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEconomicsDemandShiftViews,
  normalizeKpEconomicsDemandShiftViewSearch,
  readKpEconomicsDemandShiftView,
  writeKpEconomicsDemandShiftView
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-view.ts";

test("economics views prefer canonical view URLs while preserving legacy layouts", () => {
  assert.deepEqual(kpEconomicsDemandShiftViews, [
    "reader",
    "deck",
    "attention-stage",
    "split",
    "inline-sticky",
    "two-column-scroll"
  ]);
  assert.equal(readKpEconomicsDemandShiftView(""), "reader");
  assert.equal(readKpEconomicsDemandShiftView("?view=deck"), "deck");
  assert.equal(
    readKpEconomicsDemandShiftView("?view=attention-stage"),
    "attention-stage"
  );
  assert.equal(
    readKpEconomicsDemandShiftView("?layout=animation-station"),
    "reader"
  );
  assert.equal(
    readKpEconomicsDemandShiftView("?layout=inline-sticky"),
    "inline-sticky"
  );
  assert.equal(
    readKpEconomicsDemandShiftView("?view=reader&layout=two-column-scroll"),
    "reader"
  );
});

test("retired Station links normalize to Reader without discarding preferences", () => {
  assert.equal(
    normalizeKpEconomicsDemandShiftViewSearch(
      "?layout=animation-station&theme=light&gap=42"
    ),
    "?theme=light&view=reader"
  );
  assert.equal(
    normalizeKpEconomicsDemandShiftViewSearch(
      "?view=animation-station&theme=dark"
    ),
    "?view=reader&theme=dark"
  );
  assert.equal(
    normalizeKpEconomicsDemandShiftViewSearch("?view=deck&theme=dark"),
    "?view=deck&theme=dark"
  );
  assert.equal(
    normalizeKpEconomicsDemandShiftViewSearch(
      "?view=deck&layout=animation-station&theme=dark"
    ),
    "?view=deck&layout=animation-station&theme=dark"
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
