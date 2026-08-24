import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPythonRefactorOpticalEndpoint,
  kpPythonRefactorDarkOpticalEndpoint,
  kpPythonRefactorLightOpticalEndpoint,
  resolveKpPythonRefactorOpticalEndpoint,
  serializeKpPythonRefactorOpticalEndpoint
} from "../src/rendering/python-refactor-optical-theme.ts";
import { kpPythonRefactorPaintRoleContract } from
  "../src/rendering/python-refactor-paint-role-contract.ts";

test("dark endpoint covers the Python paint contract with prior optical values", () => {
  const endpoint = kpPythonRefactorDarkOpticalEndpoint;
  assert.equal(endpoint.id, "dark");
  assert.equal(endpoint.contractId, kpPythonRefactorPaintRoleContract.id);
  assert.equal(endpoint.profileId, "kp.code-source-dom-optical-profile.v1");
  assert.deepEqual(
    Object.keys(endpoint.properties).sort(),
    kpPythonRefactorPaintRoleContract.slots
      .map(({ cssProperty }) => cssProperty)
      .sort()
  );
  assert.equal(endpoint.properties["--kp-python-paint-syntax-number"],
    "#ede8d0");
  assert.equal(endpoint.properties["--kp-python-paint-withdrawal-filter"],
    "saturate(0.72) brightness(0.88)");
});

test("Python light projects the approved shared non-glow withdrawal", () => {
  const light = kpPythonRefactorLightOpticalEndpoint;
  assert.equal(resolveKpPythonRefactorOpticalEndpoint("light"), light);
  assert.equal(light.properties["--kp-python-paint-surface-panel"],
    "#fbfaf7");
  assert.equal(light.properties["--kp-python-paint-withdrawal-filter"],
    "grayscale(0.32) opacity(0.72)");
  assert.doesNotMatch(
    light.properties["--kp-python-paint-withdrawal-filter"],
    /brightness|saturate/u
  );
  assert.notDeepEqual(light.properties,
    kpPythonRefactorDarkOpticalEndpoint.properties);
  assert.equal(resolveKpPythonRefactorOpticalEndpoint("sepia"),
    kpPythonRefactorDarkOpticalEndpoint);
});

test("Python endpoints serialize in local contract order", () => {
  const serialized = serializeKpPythonRefactorOpticalEndpoint(
    kpPythonRefactorDarkOpticalEndpoint
  );
  assert.ok(serialized.startsWith("--kp-python-paint-surface-panel:#0d0e1c;"));
  assert.equal(serialized.split(";").length,
    kpPythonRefactorPaintRoleContract.slots.length);
});

test("Python optical endpoints fail closed when a semantic property is absent", () => {
  const endpoint = kpPythonRefactorDarkOpticalEndpoint;
  const properties = { ...endpoint.properties };
  delete properties["--kp-python-paint-focus-wash"];
  assert.throws(() => createKpPythonRefactorOpticalEndpoint({
    ...endpoint,
    properties
  }), /cover every paint role exactly/u);
});
