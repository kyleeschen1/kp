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
    selectedDescriptorId:
      "editor-animation.animation.generated.distribution.expand-a-sum"
  });

  assert.equal(model.optionCount, createKpAnimationAssets().length);
  assert.deepEqual(
    model.groups.map((group) => [group.id, group.options.length]),
    [
      ["algebra", 7],
      ["calculus", 4],
      ["linear-algebra", 4],
      ["equation", 18],
      ["diagram", 3],
      ["graph", 3],
      ["programming", 5],
      ["composite", 1]
    ]
  );
  assert.equal(
    model.groups.flatMap((group) => group.options)
      .filter((option) => option.selected).length,
    1
  );
  assert.deepEqual(
    model.groups.flatMap((group) => group.options)
      .filter(({ animationId }) =>
        animationId ===
          "animation.operation-evaluation.five-plus-two" ||
        animationId ===
          "animation.operation-evaluation.three-sixths"
      )
      .map(({ animationId }) => animationId),
    [
      "animation.operation-evaluation.five-plus-two",
      "animation.operation-evaluation.three-sixths"
    ]
  );

  const html = renderKpEditorAnimationPicker(model);
  assert.match(html, /data-action="set-editor-animation"/);
  assert.match(html, /<optgroup label="Graph catalog">/);
  assert.match(html, /data-kp-editor-animation-picker-option/);
  assert.match(html, /data-kp-editor-animation-index="33"/);
});

test("editor animation picker exposes one family-backed option per canonical animation", () => {
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
    ["algebra"]
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
