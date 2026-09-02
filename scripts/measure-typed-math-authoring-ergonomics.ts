import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const REGION_ID = "affine-jacobian-and-quadratic-hessian";
const START_MARKER = `// KP_AUTHORING_ERGONOMICS_START: ${REGION_ID}`;
const END_MARKER = `// KP_AUTHORING_ERGONOMICS_END: ${REGION_ID}`;

const LOW_LEVEL_CONSTRUCTORS = new Set([
  "createKpScalarExpression",
  "createKpScalarParameter",
  "createKpTypedVector",
  "defineKpTypedFunction",
  "deriveKpHessian",
  "deriveKpJacobian"
]);

export interface KpAuthoringErgonomicsMeasurement {
  readonly schemaVersion: "kp.typed-math-authoring-ergonomics.v1";
  readonly source: string;
  readonly region: string;
  readonly manualIdentityLiterals: number;
  readonly lowLevelConstructorCalls: number;
  readonly authoredSemanticSetupLines: number;
  readonly constructorCalls: Readonly<Record<string, number>>;
}

export function measureTypedMathAuthoringErgonomics(
  source: string,
  sourcePath: string
): KpAuthoringErgonomicsMeasurement {
  const region = extractRegion(source);
  const sourceFile = ts.createSourceFile(
    sourcePath,
    region,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const constructorCalls = new Map<string, number>();
  let manualIdentityLiterals = 0;

  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === "id" &&
      (ts.isStringLiteral(node.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      manualIdentityLiterals += 1;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      LOW_LEVEL_CONSTRUCTORS.has(node.expression.text)
    ) {
      constructorCalls.set(
        node.expression.text,
        (constructorCalls.get(node.expression.text) ?? 0) + 1
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const sortedConstructorCalls = Object.fromEntries(
    [...constructorCalls.entries()].sort(([left], [right]) =>
      left.localeCompare(right)
    )
  );

  return Object.freeze({
    schemaVersion: "kp.typed-math-authoring-ergonomics.v1" as const,
    source: sourcePath,
    region: REGION_ID,
    manualIdentityLiterals,
    lowLevelConstructorCalls: [...constructorCalls.values()].reduce(
      (sum, count) => sum + count,
      0
    ),
    authoredSemanticSetupLines: region.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("//");
    }).length,
    constructorCalls: Object.freeze(sortedConstructorCalls)
  });
}

function extractRegion(source: string): string {
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(
      `Expected one ordered ${REGION_ID} authoring-ergonomics region.`
    );
  }
  if (
    source.indexOf(START_MARKER, start + START_MARKER.length) >= 0 ||
    source.indexOf(END_MARKER, end + END_MARKER.length) >= 0
  ) {
    throw new Error(`Expected exactly one ${REGION_ID} region.`);
  }
  return source.slice(start + START_MARKER.length, end);
}

function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return undefined;
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  const sourcePath = process.argv[2] ??
    "tests/type-fixtures/typed-math-authoring-public-api.ts";
  const measurement = measureTypedMathAuthoringErgonomics(
    readFileSync(sourcePath, "utf8"),
    sourcePath
  );
  process.stdout.write(`${JSON.stringify(measurement, null, 2)}\n`);
}
