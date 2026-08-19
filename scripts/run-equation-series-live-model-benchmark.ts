import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

import {
  runKpEquationSeriesLiveModelBenchmark,
  type KpEquationSeriesLiveModelBatchPort
} from "../src/authoring/equation-series-live-model-benchmark.ts";
import type { KpEquationSeriesPlannerPrompt } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";

const plannerId = "planner.codex-cli.live.v1";
const outputDirectory = resolve(
  process.cwd(),
  "tmp/codex/equation-series-live-model-benchmark"
);
const schemaPath = resolve(outputDirectory, "batch-response.schema.json");
const responsePath = resolve(outputDirectory, "latest-response.json");
const reportPath = resolve(outputDirectory, "latest-report.json");
const arguments_ = parseArguments(process.argv.slice(2));

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  schemaPath,
  `${JSON.stringify(batchResponseSchema(), null, 2)}\n`,
  "utf8"
);

const port: KpEquationSeriesLiveModelBatchPort = {
  id: plannerId,
  modelId: arguments_.model ?? "codex-default-profile",
  propose: async (prompts) => arguments_.replay
    ? readBatchResponse(prompts)
    : runCodexBatch(prompts, arguments_.model)
};
const report = await runKpEquationSeriesLiveModelBenchmark({ port });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.stderr.write(`Disposable report: ${reportPath}\n`);
if (arguments_.check && report.status !== "passed") process.exitCode = 1;

function runCodexBatch(
  prompts: readonly KpEquationSeriesPlannerPrompt[],
  model: string | undefined
): readonly unknown[] {
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
    ...(model === undefined ? [] : ["--model", model]),
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
  return readBatchResponse(prompts);
}

function readBatchResponse(
  prompts: readonly KpEquationSeriesPlannerPrompt[]
): readonly unknown[] {
  const decoded = JSON.parse(readFileSync(responsePath, "utf8")) as unknown;
  if (!isRecord(decoded) || !Array.isArray(decoded["results"])) {
    throw new Error("Codex CLI returned no benchmark result array.");
  }
  const records = decoded["results"];
  // Request identity, not model ordering, joins batch output back to prompts.
  return prompts.map(({ requestId }) => records.find((record) =>
    isRecord(record) && record["requestId"] === requestId
  ));
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
    "If no registered operation exactly applies, set status=unsupported and proposals=[].",
    "Never invent an operation and never author math, semantic arguments, roles, geometry,",
    "motion, timing, rendering, LaTeX, styles, diagnostics, or other authority fields.",
    `Every result must use plannerId=${plannerId} and diagnostics=[].`,
    "Shared registered operation catalogue:",
    JSON.stringify(first.operations, null, 2),
    "Fixed benchmark requests:",
    JSON.stringify(cases, null, 2)
  ].join("\n");
}

function batchResponseSchema(): Readonly<Record<string, unknown>> {
  const single = {
    type: "object",
    additionalProperties: false,
    required: ["adjacencyId", "kind", "operationId"],
    properties: {
      adjacencyId: { type: "string" },
      kind: { type: "string", const: "single" },
      operationId: { type: "string" }
    }
  };
  const multiple = (kind: "sequence" | "alternatives") => ({
    type: "object",
    additionalProperties: false,
    required: ["adjacencyId", "kind", "operationIds"],
    properties: {
      adjacencyId: { type: "string" },
      kind: { type: "string", const: kind },
      operationIds: {
        type: "array",
        minItems: 2,
        items: { type: "string" }
      }
    }
  });
  return {
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "results"],
    properties: {
      schemaVersion: {
        type: "string",
        const: "kp.equation-series-planner-batch.v1"
      },
      results: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "schemaVersion",
            "kind",
            "requestId",
            "plannerId",
            "status",
            "proposals",
            "diagnostics"
          ],
          properties: {
            schemaVersion: {
              type: "string",
              const: "kp.equation-series-planner-record.v1"
            },
            kind: {
              type: "string",
              const: "equation-series-planner-record"
            },
            requestId: { type: "string" },
            plannerId: { type: "string", const: plannerId },
            status: {
              type: "string",
              enum: ["proposed", "unsupported"]
            },
            proposals: {
              type: "array",
              items: {
                anyOf: [single, multiple("sequence"), multiple("alternatives")]
              }
            },
            diagnostics: {
              type: "array",
              maxItems: 0,
              items: { type: "string" }
            }
          }
        }
      }
    }
  };
}

function parseArguments(values: readonly string[]): Readonly<{
  model?: string | undefined;
  check: boolean;
  replay: boolean;
}> {
  let model: string | undefined;
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
    throw new Error(`Unknown argument ${String(values[index])}.`);
  }
  return Object.freeze({
    ...(model === undefined ? {} : { model }),
    check,
    replay
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
