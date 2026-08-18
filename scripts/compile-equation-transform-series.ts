import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import { KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA } from
  "../src/authoring/equation-transform-series-request.ts";

export interface KpEquationTransformSeriesCliDependencies {
  readonly readFile: (path: string) => Promise<string>;
  readonly readStdin: () => Promise<string>;
  readonly write: (output: string) => void;
}

export type KpEquationTransformSeriesCliExitCode = 0 | 2;

export async function runKpEquationTransformSeriesCli(
  argv: readonly string[],
  dependencies: KpEquationTransformSeriesCliDependencies = defaultDependencies
): Promise<KpEquationTransformSeriesCliExitCode> {
  let options: ReturnType<typeof parseCliOptions>;
  try {
    options = parseCliOptions(argv);
  } catch (error) {
    writeJson(dependencies, failed(
      "equation-series.cli.request.arguments",
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
      schemaVersion: "kp.equation-transform-series-cli-response.v1",
      status: "catalogue",
      requestSchemaVersion: KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA,
      operations: kpEquationSeriesOperationRegistry.declarations.map(
        (declaration) => ({
          operationId: declaration.operationId,
          source: declaration.source,
          familyId: declaration.familyId,
          recipeIds: declaration.recipeIds,
          authorityRefIds: declaration.authorityRefIds,
          roleIds: declaration.roleIds,
          canonicalComposition: declaration.canonicalComposition
        })
      )
    });
    return 0;
  }

  let source: string;
  try {
    source = options.requestPath === undefined || options.requestPath === "-"
      ? await dependencies.readStdin()
      : await dependencies.readFile(options.requestPath);
  } catch (error) {
    writeJson(dependencies, failed(
      "equation-series.cli.request.read",
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
    writeJson(dependencies, failed(
      "equation-series.cli.request.json",
      "$.request",
      errorMessage(error),
      "Provide exactly one valid JSON transform-series request."
    ));
    return 2;
  }

  const result = compileKpEquationTransformSeries({ value: request });
  if (result.status === "repair-required" || result.active === undefined) {
    writeJson(dependencies, {
      schemaVersion: "kp.equation-transform-series-cli-response.v1",
      status: "repair-required",
      repairs: result.repairs
    });
    return 2;
  }

  writeJson(dependencies, {
    schemaVersion: "kp.equation-transform-series-cli-response.v1",
    status: "compiled",
    request: result.active.request,
    normalizedStates: result.active.normalizedStates,
    runtime: result.active.runtime
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

function failed(
  code: string,
  path: string,
  message: string,
  instruction: string
): object {
  return {
    schemaVersion: "kp.equation-transform-series-cli-response.v1",
    status: "repair-required",
    repairs: [{
      code,
      path,
      message,
      action: { kind: "edit-request", instruction }
    }]
  };
}

function writeJson(
  dependencies: KpEquationTransformSeriesCliDependencies,
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

const helpText = `Usage: npm run author:equation-series -- [options]

Compile one tool-neutral JSON equation-transform series from stdin by default.
TypeScript authors may import compileKpEquationTransformSeries directly.

  --request <path|->  Read JSON from a file or stdin (-)
  --list              Print registered semantic operation capabilities
  --help, -h          Show this help
`;

const defaultDependencies: KpEquationTransformSeriesCliDependencies = {
  readFile: (path) => readFile(path, "utf8"),
  readStdin,
  write: (output) => process.stdout.write(output)
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await runKpEquationTransformSeriesCli(
    process.argv.slice(2)
  );
}
