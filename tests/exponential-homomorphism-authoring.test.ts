import assert from "node:assert/strict";
import test from "node:test";

import { compileEquationIntent } from
  "../src/authoring/compile-equation-intent.ts";
import { createKpEquationLlmAuthoringCatalogue } from
  "../src/authoring/equation-llm-authoring-catalogue.ts";
import { kpExponentialHomomorphismAuthoringCorpus } from
  "../src/authoring/exponential-homomorphism-authoring-corpus.ts";
import { kpExponentialHomomorphismCallerDeclarations } from
  "../src/animation/exponential-homomorphism-caller-declarations.ts";

test("approved exponential callers are discoverable through exact operations", () => {
  const catalogue = createKpEquationLlmAuthoringCatalogue();
  for (const declaration of kpExponentialHomomorphismCallerDeclarations) {
    const surface = catalogue.surfaces.find(({ animationId }) =>
      animationId === declaration.callerId
    );
    assert.equal(surface?.authoringStatus, "promoted");
    assert.ok(surface?.recipeIds.includes(declaration.recipeId));
    const operation = catalogue.operations.find(({ operationId }) =>
      operationId === declaration.operationKind
    );
    assert.deepEqual(operation?.extensionAuthority?.callerIds, [
      declaration.callerId
    ]);
  }
});

test("natural-language and LaTeX corpus accepts only the reviewed narrow seam", () => {
  for (const fixture of kpExponentialHomomorphismAuthoringCorpus.cases) {
    const result = compileEquationIntent(fixture.request);
    assert.equal(result.status, fixture.expectedStatus, fixture.id);
    if (fixture.expectedStatus === "accepted") {
      assert.equal(result.status, "accepted");
      assert.equal(
        result.plan.kind,
        "exponential-homomorphism-correspondence-plan"
      );
      assert.match(fixture.sourceLatex, /e\^/u);
      continue;
    }
    assert.equal(result.status, "repair-required");
    assert.ok(result.diagnostics.some(({ code }) =>
      code === fixture.expectedRepairCode
    ), fixture.boundary);
  }
});

test("operation mismatch returns repair instead of selecting nearby motion", () => {
  const fixture = kpExponentialHomomorphismAuthoringCorpus.cases[0]!;
  const result = compileEquationIntent({
    ...fixture.request,
    operation: {
      ...fixture.request.operation,
      operationId:
        "operation.equation.exponential-difference-to-quotient.v1"
    }
  });
  assert.equal(result.status, "repair-required");
  assert.ok(result.diagnostics.some(({ code }) =>
    code === "equation-llm.surface-operation.mismatch"
  ));
});
