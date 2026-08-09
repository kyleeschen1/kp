import { spawnSync } from "node:child_process";
import { join } from "node:path";

const result = runInferenceCheck();
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
  const ceilings = {
    types: 50_000,
    instantiations: 100_000
  } as const;
  const exceeded = [
    ...(types > ceilings.types ? [`types ${types} > ${ceilings.types}`] : []),
    ...(instantiations > ceilings.instantiations
      ? [`instantiations ${instantiations} > ${ceilings.instantiations}`]
      : [])
  ];

  console.log(
    `inference contracts passed (types=${types}, instantiations=${instantiations}, check=${checkSeconds}s)`
  );
  if (exceeded.length > 0) {
    console.error(`inference compiler-cost ceiling exceeded: ${exceeded.join(", ")}`);
    process.exitCode = 1;
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

function runInferenceCheck() {
  return spawnSync(process.execPath, [
    join(process.cwd(), "node_modules/typescript/bin/tsc"),
    "--project",
    "tsconfig.inference.json",
    "--extendedDiagnostics",
    "--pretty",
    "false"
  ], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}
