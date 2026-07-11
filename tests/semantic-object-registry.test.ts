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

test("semantic object registry advertises detailed object capabilities", () => {
  const registry = createDefaultSemanticObjectRegistry();

  const expressionCapabilities =
    registry.listCapabilityAdvertisementsForType("expression");
  const expressionDerive = expressionCapabilities.find(
    (capability) => capability.capability === "derive"
  );
  const expressionExecute = expressionCapabilities.find(
    (capability) => capability.capability === "execute"
  );
  const matrixDerive = registry
    .listCapabilityAdvertisementsForType("matrix")
    .find((capability) => capability.capability === "derive");

  assert.deepEqual(expressionDerive?.descriptorIds, [
    "expression.latex",
    "expression.graph2d",
    "expression.graph3d"
  ]);
  assert.deepEqual(expressionDerive?.targetTypes, [
    "latex-form",
    "graph-2d",
    "graph-3d"
  ]);
  assert.match(expressionDerive?.summary ?? "", /exact semantic forms/);
  assert.deepEqual(expressionExecute?.protocolIds, [
    "evaluate",
    "differentiate",
    "numericSample"
  ]);
  assert.deepEqual(matrixDerive?.descriptorIds, ["matrix.linear-map"]);
  assert.deepEqual(registry.listCapabilityAdvertisementsForType("unknown"), []);
});

test("semantic object registry maps object types to capability package ids", () => {
  const registry = createDefaultSemanticObjectRegistry();

  assert.deepEqual(registry.listCapabilityPackageIdsForType("equation"), [
    "package.kp.equation.render.katex",
    "package.kp.equation.transform.semantic",
    "package.kp.equation.animate.motion-plan"
  ]);
  assert.deepEqual(registry.listCapabilityPackageIdsForType("matrix"), [
    "package.kp.matrix.render.katex",
    "package.kp.matrix.execute.facts",
    "package.kp.matrix.derive.linear-map"
  ]);
  assert.deepEqual(registry.listCapabilityPackageIdsForType("graph-2d"), [
    "package.kp.graph2d.render.svg",
    "package.kp.graph2d.derive.latex"
  ]);
  assert.deepEqual(registry.listCapabilityPackageIdsForType("graph-3d"), [
    "package.kp.graph3d.render.webgl.surface-mesh",
    "package.kp.graph3d.animate.surface-mode"
  ]);
  assert.deepEqual(registry.listCapabilityPackageIdsForType("unknown"), []);
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
