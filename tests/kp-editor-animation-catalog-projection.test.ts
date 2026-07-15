import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
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
  validateKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";

test("editor catalog projection preserves asset entries and adds concrete family refs", () => {
  const assets = createKpAnimationAssets();
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets,
    families: createSymbolicManipulationFamilyRegistry()
  });

  assert.equal(descriptors.length, assets.length + 10);
  assert.equal(
    descriptors.filter((descriptor) => descriptor.familyId !== undefined).length,
    10
  );
  assert.equal(
    descriptors.flatMap(validateKpEditorAnimationDescriptor).length,
    0
  );
  assert.deepEqual(descriptors[0], {
    id: "editor-animation.animation.linear-solve.solve-x",
    kind: "editor-animation-descriptor",
    animationId: "animation.linear-solve.solve-x",
    title: "Solve x + 3 = 7",
    summary: "Solve x + 3 = 7",
    renderTargetKinds: ["equation"],
    controlKinds: ["playback", "step", "scrubber", "rewind"],
    durationMs: 2400,
    beatCount: 50,
    tags: ["animation", "equation", "linear-solve"]
  });
});

test("editor catalog projection attaches exact concrete family provenance", () => {
  const asset = createLinearSolveAnimationAsset();
  const family = createKpSymbolicManipulationFamily({
    id: "family.algebra.both-sides",
    title: "Both-sides operations",
    domain: "algebra",
    runtimeSamples: [
      {
        id: "sample.animation.solve-x.both-sides",
        animationId: asset.id,
        availability: "concrete",
        renderTargetKinds: ["equation"],
        summary: "Concrete subtract-both-sides editor sample."
      }
    ]
  });

  assert.deepEqual(
    projectKpAnimationAssetsToEditorDescriptors({
      assets: [asset],
      families: [family]
    }).find((descriptor) => descriptor.familyId === family.id),
    {
      id: "editor-animation.sample.animation.solve-x.both-sides",
      kind: "editor-animation-descriptor",
      animationId: asset.id,
      title: "Solve x + 3 = 7",
      summary: "Concrete subtract-both-sides editor sample.",
      domain: "algebra",
      familyId: family.id,
      sampleId: "sample.animation.solve-x.both-sides",
      renderTargetKinds: ["equation"],
      controlKinds: ["playback", "step", "scrubber", "rewind"],
      durationMs: 2400,
      beatCount: 50,
      tags: ["animation", "equation", "linear-solve", "family-backed", "algebra"]
    }
  );
});
