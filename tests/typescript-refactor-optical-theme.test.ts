import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTypeScriptRefactorOpticalEndpoint,
  kpTypeScriptRefactorDarkOpticalEndpoint,
  serializeKpTypeScriptRefactorOpticalEndpoint
} from "../src/rendering/typescript-refactor-optical-theme.ts";
import { kpTypeScriptRefactorPaintRoleContract } from
  "../src/rendering/typescript-refactor-paint-role-contract.ts";

test("dark endpoint covers the TypeScript paint contract exactly", () => {
  const endpoint = kpTypeScriptRefactorDarkOpticalEndpoint;
  assert.equal(endpoint.id, "dark");
  assert.equal(endpoint.contractId, kpTypeScriptRefactorPaintRoleContract.id);
  assert.deepEqual(
    Object.keys(endpoint.properties).sort(),
    kpTypeScriptRefactorPaintRoleContract.slots
      .map(({ cssProperty }) => cssProperty)
      .sort()
  );
  assert.equal(
    endpoint.properties["--kp-typescript-paint-syntax-number"],
    "#ede8d0"
  );
  assert.equal(
    endpoint.properties["--kp-typescript-paint-withdrawal-filter"],
    "saturate(0.72) brightness(0.88)"
  );
});

test("dark endpoint serializes deterministically in contract order", () => {
  const serialized = serializeKpTypeScriptRefactorOpticalEndpoint(
    kpTypeScriptRefactorDarkOpticalEndpoint
  );
  assert.ok(serialized.startsWith(
    "--kp-typescript-paint-surface-panel:#0d0e1c;"
  ));
  assert.equal(serialized.split(";").length,
    kpTypeScriptRefactorPaintRoleContract.slots.length);
});

test("optical endpoints fail closed when a semantic property is absent", () => {
  const endpoint = kpTypeScriptRefactorDarkOpticalEndpoint;
  const properties = { ...endpoint.properties };
  delete properties["--kp-typescript-paint-focus-wash"];
  assert.throws(() => createKpTypeScriptRefactorOpticalEndpoint({
    ...endpoint,
    properties
  }), /cover every paint role exactly/u);
});
