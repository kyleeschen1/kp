import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpEquationOperationDiscoveryApi
} from "../src/authoring/equation-operation-discovery-api.ts";

test("tool-neutral discovery lists, searches, and inspects friendly aliases", () => {
  const api = createKpEquationOperationDiscoveryApi();
  assert.ok(api.list().length > 10);
  assert.deepEqual(
    api.list("remove additive zero").map(({ operationId }) => operationId),
    ["kp.semantic-motion.absorb-additive-identity"]
  );
  const alias = api.inspect("  DROP + 0  ");
  assert.equal(alias.status, "resolved");
  if (alias.status !== "resolved") return;
  assert.equal(alias.resolution, "alias");
  assert.equal(alias.capability.operationId,
    "kp.semantic-motion.absorb-additive-identity");
  assert.equal(api.inspect("invent a renderer").status, "unknown");
});

test("ordered states narrow deterministically before a model is involved", () => {
  const api = createKpEquationOperationDiscoveryApi();
  const result = api.narrow({ states: [
    { id: "before-add", latex: "x + 0 = 4" },
    { id: "after-add", latex: "x = 4" },
    { id: "before-product", latex: "2 \\times 3" },
    { id: "after-product", latex: "6" }
  ] });
  assert.equal(result.status, "narrowed");
  if (result.status !== "narrowed") return;
  assert.deepEqual(result.adjacencies.map(({ candidates }) =>
    candidates.map(({ operationId }) => operationId)
  ), [
    ["kp.semantic-motion.absorb-additive-identity"],
    [],
    ["kp.algebra.simplify-constant-product"]
  ]);
  assert.ok(result.adjacencies[0]?.candidates[0]
    ?.requiredEvidenceIds.length);
});

test("candidate narrowing does not infer a carrier from equal glyph text", () => {
  const api = createKpEquationOperationDiscoveryApi();
  const result = api.narrow({ states: [
    { id: "source", latex: "x + y" },
    { id: "target", latex: "x" }
  ] });
  assert.equal(result.status, "narrowed");
  if (result.status !== "narrowed") return;
  assert.deepEqual(result.adjacencies[0]?.candidates, []);
  assert.equal(api.narrow({ states: [
    { id: "only", latex: "x" }
  ] }).status, "invalid-request");
});

test("custom rules extend narrowing without modifying the API core", () => {
  const base = createKpEquationOperationDiscoveryApi();
  const api = createKpEquationOperationDiscoveryApi({
    rules: [{
      id: "rule.test.substitute.v1",
      operationId: "kp.core.substitute",
      reason: "Test-only exact state pair.",
      matches: ({ sourceLatex, targetLatex }) =>
        sourceLatex === "a" && targetLatex === "b"
    }]
  });
  assert.ok(base.list().some(({ operationId }) =>
    operationId === "kp.core.substitute"
  ));
  const result = api.narrow({ states: [
    { id: "a", latex: "a" },
    { id: "b", latex: "b" }
  ] });
  assert.equal(result.status, "narrowed");
  if (result.status !== "narrowed") return;
  assert.deepEqual(result.adjacencies[0]?.candidates.map(({ operationId }) =>
    operationId
  ), ["kp.core.substitute"]);
});

test("the discovery API owns no renderer, framework, or DOM dependency", async () => {
  const source = await readFile(new URL(
    "../src/authoring/equation-operation-discovery-api.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of [
    "../rendering/",
    "../editor/",
    "svelte",
    "document.",
    "window."
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
