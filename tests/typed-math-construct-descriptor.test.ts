import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticConstructDescriptor,
  kpHessianConstructDescriptor,
  kpJacobianConstructDescriptor,
  type KpSemanticConstructDescriptor
} from "../src/math/authoring/construct-descriptor.ts";

test("Jacobian and Hessian descriptors declare bounded authoring metadata", () => {
  assert.equal(kpJacobianConstructDescriptor.macro.id, "kp.math.macro.jacobian.v1");
  assert.deepEqual(kpJacobianConstructDescriptor.capabilityRequirements, [
    "differentiable-map",
    "domain-basis",
    "codomain-basis"
  ]);
  assert.deepEqual(
    kpJacobianConstructDescriptor.projections.map(({ form }) => form),
    ["compact", "operator", "expanded"]
  );
  assert.deepEqual(kpHessianConstructDescriptor.capabilityRequirements, [
    "second-derivative-map",
    "domain-basis",
    "codomain-basis",
    "symmetry-evidence"
  ]);
  assert.equal(
    kpHessianConstructDescriptor.generationInputs.some(
      ({ name }) => name === "symmetry-evidence"
    ),
    true
  );
  assert.equal(Object.isFrozen(kpHessianConstructDescriptor.children[0]?.path), true);
});

test("construct descriptors reject duplicated and missing mechanical fields", () => {
  const valid = kpJacobianConstructDescriptor;
  assert.throws(
    () => createKpSemanticConstructDescriptor({
      ...valid,
      id: "kp.math.construct.invalid-duplicate",
      capabilityRequirements: ["differentiable-map", "differentiable-map"]
    }),
    /repeats a capability/
  );
  assert.throws(
    () => createKpSemanticConstructDescriptor({
      ...valid,
      id: "kp.math.construct.invalid-missing-child",
      children: []
    } as unknown as Omit<KpSemanticConstructDescriptor, "kind">),
    /requires children/
  );
  assert.throws(
    () => createKpSemanticConstructDescriptor({
      ...valid,
      id: "kp.math.construct.invalid-missing-projection",
      projections: valid.projections.filter(({ form }) => form !== "operator")
    } as unknown as Omit<KpSemanticConstructDescriptor, "kind">),
    /requires projection operator/
  );
});
