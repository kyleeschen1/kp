import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpEquationSeriesOperationAliasRegistry,
  kpEquationSeriesOperationAliasRegistry,
  normalizeKpEquationSeriesOperationId
} from "../src/authoring/equation-series-operation-alias-registry.ts";
import {
  createKpEquationSeriesOperationRegistry
} from "../src/authoring/equation-series-operation-declarations.ts";

test("alias registry projects legacy IDs onto canonical planner operations", () => {
  assert.deepEqual(
    kpEquationSeriesOperationAliasRegistry.byAliasId[
      "operation.wrap-function.v1"
    ],
    {
      aliasId: "operation.wrap-function.v1",
      canonicalOperationId: "kp.algebra.wrap-function"
    }
  );
  assert.deepEqual(normalizeKpEquationSeriesOperationId({
    operationId: "kp.algebra.wrap-function"
  }), {
    status: "canonical",
    requestedOperationId: "kp.algebra.wrap-function",
    canonicalOperationId: "kp.algebra.wrap-function"
  });
  assert.deepEqual(normalizeKpEquationSeriesOperationId({
    operationId: "operation.wrap-function.v1"
  }), {
    status: "alias",
    requestedOperationId: "operation.wrap-function.v1",
    canonicalOperationId: "kp.algebra.wrap-function"
  });
  assert.deepEqual(normalizeKpEquationSeriesOperationId({
    operationId: "provider.guess"
  }), {
    status: "unknown",
    requestedOperationId: "provider.guess"
  });
});

test("custom declarations extend alias normalization without core edits", () => {
  const registry = createKpEquationSeriesOperationRegistry([
    {
      operationId: "kp.example.transform",
      plannerExposure: {
        kind: "exposed",
        summary: "Apply the example transform."
      },
      source: "equation-extension",
      familyId: "family.example",
      recipeIds: ["recipe.example"],
      authorityRefIds: ["law.example"],
      roleIds: [],
      canonicalComposition: ["kp.example.transform"]
    },
    {
      operationId: "legacy.example.transform",
      plannerOperationId: "kp.example.transform",
      plannerExposure: {
        kind: "alias",
        canonicalOperationId: "kp.example.transform"
      },
      source: "equation-extension",
      familyId: "family.example",
      recipeIds: ["recipe.example"],
      authorityRefIds: ["law.example"],
      roleIds: [],
      canonicalComposition: ["legacy.example.transform"]
    }
  ]);
  const aliases = createKpEquationSeriesOperationAliasRegistry(registry);
  const normalized = normalizeKpEquationSeriesOperationId({
    operationId: "legacy.example.transform",
    operationRegistry: registry,
    aliasRegistry: aliases
  });
  assert.equal(normalized.status, "alias");
  if (normalized.status !== "alias") return;
  assert.equal(
    normalized.canonicalOperationId,
    "kp.example.transform"
  );
});

test("normalization owns no rendering choreography or closed operation switch", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-operation-alias-registry.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /switch\s*\(|renderer|durationMs|trajectory/u);
});
