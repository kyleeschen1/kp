import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCapabilityPackageCatalog,
  createKpCapabilityPackageManifest,
  defaultKpCapabilityPackageManifests
} from "../src/semantic/capability-package-manifest.ts";

test("capability package manifests derive stable capability keys", () => {
  const manifest = createKpCapabilityPackageManifest({
    id: "package.kp.equation.render.katex",
    title: "KaTeX Equation Renderer",
    library: "kp.equation",
    capability: "render.katex",
    objectType: "equation",
    mode: "*",
    status: "active",
    target: "browser",
    loadPhase: "initial-render",
    summary: "Render equation semantic objects through the KaTeX pipeline.",
    semanticCapabilities: ["render", "select"],
    protocols: ["renderEquationKatex"],
    views: ["katex"],
    tags: ["equation", "katex"],
    sourceRefs: [
      {
        label: "Equation motion sampler",
        href: "src/rendering/equation-motion-sampler.ts"
      }
    ]
  });

  assert.equal(manifest.capabilityKey, "kp.equation:render.katex:equation:*");
  assert.deepEqual(manifest.semanticCapabilities, ["render", "select"]);
  assert.deepEqual(manifest.protocols, ["renderEquationKatex"]);
  assert.equal(manifest.sourceRefs[0]?.href, "src/rendering/equation-motion-sampler.ts");
});

test("capability package catalog indexes default package manifests", () => {
  const catalog = createKpCapabilityPackageCatalog(
    defaultKpCapabilityPackageManifests
  );

  assert.equal(catalog.listManifests().length >= 6, true);
  assert.equal(
    catalog.getManifest("package.kp.equation.render.katex")?.capabilityKey,
    "kp.equation:render.katex:equation:*"
  );
  assert.deepEqual(
    catalog.listManifestsForObjectType("equation").map((manifest) => manifest.id),
    [
      "package.kp.equation.render.katex",
      "package.kp.equation.transform.semantic",
      "package.kp.equation.animate.motion-plan"
    ]
  );
  assert.deepEqual(
    catalog.listManifestsByCapabilityKey(
      "kp.equation:transform.semantic:equation:*"
    ).map((manifest) => manifest.id),
    ["package.kp.equation.transform.semantic"]
  );
  assert.deepEqual(
    catalog.listManifestsByCapabilityKey(
      "kp.graph:render.webgl:graph-3d:surface.mesh"
    ).map((manifest) => manifest.id),
    ["package.kp.graph3d.render.webgl.surface-mesh"]
  );
  assert.deepEqual(
    catalog.listManifestsForObjectType("matrix").map((manifest) => manifest.id),
    [
      "package.kp.matrix.render.katex",
      "package.kp.matrix.execute.facts"
    ]
  );
});

test("capability package catalog rejects duplicate package ids", () => {
  const manifest = createKpCapabilityPackageManifest({
    id: "package.duplicate",
    title: "Duplicate package",
    library: "kp.test",
    capability: "render.test",
    objectType: "test-object",
    mode: "*",
    status: "active",
    target: "browser",
    loadPhase: "initial-render",
    summary: "Duplicate package fixture.",
    semanticCapabilities: ["render"],
    protocols: [],
    views: [],
    tags: [],
    sourceRefs: []
  });

  assert.throws(
    () => createKpCapabilityPackageCatalog([manifest, manifest]),
    /Duplicate capability package manifest package\.duplicate/
  );
});
