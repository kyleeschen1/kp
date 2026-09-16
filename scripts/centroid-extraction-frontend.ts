import ts from "typescript";
import { compileKpTypeScriptFrontend } from "./typescript-refactor-frontend.ts";
import { createKpCodeRefactorGenerationDiagnostic, repairKpCodeRefactorGeneration } from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type { KpCentroidExtractionArtifact, KpCentroidExtractionState } from "../src/semantic/centroid-extraction-model.ts";
import { tokenizeKpTypeScriptSource } from "../src/semantic/typescript-source-tokens.ts";
import { sha256 } from "../src/kernel/sha256.ts";
import { compileKpExtractHelperCausalContract } from "../src/domain-ir/extract-helper-causal-contract.ts";

function requireShape(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function parse(source: string) { return ts.createSourceFile("centroid.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS); }
function name(node: ts.Node | undefined): string {
  requireShape(node && ts.isIdentifier(node), "Expected a simple local binding");
  return node.text;
}
function declaration(node: ts.Node | undefined, flag: ts.NodeFlags) {
  requireShape(node && ts.isVariableStatement(node) && node.declarationList.flags === flag && node.declarationList.declarations.length === 1, "Expected one plain variable declaration");
  return node.declarationList.declarations[0]!;
}
function fn(node: ts.Node | undefined) {
  requireShape(node && ts.isFunctionDeclaration(node) && node.body && node.name && !node.asteriskToken && !node.typeParameters && !node.modifiers?.some(m => m.kind !== ts.SyntaxKind.ExportKeyword), "Expected a plain named function");
  return node as ts.FunctionDeclaration & { body: ts.Block; name: ts.Identifier };
}
function parameters(node: ts.FunctionDeclaration): string[] {
  return node.parameters.map(parameter => {
    requireShape(!parameter.initializer && !parameter.dotDotDotToken && !parameter.questionToken && parameter.type && ts.isArrayTypeNode(parameter.type) && parameter.type.elementType.kind === ts.SyntaxKind.NumberKeyword, "Expected required number-array parameters");
    return name(parameter.name);
  });
}
function calculation(nodes: readonly ts.Statement[], returned: boolean) {
  requireShape(nodes.length === 3, "Calculation must contain only initialize, accumulate and divide");
  const sum = declaration(nodes[0], ts.NodeFlags.Let);
  requireShape(sum.initializer && ts.isNumericLiteral(sum.initializer) && sum.initializer.text === "0", "Accumulator must begin at zero");
  const loop = nodes[1];
  requireShape(loop && ts.isForOfStatement(loop) && !loop.awaitModifier && ts.isVariableDeclarationList(loop.initializer) && loop.initializer.flags === ts.NodeFlags.Const && loop.initializer.declarations.length === 1 && ts.isBlock(loop.statement) && loop.statement.statements.length === 1, "Expected one synchronous local for-of accumulation");
  const local = loop.initializer.declarations[0]!;
  requireShape(!local.initializer, "Iteration binding cannot have an initializer");
  const expression = loop.statement.statements[0]!;
  requireShape(ts.isExpressionStatement(expression) && ts.isBinaryExpression(expression.expression), "Expected one accumulation statement");
  const addition = expression.expression;
  requireShape(addition.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken && name(addition.left) === name(sum.name) && name(addition.right) === name(local.name), "Loop must add the current item to its own local sum");
  const last = nodes[2]!;
  const division = returned ? (ts.isReturnStatement(last) ? last.expression : undefined) : declaration(last, ts.NodeFlags.Const).initializer;
  requireShape(division && ts.isBinaryExpression(division) && division.operatorToken.kind === ts.SyntaxKind.SlashToken && name(division.left) === name(sum.name) && ts.isPropertyAccessExpression(division.right) && division.right.name.text === "length" && name(division.right.expression) === name(loop.expression), "Result must divide this sum by this array length");
  const names = [name(loop.expression), name(sum.name), name(local.name)];
  requireShape(new Set(names).size === names.length, "Input and per-call locals must be distinct");
  return { nodes, division, names, output: returned ? undefined : name(declaration(last, ts.NodeFlags.Const).name) };
}
function tupleReturn(node: ts.Node | undefined, names: readonly string[]) {
  requireShape(node && ts.isReturnStatement(node) && node.expression && ts.isArrayLiteralExpression(node.expression) && node.expression.elements.map(name).join() === names.join(), "Return must preserve coordinate order");
}
function snippet(nodes: readonly ts.Statement[]) {
  return nodes.map(node => node.getText().replaceAll("\n  ", "\n")).join("\n");
}
function snapshot(id: KpCentroidExtractionState["id"], source: string) {
  return { id, source, tokens: tokenizeKpTypeScriptSource(source).map((token, index) => ({ ...token, id: `centroid.${id}.${index}`, entityId: `centroid.${id}.syntax` })) };
}
type Snapshot = ReturnType<typeof snapshot>;
function tokensIn(state: Snapshot, node: ts.Node) {
  return state.tokens.filter(token => token.startOffset >= node.getStart() && token.endOffset <= node.getEnd());
}
function correspond(from: Snapshot, source: ts.Node, to: Snapshot, target: ts.Node, entityId: string) {
  const a = tokensIn(from, source), b = tokensIn(to, target);
  requireShape(a.length === b.length, "Semantic region token topology changed");
  a.forEach((token, index) => {
    const next = b[index]!;
    // Ordinal correspondence is legal only inside the structurally checked
    // operation region; lexical equality never discovers a relationship.
    requireShape(token.kind === next.kind, "Corresponding syntax roles differ");
    token.entityId = entityId; next.id = token.id; next.entityId = entityId;
  });
}

export function compileCentroidExtraction(before: string, after: string) {
  const revisionIds = ["centroid.before", "centroid.after"];
  const frontends = [before, after].map((sourceText, index) => compileKpTypeScriptFrontend({ path: `centroid-${index}.ts`, revisionId: revisionIds[index]!, sourceText }));
  const repair = (message: string, parseRejected = false) => repairKpCodeRefactorGeneration({ language: "typescript", diagnostics: [createKpCodeRefactorGenerationDiagnostic({
    diagnosticId: "diagnostic.centroid.extraction", code: parseRejected ? "code-refactor.parse-rejected" : "code-refactor.unsupported-source-shape", language: "typescript", revisionIds, message,
    repairSummary: "Restore the bounded initialize/for-of-add/divide extraction with independent locals, or extend its language-owned checker before animating."
  })] });
  if (frontends.some(result => result.status !== "accepted")) return repair("TypeScript rejected a centroid revision", true);
  try {
    const source = parse(before), target = parse(after);
    requireShape(source.statements.length === 1 && target.statements.length === 2, "Unexpected top-level effect or declaration");
    const old = fn(source.statements[0]), helper = fn(target.statements[0]), caller = fn(target.statements[1]);
    const inputs = parameters(old), helperInputs = parameters(helper);
    requireShape(inputs.length === 2 && parameters(caller).join() === inputs.join() && helperInputs.length === 1 && old.name.text === caller.name.text && helper.name.text !== caller.name.text, "Function inputs or identity changed");
    requireShape(old.body.statements.length === 7 && caller.body.statements.length === 3, "Unexpected statements outside the extraction");
    const x = calculation(old.body.statements.slice(0, 3), false), y = calculation(old.body.statements.slice(3, 6), false), h = calculation([...helper.body.statements], true);
    requireShape(x.names[0] === inputs[0] && y.names[0] === inputs[1] && h.names[0] === helperInputs[0], "Calculation input does not resolve to its parameter");
    requireShape(new Set([...x.names, ...y.names, x.output!, y.output!]).size === 8 && !h.names.includes(helper.name.text), "Extraction would collide with a binding");
    tupleReturn(old.body.statements[6], [x.output!, y.output!]);
    tupleReturn(caller.body.statements[2], [x.output!, y.output!]);
    [x, y].forEach((calculation, index) => {
      const call = declaration(caller.body.statements[index], ts.NodeFlags.Const);
      requireShape(name(call.name) === calculation.output && call.initializer && ts.isCallExpression(call.initializer) && name(call.initializer.expression) === helper.name.text && call.initializer.arguments.length === 1 && name(call.initializer.arguments[0]) === calculation.names[0], "Replacement must return this helper applied to the same coordinate array");
    });
    const generic = helper.getText().replace(/^export\s+/, "");
    // Scope is already checked: all helper identifiers belong to this one
    // parameter/local group. Edit AST-owned identifiers, not string substrings.
    const edits: { start: number; end: number; value: string }[] = [];
    const genericFile = parse(generic);
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        const index = h.names.indexOf(node.text);
        const propertyName = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
        if (index >= 0 && !propertyName) edits.push({ start: node.getStart(), end: node.getEnd(), value: x.names[index]! });
      }
      node.forEachChild(visit);
    };
    visit(genericFile);
    let named = generic;
    for (const edit of edits.sort((a, b) => b.start - a.start)) named = named.slice(0, edit.start) + edit.value + named.slice(edit.end);
    const call = caller.body.statements[0]!.getText();
    const initial = snapshot("original", snippet(x.nodes));
    const extracted = snapshot("extracted", `${named}\n\n${call}`);
    const generalized = snapshot("generalized", `${generic}\n\n${call}`);
    const initialAst = parse(initial.source), extractedAst = parse(extracted.source), generalizedAst = parse(generalized.source);
    const targetBody = fn(extractedAst.statements[0]).body;
    correspond(initial, initialAst.statements[0]!, extracted, targetBody.statements[0]!, "centroid.local.sum");
    correspond(initial, initialAst.statements[1]!, extracted, targetBody.statements[1]!, "centroid.local.iteration");
    const sourceAssignment = declaration(initialAst.statements[2], ts.NodeFlags.Const);
    const returnNode = targetBody.statements[2]!;
    requireShape(ts.isReturnStatement(returnNode) && returnNode.expression, "Missing helper result");
    correspond(initial, sourceAssignment.initializer!, extracted, returnNode.expression, "centroid.result.expression");
    const prefix = tokensIn(initial, initialAst.statements[2]!).filter(token => token.endOffset <= sourceAssignment.initializer!.getStart() || token.startOffset >= sourceAssignment.initializer!.getEnd());
    const callDecl = declaration(extractedAst.statements[1], ts.NodeFlags.Const);
    const callPrefix = tokensIn(extracted, extractedAst.statements[1]!).filter(token => token.endOffset <= callDecl.initializer!.getStart() || token.startOffset >= callDecl.initializer!.getEnd());
    requireShape(prefix.length === callPrefix.length, "Caller binding shape changed");
    prefix.forEach((token, index) => { token.entityId = "centroid.caller.result"; callPrefix[index]!.id = token.id; callPrefix[index]!.entityId = token.entityId; });
    correspond(extracted, extractedAst, generalized, generalizedAst, "centroid.parameterized.procedure");
    // Preserve the finer roles carried by the extraction rather than flattening
    // the whole procedure into one instructional target during renaming.
    extracted.tokens.forEach((token, index) => {
      const original = initial.tokens.find(value => value.id === token.id);
      if (original) token.entityId = original.entityId;
      generalized.tokens[index]!.entityId = token.entityId;
    });
    requireShape(initial.tokens.every(token => extracted.tokens.some(next => next.id === token.id)), "A source token lost its declared successor");
    const artifact: KpCentroidExtractionArtifact = {
      schemaVersion: "kp.centroid-extraction.v1", sourcePin: sha256(JSON.stringify([before, after])),
      causalContract: compileKpExtractHelperCausalContract({
        contractId: "contract.centroid.extract-helper", sourceProgramRoleId: "role.centroid.before", targetProgramRoleId: "role.centroid.after",
        introducedHelper: { declarationRoleId: "role.centroid.helper", bodyRoleId: "role.centroid.helper.body" },
        contributors: [
          { sourceContributorRoleId: "role.centroid.x.calculation", targetCallRoleId: "role.centroid.x.call" },
          { sourceContributorRoleId: "role.centroid.y.calculation", targetCallRoleId: "role.centroid.y.call" }
        ]
      }),
      evidence: { sourceRevisionId: revisionIds[0]!, targetRevisionId: revisionIds[1]!, syntaxRecordIds: frontends.flatMap(result => result.syntax.filter(node => ["FunctionDeclaration", "ForOfStatement", "ReturnStatement", "VariableStatement"].includes(node.kindName)).map(node => `${result.revisionId}:${node.id}`)), assumptions: ["Ordinary finite nonempty number arrays, not proxies or custom iterators", "Synchronous code; independent call-local accumulators", "Same floating-point operation order, not exact-real arithmetic"] },
      states: [initial, extracted, generalized]
    };
    return { status: "accepted" as const, artifact };
  } catch (error) { return repair(error instanceof Error ? error.message : String(error)); }
}
