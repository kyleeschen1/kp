import { readFileSync } from "node:fs";
import ts from "typescript";

const sourcePath = "src/experiments/typed-linear-supply-demand/semantic-state-composed-market.ts";
const baselinePath = "tests/fixtures/authoring-integration/composed-market-baseline.ts.txt";
const sharedPaths = [
  "src/semantic-state/authoring-model-assembly.ts",
  "src/semantic-state/authoring-explanation-assembly.ts",
  "src/semantic-state/authoring-query-session.ts",
  "src/semantic-state/authoring-diagnostics.ts"
];
const lines = (text: string) => text.split("\n").filter(line => line.trim()).length;

export function measureKpAuthoringIntegrationCost() {
  const source = readFileSync(sourcePath, "utf8");
  const baseline = readFileSync(baselinePath, "utf8");
  const region = (text: string) => text.split("// composed-market-packet:start\n")[1]!
    .split("// composed-market-packet:end")[0]!;
  const ast = ts.createSourceFile("market.ts", region(source), ts.ScriptTarget.Latest, true);
  let setupOrchestrationLines = 0;
  const bindingCosts = ast.statements.map(statement => {
    if (!ts.isVariableStatement(statement)) throw new Error("Unclassified authored statement.");
    const name = statement.declarationList.declarations[0]!.name.getText(ast);
    const total = lines(statement.getText(ast));
    let orchestration = 0;
    if (name === "stateHandles" || name === "explanation") orchestration = total;
    else if (name === "model") {
      let declaredDerivationLines = 0;
      const visit = (node: ts.Node): void => {
        if (ts.isVariableStatement(node)) {
          const declared = node.declarationList.declarations[0]!.name.getText(ast);
          if (["evaluation", "equilibrium", "accounting"].includes(declared)) {
            declaredDerivationLines += lines(node.getText(ast));
            return;
          }
        }
        ts.forEachChild(node, visit);
      };
      ts.forEachChild(statement, visit);
      orchestration = total - declaredDerivationLines;
    } else if (!["schema", "demandTransition", "taxTransition", "demandFamily",
      "taxFamily", "demandApplication", "taxApplication", "demandMember", "taxMember", "root"].includes(name)) {
      throw new Error(`Unclassified author binding ${name}.`);
    }
    setupOrchestrationLines += orchestration;
    return { name, lines: total, orchestration };
  });
  const moduleCosts = (text: string) => {
    const module = ts.createSourceFile("module.ts", text, ts.ScriptTarget.Latest, true);
    const imports = module.statements.filter(ts.isImportDeclaration);
    const packet = module.statements.find(node => ts.isFunctionDeclaration(node) &&
      node.name?.text === "createKpSemanticStateComposedMarketPacket");
    const result = packet && ts.isFunctionDeclaration(packet)
      ? packet.body?.statements.find(ts.isReturnStatement) : undefined;
    return {
      totalSourceLines: lines(text), importModules: imports.length,
      importLines: imports.reduce((total, item) => total + lines(item.getText(module)), 0),
      compatibilityReturnLines: result ? lines(result.getText(module)) : 0
    };
  };
  const previous = moduleCosts(baseline);
  const current = moduleCosts(source);
  // Conservatively charge all added compatibility return lines as caller glue,
  // even where they merely expose the model/explanation for downstream checks.
  const compatibilityGrowth = Math.max(0,
    current.compatibilityReturnLines - previous.compatibilityReturnLines);
  return {
    authoredSetupLines: lines(region(source)), setupOrchestrationLines,
    semanticDeclarationLines: lines(region(source)) - setupOrchestrationLines,
    chargedOrchestrationLines: setupOrchestrationLines + compatibilityGrowth,
    compatibilityGrowth, previous, current, bindingCosts,
    shared: sharedPaths.map(path => ({ path, sourceLines: lines(readFileSync(path, "utf8")) }))
  };
}
