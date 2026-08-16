import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { collectKpTypescriptImportGraph } from "../scripts/typescript-import-extractor.ts";

test("the AST extractor closes the current production TypeScript graph", () => {
  const graph = collectKpTypescriptImportGraph(
    fileURLToPath(new URL("..", import.meta.url))
  );

  assert.ok(graph.sourcePaths.length > 1_500);
  assert.ok(graph.references.length > graph.sourcePaths.length);
  assert.deepEqual(graph.unresolvedLocalReferences, []);
});
