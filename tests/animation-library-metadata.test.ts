import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "../src/editor/animation-catalog-projection.ts";
import {
  validateKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import logExponent from "../src/tutorial/kinetic-figure-log-exponent-focus-card/descriptor.generated.ts";
import logarithmBase from "../src/experiments/authoring-market/equation-descriptor.generated.ts";
import { collectKpRuntimeImportClosure } from "../scripts/runtime-import-closure.ts";

test("prepared cards retain exact generated descriptors without importing the picker catalogue", () => {
  const library = createKpEditorAnimationLibrary();
  for (const descriptor of [logExponent, logarithmBase]) {
    assert.deepEqual(descriptor, library.find(item => item.animationId === descriptor.animationId));
    assert.deepEqual(validateKpEditorAnimationDescriptor(descriptor), []);
  }
  for (const entry of [
    "src/tutorial/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-static.ts",
    "src/experiments/authoring-market/authoring-equation-card.ts"
  ]) {
    assert.equal(collectKpRuntimeImportClosure(entry).some(path => /animation-library(?:-metadata)?(?:\.generated)?\.(?:ts|json)$/.test(path)), false, entry);
  }
});

test("generated animation metadata matches concrete catalog projection", () => {
  const projected = projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  });
  const metadata = createKpEditorAnimationLibrary();

  assert.deepEqual(metadata, projected);
  assert.equal(metadata.length > 20, true);
  assert.deepEqual(
    metadata.flatMap(validateKpEditorAnimationDescriptor),
    []
  );
});

test("runtime animation library does not import the concrete asset catalog", async () => {
  const source = await readFile(
    new URL("../src/editor/animation-library.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /animation\/catalog/);
  assert.doesNotMatch(source, /symbolic-manipulation-family-registry/);
});
