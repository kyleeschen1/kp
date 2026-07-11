import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  runKpExternalPort
} from "../src/semantic/asset-port.ts";
import {
  checkKpPortDeterminism,
  checkKpPortLossDiagnostics
} from "../src/semantic/asset-laws.ts";
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

test("linear solve algebra trace fixture passes port determinism law", () => {
  const port = createLinearSolveAlgebraTracePort();

  assert.deepEqual(checkKpPortDeterminism(port, linearSolveAlgebraTraceFixture), {
    lawId: "port.determinism",
    passed: true,
    failures: []
  });
});

test("linear solve algebra trace fixture reports lossy mismatches", () => {
  const port = createLinearSolveAlgebraTracePort();
  const mismatchedTrace = {
    ...linearSolveAlgebraTraceFixture,
    steps: linearSolveAlgebraTraceFixture.steps.map((step) =>
      step.id === "trace.linear-solve.step.left-simplified"
        ? { ...step, latex: "x = 0" }
        : step
    )
  };
  const imported = runKpExternalPort(port, mismatchedTrace);

  assert.equal(imported.preservation, "lax");
  assert.deepEqual(imported.diagnostics, [
    {
      severity: "warning",
      code: "trace-latex-mismatch",
      lossKind: "partial",
      message:
        "Trace step trace.linear-solve.step.left-simplified latex does not match canonical object equation.linear-solve.left-simplified.",
      path: "steps[2].latex"
    }
  ]);
  assert.deepEqual(checkKpPortLossDiagnostics(imported), {
    lawId: "port.loss-reporting",
    passed: true,
    failures: []
  });
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
