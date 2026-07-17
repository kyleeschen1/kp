import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const closeoutPath = new URL(
  "../docs/project/reviews/2026-07-17-semantic-motion-library-loop-closeout.md",
  import.meta.url
);

test("semantic motion library closeout records delivered scope and honest boundaries", async () => {
  const closeout = await readFile(closeoutPath, "utf8");

  assert.match(closeout, /approved 28-slice loop is complete/);
  assert.match(closeout, /23 required transformation types across 17 concrete/);
  assert.match(closeout, /29 operations exposed to the\s+constrained LLM authoring catalog/);
  assert.match(closeout, /44 descriptors and 528 viewport\/progress samples with 0/);
  assert.match(closeout, /live prompt\/upload parser/);
  assert.match(closeout, /intentionally incorrect derivation/);
});
