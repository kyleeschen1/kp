import assert from "node:assert/strict";
import test from "node:test";
import generatedInventory from
  "../src/architecture/post-convergence-infrastructure-inventory.generated.json" with {
    type: "json"
  };
import {
  createKpPostConvergenceInfrastructureInventory
} from "../src/architecture/post-convergence-infrastructure-inventory.ts";

test("post-convergence counts are projections of canonical declarations", () => {
  const inventory = createKpPostConvergenceInfrastructureInventory();

  assert.deepEqual(generatedInventory, inventory);
  assert.equal(
    Object.values(inventory.equationSurfaces.dispositionCounts)
      .reduce((total, count) => total + count, 0),
    inventory.equationSurfaces.count
  );
  assert.equal(
    Object.values(inventory.compatibility.statusCounts)
      .reduce((total, count) => total + count, 0),
    inventory.compatibility.count
  );
  assert.deepEqual(
    Object.keys(inventory.selectedCapabilities.callerCounts),
    inventory.selectedCapabilities.ids
  );
});
