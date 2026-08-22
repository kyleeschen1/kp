import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  projectKpLogProductMaterialDepthPresentation
} from "../src/animation/log-product-material-depth-presentation.ts";
import {
  kpCanonicalLogProductMaterialRoleBindings
} from "../src/animation/log-product-material-depth-bindings.ts";

const factorBinding = kpCanonicalLogProductMaterialRoleBindings.find(
  ({ roleId }) => roleId === "role.material.log-product.persistent-factor"
)!;

test("material presentation projects roles without mutating transit owners", () => {
  const owners = [
    {
      ownerId: "owner.factor",
      semanticEntityId: factorBinding.entityIds[0]
    },
    {
      ownerId: "owner.unbound",
      semanticEntityId: "semantic.unbound"
    }
  ];
  const baseline = JSON.stringify(owners);
  const presentations = projectKpLogProductMaterialDepthPresentation({
    mode: "material",
    owners
  });

  assert.equal(JSON.stringify(owners), baseline);
  assert.deepEqual(presentations, [{
    ownerId: "owner.factor",
    semanticEntityId: factorBinding.entityIds[0],
    roleId: "role.material.log-product.persistent-factor",
    pose: { plane: "surface", normalizedDepth: 0, activity: 0 }
  }]);
});

test("flat and no-depth presentations add no transit-owner treatment", () => {
  const owners = [{
    ownerId: "owner.factor",
    semanticEntityId: factorBinding.entityIds[0]
  }];
  assert.deepEqual(projectKpLogProductMaterialDepthPresentation({
    mode: "flat",
    owners
  }), []);
  assert.deepEqual(projectKpLogProductMaterialDepthPresentation({
    mode: "no-depth",
    owners
  }), []);
});

test("the DOM projector does not read layout or rewrite motion properties", () => {
  const source = readFileSync(new URL(
    "../src/rendering/log-product-material-depth-dom.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of [
    "getBoundingClientRect",
    "offsetWidth",
    "offsetHeight",
    'style.transform',
    'style.opacity',
    'style.left',
    'style.top'
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("contact shadow uses a local static gradient with opacity and scale", () => {
  const css = readFileSync(new URL(
    "../src/editor/log-product-surface.css",
    import.meta.url
  ), "utf8");
  const materialTreatment = css.slice(css.indexOf(
    ".kp-log-product-stage[data-kp-log-product-material-active"
  ));
  assert.match(materialTreatment, /::after/u);
  assert.match(materialTreatment, /radial-gradient/u);
  assert.match(materialTreatment, /will-change:\s*opacity, transform/u);
  assert.doesNotMatch(materialTreatment, /filter:/u);
  assert.doesNotMatch(materialTreatment, /blur\(/u);
  assert.doesNotMatch(materialTreatment, /box-shadow:/u);
});
