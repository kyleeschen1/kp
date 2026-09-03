import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const CONSTRUCTOR_NAMES = Object.freeze([
  "createKpUnitTaggedScalarSpace",
  "createKpDifferentiableMap",
  "createKpLinearMap",
  "defineKpAuthoredUnitScalarMap"
]);

const callerSpecs = Object.freeze([
  Object.freeze({
    id: "market",
    source: "src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts",
    functionNames: Object.freeze([
      "createKpLinearSupplyDemandExperiment",
      "createCurve"
    ])
  }),
  Object.freeze({
    id: "circle",
    source: "tests/fixtures/typed-circle-measurement.ts",
    functionNames: Object.freeze(["createKpCircleMeasurement"])
  })
]);

export interface KpUnitScalarCallerBurden {
  readonly id: string;
  readonly source: string;
  readonly functionNames: readonly string[];
  readonly authoredSetupLines: number;
  readonly mechanicalStatements: number;
  readonly constructorCalls: Readonly<Record<string, number>>;
  readonly unitGuardCalls: number;
  readonly semanticPathCalls: number;
  readonly derivativeUnitProjectionCalls: number;
}

export interface KpUnitScalarAuthoringBurden {
  readonly callers: readonly KpUnitScalarCallerBurden[];
  readonly totals: Readonly<{
    authoredSetupLines: number;
    mechanicalStatements: number;
    constructorCalls: number;
    unitGuardCalls: number;
    semanticPathCalls: number;
    derivativeUnitProjectionCalls: number;
  }>;
}

export interface KpUnitScalarHelperBaseline {
  readonly schemaVersion: "kp.unit-scalar-helper-baseline.v1";
  readonly authoring: KpUnitScalarAuthoringBurden;
  readonly inference: Readonly<{
    project: string;
    fixtureCount: number;
    types: number;
    instantiations: number;
  }>;
}

export function measureKpUnitScalarAuthoringBurden(
  repositoryRoot = process.cwd()
): KpUnitScalarAuthoringBurden {
  const callers = callerSpecs.map((spec) => measureCaller(
    repositoryRoot,
    spec
  ));
  return Object.freeze({
    callers: Object.freeze(callers),
    totals: Object.freeze({
      authoredSetupLines: sum(callers, "authoredSetupLines"),
      mechanicalStatements: sum(callers, "mechanicalStatements"),
      constructorCalls: callers.reduce((total, caller) =>
        total + Object.values(caller.constructorCalls).reduce(
          (subtotal, count) => subtotal + count,
          0
        ), 0),
      unitGuardCalls: sum(callers, "unitGuardCalls"),
      semanticPathCalls: sum(callers, "semanticPathCalls"),
      derivativeUnitProjectionCalls: sum(
        callers,
        "derivativeUnitProjectionCalls"
      )
    })
  });
}

export function measureKpUnitScalarInference(
  repositoryRoot = process.cwd()
): KpUnitScalarHelperBaseline["inference"] {
  const project = "tsconfig.unit-scalar-map-helper-inference.json";
  const result = spawnSync(process.execPath, [
    join(repositoryRoot, "node_modules/typescript/bin/tsc"),
    "--project",
    project,
    "--extendedDiagnostics",
    "--pretty",
    "false"
  ], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) {
    throw new Error(`Focused unit-scalar inference failed:\n${output}`);
  }
  return Object.freeze({
    project,
    fixtureCount: 2,
    types: diagnosticInteger(output, "Types"),
    instantiations: diagnosticInteger(output, "Instantiations")
  });
}

export function measureKpUnitScalarHelperBaseline(
  repositoryRoot = process.cwd()
): KpUnitScalarHelperBaseline {
  return Object.freeze({
    schemaVersion: "kp.unit-scalar-helper-baseline.v1" as const,
    authoring: measureKpUnitScalarAuthoringBurden(repositoryRoot),
    inference: measureKpUnitScalarInference(repositoryRoot)
  });
}

function measureCaller(
  repositoryRoot: string,
  spec: typeof callerSpecs[number]
): KpUnitScalarCallerBurden {
  const sourceText = readFileSync(join(repositoryRoot, spec.source), "utf8");
  const sourceFile = ts.createSourceFile(
    spec.source,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const statements = new Set<ts.Statement>();
  const constructorCalls = new Map(CONSTRUCTOR_NAMES.map((name) => [name, 0]));
  let unitGuardCalls = 0;
  let semanticPathCalls = 0;
  let derivativeUnitProjectionCalls = 0;

  for (const functionName of spec.functionNames) {
    const declaration = sourceFile.statements.find((statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === functionName
    );
    if (declaration === undefined || !ts.isFunctionDeclaration(declaration) ||
      declaration.body === undefined) {
      throw new Error(`Missing measured function ${functionName} in ${spec.source}.`);
    }
    for (const statement of declaration.body.statements) {
      let mechanical = false;
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const name = callName(node.expression);
          if (name !== undefined && constructorCalls.has(name)) {
            constructorCalls.set(name, constructorCalls.get(name)! + 1);
            mechanical = true;
          } else if (name === "requireUnitMagnitude") {
            unitGuardCalls += 1;
            mechanical = true;
          } else if (name === "projectKpDerivativeUnitToLatex") {
            derivativeUnitProjectionCalls += 1;
            mechanical = true;
          } else if (name === "id" || name === "at") {
            semanticPathCalls += 1;
            mechanical = true;
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(statement);
      if (mechanical) statements.add(statement);
    }
  }

  return Object.freeze({
    id: spec.id,
    source: spec.source,
    functionNames: spec.functionNames,
    authoredSetupLines: [...statements].reduce(
      (total, statement) => total + meaningfulLineCount(statement.getText(sourceFile)),
      0
    ),
    mechanicalStatements: statements.size,
    constructorCalls: Object.freeze(Object.fromEntries(
      [...constructorCalls].filter(([, count]) => count > 0)
    )),
    unitGuardCalls,
    semanticPathCalls,
    derivativeUnitProjectionCalls
  });
}

function callName(expression: ts.LeftHandSideExpression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return undefined;
}

function meaningfulLineCount(source: string): number {
  return source.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("//");
  }).length;
}

function sum(
  callers: readonly KpUnitScalarCallerBurden[],
  key: "authoredSetupLines" | "mechanicalStatements" | "unitGuardCalls" |
    "semanticPathCalls" | "derivativeUnitProjectionCalls"
): number {
  return callers.reduce((total, caller) => total + caller[key], 0);
}

function diagnosticInteger(output: string, label: string): number {
  const match = output.match(new RegExp(`^${label}:\\s+([0-9]+)`, "m"));
  if (match?.[1] === undefined) {
    throw new Error(`Missing TypeScript diagnostic ${label}.`);
  }
  return Number(match[1]);
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  const measured = measureKpUnitScalarHelperBaseline();
  if (process.argv.includes("--check")) {
    const acceptedPath = "tests/fixtures/unit-scalar-map-helper-accepted.json";
    const expected = JSON.parse(readFileSync(acceptedPath, "utf8")) as unknown;
    assert.deepEqual(measured, expected);
    process.stdout.write(
      `unit-scalar helper accepted measurement is current ` +
      `(types=${measured.inference.types}, ` +
      `instantiations=${measured.inference.instantiations})\n`
    );
  } else {
    process.stdout.write(`${JSON.stringify(measured, null, 2)}\n`);
  }
}
