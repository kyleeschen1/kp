import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKpEquationTransformSeriesEndpoints } from
  "../src/authoring/equation-latex-endpoint-normalizer.ts";
import { kpEquationSyntaxHazardCorpus } from
  "../src/authoring/equation-syntax-hazard-corpus.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("Calculus BC syntax hazards normalize or fail closed as declared", () => {
  assert.equal(new Set(kpEquationSyntaxHazardCorpus.cases.map(({ id }) => id)).size,
    kpEquationSyntaxHazardCorpus.cases.length);

  for (const hazard of kpEquationSyntaxHazardCorpus.cases) {
    const result = normalizeKpEquationTransformSeriesEndpoints(
      request(hazard.id, hazard.latex)
    );
    assert.equal(result.status,
      hazard.disposition === "normalized" ? "normalized" : "unsupported-syntax",
      hazard.id);
    if (hazard.disposition === "typed-gap") {
      assert.equal(result.diagnostics.length, 2, hazard.id);
      assert.ok(result.diagnostics.every(({ code, repair }) =>
        code === "equation-series.endpoint.unsupported-syntax" &&
        /bounded parser capability/u.test(repair)
      ), hazard.id);
    }
  }
});

test("inverse and reciprocal trigonometric spellings never collapse together", () => {
  const byMeaning = new Map(kpEquationSyntaxHazardCorpus.cases.map((hazard) =>
    [hazard.meaning, hazard]
  ));
  assert.equal(byMeaning.get("inverse-function")?.disposition, "typed-gap");
  assert.equal(byMeaning.get("reciprocal-function")?.disposition, "normalized");

  const reciprocal = normalizeKpEquationTransformSeriesEndpoints(
    request("syntax-hazard.trig.reciprocal-sine", "\\frac{1}{\\sin(x)}")
  );
  assert.equal(reciprocal.status, "normalized");
  if (reciprocal.status !== "normalized") return;
  assert.deepEqual(reciprocal.states[0]?.endpoint, {
    kind: "expression",
    expression: {
      kind: "binary",
      operator: "/",
      left: { kind: "number", value: 1 },
      right: {
        kind: "call",
        name: "sin",
        argument: { kind: "identifier", name: "x" }
      }
    }
  });
});

test("principal and indexed radicals retain different parser authority", () => {
  const principal = normalizeKpEquationTransformSeriesEndpoints(
    request("syntax-hazard.root.principal-square", "\\sqrt{x}")
  );
  const indexed = normalizeKpEquationTransformSeriesEndpoints(
    request("syntax-hazard.root.indexed", "\\sqrt[3]{x}")
  );
  assert.equal(principal.status, "normalized");
  assert.equal(indexed.status, "unsupported-syntax");
  if (indexed.status === "unsupported-syntax") {
    assert.equal(indexed.states.length, 0);
  }
});

function request(
  id: string,
  latex: string
): KpEquationTransformSeriesRequest {
  const states = [0, 1].map((index) => ({
    id: `${id}.${index}`,
    latex
  })) as unknown as KpEquationTransformSeriesRequest["states"];
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `series.${id}`,
    states,
    adjacencies: [{
      id: `adjacency.${id}`,
      fromStateId: states[0]!.id,
      toStateId: states[1]!.id,
      intent: { mode: "proposed" }
    }]
  };
}
