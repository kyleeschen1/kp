import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonFrontend } from "../scripts/python-refactor-frontend.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

test("Python stdlib frontend accepts both frozen revisions without execution", () => {
  for (const revision of [
    kpPythonFreeShippingRefactorContract.before,
    kpPythonFreeShippingRefactorContract.after
  ]) {
    const result = compileKpPythonFrontend({
      path: revision.path,
      revisionId: revision.revisionId,
      sourceText: `${revision.source}\nassert False, "the frontend must never execute source"`
    });

    assert.equal(result.status, "accepted");
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.syntax[0]?.kindName, "Module");
    assert.ok(result.syntax.some(({ kindName }) => kindName === "FunctionDef"));
    assert.ok(result.syntax.some(({ kindName }) => kindName === "Compare"));
    assert.ok(result.tokens.some(({ kindName, text }) =>
      kindName === "NAME" && text === "total"
    ));
    const shippingCost = result.syntax.find(({ kindName, facts }) =>
      kindName === "FunctionDef" && facts?.declaredName === "shipping_cost"
    );
    assert.deepEqual(shippingCost?.facts, {
      declaredName: "shipping_cost",
      parameterNames: ["total"],
      parameterAnnotations: [{ name: "total", annotation: "int" }],
      returnAnnotation: "int",
      hasVariadicParameters: false
    });
    const comparison = result.syntax.find(({ kindName }) => kindName === "Compare");
    assert.deepEqual(comparison?.facts?.referencedNames, ["total"]);
    const call = result.syntax.find(({ kindName }) => kindName === "Call");
    if (revision.revisionId === "free-shipping.after.v1") {
      assert.equal(call?.facts?.calledName, "qualifies_for_free_shipping");
      assert.deepEqual(call?.facts?.argumentTexts, ["total"]);
      assert.equal(call?.facts?.hasKeywordArguments, false);
    }
    for (const record of [...result.syntax, ...result.tokens]) {
      assert.equal(
        result.sourceText.slice(record.startOffset, record.endOffset),
        record.text,
        record.id
      );
    }
  }
});

test("Python frontend returns deterministic plain data with stable parent ids", () => {
  const input = {
    path: kpPythonFreeShippingRefactorContract.after.path,
    revisionId: kpPythonFreeShippingRefactorContract.after.revisionId,
    sourceText: kpPythonFreeShippingRefactorContract.after.source
  } as const;
  const first = compileKpPythonFrontend(input);
  const second = compileKpPythonFrontend(input);
  const ids = new Set(first.syntax.map(({ id }) => id));

  assert.deepEqual(second, first);
  assert.ok(first.syntax.every(({ parentId }) =>
    parentId === undefined || ids.has(parentId)
  ));
  assert.equal(JSON.parse(JSON.stringify(first)).schemaVersion, "kp.python-frontend.v1");
});

test("Python frontend uses JavaScript-compatible UTF-16 offsets", () => {
  const source = `def café() -> str:\n    return "🚚"`;
  const result = compileKpPythonFrontend({
    path: "unicode.py",
    revisionId: "unicode.v1",
    sourceText: source
  });
  const string = result.syntax.find(({ kindName }) => kindName === "Constant");

  assert.equal(result.status, "accepted");
  assert.ok(string);
  assert.equal(source.slice(string.startOffset, string.endOffset), '"🚚"');
  assert.equal(string.start.column, 12);
});

test("Python frontend rejects malformed source with bounded diagnostics", () => {
  const result = compileKpPythonFrontend({
    path: "broken.py",
    revisionId: "broken.v1",
    sourceText: "def broken(:\n    pass"
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.syntax.length, 0);
  assert.ok(result.diagnostics.some(({ code }) => code === "SyntaxError"));
  assert.ok(result.diagnostics.every(({ category }) => category === "error"));
});

test("Python frontend rejects empty authority inputs before spawning", () => {
  assert.throws(() => compileKpPythonFrontend({
    path: " ",
    revisionId: "empty.v1",
    sourceText: "pass"
  }), /source path must not be empty/);
});
