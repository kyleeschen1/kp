import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCapabilityLoadPlan
} from "../src/semantic/capability-loader-plan.ts";
import {
  createSemanticObjectRegistry
} from "../src/semantic/object-registry.ts";

test("capability load plan selects packages by object type and filters", () => {
  const plan = createKpCapabilityLoadPlan({
    objectTypes: ["equation", "matrix", "unknown-object"],
    semanticCapabilities: ["render"],
    targets: ["browser"]
  });

  assert.deepEqual(plan.packageIds, [
    "package.kp.equation.render.katex",
    "package.kp.matrix.render.katex"
  ]);
  assert.deepEqual(plan.capabilityKeys, [
    "kp.equation:render.katex:equation:*",
    "kp.matrix:render.katex:matrix:*"
  ]);
  assert.deepEqual(plan.loadPhases, ["initial-render"]);
  assert.deepEqual(plan.diagnostics, [
    {
      path: "objectTypes[2]",
      message: "Unknown semantic object type unknown-object."
    }
  ]);
});

test("capability load plan keeps multi-target runtime packages ordered", () => {
  const plan = createKpCapabilityLoadPlan({
    objectTypes: ["graph-3d", "matrix"],
    semanticCapabilities: ["render", "execute"],
    targets: ["browser", "runtime"]
  });

  assert.deepEqual(plan.packageIds, [
    "package.kp.graph3d.render.webgl.surface-mesh",
    "package.kp.matrix.render.katex",
    "package.kp.matrix.execute.facts"
  ]);
  assert.deepEqual(plan.loadPhases, ["interaction", "initial-render"]);
  assert.equal(plan.diagnostics.length, 0);
});

test("capability load plan reports registry package ids missing from catalog", () => {
  const registry = createSemanticObjectRegistry([
    {
      type: "custom-object",
      title: "Custom object",
      domain: "test",
      status: "active",
      summary: "Object with a missing package id.",
      tags: [],
      capabilities: ["render"],
      capabilityPackageIds: ["package.kp.missing"]
    }
  ]);
  const plan = createKpCapabilityLoadPlan({
    registry,
    objectTypes: ["custom-object"],
    semanticCapabilities: ["render"]
  });

  assert.deepEqual(plan.packageIds, []);
  assert.deepEqual(plan.diagnostics, [
    {
      path: "custom-object.capabilityPackageIds[0]",
      message:
        "Capability package package.kp.missing for custom-object is not in the catalog."
    }
  ]);
});
