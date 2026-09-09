import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import ts from "typescript";
import { assertInferenceMembership, inferenceCohorts } from "../src/architecture/typescript-inference-cohorts.ts";

// Scan disk independently: a tsconfig exclusion must not hide an unassigned fixture.
assertInferenceMembership(
  ts.sys.readDirectory(join(process.cwd(), "tests/type-fixtures"), [".ts"]).map(path => relative(process.cwd(), path)),
  inferenceCohorts[1].fixtures
);
for (const cohort of inferenceCohorts) {
  const config = ts.readConfigFile(cohort.config, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  if (parsed.errors.length || parsed.options.skipLibCheck || parsed.options.noCheck)
    throw new Error(`Invalid or weakened ${cohort.name} inference configuration`);
  assertInferenceMembership(parsed.fileNames.map(path => relative(process.cwd(), path)), cohort.fixtures);
  const result = runInferenceCheck(cohort.config);
  const output = `${result.stdout}${result.stderr}`;

  if (result.status !== 0) {
    process.stderr.write(output);
    process.exitCode = result.status ?? 1;
  } else {
    const types = diagnosticNumber(output, "Types");
    const instantiations = diagnosticNumber(output, "Instantiations");
    // Structural counts are deterministic; TypeScript's check-time diagnostic
    // varies with host contention, so report it without making local runs flaky.
    const checkSeconds = diagnosticSeconds(output, "Check time");
    const { ceilings } = cohort.budget;
    const exceeded = [
      ...(types > ceilings.types ? [`types ${types} > ${ceilings.types}`] : []),
      ...(instantiations > ceilings.instantiations
        ? [`instantiations ${instantiations} > ${ceilings.instantiations}`]
        : [])
    ];

    console.log(
      `${cohort.name} inference contracts ${exceeded.length ? "FAILED" : "passed"} (types=${types}, instantiations=${instantiations}, check=${checkSeconds}s)`
    );
    if (exceeded.length > 0) {
      console.error(`inference compiler-cost ceiling exceeded: ${exceeded.join(", ")}`);
      process.exitCode = 1;
    }
  }
}

function diagnosticNumber(output: string, label: string): number {
  const match = output.match(new RegExp(`^${label}:\\s+([0-9]+)`, "m"));
  if (match?.[1] === undefined) throw new Error(`Missing TypeScript diagnostic ${label}`);
  return Number(match[1]);
}

function diagnosticSeconds(output: string, label: string): number {
  const match = output.match(new RegExp(`^${label}:\\s+([0-9.]+)s`, "m"));
  if (match?.[1] === undefined) throw new Error(`Missing TypeScript diagnostic ${label}`);
  return Number(match[1]);
}

function runInferenceCheck(config: string) {
  return spawnSync(process.execPath, [
    join(process.cwd(), "node_modules/typescript/bin/tsc"),
    "--project",
    config,
    "--extendedDiagnostics",
    "--pretty",
    "false"
  ], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}
