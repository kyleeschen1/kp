import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpExtractHelperCausalContract,
  type KpExtractHelperCausalContractInput
} from "../src/domain-ir/extract-helper-causal-contract.ts";

test("two language callers compile to the same causal relation grammar", () => {
  const typescript = compileKpExtractHelperCausalContract(input("ts"));
  const python = compileKpExtractHelperCausalContract(input("py"));
  const expectedKinds = [
    "merge-contributors",
    "introduce-helper",
    "change-contributor-role",
    "change-contributor-role",
    "succeed-program"
  ];

  assert.deepEqual(typescript.relations.map(({ kind }) => kind), expectedKinds);
  assert.deepEqual(python.relations.map(({ kind }) => kind), expectedKinds);
  assert.deepEqual(
    typescript.relations.map(({ sourceRoleIds, targetRoleIds }) => [
      sourceRoleIds.length,
      targetRoleIds.length
    ]),
    [[2, 1], [0, 1], [1, 1], [1, 1], [1, 1]]
  );
  assert.equal(Object.isFrozen(typescript), true);
  assert.equal(Object.isFrozen(typescript.relations), true);
  assert.deepEqual(JSON.parse(JSON.stringify(typescript)), typescript);
});

test("contributors map one-for-one to role-changing call sites", () => {
  const contract = compileKpExtractHelperCausalContract(input("ts"));
  const changes = contract.relations.filter(
    ({ kind }) => kind === "change-contributor-role"
  );
  assert.deepEqual(changes.map((relation) => ({
    source: relation.sourceRoleIds[0],
    target: relation.targetRoleIds[0]
  })), contract.contributors.map((contributor) => ({
    source: contributor.sourceContributorRoleId,
    target: contributor.targetCallRoleId
  })));
  assert.deepEqual(
    contract.relations.at(-1),
    {
      id: "contract.code.ts.extract-helper.v1.succeed-program",
      kind: "succeed-program",
      sourceRoleIds: ["role.ts.program.before"],
      targetRoleIds: ["role.ts.program.after"]
    }
  );
});

test("causal compiler rejects insufficient or colliding roles", () => {
  const insufficient = input("ts");
  assert.throws(() => compileKpExtractHelperCausalContract({
    ...insufficient,
    contributors: insufficient.contributors.slice(0, 1)
  }), (error: unknown) => {
    assert.deepEqual(codes(error), [
      "extract-helper.contract.contributors-insufficient"
    ]);
    return true;
  });

  const collision = input("py");
  assert.throws(() => compileKpExtractHelperCausalContract({
    ...collision,
    targetProgramRoleId: collision.sourceProgramRoleId
  }), (error: unknown) => {
    assert.deepEqual(codes(error), [
      "extract-helper.contract.role-collision"
    ]);
    return true;
  });
});

test("causal contract imports no language syntax or presentation authority", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/extract-helper-causal-contract.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /^import\s/mu);
  assert.doesNotMatch(
    source,
    /readonly\s+(?:sourceRange|startOffset|endOffset|renderer|motion|durationMs|geometry|domNode|coordinates)\b/u
  );
  assert.doesNotMatch(source, /interface\s+.*(?:Ast|SyntaxNode|Token)/u);
});

function input(language: "ts" | "py"): KpExtractHelperCausalContractInput {
  return {
    contractId: `contract.code.${language}.extract-helper.v1`,
    sourceProgramRoleId: `role.${language}.program.before`,
    targetProgramRoleId: `role.${language}.program.after`,
    introducedHelper: {
      declarationRoleId: `role.${language}.helper.declaration`,
      bodyRoleId: `role.${language}.helper.body`
    },
    contributors: [{
      sourceContributorRoleId: `role.${language}.contributor.cost`,
      targetCallRoleId: `role.${language}.call.cost`
    }, {
      sourceContributorRoleId: `role.${language}.contributor.message`,
      targetCallRoleId: `role.${language}.call.message`
    }]
  };
}

function codes(error: unknown): readonly string[] {
  return typeof error === "object" && error !== null &&
    "diagnostics" in error && Array.isArray(error.diagnostics)
    ? error.diagnostics.map((diagnostic: any) => diagnostic.code)
    : [];
}
