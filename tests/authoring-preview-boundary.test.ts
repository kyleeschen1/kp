import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("all four revision editors delegate temporary DOM to the shared preview owner", () => {
  for (const family of ["bayesian-reasoning", "composed-algebra-intuition", "composed-algebra", "common-factor"]) {
    const path = `src/experiments/${family}/entry.ts`;
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    let importsOwner = false, checkedCallbacks = 0;
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === "../../authoring/staged-preview.ts") importsOwner = true;
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "prepare") {
        checkedCallbacks++;
        const calls: string[] = [];
        const inspect = (child: ts.Node) => {
          if (ts.isCallExpression(child)) calls.push(child.expression.getText(source));
          ts.forEachChild(child, inspect);
        };
        inspect(node.initializer);
        assert.ok(calls.includes("preparePreview"), `${family} must use the preview owner`);
        assert.ok(!calls.some(call => call.endsWith(".createElement")), `${family} must not duplicate staging setup`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    assert.ok(importsOwner, path);
    assert.equal(checkedCallbacks, 1, path);
  }
});
