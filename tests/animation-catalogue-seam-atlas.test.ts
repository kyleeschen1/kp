import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";

test("seam atlas enumerates every concrete asset without assigning review", async () => {
  const source = await readFile(new URL(
    "../docs/project/reviews/2026-08-01-animation-catalogue-seam-atlas.md",
    import.meta.url
  ), "utf8");
  const atlas = source.split("## Atlas\n")[1]?.split("## Shared Seams\n")[0];
  assert.ok(atlas);
  const recordedIds = [...atlas.matchAll(/`(animation\.[^`]+)`/g)]
    .map((match) => match[1]!);
  const projectedIds = createKpAnimationCatalogueProjection().entries
    .map(({ animationId }) => animationId);

  assert.equal(recordedIds.length, 60);
  assert.deepEqual([...recordedIds].sort(), [...projectedIds].sort());
  assert.match(source, /60 meaningfully painted/);
  assert.match(source, /no remaining native-host\s+capability gaps/);
  assert.match(source, /Every human disposition remains `Unreviewed`/);
});
