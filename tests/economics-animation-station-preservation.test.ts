import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import baseline from
  "./fixtures/economics-animation-station-preservation-baseline.json" with
  { type: "json" };

test("animation-station preservation baseline freezes ownership and anchors", async () => {
  assert.equal(
    baseline.schemaVersion,
    "kp.economics-animation-station-preservation-baseline.v3"
  );
  assert.equal(
    baseline.canonicalRoute,
    "/tutorials/economics/demand-shift/?layout=animation-station"
  );

  const ownershipEntries = Object.entries(baseline.ownership);
  const sources = new Map(await Promise.all(ownershipEntries.map(
    async ([owner, path]) => [owner, await readFile(path, "utf8")] as const
  )));
  const host = sources.get("host")!;
  const style = sources.get("stationStyle")!;
  const visualCheck = sources.get("visualCheck")!;

  for (const selector of baseline.requiredSelectors) {
    assert.ok(host.includes(selector), `missing station selector ${selector}`);
  }
  for (const [token, value] of Object.entries(baseline.geometryTokens)) {
    assert.ok(
      style.includes(`${token}: ${value}`),
      `station token ${token} no longer has the preserved ${value} baseline`
    );
  }
  for (const screenshot of baseline.screenshotAnchors) {
    assert.ok(
      visualCheck.includes(screenshot),
      `visual check no longer captures ${screenshot}`
    );
  }

  assert.deepEqual(baseline.structure, {
    cueCount: 6,
    motionBlockCount: 2,
    transitionSeamCount: 2,
    transitionPacketCount: 2,
    readingPassageCount: 0,
    scrubBarCount: 0
  });
  assert.deepEqual(baseline.canonicalGeometryPx, {
    railTop: 120,
    railBottom: 680,
    railHeight: 560,
    graphTop: 136,
    graphBottom: 400,
    graphHeight: 264,
    stageWidth: 672
  });
  assert.match(baseline.rollback.unit, /animation-station query presenter/);
  assert.match(baseline.rollback.preserve, /retained SVG session/);
});
