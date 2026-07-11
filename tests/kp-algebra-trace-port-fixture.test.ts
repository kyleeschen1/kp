import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  runKpExternalPort
} from "../src/semantic/asset-port.ts";
import {
  createLinearSolveAlgebraTracePort,
  linearSolveAlgebraTraceFixture
} from "../src/semantic/algebra-trace-port-fixture.ts";
import {
  createLinearSolveKpAssetBundle
} from "../src/semantic/linear-solve-asset.ts";

test("linear solve algebra trace fixture imports to canonical bundle shape", () => {
  const port = createLinearSolveAlgebraTracePort();
  const imported = runKpExternalPort(port, linearSolveAlgebraTraceFixture);
  const canonical = createLinearSolveKpAssetBundle();

  assert.equal(imported.portId, "port.fixture.algebra-trace.linear-solve");
  assert.equal(imported.sourceSystem, "fixture.algebra-trace");
  assert.equal(imported.preservation, "strict");
  assert.deepEqual(imported.diagnostics, []);
  assert.deepEqual(validateKpAssetBundle(imported.bundle), []);
  assert.deepEqual(bundleShape(imported.bundle), bundleShape(canonical.bundle));
  assert.deepEqual(
    imported.bundle.objects.map((object) => ({
      objectId: object.id,
      provenance: object.provenance
    })),
    [
      {
        objectId: "equation.linear-solve.initial",
        provenance: {
          kind: "imported",
          sourceIds: ["trace.linear-solve.step.initial"],
          portId: "port.fixture.algebra-trace.linear-solve"
        }
      },
      {
        objectId: "equation.linear-solve.after-subtract",
        provenance: {
          kind: "transformed",
          sourceIds: ["trace.linear-solve.step.after-subtract"],
          transformationId: "transform.linear-solve.subtract-both-sides-3",
          portId: "port.fixture.algebra-trace.linear-solve"
        }
      },
      {
        objectId: "equation.linear-solve.left-simplified",
        provenance: {
          kind: "transformed",
          sourceIds: ["trace.linear-solve.step.left-simplified"],
          transformationId: "transform.linear-solve.cancel-left-additive-inverse",
          portId: "port.fixture.algebra-trace.linear-solve"
        }
      },
      {
        objectId: "equation.linear-solve.solved",
        provenance: {
          kind: "transformed",
          sourceIds: ["trace.linear-solve.step.solved"],
          transformationId: "transform.linear-solve.simplify-right-difference",
          portId: "port.fixture.algebra-trace.linear-solve"
        }
      }
    ]
  );
});

function bundleShape(bundle: ReturnType<typeof createLinearSolveKpAssetBundle>["bundle"]) {
  return bundle.objects.map((object) => ({
    id: object.id,
    value: object.value,
    selectors: object.selectors.map((selector) => ({
      id: selector.id,
      kind: selector.kind,
      label: selector.label
    }))
  }));
}
