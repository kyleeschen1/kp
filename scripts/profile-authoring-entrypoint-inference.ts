import ts from "typescript";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { typescriptInferenceBudget } from "../src/architecture/typescript-inference-budget.ts";
import { assertInferenceMembership, coreInferenceFixtures, inferenceCohorts, combinedInferenceBudget } from "../src/architecture/typescript-inference-cohorts.ts";
import { relative } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const config = ts.readConfigFile(resolve(root, "tsconfig.inference.json"), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const format = (diagnostics: readonly ts.Diagnostic[]) => ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: path => path, getCurrentDirectory: () => root, getNewLine: () => "\n"
});
if (parsed.errors.length) throw new Error(format(parsed.errors));
const fixture = resolve(root, "tests/type-fixtures/authoring-entrypoint-consumers.ts");
if (!parsed.fileNames.includes(fixture)) throw new Error("The real R4A consumers must remain in the fixed inference gate.");
const baseline = parsed.fileNames.filter(path => path !== fixture);
assertInferenceMembership(baseline.map(path => relative(root, path)), coreInferenceFixtures);
assertInferenceMembership(parsed.fileNames.map(path => relative(root, path)), inferenceCohorts[1].fixtures);
// Independent counterfactuals attribute costs; the final full fixture remains
// the release gate. Never sum overlapping closures or replace the real gate.
const stages = [
  { name: "pre-R4A counterfactual", entries: baseline },
  ...[
    "src/authoring/equation-series-logarithm-base-draft.ts",
    "src/experiments/reusable-reasoning/code-evidence.ts",
    "src/experiments/reusable-reasoning/equation-author-check.ts",
    "src/experiments/authoring-market/authoring-market-source-branch.ts",
    "scripts/gallery-graph-3d-saddle-parameter-frontend.ts",
    "src/authoring/common-factor-session.ts",
    "src/experiments/common-factor/page.ts",
    "src/experiments/common-factor/native.ts"
  ].map(entry => ({ name: entry, entries: [...baseline, resolve(root, entry)] })),
  { name: "complete fixed inference configuration", entries: parsed.fileNames }
];
for (const [index, stage] of stages.entries()) {
  const program = ts.createProgram(stage.entries, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(format(diagnostics));
  const types = program.getTypeCount(), instantiations = program.getInstantiationCount();
  const budget = index === 0 ? typescriptInferenceBudget : combinedInferenceBudget;
  const withinCeilings = types <= budget.ceilings.types && instantiations <= budget.ceilings.instantiations;
  console.log(JSON.stringify({ stage: stage.name, types, instantiations, withinCeilings,
    checkedLocalFiles: program.getSourceFiles().filter(file => file.fileName.startsWith(root) && !file.fileName.includes("node_modules/")).length,
    qualification: "Overlapping checked-source closure, not runtime import cost or bundle bytes." }));
  if ((index === 0 || index === stages.length - 1) && !withinCeilings) process.exitCode = 1;
}
