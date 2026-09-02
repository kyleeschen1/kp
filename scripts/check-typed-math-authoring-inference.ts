import { spawnSync } from "node:child_process";
import { join } from "node:path";

import {
  kpTypedMathAuthoringInferenceBudget
} from "../src/math/authoring/inference-budget.ts";

const result = spawnSync(process.execPath, [
  join(process.cwd(), "node_modules/typescript/bin/tsc"),
  "--project",
  kpTypedMathAuthoringInferenceBudget.measuredProject,
  "--extendedDiagnostics",
  "--pretty",
  "false"
], {
  cwd: process.cwd(),
  encoding: "utf8"
});
const output = `${result.stdout}${result.stderr}`;

if (result.status !== 0) {
  process.stderr.write(output);
  process.exitCode = result.status ?? 1;
} else {
  const types = diagnosticInteger(output, "Types");
  const instantiations = diagnosticInteger(output, "Instantiations");
  const { ceilings } = kpTypedMathAuthoringInferenceBudget;
  const exceeded = [
    ...(types > ceilings.types ? [`types ${types} > ${ceilings.types}`] : []),
    ...(instantiations > ceilings.instantiations
      ? [`instantiations ${instantiations} > ${ceilings.instantiations}`]
      : [])
  ];

  console.log(
    `typed math authoring inference passed (types=${types}, instantiations=${instantiations})`
  );
  if (exceeded.length > 0) {
    console.error(
      `typed math authoring inference ceiling exceeded: ${exceeded.join(", ")}`
    );
    process.exitCode = 1;
  }
}

function diagnosticInteger(output: string, label: string): number {
  const match = output.match(new RegExp(`^${label}:\\s+([0-9]+)`, "m"));
  if (match?.[1] === undefined) {
    throw new Error(`Missing TypeScript diagnostic ${label}.`);
  }
  return Number(match[1]);
}
