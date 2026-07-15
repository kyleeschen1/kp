import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "../src/editor/animation-catalog-projection.ts";
import {
  createKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  dispatchKpEditorAnimationSurface
} from "../src/editor/animation-surface-dispatch.ts";

test("editor animation surface dispatch covers every current concrete asset", () => {
  const dispatches = projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  }).map(dispatchKpEditorAnimationSurface);

  assert.equal(dispatches.length, 34);
  assert.equal(
    dispatches.some((dispatch) => dispatch.kind === "unsupported"),
    false
  );
  assert.deepEqual(
    Object.fromEntries(
      ["equation", "graph", "programming", "composite"].map((kind) => [
        kind,
        dispatches.filter((dispatch) => dispatch.kind === kind).length
      ])
    ),
    {
      equation: 28,
      graph: 4,
      programming: 1,
      composite: 1
    }
  );
});

test("editor animation surface dispatch merges matrix with equation and rejects partial custom surfaces", () => {
  const matrixEquation = createKpEditorAnimationDescriptor({
    animationId: "animation.matrix-equation",
    title: "Matrix equation",
    summary: "Matrix and equation view.",
    renderTargetKinds: ["matrix", "equation"]
  });
  const partialCustom = createKpEditorAnimationDescriptor({
    animationId: "animation.partial-custom",
    title: "Partial custom",
    summary: "Equation plus unsupported custom view.",
    renderTargetKinds: ["equation", "custom"]
  });

  assert.deepEqual(dispatchKpEditorAnimationSurface(matrixEquation), {
    descriptorId: matrixEquation.id,
    animationId: matrixEquation.animationId,
    kind: "equation",
    slotKinds: ["equation"],
    unsupportedTargetKinds: []
  });
  assert.deepEqual(dispatchKpEditorAnimationSurface(partialCustom), {
    descriptorId: partialCustom.id,
    animationId: partialCustom.animationId,
    kind: "unsupported",
    slotKinds: ["equation"],
    unsupportedTargetKinds: ["custom"]
  });
});
