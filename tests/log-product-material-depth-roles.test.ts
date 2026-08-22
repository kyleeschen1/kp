import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpLogProductMaterialRoleDefinitions
} from "../src/animation/log-product-material-depth-roles.ts";

test("log product material roles are unique and settle on the surface", () => {
  const ids = kpLogProductMaterialRoleDefinitions.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(kpLogProductMaterialRoleDefinitions.every(
    ({ restingPlane, permittedPlanes, physicalVerbs }) =>
      restingPlane === "surface" &&
      permittedPlanes.includes(restingPlane) &&
      physicalVerbs.includes("rest")
  ));
});

test("log product material roles state identity effects explicitly", () => {
  const byId = new Map(kpLogProductMaterialRoleDefinitions.map(
    (definition) => [definition.id, definition]
  ));

  assert.equal(
    byId.get("role.material.log-product.persistent-factor")?.identityEffect,
    "preserve"
  );
  assert.equal(
    byId.get("role.material.log-product.source-application")?.identityEffect,
    "withdraw-source"
  );
  assert.equal(
    byId.get("role.material.log-product.target-application-syntax")
      ?.identityEffect,
    "generate-successor"
  );
});

test("log product material roles contain no renderer authority", () => {
  const source = readFileSync(new URL(
    "../src/animation/log-product-material-depth-roles.ts",
    import.meta.url
  ), "utf8");

  for (const forbidden of [
    "HTMLElement",
    "querySelector",
    "translate",
    "opacity",
    "shadow",
    "duration",
    "easing",
    "px"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
