import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpAnimationLibraryDisplayCatalog as createGeneratedCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import {
  createKpAnimationLibraryDisplayCatalog as createSourceCatalog
} from "../src/editor/animation-library-display-catalog-builder.ts";

test("generated display metadata matches the source-rich catalog builder", () => {
  assert.deepEqual(createGeneratedCatalog(), createSourceCatalog());
});

test("display runtime cannot import animation or renderer implementation graphs", async () => {
  const source = await readFile(new URL(
    "../src/editor/animation-library-display-catalog.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /from\s+["']\.\.\/(?:animation|architecture|rendering)\//
  );
  assert.match(
    source,
    /animation-library-display-catalog\.generated\.json/
  );
});
