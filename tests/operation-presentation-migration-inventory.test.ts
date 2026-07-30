import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  kpExecutableMotifMigrationLedger,
  kpOperationPresentationCancellationAuthoringSites,
  kpOperationPresentationEvidenceClosures,
  kpOperationPresentationEvidenceGaps,
  kpOperationEvaluationContinuityMigrationInventory,
  kpOperationPresentationReaderPlanSeams,
  kpOperationPresentationRendererInputs
} from "../src/architecture/operation-presentation-migration-inventory.ts";

const inventory = [
  ...kpOperationPresentationReaderPlanSeams,
  ...kpOperationPresentationRendererInputs,
  ...kpOperationPresentationCancellationAuthoringSites,
  ...kpOperationPresentationEvidenceGaps,
  ...kpOperationPresentationEvidenceClosures,
  ...kpOperationEvaluationContinuityMigrationInventory,
  ...kpExecutableMotifMigrationLedger
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

test("canonical compositor primitives are only projections of one verified reader plan", () => {
  assert.equal(kpOperationPresentationRendererInputs.length, 7);
  assert.ok(kpOperationPresentationRendererInputs.every(
    ({ state }) => state === "internal-projection-primitive"
  ));
});

test("semantic cancellation sites cross verified plans and old evidence gaps are closed", () => {
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
  assert.ok(kpOperationPresentationCancellationAuthoringSites.every(
    ({ state }) => state === "verified-plan"
  ));
  assert.equal(kpOperationPresentationEvidenceGaps.length, 0);
  assert.equal(kpOperationPresentationEvidenceClosures.length, 7);
  assert.ok(kpOperationPresentationEvidenceClosures.every(
    ({ state }) => state === "verified-plan"
  ));
});

test("operation continuity inventory exposes every known bypass and shared route", () => {
  assert.deepEqual(
    kpOperationEvaluationContinuityMigrationInventory.map(
      ({ id, state, owningSlice }) => ({ id, state, owningSlice })
    ),
    [
      {
        id: "operation-continuity.raw-binding-paint-policy",
        state: "removed",
        owningSlice: "s09"
      },
      {
        id: "operation-continuity.renderer-binary-handoff",
        state: "removed",
        owningSlice: "s15"
      },
      {
        id: "operation-continuity.reader-registry-compiler",
        state: "canonical-route",
        owningSlice: "s07"
      },
      {
        id: "operation-continuity.matrix-vector-duration",
        state: "existing-shared-consumer",
        owningSlice: "s18"
      },
      {
        id: "operation-continuity.matrix-matrix-duration",
        state: "existing-shared-consumer",
        owningSlice: "s18"
      },
      {
        id: "operation-continuity.exact-fraction-duration",
        state: "adoption-gap",
        owningSlice: "s18"
      }
    ]
  );
  assert.equal(
    kpOperationEvaluationContinuityMigrationInventory.filter(
      ({ state }) => state === "canonical-route"
    ).length,
    1
  );
  assert.equal(
    kpOperationEvaluationContinuityMigrationInventory.filter(
      ({ state }) => state === "must-remove"
    ).length,
    0
  );
  assert.equal(
    kpOperationEvaluationContinuityMigrationInventory.filter(
      ({ state }) => state === "removed"
    ).length,
    2
  );
});

test("executable motif ledger covers every authority seam and owns every repair", () => {
  assert.deepEqual(
    [...new Set(kpExecutableMotifMigrationLedger.map(
      ({ category }) => category
    ))].sort(),
    [
      "endpoint-bypass",
      "generic-fallback",
      "label-declaration",
      "promotion-evidence",
      "renderer-consumer",
      "zero-area-transfer"
    ]
  );
  assert.ok(kpExecutableMotifMigrationLedger.every(
    ({ summary }) => summary.trim().length > 0
  ));
  assert.ok(kpExecutableMotifMigrationLedger
    .filter(({ owningSlice }) => owningSlice !== "preserve")
    .every(({ owningSlice }) => {
      const number = Number(owningSlice.slice(1));
      return number >= 7 && number <= 23;
    }));
  assert.deepEqual(
    kpExecutableMotifMigrationLedger
      .filter(({ state }) => state === "protected-existing-consumer")
      .map(({ id }) => id)
      .sort(),
    [
      "executable-motif.consumer.factoring-fission-fusion",
      "executable-motif.consumer.quadratic-fission-fusion",
      "executable-motif.consumer.quadratic-runtime-fission-fusion"
    ]
  );
});

test("runtime sampler discovery cannot grow a silent motif route", async () => {
  const sourceFiles = await listTypeScriptFiles("src");
  const discovery = [
    {
      needle: "sampleKpSuccessorSynthesis(",
      expected: [
        "src/animation/successor-synthesis.ts",
        "src/rendering/equation-linear-rearrangement.ts"
      ]
    },
    {
      needle:
        "sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis(",
      expected: [
        "src/animation/successor-synthesis.ts",
        "src/editor/operation-evaluation-reference-comparison.dev.ts",
        "src/rendering/native-katex-successor-synthesis.ts"
      ]
    },
    {
      needle: "sampleKpFissionFusion(",
      expected: [
        "src/animation/fission-fusion.ts",
        "src/animation/quadratic-branch-choreography.ts",
        "src/reader/app/quadratic-branching-runtime.ts",
        "src/rendering/exact-fraction-quantity-runtime.ts",
        "src/rendering/native-katex-factoring-choreography.ts"
      ]
    },
    {
      needle: 'legacyContinuityAuthority: "exact-fraction-quantity-v0"',
      expected: []
    }
  ] as const;

  for (const { needle, expected } of discovery) {
    const found: string[] = [];
    for (const sourcePath of sourceFiles) {
      if (
        sourcePath ===
        "src/architecture/operation-presentation-migration-inventory.ts"
      ) continue;
      const source = await readFile(sourcePath, "utf8");
      if (source.includes(needle)) found.push(sourcePath);
    }
    assert.deepEqual(found.sort(), [...expected].sort(), needle);
  }
});

async function listTypeScriptFiles(root: string): Promise<readonly string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  }));
  return nested.flat().sort();
}
