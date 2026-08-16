import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies,
  type KpCompiledEquationIntentPlan
} from "../src/authoring/compile-equation-intent.ts";

export interface KpEquationIntentCliDependencies {
  readonly readFile: (path: string) => Promise<string>;
  readonly readStdin: () => Promise<string>;
  readonly write: (output: string) => void;
}

export type KpEquationIntentCliExitCode = 0 | 1 | 2;

export async function runKpEquationIntentCli(
  argv: readonly string[],
  dependencies: KpEquationIntentCliDependencies = defaultDependencies
): Promise<KpEquationIntentCliExitCode> {
  let options: ReturnType<typeof parseCliOptions>;
  try {
    options = parseCliOptions(argv);
  } catch (error) {
    writeJson(dependencies, failure(
      "equation-intent.request.arguments",
      "$",
      errorMessage(error),
      "Use --list or provide at most one --request <path|->."
    ));
    return 2;
  }

  if (options.help) {
    dependencies.write(helpText);
    return 0;
  }
  if (options.list) {
    writeJson(dependencies, {
      schemaVersion: "kp.equation-intent-cli-response.v1",
      status: "catalogue",
      surfaces: listKpEquationIntentSurfaceVocabularies()
    });
    return 0;
  }

  let source: string;
  try {
    source = options.requestPath === undefined || options.requestPath === "-"
      ? await dependencies.readStdin()
      : await dependencies.readFile(options.requestPath);
  } catch (error) {
    writeJson(dependencies, failure(
      "equation-intent.request.read",
      "$.request",
      errorMessage(error),
      "Provide a readable JSON request path, or pass - to read stdin."
    ));
    return 2;
  }

  let request: unknown;
  try {
    request = JSON.parse(source) as unknown;
  } catch (error) {
    writeJson(dependencies, failure(
      "equation-intent.request.json",
      "$.request",
      errorMessage(error),
      "Provide exactly one valid JSON authoring request."
    ));
    return 2;
  }

  const result = compileEquationIntent(request);
  if (result.status === "repair-required") {
    writeJson(dependencies, {
      schemaVersion: "kp.equation-intent-cli-response.v1",
      status: result.status,
      diagnostics: result.diagnostics
    });
    return 2;
  }

  writeJson(dependencies, {
    schemaVersion: "kp.equation-intent-cli-response.v1",
    status: result.status,
    request: result.request,
    surface: {
      animationId: result.surface.animationId,
      operationId: result.operation.operationId
    },
    plan: summarizePlan(result.plan)
  });
  return 0;
}

function parseCliOptions(argv: readonly string[]): {
  readonly help: boolean;
  readonly list: boolean;
  readonly requestPath: string | undefined;
} {
  const { values } = parseArgs({
    args: [...argv],
    strict: true,
    options: {
      help: { type: "boolean", short: "h", default: false },
      list: { type: "boolean", default: false },
      request: { type: "string" }
    }
  });
  if (values.list && values.request !== undefined) {
    throw new Error("--list and --request are mutually exclusive.");
  }
  return {
    help: values.help,
    list: values.list,
    requestPath: values.request
  };
}

function summarizePlan(plan: KpCompiledEquationIntentPlan): Readonly<
  Record<string, string>
> {
  switch (plan.kind) {
    case "function-wrap-motif-plan":
      return Object.freeze({
        kind: plan.kind,
        animationId: plan.animationId,
        operationId: plan.operationId,
        extensionPackId: plan.extensionPackId,
        recipeId: plan.recipeId,
        compiledPlanId: plan.plan.id,
        motifId: plan.plan.motifId
      });
    case "cancellation-semantic-motion-plan":
      return Object.freeze({
        kind: plan.kind,
        animationId: plan.animationId,
        operationId: plan.operationId,
        contractId: plan.contractId,
        choreographyId: plan.plan.id,
        recipeId: plan.plan.recipeId
      });
    case "distribution-operation-plan":
      return Object.freeze({
        kind: plan.kind,
        animationId: plan.animationId,
        operationId: plan.operationId,
        operationSpecId: plan.operationSpecId,
        inverseOperationId: plan.inverseOperationId,
        transformationId: plan.plan.transformationId
      });
  }
}

function failure(
  code: string,
  path: string,
  message: string,
  repair: string
): object {
  return {
    schemaVersion: "kp.equation-intent-cli-response.v1",
    status: "repair-required",
    diagnostics: [{ code, path, message, repair }]
  };
}

function writeJson(
  dependencies: KpEquationIntentCliDependencies,
  value: unknown
): void {
  dependencies.write(`${JSON.stringify(value, null, 2)}\n`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readStdin(): Promise<string> {
  return new Promise((resolveInput, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => { input += chunk; });
    process.stdin.on("end", () => resolveInput(input));
    process.stdin.on("error", reject);
  });
}

const helpText = `Usage: npm run author:equation-intent -- [options]

Compile one tool-neutral equation authoring request from stdin by default.

  --request <path|->  Read JSON from a file or stdin (-)
  --list              Print supported surfaces and canonical vocabularies
  --help, -h          Show this help
`;

const defaultDependencies: KpEquationIntentCliDependencies = {
  readFile: (path) => readFile(path, "utf8"),
  readStdin,
  write: (output) => process.stdout.write(output)
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await runKpEquationIntentCli(process.argv.slice(2));
}
