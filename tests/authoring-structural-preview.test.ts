import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildKpAuthoredDistributionPreview } from "../src/experiments/authoring-structural/distribution-preview-build.ts";
import { restoreKpReaderAuthoringDistributionPreview } from "../src/reader/app/authoring-distribution-preview.ts";
import { findKpRegisteredOperationPresentationPlan } from "../src/animation/operation-presentation-plan-types.ts";

test("prepared distribution crosses data transport and reconstructs local presentation authority", () => {
  const prepared = buildKpAuthoredDistributionPreview();
  const wire = JSON.parse(JSON.stringify(prepared));
  assert.equal(findKpRegisteredOperationPresentationPlan(wire.animation.transformations[0]), undefined);
  const restored = restoreKpReaderAuthoringDistributionPreview(wire);
  assert.notEqual(restored.beforeVersionId, restored.afterVersionId);
  assert.deepEqual(restored.animation, prepared.animation);
  assert.equal(findKpRegisteredOperationPresentationPlan(restored.animation.transformations[0]!)!.planKind, "distribution");
});

test("preview rejects foreign revisions, altered timing and partial lineage", () => {
  const prepared = buildKpAuthoredDistributionPreview();
  for (const value of [null, { ...prepared, schemaVersion: "foreign" },
    { ...prepared, afterVersionId: prepared.beforeVersionId },
    { ...prepared, animation: { ...prepared.animation, timeline: { ...prepared.animation.timeline!, durationMs: 100 } } },
    { ...prepared, animation: { ...prepared.animation, transformations: prepared.animation.transformations.slice(1) } }]) {
    assert.throws(() => restoreKpReaderAuthoringDistributionPreview(value), { code: "kp.reader.authoring-distribution-preview-gap" });
  }
});

test("reader preview imports no experiment or author-source module", () => {
  const source = readFileSync(new URL("../src/reader/app/authoring-distribution-preview.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:experiments|semantic-state)/);
  const entry = readFileSync(new URL("../src/reader/app/exemplar-entry.ts", import.meta.url), "utf8");
  assert.match(entry, /structuralPreview = import\.meta\.env\.DEV/);
  const plugin = readFileSync(new URL("../scripts/vite-authoring-structural-preview.ts", import.meta.url), "utf8");
  assert.match(plugin, /apply: "serve"/);
  assert.match(plugin, /request\.method !== "GET"/);
});
