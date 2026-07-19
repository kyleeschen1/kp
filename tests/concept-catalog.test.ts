import assert from "node:assert/strict";
import test from "node:test";

import { generatedConceptCatalog } from "../content/public-api.ts";
import {
  defineConceptCatalog,
  type KpGeneratedConceptCatalogEntry
} from "../src/authoring/public-api.ts";

test("generated catalog exposes route, lazy load, preload, and search metadata", async () => {
  assert.equal(generatedConceptCatalog.length, 1);
  const entry = generatedConceptCatalog[0]!;
  assert.equal(entry.conceptId, "mathematics.linear-equations.solve-with-balance");
  assert.equal(entry.canonicalPath, "/concepts/mathematics/linear-equations/solve-with-balance");
  assert.deepEqual(entry.checkpointIds, ["start", "subtract-three", "divide-two", "solved"]);
  assert.match(entry.searchableText, /divide both sides by 2/);
  assert.deepEqual(entry.preload, []);
  const artifact = await entry.load();
  assert.equal(artifact.integrity, "sha256:c97f83668b545f7a5744d5eca1f27c4109fe4696b8c03172114f8eb013a279ec");
});

test("catalog rejects duplicate concept versions and routes", () => {
  const base: KpGeneratedConceptCatalogEntry = {
    conceptId: "mathematics.example",
    version: "1.0.0",
    canonicalPath: "/concepts/mathematics/example",
    legacyAliases: [],
    title: "Example",
    summary: "Example summary",
    searchableText: "example searchable text",
    checkpointIds: ["start"],
    preload: [],
    load: async () => generatedConceptCatalog[0]!.load()
  };
  assert.throws(() => defineConceptCatalog([base, { ...base }]), /Duplicate concept ID/);
  assert.throws(() => defineConceptCatalog([
    base,
    { ...base, conceptId: "mathematics.second", version: "2.0.0" }
  ]), /Duplicate concept route/);
});
