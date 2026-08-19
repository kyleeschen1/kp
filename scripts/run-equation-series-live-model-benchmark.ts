import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

import {
  fingerprintKpEquationSeriesBenchmarkPayload,
  runKpEquationSeriesLiveModelBenchmark,
  type KpEquationSeriesLiveModelBatchResult,
  type KpEquationSeriesLiveModelBatchPort
} from "../src/authoring/equation-series-live-model-benchmark.ts";
import type { KpEquationSeriesPlannerPrompt } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";
import { createKpEquationSeriesLiveModelBatchResponseSchema } from
  "../src/authoring/equation-series-live-model-batch-schema.ts";

const plannerId = "planner.codex-cli.live.v1";
const outputDirectory = resolve(
  process.cwd(),
  "tmp/codex/equation-series-live-model-benchmark"
);
const schemaPath = resolve(outputDirectory, "batch-response.schema.json");
const reportPath = resolve(outputDirectory, "latest-report.json");
const arguments_ = parseArguments(process.argv.slice(2));

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  schemaPath,
  `${JSON.stringify(createKpEquationSeriesLiveModelBatchResponseSchema({
    plannerId,
    resultCount: 6
  }), null, 2)}\n`,
  "utf8"
);

const port: KpEquationSeriesLiveModelBatchPort = {
  id: plannerId,
  modelId: arguments_.model,
  propose: async ({ prompts, repetitionIndex }) => arguments_.replay
    ? readBatchResponse(prompts, repetitionIndex, "replayed-file")
    : runCodexBatch(prompts, repetitionIndex, arguments_.model)
};
const report = await runKpEquationSeriesLiveModelBenchmark({
  port,
  repetitionCount: arguments_.repetitionCount
});
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.stderr.write(`Disposable report: ${reportPath}\n`);
if (arguments_.check && report.status !== "passed") process.exitCode = 1;

function runCodexBatch(
  prompts: readonly KpEquationSeriesPlannerPrompt[],
  repetitionIndex: number,
  model: string
): KpEquationSeriesLiveModelBatchResult {
  const responsePath = responsePathFor(repetitionIndex);
  const args = [
    "exec",
    "--ephemeral",
    "--ignore-user-config",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--color",
    "never",
    "-c",
    "model_reasoning_effort=\"low\"",
    "--model",
    model,
    "--output-schema",
    schemaPath,
    "--output-last-message",
    responsePath,
    "-"
  ];
  const child = spawnSync("codex", args, {
    cwd: outputDirectory,
    input: benchmarkPrompt(prompts),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  if (child.error !== undefined) throw child.error;
  if (child.status !== 0) {
    const detail = child.stderr.trim().slice(-4_000);
    throw new Error(`Codex CLI exited ${String(child.status)}: ${detail}`);
  }
  return readBatchResponse(prompts, repetitionIndex, "captured-file");
}

function readBatchResponse(
  prompts: readonly KpEquationSeriesPlannerPrompt[],
  repetitionIndex: number,
  kind: "captured-file" | "replayed-file"
): KpEquationSeriesLiveModelBatchResult {
  const responsePath = responsePathFor(repetitionIndex);
  const rawResponse = readFileSync(responsePath, "utf8");
  const decoded = JSON.parse(rawResponse) as unknown;
  if (!isRecord(decoded) || !Array.isArray(decoded["results"])) {
    throw new Error("Codex CLI returned no benchmark result array.");
  }
  const records = decoded["results"];
  // Request identity, not model ordering, joins batch output back to prompts.
  return Object.freeze({
    candidates: prompts.map(({ requestId }) => records.find((record) =>
      isRecord(record) && record["requestId"] === requestId
    )),
    rawResponseProvenance: Object.freeze({
      kind,
      locator: responsePath,
      contentFingerprint:
        fingerprintKpEquationSeriesBenchmarkPayload(rawResponse)
    })
  });
}

function responsePathFor(repetitionIndex: number): string {
  return resolve(
    outputDirectory,
    `response-${String(repetitionIndex).padStart(2, "0")}.json`
  );
}

function benchmarkPrompt(
  prompts: readonly KpEquationSeriesPlannerPrompt[]
): string {
  const first = prompts[0];
  if (first === undefined) throw new Error("Live benchmark has no prompts.");
  const cases = prompts.map(({ operations: _, ...prompt }) => prompt);
  return [
    "You are a constrained semantic operation planner for Kinetic Press.",
    "Do not use tools or inspect files. Everything needed is below.",
    "Return only the JSON required by the supplied output schema.",
    "For each request, cover every adjacency exactly once and in order.",
    "Use kind=single when one registered operation exactly explains an adjacency.",
    "Use sequence only when one adjacency truly contains multiple registered operations.",
    "Use alternatives only when the supplied evidence is genuinely ambiguous.",
    "If no registered operation exactly applies, set status=unsupported, include a",
    "nonblank reason and every unsupportedAdjacencyId, and omit proposals entirely.",
    "Never invent an operation and never author math, semantic arguments, roles, geometry,",
    "motion, timing, rendering, LaTeX, styles, diagnostics, or other authority fields.",
    `Every result must use plannerId=${plannerId} and diagnostics=[].`,
    "Shared registered operation catalogue:",
    JSON.stringify(first.operations, null, 2),
    "Fixed benchmark requests:",
    JSON.stringify(cases, null, 2)
  ].join("\n");
}

function parseArguments(values: readonly string[]): Readonly<{
  model: string;
  repetitionCount: number;
  check: boolean;
  replay: boolean;
}> {
  let model: string | undefined;
  let repetitionCount: number | undefined;
  let check = false;
  let replay = false;
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--check") {
      check = true;
      continue;
    }
    if (values[index] === "--replay") {
      replay = true;
      continue;
    }
    if (values[index] === "--model") {
      model = values[index + 1];
      if (model === undefined || model.trim() === "") {
        throw new Error("--model requires a nonblank model ID.");
      }
      index += 1;
      continue;
    }
    if (values[index] === "--repetitions") {
      const raw = values[index + 1];
      repetitionCount = raw === undefined ? undefined : Number(raw);
      if (
        repetitionCount === undefined ||
        !Number.isSafeInteger(repetitionCount) ||
        repetitionCount < 1 || repetitionCount > 20
      ) {
        throw new Error("--repetitions requires an integer from 1 to 20.");
      }
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument ${String(values[index])}.`);
  }
  if (model === undefined) throw new Error(
    "--model is required so benchmark evidence names the exact model."
  );
  if (repetitionCount === undefined) throw new Error(
    "--repetitions is required so benchmark evidence records run count."
  );
  return Object.freeze({
    model,
    repetitionCount,
    check,
    replay
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
