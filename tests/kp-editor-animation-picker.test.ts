import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "../src/editor/animation-catalog-projection.ts";
import {
  createKpEditorAnimationPickerModel,
  renderKpEditorAnimationPicker
} from "../src/editor/animation-picker.ts";

test("editor animation picker groups the concrete catalog by supported surface", () => {
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  });
  const model = createKpEditorAnimationPickerModel({
    descriptors,
    selectedDescriptorId: descriptors[13]?.id
  });

  assert.equal(model.optionCount, 28);
  assert.deepEqual(
    model.groups.map((group) => [group.id, group.options.length]),
    [
      ["algebra", 8],
      ["equation", 16],
      ["graph", 2],
      ["programming", 1],
      ["composite", 1]
    ]
  );
  assert.equal(
    model.groups.flatMap((group) => group.options)
      .filter((option) => option.selected).length,
    1
  );

  const html = renderKpEditorAnimationPicker(model);
  assert.match(html, /data-action="set-editor-animation"/);
  assert.match(html, /<optgroup label="Graph catalog">/);
  assert.match(html, /data-kp-editor-animation-picker-option/);
  assert.match(html, /data-kp-editor-animation-index="27"/);
});

test("editor animation picker promotes exact family-backed entries into domain groups", () => {
  const asset = createKpAnimationAssets()[0]!;
  const family = createKpSymbolicManipulationFamily({
    id: "family.algebra.both-sides",
    title: "Both-sides operations",
    domain: "algebra",
    runtimeSamples: [
      {
        id: "sample.animation.solve-x.both-sides",
        animationId: asset.id,
        availability: "concrete",
        renderTargetKinds: ["equation"]
      }
    ]
  });
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets: [asset],
    families: [family]
  });

  assert.deepEqual(
    createKpEditorAnimationPickerModel({ descriptors }).groups.map(
      (group) => group.id
    ),
    ["algebra", "equation"]
  );
});

test("editor animation picker rejects duplicate descriptor ids", () => {
  const descriptor = projectKpAnimationAssetsToEditorDescriptors({
    assets: [createKpAnimationAssets()[0]!],
    families: []
  })[0]!;

  assert.throws(
    () => createKpEditorAnimationPickerModel({
      descriptors: [descriptor, descriptor]
    }),
    /Duplicate editor animation descriptor id/
  );
});
