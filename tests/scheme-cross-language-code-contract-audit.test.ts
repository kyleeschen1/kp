import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditUrl = new URL(
  "../docs/project/reviews/2026-08-13-scheme-cross-language-code-contract-audit.md",
  import.meta.url
);

test("Scheme audit protects specialized recursion while adopting bounded laws", async () => {
  const audit = await readFile(auditUrl, "utf8");

  for (const term of [
    "`adapt`",
    "`preserve-specialized`",
    "`reject`",
    "syntax-address occurrence IDs",
    "delimiter ownership",
    "deepest-first return",
    "no evaluator, parser, or trace shipped"
  ]) {
    assert.match(audit, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(audit, /waiting multiplication\s+shells/u);
  assert.match(audit, /Any change to evaluator events[\s\S]*must stop the\s+run/u);
});

test("Scheme audit rejects flat projections and imperative token theater", async () => {
  const audit = await readFile(auditUrl, "utf8");
  assert.match(audit, /Complete fragment source projection \| `reject`/u);
  assert.match(audit, /Imperative token theater \| `reject`/u);
  assert.doesNotMatch(audit, /universal Scheme renderer|shared Scheme score/u);
});
