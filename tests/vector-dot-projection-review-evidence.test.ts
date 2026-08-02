import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("stable vector command owns seven non-dispositive review checkpoints", async () => {
  const [packageSource, script, packet] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL(
      "../scripts/capture-animation-catalogue.ts",
      import.meta.url
    ), "utf8"),
    readFile(new URL(
      "../docs/project/reviews/2026-08-02-vector-dot-projection-review-package.md",
      import.meta.url
    ), "utf8")
  ]);
  const checkpointIds = [
    "start-wide-0",
    "component-pairing-wide-188",
    "projection-wide-688",
    "settlement-wide-1000",
    "projection-narrow-688",
    "projection-reduced-motion-688",
    "settlement-static-svg-1000"
  ];

  assert.match(
    packageSource,
    /"visual:vector-dot-projection": "node --disable-warning=ExperimentalWarning scripts\/capture-animation-catalogue\.ts --scope vector-dot-projection"/
  );
  assert.match(
    script,
    /kp\.animation-catalogue-vector-dot-projection-review\.v1/
  );
  assert.match(script, /disposition: "Unreviewed"/);
  assert.match(
    script,
    /promotion: "frozen-pending-consolidated-human-checkpoint"/
  );
  checkpointIds.forEach((id) => {
    assert.match(script, new RegExp(`id: "${id}"`));
    assert.equal(packet.includes(`\`${id}\``), true);
  });
  assert.match(packet, /npm run visual:vector-dot-projection/);
  assert.match(packet, /does not promote a shared motif/);
  assert.match(packet, /catalogue disposition\s+remains `Unreviewed`/);
});
