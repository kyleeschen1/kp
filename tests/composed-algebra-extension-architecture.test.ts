import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function kindDispatch(source: string): number {
  const root = ts.createSourceFile("boundary.ts", source, ts.ScriptTarget.Latest, true);
  let count = 0;
  const containsKind = (node: ts.Node): boolean => {
    if (ts.isPropertyAccessExpression(node) && node.name.text === "kind") return true;
    if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && node.argumentExpression.text === "kind") return true;
    return ts.forEachChild(node, containsKind) ?? false;
  };
  const visit = (node: ts.Node): void => {
    const expression = ts.isIfStatement(node) || ts.isSwitchStatement(node) ? node.expression
      : ts.isConditionalExpression(node) ? node.condition : undefined;
    if (expression && containsKind(expression)) count++;
    ts.forEachChild(node, visit);
  };
  visit(root);
  return count;
}
const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("scalar projection and composed task cannot grow local kind dispatch or semantic assembly", () => {
  for (const path of ["semantic/structured-scalar-latex.ts", "semantic/composed-algebra-asset.ts"])
    assert.equal(kindDispatch(source(path)), 0, path);
  const composition = source("semantic/composed-algebra-asset.ts");
  assert.doesNotMatch(composition, /correspondenceMap|sourceSelectorIds|targetSelectorIds|createKpSemanticTransformation|scalarLatex|transformType/);
  assert.match(composition, /defineKpSemanticOperationProjector/);
  assert.match(composition, /composeKpSemanticOperationProjections/);
  assert.match(source("semantic/structured-scalar-latex.ts"), /defineKpExpressionProjection/);
  assert.match(source("authoring/common-factor-presentation.ts"), /projectKpStructuredScalarLatex/);
});

test("canonical and composed factoring share their correspondence owner", () => {
  for (const path of ["semantic/generated-algebra-tutorial-fixture.ts", "semantic/integer-multiple-factoring-projection.ts"])
    assert.match(source(path), /createKpFactoringCorrespondenceMap/);
  const owner = source("semantic/integer-multiple-factoring-projection.ts");
  assert.match(owner, /createGeneratedAlgebraSemanticTransformation/);
  assert.doesNotMatch(owner, /relation\s*:/);
  assert.doesNotMatch(source("semantic/semantic-operation-projection.ts"), /verified-composed-factoring|verified-composed-evaluation|factorCommonTerm|simplifyConstantSum/);
});

test("extension architecture guard detects dispatch under aliases and ignores comments", () => {
  assert.equal(kindDispatch('if (x.kind === "sum") return 1; else if (x["kind"] === "product") return 2;'), 2);
  assert.equal(kindDispatch('switch (proof.kind) { case "factor": break; }'), 1);
  assert.equal(kindDispatch('const p = x.kind === "sum" ? a : b;'), 1);
  assert.equal(kindDispatch('// if (x.kind === "sum")\nif (!authenticated(x)) throw Error();'), 0);
});
