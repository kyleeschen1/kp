import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("in-shell selection keeps one review composer lifecycle", async () => {
  const [source, host, svelteEntry] = await Promise.all([
    readFile("src/editor/animation-catalogue-application.ts", "utf8"),
    readFile("src/editor/animation-catalogue-review-host.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
      "utf8"
    )
  ]);

  assert.match(source, /#reviewHost = createKpAnimationCatalogueReviewHost/);
  assert.match(source, /this\.#reviewHost\.dispose\(\)/);
  assert.match(svelteEntry, /const reviewHost = createKpAnimationCatalogueReviewHost/);
  assert.match(svelteEntry, /void reviewHost\.mount\(\)/);
  assert.match(svelteEntry, /reviewHost\.dispose\(\)/);
  assert.match(host, /pending \?\?=/);
  assert.match(host, /disposeReview !== undefined/);
  assert.doesNotMatch(host, /capture\(|createNote|sessionStorage/);
});
