import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoredSimplificationPreview } from "../src/experiments/authoring-structural/simplification-preview-build.ts";
import { restoreKpReaderAuthoringSimplificationPreview } from "../src/reader/app/authoring-simplification-preview.ts";

test("simplification aggregate endpoints cross data transport without transporting authority", () => {
  const built = buildKpAuthoredSimplificationPreview();
  const restored = restoreKpReaderAuthoringSimplificationPreview(JSON.parse(JSON.stringify(built)));
  assert.deepEqual(restored.animation, built.animation);
  assert.notEqual(restored.beforeVersionId, restored.afterVersionId);
  assert.throws(() => restoreKpReaderAuthoringSimplificationPreview({ ...built, afterVersionId: built.beforeVersionId }), /revision/);
  assert.throws(() => restoreKpReaderAuthoringSimplificationPreview({ ...built, animation: { ...built.animation, transformations: [] } }), /lineage/);
});
