import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKpEquationTransformSeriesEndpoints } from
  "../src/authoring/equation-latex-endpoint-normalizer.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("normalizes nested fractions roots logarithms and equalities", () => {
  const result = normalizeKpEquationTransformSeriesEndpoints(request([
    "\\frac{\\frac{x}{y}}{\\sqrt{z}}",
    "\\ln(x)+\\ln(y)=\\ln(xy)"
  ]));

  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") return;
  assert.equal(result.states[0]?.endpoint.kind, "expression");
  assert.deepEqual(result.states[0]?.endpoint, {
    kind: "expression",
    expression: {
      kind: "binary",
      operator: "/",
      left: {
        kind: "binary",
        operator: "/",
        left: { kind: "identifier", name: "x" },
        right: { kind: "identifier", name: "y" }
      },
      right: {
        kind: "call",
        name: "sqrt",
        argument: { kind: "identifier", name: "z" }
      }
    }
  });
  assert.deepEqual(result.states[1]?.endpoint, {
    kind: "relation",
    relation: "equals",
    equation: {
      kind: "equation",
      left: {
        kind: "binary",
        operator: "+",
        left: {
          kind: "call",
          name: "ln",
          argument: { kind: "identifier", name: "x" }
        },
        right: {
          kind: "call",
          name: "ln",
          argument: { kind: "identifier", name: "y" }
        }
      },
      right: {
        kind: "call",
        name: "ln",
        argument: { kind: "identifier", name: "xy" }
      }
    }
  });
  assert.equal(result.states[0]?.authority,
    "normalizer.equation.native-latex.v1");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.states[0]?.endpoint), true);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test("returns typed gaps for every unsupported endpoint without fallback", () => {
  const result = normalizeKpEquationTransformSeriesEndpoints(request([
    "\\tan(x)",
    "x = y = z"
  ]));

  assert.equal(result.status, "unsupported-syntax");
  if (result.status !== "unsupported-syntax") return;
  assert.deepEqual(result.states, []);
  assert.deepEqual(result.diagnostics.map(({ code, stateIndex, expected }) => ({
    code,
    stateIndex,
    expected
  })), [{
    code: "equation-series.endpoint.unsupported-syntax",
    stateIndex: 0,
    expected: "supported command"
  }, {
    code: "equation-series.endpoint.unsupported-syntax",
    stateIndex: 1,
    expected: "single equals"
  }]);
  assert.match(result.diagnostics[0]?.repair ?? "", /bounded parser capability/u);
});

test("preserves supported endpoints while reporting a neighboring gap", () => {
  const result = normalizeKpEquationTransformSeriesEndpoints(request([
    "x+1",
    "\\operatorname{mystery}(x)",
    "\\sin(x)"
  ]));

  assert.equal(result.status, "unsupported-syntax");
  if (result.status !== "unsupported-syntax") return;
  assert.deepEqual(result.states.map(({ id, index, endpoint }) => ({
    id,
    index,
    kind: endpoint.kind
  })), [{ id: "state.endpoint.0", index: 0, kind: "expression" }, {
    id: "state.endpoint.2",
    index: 2,
    kind: "expression"
  }]);
  assert.deepEqual(result.diagnostics.map(({ stateId }) => stateId), [
    "state.endpoint.1"
  ]);
});

function request(
  latexStates: readonly [string, string, ...string[]]
): KpEquationTransformSeriesRequest {
  const states = latexStates.map((latex, index) => ({
    id: `state.endpoint.${index}`,
    latex,
    ...(index === 0 ? { narration: "Inspect the source notation." } : {})
  })) as unknown as KpEquationTransformSeriesRequest["states"];
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.endpoint-normalization.fixture",
    states,
    adjacencies: states.slice(1).map((state, index) => ({
      id: `adjacency.endpoint.${index}`,
      fromStateId: states[index]!.id,
      toStateId: state.id,
      intent: { mode: "proposed" }
    }))
  };
}
