import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const closeoutPath = new URL(
  "../docs/project/reviews/2026-07-17-semantic-material-motion-performance-loop-closeout.md",
  import.meta.url
);

test("material motion closeout records promotion evidence and honest target debt", async () => {
  const closeout = await readFile(closeoutPath, "utf8");

  assert.match(closeout, /approved 30-slice loop is complete/);
  assert.match(closeout, /promotion matrix contains 18 cells/);
  assert.match(closeout, /1,376 tests passed, 0 failed/);
  assert.match(closeout, /45 descriptors, 540 viewport\/progress samples, and 0 nested/);
  assert.match(closeout, /289\.35 KB against the 250 KB product/);
  assert.match(closeout, /about 50 ms against the 33 ms product/);
  assert.match(closeout, /novelty-maturity-promotion-v0/);
  assert.match(closeout, /stop for human review before\s+gold promotion/);
});
