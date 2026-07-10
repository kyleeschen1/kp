import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultSemanticObjectRegistry,
  createSemanticObjectRegistry
} from "../src/semantic/object-registry.ts";

test("default semantic object registry exposes metadata without behavior", () => {
  const registry = createDefaultSemanticObjectRegistry();

  const expression = registry.getDefinition("expression");
  const matrix = registry.getDefinition("matrix");
  const graph2D = registry.getDefinition("graph-2d");

  assert.equal(expression?.title, "Expression");
  assert.deepEqual(expression?.capabilities, [
    "render",
    "select",
    "derive",
    "execute"
  ]);
  assert.equal(matrix?.domain, "linear-algebra");
  assert.equal(graph2D?.summary.includes("symbolic provenance"), true);
  assert.equal("render" in (expression ?? {}), false);
  assert.equal("execute" in (matrix ?? {}), false);
});

test("semantic object registry lists object types by capability", () => {
  const registry = createDefaultSemanticObjectRegistry();

  assert.deepEqual(registry.listTypesByCapability("derive"), [
    "expression",
    "equation",
    "graph-2d",
    "matrix"
  ]);
  assert.deepEqual(registry.listTypesByCapability("animate"), [
    "equation",
    "graph-3d",
    "animation-intent"
  ]);
});

test("semantic object registry rejects duplicate type definitions", () => {
  assert.throws(
    () =>
      createSemanticObjectRegistry([
        {
          type: "expression",
          title: "Expression",
          domain: "math-core",
          status: "active",
          summary: "First definition.",
          tags: [],
          capabilities: []
        },
        {
          type: "expression",
          title: "Expression again",
          domain: "math-core",
          status: "active",
          summary: "Duplicate definition.",
          tags: [],
          capabilities: []
        }
      ]),
    /Duplicate semantic object definition expression/
  );
});
