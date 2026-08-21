import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonCodeGeneration } from
  "../scripts/python-code-generation-frontend.ts";
import { compileKpTypeScriptCodeGeneration } from
  "../scripts/typescript-code-generation-frontend.ts";
import {
  KpCodeExtractHelperRecipeError,
  promoteKpCodeExtractHelperCausalRecipe,
  type KpCodeExtractHelperRecipeCandidate
} from "../src/domain-ir/code-extract-helper-causal-recipe.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
  type KpCodeRefactorGenerationRequest,
  type KpCodeRefactorLanguage
} from "../src/domain-ir/code-refactor-generation-request.ts";
import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function request(
  language: KpCodeRefactorLanguage,
  before: { revisionId: string; path: string; source: string },
  after: { revisionId: string; path: string; source: string }
): KpCodeRefactorGenerationRequest {
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: `request.${language}.recipe-proof`,
    language,
    revisions: [
      {
        revisionId: before.revisionId,
        path: before.path,
        sourceText: before.source,
        role: "before"
      },
      {
        revisionId: after.revisionId,
        path: after.path,
        sourceText: after.source,
        role: "after"
      }
    ],
    intent: { kind: "extract-helper", preserve: ["behavior", "program-identity"] }
  };
}

function canonicalCandidates(): readonly [
  KpCodeExtractHelperRecipeCandidate,
  KpCodeExtractHelperRecipeCandidate
] {
  const tsContract = kpTypeScriptFreeShippingRefactorContract;
  const pyContract = kpPythonFreeShippingRefactorContract;
  const ts = compileKpTypeScriptCodeGeneration(request(
    "typescript", tsContract.before, tsContract.after
  ));
  const py = compileKpPythonCodeGeneration(request(
    "python", pyContract.before, pyContract.after
  ));
  assert.equal(ts.status, "accepted");
  assert.equal(py.status, "accepted");
  if (ts.status !== "accepted" || py.status !== "accepted") {
    throw new Error("canonical callers must be accepted");
  }
  return [
    {
      language: "typescript",
      causalContract: ts.semanticPlan.causalContract,
      evidenceRoleIds: ts.semanticPlan.roleEvidence.map(({ roleId }) => roleId)
    },
    {
      language: "python",
      causalContract: py.semanticPlan.causalContract,
      evidenceRoleIds: py.semanticPlan.roleEvidence.map(({ roleId }) => roleId)
    }
  ];
}

test("promotes only the causal laws proved by both language callers", () => {
  const recipe = promoteKpCodeExtractHelperCausalRecipe(canonicalCandidates());

  assert.equal(recipe.recipeId, "recipe.code.extract-helper.v1");
  assert.deepEqual(recipe.provedLanguages, ["typescript", "python"]);
  assert.equal(recipe.contributorCardinality.minimum, 2);
  assert.equal(recipe.relationLaws.changeContributorRole.multiplicity,
    "once-per-contributor");
  assert.equal(Object.isFrozen(recipe.relationLaws), true);
});

test("promoted recipe carries no caller syntax, identities, or presentation", () => {
  const serialized = JSON.stringify(
    promoteKpCodeExtractHelperCausalRecipe(canonicalCandidates())
  );
  assert.doesNotMatch(serialized,
    /syntaxRecordId|sourceText|role\.|\.ts|\.py|duration|geometry|keyframe|playhead/u);
});

test("promotion requires one independently proved caller per language", () => {
  const [typescript] = canonicalCandidates();
  assert.throws(
    () => promoteKpCodeExtractHelperCausalRecipe([typescript]),
    (error) => error instanceof KpCodeExtractHelperRecipeError &&
      error.diagnostics[0]?.code === "code-recipe.caller-set-invalid"
  );
});

test("promotion rejects incomplete evidence and malformed causal shape", () => {
  const [typescript, python] = canonicalCandidates();
  const incomplete = {
    ...python,
    evidenceRoleIds: python.evidenceRoleIds.slice(1)
  };
  assert.throws(
    () => promoteKpCodeExtractHelperCausalRecipe([typescript, incomplete]),
    (error) => error instanceof KpCodeExtractHelperRecipeError &&
      error.diagnostics.some(({ code }) => code === "code-recipe.evidence-incomplete")
  );

  const malformed = {
    ...python,
    causalContract: {
      ...python.causalContract,
      relations: python.causalContract.relations.slice(0, -1)
    }
  };
  assert.throws(
    () => promoteKpCodeExtractHelperCausalRecipe([typescript, malformed]),
    (error) => error instanceof KpCodeExtractHelperRecipeError &&
      error.diagnostics.some(({ code }) =>
        code === "code-recipe.relation-shape-invalid"
      )
  );
});
