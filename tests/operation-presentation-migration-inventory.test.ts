import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpOperationPresentationCancellationAuthoringSites,
  kpOperationPresentationEvidenceGaps,
  kpOperationPresentationOptionalSeams,
  kpOperationPresentationRendererInputs
} from "../src/architecture/operation-presentation-migration-inventory.ts";

const inventory = [
  ...kpOperationPresentationOptionalSeams,
  ...kpOperationPresentationRendererInputs,
  ...kpOperationPresentationCancellationAuthoringSites,
  ...kpOperationPresentationEvidenceGaps
];

test("operation presentation migration inventory has unique executable evidence", async () => {
  assert.equal(new Set(inventory.map(({ id }) => id)).size, inventory.length);
  for (const entry of inventory) {
    const source = await readFile(entry.sourcePath, "utf8");
    assert.ok(
      source.includes(entry.sourceNeedle),
      `${entry.id} no longer matches ${entry.sourcePath}`
    );
  }
});

test("reader planning currently exposes five independently optional concerns", () => {
  assert.deepEqual(
    kpOperationPresentationOptionalSeams.map(({ sourceNeedle }) => sourceNeedle),
    [
      "visualMotif",
      "factoringMotifBinding",
      "structuralSuccession",
      "successorSyntheses",
      "operationChoreography"
    ]
  );
  assert.ok(kpOperationPresentationOptionalSeams.every(
    ({ state }) => state === "independent-optional"
  ));
});

test("canonical compositor currently accepts seven independently combinable inputs", () => {
  assert.equal(kpOperationPresentationRendererInputs.length, 7);
  assert.ok(kpOperationPresentationRendererInputs.every(
    ({ state }) => state === "independent-optional"
  ));
});

test("raw cancellation authoring and behavior-evidence gaps remain explicit", () => {
  assert.deepEqual(
    kpOperationPresentationCancellationAuthoringSites.map(({ id }) => id),
    [
      "cancellation-authoring.fraction-composition",
      "cancellation-authoring.fractional-linear",
      "cancellation-authoring.linear-solve",
      "cancellation-authoring.divide-both-sides",
      "cancellation-authoring.generated-algebra"
    ]
  );
  assert.equal(kpOperationPresentationEvidenceGaps.length, 3);
});

