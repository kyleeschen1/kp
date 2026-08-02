import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("in-shell selection keeps one review composer lifecycle", async () => {
  const source = await readFile(
    "src/editor/animation-catalogue-application.ts",
    "utf8"
  );
  const mountReviewStart = source.indexOf("async #mountReview");
  const mountReview = source.slice(
    mountReviewStart,
    source.indexOf("  #filterFromInput", mountReviewStart)
  );

  assert.match(
    mountReview,
    /this\.#disposeReview !== undefined\) return;/
  );
  assert.doesNotMatch(mountReview, /this\.#disposeReview\?\.\(\)/);
  assert.match(
    source,
    /dispose\(\): void \{[\s\S]*this\.#disposeReview\?\.\(\)/
  );
});
