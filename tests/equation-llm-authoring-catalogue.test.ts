import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationLlmAuthoringCatalogue,
  validateKpEquationLlmEntityClosure,
  validateKpEquationLlmAuthoringRequest
} from "../src/authoring/equation-llm-authoring-catalogue.ts";
import {
  kpWaveAEquationOperationPlanDeclarations,
  kpWaveBEquationStructuralDeclarations,
  kpWaveCEquationDispositionDeclarations
} from "../src/domain-ir/equation-surface-family-declarations.ts";

test("equation LLM catalogue is an exact projection of the three migration waves", () => {
  const catalogue = createKpEquationLlmAuthoringCatalogue();
  const expectedIds = [
    ...kpWaveAEquationOperationPlanDeclarations,
    ...kpWaveBEquationStructuralDeclarations,
    ...kpWaveCEquationDispositionDeclarations
  ].map((entry) => entry.animationId);

  assert.equal(catalogue.schemaVersion, "kp.equation-llm-authoring-catalogue.v1");
  assert.deepEqual(catalogue.surfaces.map((entry) => entry.animationId), expectedIds);
  assert.equal(new Set(expectedIds).size, expectedIds.length);
  assert.ok(catalogue.surfaces.every((entry) =>
    entry.selectionAuthority.recipe === "kp-compiler" &&
    entry.selectionAuthority.presentation === "kp-renderer" &&
    entry.exampleSourcePaths.length > 0
  ));
  assert.deepEqual(catalogue.allowedAuthoringConcepts, [
    "semantic-operation",
    "semantic-role-bindings",
    "semantic-lineage",
    "teaching-intent",
    "explanation-depth"
  ]);
});

test("catalogue exposes operation roles and motif capabilities without motion geometry", () => {
  const catalogue = createKpEquationLlmAuthoringCatalogue();
  const wrap = catalogue.operations.find((entry) =>
    entry.operationId === "kp.algebra.wrap-function"
  );
  const functionWrap = catalogue.surfaces.find((entry) =>
    entry.animationId === "animation.generated.function-wrap.apply-f"
  );

  assert.equal(wrap?.visualMotif, "wrap");
  assert.deepEqual(wrap?.roles.map((role) => role.id), [
    "content-before",
    "content-after",
    "wrapper"
  ]);
  assert.deepEqual(functionWrap?.recipeIds, [
    "recipe.equation.function-application.v1"
  ]);
  assert.equal(functionWrap?.authoringStatus, "promoted");
  assert.ok(catalogue.prohibitedAuthoringFields.includes("geometry and bounds"));
  assert.ok(catalogue.prohibitedAuthoringFields.includes("timing"));

  const surfaceJson = JSON.stringify(catalogue.surfaces);
  assert.doesNotMatch(surfaceJson, /durationMs|delayMs|coordinates|keyframes/);
  assert.equal(catalogue.examples.length, 2);
  catalogue.examples.forEach((example) => {
    assert.equal(
      validateKpEquationLlmAuthoringRequest(example.request, catalogue).status,
      "accepted"
    );
  });
});

test("recipe catalogue groups callers and owners from canonical declarations", () => {
  const catalogue = createKpEquationLlmAuthoringCatalogue();
  const functionApplication = catalogue.recipes.find((entry) =>
    entry.recipeId === "recipe.equation.function-application.v1"
  );

  assert.deepEqual(functionApplication, {
    recipeId: "recipe.equation.function-application.v1",
    kind: "structural-recipe",
    callerAnimationIds: [
      "animation.algebra.log-quotient.difference-to-quotient",
      "animation.generated.function-wrap.apply-f"
    ],
    ownerSourcePaths: [
      "src/editor/log-quotient-surface-adapter.ts",
      "src/animation/function-wrap-motif.ts"
    ],
    selectionAuthority: "kp-compiler"
  });
});

test("promoted semantic request is accepted without model-authored presentation", () => {
  const result = validateKpEquationLlmAuthoringRequest({
    animationId: "animation.generated.function-wrap.apply-f",
    operation: {
      operationId: "kp.algebra.wrap-function",
      roleBindings: {
        "content-before": ["source.x"],
        "content-after": ["target.x"],
        wrapper: ["target.function", "target.open", "target.close"]
      }
    },
    explanationDepth: "standard",
    teachingIntent: "Show the function accepting its argument."
  });

  assert.equal(result.status, "accepted");
  assert.equal(
    result.status === "accepted" && result.operation.visualMotif,
    "wrap"
  );
});

test("repair diagnostics reject presentation authorship and incomplete semantics", () => {
  const result = validateKpEquationLlmAuthoringRequest({
    animationId: "animation.comparison.jacobian-hessian",
    operation: {
      operationId: "kp.algebra.wrap-function",
      roleBindings: {
        "content-before": [],
        invented: ["source.x"]
      },
      durationMs: 400
    },
    explanationDepth: "cinematic"
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(new Set(result.diagnostics.map((entry) => entry.code)), new Set([
    "equation-llm.surface.not-promoted",
    "equation-llm.role.missing",
    "equation-llm.role.unknown",
    "equation-llm.explanation-depth.invalid",
    "equation-llm.field.forbidden"
  ]));
  assert.ok(result.diagnostics.every((entry) => entry.repair.length > 0));
});

test("resolved surface vocabulary produces typed entity-closure repairs", () => {
  const request = createKpEquationLlmAuthoringCatalogue().examples[0]!.request;
  const diagnostics = validateKpEquationLlmEntityClosure({
    request,
    availableEntityIds: ["source.x", "target.x", "target.function"]
  });

  assert.deepEqual(diagnostics.map((entry) => ({
    code: entry.code,
    entityId: entry.entityId,
    roleId: entry.roleId,
    bindingIndex: entry.bindingIndex
  })), [{
    code: "equation-llm.entity.unresolved",
    entityId: "target.open-parenthesis",
    roleId: "wrapper",
    bindingIndex: 1
  }, {
    code: "equation-llm.entity.unresolved",
    entityId: "target.close-parenthesis",
    roleId: "wrapper",
    bindingIndex: 2
  }]);
});
