import ts from "typescript";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { typescriptInferenceBudget } from "../src/architecture/typescript-inference-budget.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const configPath = resolve(root, "tsconfig.inference.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
if (parsed.errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
  getCanonicalFileName: path => path, getCurrentDirectory: () => root, getNewLine: () => "\n"
}));
const fixture = resolve(root, "tests/type-fixtures/bayesian-authoring.ts");
if (!parsed.fileNames.includes(fixture)) throw new Error("The real Bayes authoring fixture must remain in the inference gate.");
const baseline = parsed.fileNames.filter(path => path !== fixture);

// Counterfactual programs attribute cost only. They never replace the final
// full-fixture measurement or modify the repository's gate/configuration.
const stages = [
  { name: "pre-Bayes counterfactual", entries: baseline },
  ...[
    "domains/probability/binary-joint-model.ts",
    "domains/probability/binary-probability-trace.ts",
    "src/experiments/bayesian-reasoning/evidence.ts",
    "src/experiments/bayesian-reasoning/notation.ts",
    "src/experiments/bayesian-reasoning/tree-frame.ts"
  ].map(entry => ({ name: entry, entries: [...baseline, resolve(root, entry)] })),
  { name: "full unchanged inference configuration", entries: parsed.fileNames }
];
let baselineTypes = 0, baselineInstantiations = 0;
for (const [index, stage] of stages.entries()) {
  const program = ts.createProgram(stage.entries, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: path => relative(root, path), getCurrentDirectory: () => root, getNewLine: () => "\n"
  }));
  const types = program.getTypeCount(), instantiations = program.getInstantiationCount();
  if (index === 0) { baselineTypes = types; baselineInstantiations = instantiations; }
  const withinCeilings = types <= typescriptInferenceBudget.ceilings.types &&
    instantiations <= typescriptInferenceBudget.ceilings.instantiations;
  console.log(JSON.stringify({ stage: stage.name, types, instantiations,
    addedTypes: types - baselineTypes, addedInstantiations: instantiations - baselineInstantiations,
    withinCeilings, qualification: "Independent baseline-plus-entry closure; deltas overlap and must not be summed." }));
  if (index === stages.length - 1 && !withinCeilings) process.exitCode = 1;
}
