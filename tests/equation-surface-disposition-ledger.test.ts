import assert from "node:assert/strict";
import test from "node:test";

import generatedLedger from
  "../src/architecture/equation-surface-disposition-ledger.generated.json" with {
    type: "json"
  };
import {
  compileKpEquationSurfaceDispositionLedger,
  createKpEquationSurfaceDispositionLedger,
  kpEquationSurfaceDispositionValues,
  kpEquationSurfaceMigrationWaveValues,
  KpEquationSurfaceDispositionLedgerError
} from "../src/architecture/equation-surface-disposition-ledger.ts";
import {
  createKpEquationSurfaceAuthorityGraph
} from "../src/architecture/equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceInventory
} from "../src/architecture/equation-surface-inventory.ts";
import {
  createKpEquationSurfacePreservationMatrix
} from "../src/architecture/equation-surface-preservation-matrix.ts";

test("disposition ledger classifies every equation row exactly once", () => {
  const ledger = createKpEquationSurfaceDispositionLedger();
  const inventory = createKpEquationSurfaceInventory();

  assert.deepEqual(generatedLedger, ledger);
  assert.deepEqual(
    new Set(ledger.entries.map(({ animationId }) => animationId)),
    new Set(inventory.entries.map(({ animationId }) => animationId))
  );
  assert.equal(ledger.entries.every(({ disposition, migrationWave }) =>
    kpEquationSurfaceDispositionValues.includes(disposition) &&
    kpEquationSurfaceMigrationWaveValues.includes(migrationWave)), true);
});

test("every disposition has a single-row rollback and blocked retirement gate", () => {
  const ledger = createKpEquationSurfaceDispositionLedger();

  for (const entry of ledger.entries) {
    assert.equal(entry.rollbackUnit.scope,
      "single-equation-surface-authority-path");
    assert.equal(entry.rollbackUnit.restoreSourcePaths.length > 0, true);
    assert.equal(entry.rollbackUnit.verificationCommands.length, 3);
    assert.equal(entry.preservationBoundary.semanticEndpointFingerprints.length > 0,
      true);
    assert.equal(entry.retirementEvidence.status, "blocked-active-callers");
    assert.equal(entry.retirementEvidence.productionCallers.length, 3);
    assert.equal(entry.retirementEvidence.conformanceCallers.length, 3);
    assert.equal(entry.retirementEvidence.retirementCondition,
      "zero-production-and-conformance-callers-after-replacement");
  }
  assert.deepEqual(ledger.entries.filter(({ disposition }) =>
    disposition === "retirement-candidate").map(({ animationId }) => animationId),
  ["animation.generated.substitute-three.provisional-incorrect"]);
});

test("disposition compilation rejects duplicate and missing source rows", () => {
  const inventory = createKpEquationSurfaceInventory();
  const authority = createKpEquationSurfaceAuthorityGraph();
  const preservation = createKpEquationSurfacePreservationMatrix();
  const first = inventory.entries[0]!;

  assert.throws(() => compileKpEquationSurfaceDispositionLedger({
    inventory: { ...inventory, entries: [...inventory.entries, first] },
    authority,
    preservation
  }), (error: unknown) =>
    error instanceof KpEquationSurfaceDispositionLedgerError &&
    error.diagnostics.some((message) =>
      message.includes(`Duplicate inventory row ${first.animationId}`)));
  assert.throws(() => compileKpEquationSurfaceDispositionLedger({
    inventory: {
      ...inventory,
      entries: inventory.entries.filter(({ animationId }) =>
        animationId !== first.animationId)
    },
    authority,
    preservation
  }), (error: unknown) =>
    error instanceof KpEquationSurfaceDispositionLedgerError &&
    error.diagnostics.some((message) =>
      message.includes(`${first.animationId} is absent from inventory`)));
});
