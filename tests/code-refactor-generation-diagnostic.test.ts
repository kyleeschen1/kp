import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCodeRefactorGenerationDiagnostic,
  listKpCodeRefactorGenerationDiagnosticDefinitions,
  repairKpCodeRefactorGeneration
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";

const expectedDefinitions = Object.freeze([
  ["code-refactor.parse-rejected", "parse", "fix-syntax"],
  [
    "code-refactor.unsupported-operation",
    "recognize",
    "choose-supported-operation"
  ],
  [
    "code-refactor.non-equivalent-duplicates",
    "legality",
    "make-duplicates-equivalent"
  ],
  [
    "code-refactor.unsafe-capture",
    "legality",
    "move-or-rename-binding"
  ],
  [
    "code-refactor.ambiguous-ownership",
    "bind",
    "disambiguate-owner"
  ],
  [
    "code-refactor.unsupported-source-shape",
    "recognize",
    "simplify-source-shape"
  ]
] as const);

test("semantic repair vocabulary is closed exhaustive and data-driven", () => {
  const definitions = listKpCodeRefactorGenerationDiagnosticDefinitions();
  assert.deepEqual(
    definitions.map(({ code, phase, repairKind }) => [
      code,
      phase,
      repairKind
    ]),
    expectedDefinitions
  );
  assert.ok(definitions.every(({ meaning }) => meaning.length > 0));
  assert.equal(Object.isFrozen(definitions), true);
  assert.doesNotMatch(
    definitions.map(({ code }) => code).join(" "),
    /(?:unknown|other|fallback|generic)/u
  );
});

test("each code mints its canonical phase and repair action", () => {
  for (const [index, [code, phase, repairKind]] of
    expectedDefinitions.entries()) {
    const diagnostic = createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: `diagnostic.code.fixture-${index}.v1`,
      code,
      language: "typescript",
      message: `Fixture for ${code}.`,
      revisionIds: ["free-shipping.before.v1"],
      roleIds: index === 0 ? [] : ["role.duplicate-contributor.1"],
      repairSummary: `Apply ${repairKind}.`
    });
    assert.equal(diagnostic.phase, phase);
    assert.equal(diagnostic.repair.kind, repairKind);
    assert.equal(diagnostic.severity, "error");
    assert.equal(Object.isFrozen(diagnostic), true);
    assert.equal(Object.isFrozen(diagnostic.evidence.revisionIds), true);
    assert.deepEqual(JSON.parse(JSON.stringify(diagnostic)), diagnostic);
  }
});

test("repair results reject empty duplicate or cross-language diagnostics", () => {
  const diagnostic = createKpCodeRefactorGenerationDiagnostic({
    diagnosticId: "diagnostic.code.parse.before.v1",
    code: "code-refactor.parse-rejected",
    language: "python",
    message: "The before revision does not parse.",
    revisionIds: ["free-shipping.before.v1"],
    repairSummary: "Fix the reported Python syntax error."
  });
  const result = repairKpCodeRefactorGeneration({
    requestId: "request.code.python.extract-helper.v1",
    language: "python",
    diagnostics: [diagnostic]
  });
  assert.equal(result.status, "repair-required");
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);

  assert.throws(() => repairKpCodeRefactorGeneration({
    language: "python",
    diagnostics: []
  }), /at least one diagnostic/u);
  assert.throws(() => repairKpCodeRefactorGeneration({
    language: "python",
    diagnostics: [diagnostic, diagnostic]
  }), /duplicate diagnostic IDs/u);
  assert.throws(() => repairKpCodeRefactorGeneration({
    language: "typescript",
    diagnostics: [diagnostic]
  }), /match the result language/u);
});

test("evidence IDs are stable unique semantic references, never offsets", () => {
  assert.throws(() => createKpCodeRefactorGenerationDiagnostic({
    diagnosticId: "diagnostic.code.capture.v1",
    code: "code-refactor.unsafe-capture",
    language: "typescript",
    message: "The helper would capture a local binding.",
    revisionIds: ["free-shipping.after.v1"],
    roleIds: ["role.binding.total", "role.binding.total"],
    repairSummary: "Move the helper or make the binding explicit."
  }), /must be unique/u);
});

