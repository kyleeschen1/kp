import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import {
  createKpEquationSeriesFrontendUnavailableRepair,
  repairsForKpEquationSeriesExternalDiagnostics
} from "../src/authoring/equation-series-repair-taxonomy.ts";

test("valid series compiles and every invalid attempt preserves the last good candidate", () => {
  const valid = compileKpEquationTransformSeries({ value: validRequest() });
  assert.equal(valid.status, "compiled");
  assert.ok(valid.active);
  const invalidCases = [
    { ...validRequest(), states: [] },
    {
      ...validRequest(),
      states: [
        { id: "state.example.before", latex: "x" },
        { id: "state.example.after", latex: "\\sum_{i=1}^{n} i" }
      ]
    },
    requestWithOperation("operation.equation.not-registered.v1")
  ];
  for (const value of invalidCases) {
    const result = compileKpEquationTransformSeries({
      value,
      previous: valid
    });
    assert.equal(result.status, "repair-required");
    assert.strictEqual(result.active, valid.active);
    assert.ok(result.repairs.length > 0);
    assert.equal(Object.isFrozen(result.repairs), true);
  }
});

test("request syntax and unknown-operation failures have stable categories", () => {
  const invalid = compileKpEquationTransformSeries({ value: null });
  assert.deepEqual(invalid.repairs.map(({ kind, code }) => ({ kind, code })), [{
    kind: "invalid-request",
    code: "equation-series.repair.invalid-request"
  }]);
  const syntax = compileKpEquationTransformSeries({
    value: {
      ...validRequest(),
      states: [
        { id: "state.example.before", latex: "x" },
        { id: "state.example.after", latex: "\\sum_{i=1}^{n} i" }
      ]
    }
  });
  assert.equal(syntax.repairs[0]?.kind, "unsupported-syntax");
  const unknown = compileKpEquationTransformSeries({
    value: requestWithOperation("operation.equation.not-registered.v1")
  });
  assert.equal(unknown.repairs[0]?.kind, "unknown-operation");
  if (unknown.repairs[0]?.kind === "unknown-operation") {
    assert.equal(
      unknown.repairs[0].operationId,
      "operation.equation.not-registered.v1"
    );
  }
});

test("compound and ambiguous proposals remain distinct repair actions", () => {
  const value = proposedRequest();
  const compound = compileKpEquationTransformSeries({
    value,
    proposals: [{
      adjacencyId: "adjacency.example.transform",
      kind: "sequence",
      operationIds: [
        "kp.algebra.wrap-function",
        "kp.algebra.distribute-multiplication"
      ]
    }]
  });
  assert.equal(compound.repairs[0]?.kind, "compound-jump");
  if (compound.repairs[0]?.kind === "compound-jump") {
    assert.equal(compound.repairs[0].minimumIntermediateStateCount, 1);
  }
  const ambiguous = compileKpEquationTransformSeries({
    value,
    proposals: [{
      adjacencyId: "adjacency.example.transform",
      kind: "alternatives",
      operationIds: [
        "kp.algebra.wrap-function",
        "operation.wrap-function.v1"
      ]
    }]
  });
  assert.equal(ambiguous.repairs[0]?.kind, "ambiguous-jump");
});

test("role entity and unavailable frontend diagnostics share the taxonomy", () => {
  const repairs = repairsForKpEquationSeriesExternalDiagnostics([{
    code: "equation-llm.role.cardinality",
    path: "$.operation.roleBindings.wrapper",
    message: "Wrapper requires three entities.",
    roleId: "wrapper"
  }, {
    code: "equation-llm.entity.unresolved",
    path: "$.operation.roleBindings.wrapper[0]",
    message: "Entity is unavailable.",
    entityId: "target.missing",
    roleId: "wrapper"
  }]);
  assert.deepEqual(repairs.map(({ kind }) => kind), [
    "invalid-role",
    "unresolved-entity"
  ]);
  const frontend = createKpEquationSeriesFrontendUnavailableRepair({
    domain: "graph3d",
    frontendId: "frontend.graph3d.semantic-scene.v1",
    message: "Graph3D frontend is declared but unavailable."
  });
  assert.equal(frontend.kind, "frontend-unavailable");
  assert.equal(frontend.action.kind, "provide-domain-frontend");
});

test("compile transaction owns no renderer DOM clock mutation or silent fallback", () => {
  const source = readFileSync(new URL(
    "../src/authoring/compile-equation-transform-series.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /(?:renderer|HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout|fallback)/u
  );
  assert.doesNotMatch(source, /\.push\([^)]*active/u);
});

function validRequest() {
  return requestWithOperation("kp.algebra.wrap-function");
}

function requestWithOperation(operationId: string) {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.example.transaction.v1",
    states: [
      { id: "state.example.before", latex: "x" },
      { id: "state.example.after", latex: "\\ln(x)" }
    ],
    adjacencies: [{
      id: "adjacency.example.transform",
      fromStateId: "state.example.before",
      toStateId: "state.example.after",
      intent: {
        mode: "explicit",
        operationId,
        semanticArguments: { wrapper: "ln" }
      }
    }]
  };
}

function proposedRequest() {
  const value = validRequest();
  return {
    ...value,
    adjacencies: value.adjacencies.map((adjacency) => ({
      ...adjacency,
      intent: { mode: "proposed", instruction: "Choose one licensed law." }
    }))
  };
}
