import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies
} from "../src/authoring/compile-equation-intent.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";

test("all uncorrected pressure requests receive typed entity repairs", () => {
  for (const fixture of kpEquationGenerationPressureFixtures) {
    const result = compileEquationIntent(fixture.request);
    assert.equal(result.status, "repair-required");
    if (result.status !== "repair-required") continue;
    assert.ok(result.diagnostics.length > 0);
    assert.ok(result.diagnostics.every(
      ({ code }) => code === "equation-llm.entity.unresolved"
    ));
  }
});

test("canonical surface vocabularies compile through existing authorities", () => {
  const plans = listKpEquationIntentSurfaceVocabularies().map((vocabulary) => {
    const fixture = kpEquationGenerationPressureFixtures.find(
      ({ request }) => request.animationId === vocabulary.animationId
    )!;
    return compileEquationIntent({
      ...fixture.request,
      operation: {
        operationId: vocabulary.operationId,
        roleBindings: vocabulary.canonicalRoleBindings
      }
    });
  });

  assert.deepEqual(plans.map((result) => result.status), [
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted"
  ]);
  assert.deepEqual(plans.map((result) =>
    result.status === "accepted" ? result.plan.kind : undefined
  ), [
    "function-wrap-motif-plan",
    "cancellation-semantic-motion-plan",
    "distribution-operation-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "exponential-homomorphism-correspondence-plan",
    "exponential-homomorphism-correspondence-plan"
  ]);
});

test("surface-operation mismatches and wrong in-surface ownership fail closed", () => {
  const vocabularies = listKpEquationIntentSurfaceVocabularies();
  const wrap = vocabularies[0]!;
  const cancellation = vocabularies[1]!;
  const fixture = kpEquationGenerationPressureFixtures[0]!;
  const mismatch = compileEquationIntent({
    ...fixture.request,
    operation: {
      operationId: cancellation.operationId,
      roleBindings: cancellation.canonicalRoleBindings
    }
  });
  assert.deepEqual(
    mismatch.status === "repair-required"
      ? mismatch.diagnostics.map(({ code }) => code)
      : [],
    ["equation-intent.surface-operation.mismatch"]
  );

  const wrongOwner = compileEquationIntent({
    ...fixture.request,
    operation: {
      operationId: wrap.operationId,
      roleBindings: {
        ...wrap.canonicalRoleBindings,
        "content-before": wrap.canonicalRoleBindings["content-after"]
      }
    }
  });
  assert.deepEqual(
    wrongOwner.status === "repair-required"
      ? wrongOwner.diagnostics.map(({ code }) => code)
      : [],
    ["equation-intent.role-binding.mismatch"]
  );
});

test("the facade directly imports authorities and owns no renderer or timing", () => {
  const source = readFileSync(new URL(
    "../src/authoring/compile-equation-intent.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /(?:public-api|index)\.ts/);
  assert.doesNotMatch(
    source,
    /\b(?:durationMs|delayMs|keyframes|coordinates|DOMRect|HTMLElement|SVGElement|WebGL)\b/
  );
});
