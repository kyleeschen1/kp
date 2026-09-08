import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const boundaries = [
  { consumer: "src/animation/equation-linear-rearrangement-kind.ts", owner: "src/domain-ir/equation-operation-plan-recipe-types.ts", legacy: "src/domain-ir/equation-surface-family-declarations.ts", name: "KpEquationOperationPlanRecipeId" },
  { consumer: "src/rendering/native-katex-successor-synthesis.ts", owner: "src/rendering/exact-fraction-successor-binding-types.ts", legacy: "src/rendering/exact-fraction-quantity-symbolic-projection.ts", name: "KpExactOpaqueSuccessorSynthesisBinding" },
  { consumer: "src/animation/successor-synthesis.ts", owner: "src/animation/material-junction-types.ts", legacy: "src/animation/material-junction.ts", name: "KpMaterialJunctionRect" },
  { consumer: "src/rendering/native-katex-operation-choreography.ts", owner: "src/rendering/native-katex-factoring-binding-types.ts", legacy: "src/rendering/native-katex-factoring-choreography.ts", name: "KpNativeKatexFactoringSceneBinding" },
  { consumer: "src/rendering/katex-artifact-solid-mask-morph.ts", owner: "src/animation/easing.ts", legacy: "src/rendering/equation-motion-plan.ts", name: "EasingName" }
];
function source(path: string) {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
}
function references(path: string) {
  return source(path).statements.flatMap(statement => {
    if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) ||
        !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) return [];
    const names = ts.isImportDeclaration(statement) ? statement.importClause?.namedBindings : statement.exportClause;
    return [{ target: resolve(path, "..", statement.moduleSpecifier.text),
      typeOnly: ts.isImportDeclaration(statement) ? statement.importClause?.isTypeOnly : statement.isTypeOnly,
      names: names && (ts.isNamedImports(names) || ts.isNamedExports(names)) ? names.elements.map(element => element.name.text) : [] }];
  });
}

test("shared compiler consumers use data owners while legacy type exports remain compatible", () => {
  for (const boundary of boundaries) {
    const refs = references(boundary.consumer);
    assert.ok(refs.some(ref => ref.target === resolve(boundary.owner) && ref.typeOnly && ref.names.includes(boundary.name)), boundary.consumer);
    assert.ok(!refs.some(ref => ref.target === resolve(boundary.legacy)), `Implementation import returned: ${boundary.consumer}`);
    assert.ok(references(boundary.legacy).some(ref => ref.target === resolve(boundary.owner) && ref.typeOnly && ref.names.includes(boundary.name)), `Legacy export disappeared: ${boundary.name}`);
  }
});

test("new contract modules emit no runtime code or minting authority", () => {
  for (const boundary of boundaries.slice(0, 4)) {
    const text = readFileSync(boundary.owner, "utf8");
    const output = ts.transpileModule(text, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true
    } }).outputText.trim();
    assert.equal(output, "export {};", boundary.owner);
  }
});
