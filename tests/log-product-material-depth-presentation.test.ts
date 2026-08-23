import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  projectKpLogProductMaterialDepthPresentation
} from "../src/animation/log-product-material-depth-presentation.ts";
import {
  kpCanonicalLogProductMaterialRoleBindings
} from "../src/animation/log-product-material-depth-bindings.ts";
import {
  projectKpLogProductMaterialSurface,
  resolveKpLogProductDepthModeForVisualOwner
} from "../src/rendering/log-product-material-depth-dom.ts";

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
    identityEffect: "preserve",
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

test("native endpoint ownership suppresses every residual material pose", () => {
  assert.equal(
    resolveKpLogProductDepthModeForVisualOwner("material", "source-native"),
    "no-depth"
  );
  assert.equal(
    resolveKpLogProductDepthModeForVisualOwner("material", "target-native"),
    "no-depth"
  );
  assert.equal(
    resolveKpLogProductDepthModeForVisualOwner("material", "material-scene"),
    "material"
  );
});

test("the DOM projector avoids layout reads and does not rewrite motion properties", () => {
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
    'style.left'
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("material relief preserves the foreground face on its native plane", () => {
  const active = projectKpLogProductMaterialSurface({
    pose: { plane: "active", normalizedDepth: 1, activity: 1 }
  });
  const subsurface = projectKpLogProductMaterialSurface({
    pose: { plane: "subsurface", normalizedDepth: -1, activity: 1 }
  });

  assert.equal(active.reliefActive, true);
  assert.equal(active.reliefStrength, 1);
  assert.ok(active.reliefSideOffsetPx > 0);
  assert.ok(active.reliefSideOpacity > 0);
  assert.ok(active.reliefCastOffsetPx > active.reliefSideOffsetPx);
  assert.ok(active.reliefCastBlurPx > 0);
  assert.ok(active.reliefCastOpacity > 0);
  assert.deepEqual(subsurface, {
    reliefActive: false,
    reliefStrength: 0,
    reliefSideOffsetPx: 0,
    reliefSideOpacity: 0,
    reliefCastOffsetPx: 0,
    reliefCastBlurPx: 0,
    reliefCastOpacity: 0
  });

  const landed = projectKpLogProductMaterialSurface({
    pose: { plane: "surface", normalizedDepth: 0, activity: 0 }
  });
  assert.deepEqual(landed, {
    reliefActive: false,
    reliefStrength: 0,
    reliefSideOffsetPx: 0,
    reliefSideOpacity: 0,
    reliefCastOffsetPx: 0,
    reliefCastBlurPx: 0,
    reliefCastOpacity: 0
  });
});

test("relief uses stationary contour paint and an explicit theme palette", () => {
  const css = readFileSync(new URL(
    "../src/editor/log-product-surface.css",
    import.meta.url
  ), "utf8");
  const materialTreatment = css.slice(css.indexOf(
    ".kp-log-product-stage[data-kp-log-product-material-active"
  ));
  assert.match(css, /--kp-log-product-glyph-face:\s*#0d0e12/u);
  assert.match(css, /--kp-log-product-glyph-face:\s*#ede8d0/u);
  assert.match(css, /--kp-log-product-material-side-rgb:\s*26 29 38/u);
  assert.match(css, /--kp-log-product-material-cast-rgb:\s*13 14 18/u);
  assert.match(materialTreatment, /text-shadow:/u);
  assert.match(materialTreatment, /material-relief-side-offset/u);
  assert.match(materialTreatment, /material-relief-cast-offset/u);
  assert.match(
    materialTreatment,
    /material-relief-active="true"[^}]*text-shadow:/su
  );
  assert.match(
    materialTreatment,
    /material-geometry-landed="true"[^}]*will-change:\s*auto/su
  );
  assert.doesNotMatch(materialTreatment, /::after/u);
  assert.doesNotMatch(materialTreatment, /radial-gradient/u);
  assert.doesNotMatch(materialTreatment, /\btranslate:/u);
  assert.doesNotMatch(materialTreatment, /filter:/u);
  assert.doesNotMatch(materialTreatment, /blur\(/u);
  assert.doesNotMatch(materialTreatment, /box-shadow:/u);
});

test("the log-product stage reserves resize-stable document geometry", () => {
  const css = readFileSync(new URL(
    "../src/editor/log-product-surface.css",
    import.meta.url
  ), "utf8");
  const stageRule = css.slice(
    css.indexOf(".kp-log-product-stage {"),
    css.indexOf(".kp-log-product-stage__endpoint")
  );

  assert.match(
    stageRule,
    /block-size:\s*var\(--kp-log-product-stage-block-size\)/u
  );
  assert.match(stageRule, /--kp-log-product-stage-block-size:\s*24rem/u);
  assert.doesNotMatch(stageRule, /\d+vh/u);
  assert.match(stageRule, /overflow-anchor:\s*none/u);
});
