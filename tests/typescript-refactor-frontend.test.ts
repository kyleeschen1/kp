import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptFrontend
} from "../scripts/typescript-refactor-frontend.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

test("the build-time frontend emits deterministic serializable syntax", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const first = compileKpTypeScriptFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });
  const second = compileKpTypeScriptFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });

  assert.equal(first.status, "accepted");
  assert.deepEqual(first.diagnostics, []);
  assert.deepEqual(second, first);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
  assert.equal(first.syntax[0]?.kindName, "SourceFile");
  assert.equal(first.syntax[0]?.text, contract.before.source);
  assert.equal(
    first.syntax.filter(({ kindName }) => kindName === "FunctionDeclaration")
      .length,
    2
  );
  assert.equal(
    first.syntax.filter(({ text }) => text === "total >= 50").length,
    2
  );
});

test("the frontend preserves exact positions and parent closure", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const result = compileKpTypeScriptFrontend({
    path: contract.after.path,
    revisionId: contract.after.revisionId,
    sourceText: contract.after.source
  });
  const ids = new Set(result.syntax.map(({ id }) => id));
  const helper = result.syntax.find(({ text, kindName }) =>
    kindName === "FunctionDeclaration" &&
    text.startsWith("function qualifiesForFreeShipping")
  );
  const helperRule = result.syntax.find(({ text }) => text === "total >= 50");

  assert.ok(helper);
  assert.deepEqual(helper.start, { line: 1, column: 1 });
  assert.deepEqual(helper.end, { line: 3, column: 2 });
  assert.ok(helperRule);
  assert.equal(helperRule.text, contract.after.source.slice(
    helperRule.startOffset,
    helperRule.endOffset
  ));
  for (const record of result.syntax) {
    if (record.parentId !== undefined) {
      assert.equal(ids.has(record.parentId), true, record.id);
    }
  }
});

test("malformed and ill-typed source returns typed diagnostics", () => {
  const malformed = compileKpTypeScriptFrontend({
    path: "malformed.ts",
    revisionId: "malformed.v1",
    sourceText: "export function broken(total: number): string { return total + ; }"
  });
  const illTyped = compileKpTypeScriptFrontend({
    path: "ill-typed.ts",
    revisionId: "ill-typed.v1",
    sourceText: "export function broken(total: number): string { return total; }"
  });

  assert.equal(malformed.status, "rejected");
  assert.ok(malformed.diagnostics.some(({ category }) => category === "error"));
  assert.equal(illTyped.status, "rejected");
  assert.ok(illTyped.diagnostics.some(({ code }) => code === 2322));
});

test("the parser lives outside production source and exposes no execution hook", () => {
  const source = compileKpTypeScriptFrontend.toString();
  assert.doesNotMatch(source, /\beval\b|new Function|transpileModule/);
  assert.throws(
    () => compileKpTypeScriptFrontend({
      path: " ",
      revisionId: "fixture.v1",
      sourceText: "const value = 1;"
    }),
    /source path must not be empty/
  );
});
