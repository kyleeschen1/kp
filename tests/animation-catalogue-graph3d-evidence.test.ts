import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("stable catalogue command owns four non-dispositive Graph3D checkpoints", async () => {
  const script = await readFile(new URL(
    "../scripts/capture-animation-catalogue.ts",
    import.meta.url
  ), "utf8");
  const packet = await readFile(new URL(
    "../docs/project/reviews/2026-08-01-graph3d-catalogue-visual-evidence-and-disposition-packet.md",
    import.meta.url
  ), "utf8");
  const checkpointIds = [
    "wide-webgl-40",
    "narrow-webgl-70",
    "semantic-svg-fallback-100",
    "context-loss-fallback-70"
  ];

  assert.match(script, /kp\.animation-catalogue-graph3d-exemplar\.v1/);
  assert.match(script, /disposition: "Unreviewed"/);
  checkpointIds.forEach((id) => {
    assert.match(script, new RegExp(`id: "${id}"`));
    assert.equal(packet.includes(`\`${id}\``), true);
  });
  assert.match(packet, /does not assign Keep,\s+Retire, Rewrite, or promotion status/);
  assert.match(packet, /npm run visual:animation-catalogue/);
});
