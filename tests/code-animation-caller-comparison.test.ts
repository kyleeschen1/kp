import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const comparisonPath =
  "docs/project/reviews/2026-08-13-typescript-python-code-animation-caller-comparison.md";

test("caller comparison authorizes only the demonstrated extraction order", async () => {
  const comparison = await readFile(comparisonPath, "utf8");

  assert.match(comparison, /syntax-role vocabulary and source-token shape/);
  assert.match(comparison, /complete source-projection snapshots and fragment composition/);
  assert.match(comparison, /settlement and native-paint ownership laws/);
  assert.match(comparison, /explicit exceptions to those laws/);
  assert.match(comparison, /do not justify a universal code renderer/);
});

test("caller comparison preserves language and Scheme authority", async () => {
  const comparison = await readFile(comparisonPath, "utf8");

  assert.match(comparison, /Keep the following separate/);
  assert.match(comparison, /TypeScript and Python tokenizers\/frontends/);
  assert.match(comparison, /normalizing `qualifiesForFreeShipping` and/);
  assert.match(comparison, /recursive S-expression containment/);
  assert.match(comparison, /No Scheme renderer rewrite is\s+authorized/);
});

test("caller comparison protects approved observable behavior", async () => {
  const comparison = await readFile(comparisonPath, "utf8");
  const prose = comparison.replace(/\s+/g, " ");

  for (const boundary of [
    "exact source bytes",
    "score timing",
    "native ownership",
    "stable URLs",
    "direct seek",
    "reduced motion"
  ]) {
    assert.ok(prose.includes(boundary), `missing preservation boundary: ${boundary}`);
  }
  assert.match(comparison, /should be rolled back/);
});
