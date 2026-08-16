import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

import {
  compileKpEquationIterationEconomics,
  type KpIterationSourceFile
} from "../src/architecture/equation-iteration-economics.ts";
import {
  createKpEquationSurfaceCostPlan
} from "../src/architecture/equation-surface-cost-model.ts";

const repositoryRoot = resolve(".");
const costPlan = createKpEquationSurfaceCostPlan();
const authorityPaths = [...new Set(costPlan.families.flatMap(
  ({ sourcePaths }) => sourcePaths
))].sort();
const [authorityFiles, sourceFiles, testFiles, packageSource] = await Promise.all([
  readFiles(authorityPaths),
  readTree(resolve("src")),
  readTree(resolve("tests")),
  readFile(resolve("package.json"), "utf8")
]);
const packageJson = JSON.parse(packageSource) as {
  readonly scripts?: Readonly<Record<string, string>>;
};
const verificationScriptNames = Object.keys(packageJson.scripts ?? {})
  .filter((name) => /^(?:test|check|verify|visual|performance|measure):/u.test(name))
  .sort();
const report = compileKpEquationIterationEconomics({
  equationAuthorityFiles: authorityFiles,
  allSourceFiles: sourceFiles.filter(({ path }) =>
    path !== "src/architecture/equation-iteration-economics.ts"
  ),
  testFiles: testFiles.filter(({ path }) =>
    path.endsWith(".test.ts") || path.endsWith(".spec.ts")
  ),
  verificationScriptNames,
  compatibility: costPlan.compatibility
});
const outputPath = resolve("tmp/codex/equation-iteration-economics.json");
await mkdir(resolve("tmp/codex"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: relative(repositoryRoot, outputPath),
  equationAuthority: {
    ...report.equationAuthority,
    closedSwitchFiles: report.equationAuthority.closedSwitchFiles.length
  },
  motifAuthority: {
    functionWrapProfileConsumers:
      report.motifAuthority.functionWrapProfileConsumers.length,
    functionWrapReceptionConsumers:
      report.motifAuthority.functionWrapReceptionConsumers.length
  },
  tests: {
    fileCount: report.tests.fileCount,
    lineCount: report.tests.lineCount,
    sourceInspectionFiles: report.tests.sourceInspectionFiles.length,
    aggregateCountRatchetFiles: report.tests.aggregateCountRatchetFiles.length
  },
  verificationScriptCount: report.verificationScriptCount,
  compatibility: report.compatibility
}, null, 2));

async function readTree(root: string): Promise<KpIterationSourceFile[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return readTree(path);
    if (!entry.isFile() || ![".ts", ".svelte"].includes(extname(path))) return [];
    return [{
      path: relative(repositoryRoot, path),
      source: await readFile(path, "utf8")
    }];
  }));
  return files.flat().sort((left, right) => left.path.localeCompare(right.path));
}

async function readFiles(paths: readonly string[]): Promise<KpIterationSourceFile[]> {
  return Promise.all(paths.map(async (path) => ({
    path,
    source: await readFile(resolve(path), "utf8")
  })));
}
