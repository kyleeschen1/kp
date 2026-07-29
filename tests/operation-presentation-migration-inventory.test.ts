import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpOperationPresentationCancellationAuthoringSites,
  kpOperationPresentationEvidenceClosures,
  kpOperationPresentationEvidenceGaps,
  kpOperationPresentationReaderPlanSeams,
  kpOperationPresentationRendererInputs
} from "../src/architecture/operation-presentation-migration-inventory.ts";

const inventory = [
  ...kpOperationPresentationReaderPlanSeams,
  ...kpOperationPresentationRendererInputs,
  ...kpOperationPresentationCancellationAuthoringSites,
  ...kpOperationPresentationEvidenceGaps,
  ...kpOperationPresentationEvidenceClosures
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

test("reader planning exposes one required presentation plan", async () => {
  assert.deepEqual(
    kpOperationPresentationReaderPlanSeams.map(({ sourceNeedle }) =>
      sourceNeedle
    ),
    ["presentationPlan: KpReaderEquationTransitionPresentationPlan"]
  );
  assert.ok(kpOperationPresentationReaderPlanSeams.every(
    ({ state }) => state === "verified-plan"
  ));
  const source = await readFile(
    "src/reader/renderers/equation-render-plan.ts",
    "utf8"
  );
  const transitionContract = source.slice(
    source.indexOf("export interface KpReaderEquationTransitionPlan"),
    source.indexOf("export interface KpReaderEquationStatePlan")
  );
  assert.equal(
    (transitionContract.match(/presentationPlan:/g) ?? []).length,
    1
  );
  for (const formerField of [
    "visualMotif",
    "factoringMotifBinding",
    "fractionMaterialPresentationPlan",
    "structuralSuccession",
    "successorSyntheses",
    "operationChoreography"
  ]) {
    assert.equal(transitionContract.includes(formerField), false);
  }
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
  assert.equal(kpOperationPresentationEvidenceGaps.length, 2);
  assert.deepEqual(
    kpOperationPresentationEvidenceClosures.map(({ state }) => state),
    [
      "verified-plan",
      "verified-plan",
      "verified-plan",
      "verified-plan",
      "verified-plan"
    ]
  );
});
