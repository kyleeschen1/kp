import ts from "typescript";
import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { assertInferenceMembership, inferenceCohorts } from "../src/architecture/typescript-inference-cohorts.ts";

// Read-only compiler-host counterfactual: retain all present-day consumers and
// checking options. Historical source is attribution evidence, never a gate.
const index = process.argv.indexOf("--baseline");
const baseline = process.argv[index + 1];
if (index < 0 || !baseline || !/^[a-f0-9]{7,40}$/.test(baseline)) throw new Error("Supply --baseline followed by an audited commit hash");
const cohort = inferenceCohorts[1];
const config = ts.readConfigFile(cohort.config, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, " "));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
if (parsed.errors.length || parsed.options.skipLibCheck || parsed.options.noCheck) throw new Error("Invalid inference configuration");
assertInferenceMembership(parsed.fileNames.map(p => relative(process.cwd(), p)), cohort.fixtures);
const changed = execFileSync("git", ["diff", baseline, "--name-only", "--diff-filter=M", "--", "src", "domains", "protocols", "scripts"], { encoding: "utf8" })
  .trim().split("\n").filter(p => p.endsWith(".ts") || p.endsWith(".json"));
const historical = new Map(changed.map(p => [`${process.cwd()}/${p}`,
  execFileSync("git", ["show", `${baseline}:${p}`], { encoding: "utf8" })]));
for (const mode of ["current", "historical-closure", "historical-rendering", "historical-reader-dispatch"] as const) {
  const selected = process.argv.indexOf("--mode");
  if (selected >= 0 && process.argv[selected + 1] !== mode) continue;
  const host = ts.createCompilerHost(parsed.options), read = host.readFile;
  const replaced = new Set<string>();
  host.readFile = name => {
    if (historical.has(name) && (mode === "historical-closure" || mode === "historical-rendering" && name.includes("/src/rendering/") || mode === "historical-reader-dispatch" && name.endsWith("/reader/renderers/equation-scene-compositor-adapter.ts"))) {
      replaced.add(relative(process.cwd(), name)); return historical.get(name);
    }
    return read(name);
  };
  const program = ts.createProgram(parsed.fileNames, parsed.options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  console.log(JSON.stringify({ baseline, mode, fixtures: parsed.fileNames.length,
    types: program.getTypeCount(), instantiations: program.getInstantiationCount(),
    errorCount: diagnostics.length,
    errors: diagnostics.slice(0, 3).map(d => ts.flattenDiagnosticMessageText(d.messageText, " ")),
    replaced: [...replaced].sort() }));
  if (diagnostics.length) process.exitCode = 1;
}
