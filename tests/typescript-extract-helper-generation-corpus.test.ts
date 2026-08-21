import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptCodeGeneration
} from "../scripts/typescript-code-generation-frontend.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
  type KpCodeRefactorGenerationRequest
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpTypeScriptExtractHelperGenerationCorpus
} from "./fixtures/typescript-extract-helper-generation-corpus.ts";

function request(
  fixture: (typeof kpTypeScriptExtractHelperGenerationCorpus)[number]
): KpCodeRefactorGenerationRequest {
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: `request.typescript.${fixture.id}`,
    language: "typescript",
    revisions: [
      {
        revisionId: `revision.${fixture.id}.before`,
        role: "before",
        path: `${fixture.id}-before.ts`,
        sourceText: fixture.before
      },
      {
        revisionId: `revision.${fixture.id}.after`,
        role: "after",
        path: `${fixture.id}-after.ts`,
        sourceText: fixture.after
      }
    ],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}

test("the bounded TypeScript corpus has one case for every approved category", () => {
  assert.deepEqual(
    kpTypeScriptExtractHelperGenerationCorpus.map(({ category }) => category),
    [
      "renames",
      "threshold-variant",
      "explicit-types",
      "nested-expression",
      "parse-failure",
      "unequal-predicates",
      "unsafe-capture"
    ]
  );
});

for (const fixture of kpTypeScriptExtractHelperGenerationCorpus) {
  test(`${fixture.id} has the exact deterministic outcome`, () => {
    const first = compileKpTypeScriptCodeGeneration(request(fixture));
    const second = compileKpTypeScriptCodeGeneration(request(fixture));
    assert.deepEqual(second, first);
    assert.equal(first.status, fixture.expected.status);
    if (
      fixture.expected.status === "repair-required" &&
      first.status === "repair-required"
    ) assert.equal(first.diagnostics[0]?.code, fixture.expected.code);
    if (first.status === "accepted") {
      assert.deepEqual(
        first.semanticPlan.causalContract.relations.map(({ kind }) => kind),
        [
          "merge-contributors",
          "introduce-helper",
          "change-contributor-role",
          "change-contributor-role",
          "succeed-program"
        ]
      );
    }
  });
}
