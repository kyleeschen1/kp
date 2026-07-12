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
  createAlgebraTraceFixturePort,
  createLinearSolveAlgebraTracePort,
  linearSolveAlgebraTraceFixture
} from "../src/semantic/algebra-trace-port-fixture.ts";
import {
  createGeneratedLinearSolveTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
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

test("generated algebra trace fixture port reports transformation and rule mismatches", () => {
  const fixture = createGeneratedLinearSolveTutorialFixture({
    id: "generated.linear-solve.two-x-plus-3",
    title: "Generated solve 2x plus 3",
    variable: "x",
    coefficient: 2,
    addend: 3,
    solution: 4
  });
  const port = createAlgebraTraceFixturePort({
    id: `port.fixture.algebra-trace.${fixture.id}`,
    title: `${fixture.title} algebra trace port`,
    targetBundle: fixture.bundle,
    expectedTrace: fixture.trace,
    transformationIds: fixture.transformations.map(
      (transformation) => transformation.id
    )
  });
  const mismatchedTrace = {
    ...fixture.trace,
    steps: fixture.trace.steps.map((step) =>
      step.id.endsWith(".after-divide")
        ? {
            ...step,
            transformationId:
              "transform.generated.linear-solve.two-x-plus-3.cancel-additive-inverse",
            rule: "cancelAdditiveInverses"
          }
        : step
    )
  };
  const imported = runKpExternalPort(port, mismatchedTrace);

  assert.equal(imported.preservation, "lax");
  assert.deepEqual(imported.diagnostics, [
    {
      severity: "warning",
      code: "trace-transformation-mismatch",
      lossKind: "lossy",
      message:
        "Trace step trace.generated.linear-solve.two-x-plus-3.after-divide transformation transform.generated.linear-solve.two-x-plus-3.cancel-additive-inverse does not match expected transform.generated.linear-solve.two-x-plus-3.divide-coefficient.",
      path: "steps[4].transformationId"
    },
    {
      severity: "warning",
      code: "trace-rule-mismatch",
      lossKind: "partial",
      message:
        "Trace step trace.generated.linear-solve.two-x-plus-3.after-divide rule cancelAdditiveInverses does not match expected divideBothSides.",
      path: "steps[4].rule"
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
