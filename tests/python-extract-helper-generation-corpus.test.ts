import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPythonCodeGeneration
} from "../scripts/python-code-generation-frontend.ts";
import {
  compileKpPythonFrontend
} from "../scripts/python-refactor-frontend.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
  type KpCodeRefactorGenerationRequest
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpPythonExtractHelperGenerationCorpus
} from "./fixtures/python-extract-helper-generation-corpus.ts";

function request(
  fixture: (typeof kpPythonExtractHelperGenerationCorpus)[number]
): KpCodeRefactorGenerationRequest {
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: `request.python.${fixture.id}`,
    language: "python",
    revisions: [
      {
        revisionId: `revision.${fixture.id}.before`,
        role: "before",
        path: `${fixture.id}-before.py`,
        sourceText: fixture.before
      },
      {
        revisionId: `revision.${fixture.id}.after`,
        role: "after",
        path: `${fixture.id}-after.py`,
        sourceText: fixture.after
      }
    ],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}

test("the bounded Python corpus has one case for every approved category", () => {
  assert.deepEqual(
    kpPythonExtractHelperGenerationCorpus.map(({ category }) => category),
    [
      "renames",
      "threshold-variant",
      "annotations",
      "indentation",
      "nested-expression",
      "parse-failure",
      "unequal-predicates",
      "unsafe-capture"
    ]
  );
});

for (const fixture of kpPythonExtractHelperGenerationCorpus) {
  test(`${fixture.id} has the exact deterministic outcome`, () => {
    const first = compileKpPythonCodeGeneration(request(fixture));
    const second = compileKpPythonCodeGeneration(request(fixture));
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

test("the indentation fixture retains exact source and token columns", () => {
  const fixture = kpPythonExtractHelperGenerationCorpus.find(({ category }) =>
    category === "indentation"
  );
  assert.ok(fixture);
  const frontend = compileKpPythonFrontend({
    path: "indentation.py",
    revisionId: "revision.indentation.v1",
    sourceText: fixture.before
  });
  assert.equal(frontend.sourceText, fixture.before);
  assert.ok(frontend.tokens.some(({ kindName, text, start }) =>
    kindName === "INDENT" && text === "  " && start.column === 1
  ));
});
