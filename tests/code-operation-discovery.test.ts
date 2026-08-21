import assert from "node:assert/strict";
import test from "node:test";

import { createKpCodeOperationDiscoveryCatalog } from
  "../scripts/code-operation-discovery-catalog.ts";
import { createKpCodeOperationDiscoveryApi } from
  "../src/authoring/code-operation-discovery-api.ts";
import generatedCatalog from
  "../src/authoring/code-operation-discovery-catalog.generated.json" with {
    type: "json"
  };

test("generated discovery is exact, bounded, and immutable at build time", () => {
  const catalog = createKpCodeOperationDiscoveryCatalog();

  assert.deepEqual(generatedCatalog, catalog);
  assert.equal(catalog.entries.length, 2);
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.entries), true);
  assert.deepEqual(
    catalog.entries.map(({ operationId }) => operationId),
    ["code.typescript.extract-helper", "code.python.extract-helper"]
  );
  for (const entry of catalog.entries) {
    assert.equal(entry.supportScope, "bounded-extract-helper-only");
    assert.ok(entry.support.length > 0);
    assert.ok(entry.rejects.length > 0);
    assert.ok(entry.positiveExamples.length > 0);
    assert.ok(entry.counterexamples.length > 0);
    assert.ok(entry.requiredEvidence.length > 0);
  }
});

test("aliases are unique per language while common requests remain discoverable", () => {
  const catalog = createKpCodeOperationDiscoveryCatalog();
  const keys = catalog.aliases.map(({ language, alias }) =>
    `${language}:${alias}`
  );

  assert.equal(new Set(keys).size, keys.length);
  assert.equal(
    catalog.aliases.filter(({ alias }) => alias === "extract helper").length,
    2
  );
});

test("human and LLM callers can list and inspect without loading compiler authority", () => {
  const api = createKpCodeOperationDiscoveryApi();
  const typescript = api.inspect("typescript", " Extract   Helper ");
  const python = api.inspect("python", "extract helper");

  assert.equal(typescript.status, "resolved");
  assert.equal(
    typescript.status === "resolved" && typescript.capability.operationId,
    "code.typescript.extract-helper"
  );
  assert.equal(python.status, "resolved");
  assert.equal(
    python.status === "resolved" && python.capability.operationId,
    "code.python.extract-helper"
  );
  assert.deepEqual(
    api.list("annotation", "python").map(({ operationId }) => operationId),
    ["code.python.extract-helper"]
  );
  assert.equal(api.inspect("typescript", "extract class").status, "unknown");
});

test("discovery data cannot leak compiler, rendering, or timeline authority", () => {
  const serialized = JSON.stringify(createKpCodeOperationDiscoveryCatalog());
  for (const forbidden of [
    "authorityId",
    "buildTimeEntrypoint",
    "syntaxRecordId",
    "sourceOffset",
    "geometry",
    "coordinates",
    "renderer",
    "duration",
    "playhead"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
