import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("stable programming command owns eight non-dispositive review checkpoints", async () => {
  const [packageSource, script, packet] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL(
      "../scripts/capture-animation-catalogue.ts",
      import.meta.url
    ), "utf8"),
    readFile(new URL(
      "../docs/project/reviews/2026-08-02-programming-addition-review-package.md",
      import.meta.url
    ), "utf8")
  ]);
  const checkpointIds = [
    "start-wide-0",
    "statement-focus-wide-400",
    "return-local-wide-750",
    "output-settlement-wide-1000",
    "statement-focus-narrow-400",
    "statement-focus-reduced-motion-400",
    "output-static-wide-1000",
    "comparison-settlement-wide-1000"
  ];

  assert.match(
    packageSource,
    /"visual:programming-addition": "node --disable-warning=ExperimentalWarning scripts\/capture-animation-catalogue\.ts --scope programming-addition"/
  );
  assert.match(
    script,
    /kp\.animation-catalogue-programming-addition-review\.v1/
  );
  assert.match(script, /disposition: "Unreviewed"/);
  assert.match(
    script,
    /promotion: "frozen-pending-consolidated-human-checkpoint"/
  );
  assert.match(
    script,
    /const expectedMissingAdapterIds: readonly string\[\] = \[\]/
  );
  checkpointIds.forEach((id) => {
    assert.match(script, new RegExp(`id: "${id}"`));
    assert.equal(packet.includes(`\`${id}\``), true);
  });
  assert.match(packet, /npm run visual:programming-addition/);
  assert.match(packet, /does not generalize a\s+programming visual system/);
  assert.match(packet, /catalogue disposition remains `Unreviewed`/);
});
