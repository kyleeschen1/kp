import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

interface DiagnosticSample {
  readonly files: number;
  readonly linesOfTypeScript: number;
  readonly identifiers: number;
  readonly symbols: number;
  readonly types: number;
  readonly instantiations: number;
  readonly memoryKilobytes: number;
  readonly checkSeconds: number;
  readonly totalSeconds: number;
}

interface FixtureSample extends DiagnosticSample {
  readonly fixture: string;
  readonly importRoots: readonly string[];
  readonly publicBarrelImports: readonly string[];
  readonly incrementalTypesOverLibrary: number;
  readonly incrementalInstantiationsOverLibrary: number;
}

const projectRoot = process.cwd();
const fixtureRoot = join(projectRoot, "tests/type-fixtures");
const scratchRoot = join(projectRoot, "tmp/codex/inference-attribution");
const outputPath = join(
  projectRoot,
  "tmp/codex/typescript-inference-attribution.json"
);
const compilerPath = join(
  projectRoot,
  "node_modules/typescript/bin/tsc"
);

await mkdir(scratchRoot, { recursive: true });

const emptyFixture = join(scratchRoot, "empty.ts");
await writeFile(emptyFixture, "export {};\n", "utf8");
const libraryBaseline = compileFiles("library-baseline", [emptyFixture]);
const overall = compileProject("tsconfig.inference.json");
const fixtureNames = (await readdir(fixtureRoot))
  .filter((name) => name.endsWith(".ts"))
  .sort();
const fixtures: FixtureSample[] = [];

for (const fixtureName of fixtureNames) {
  const fixturePath = join(fixtureRoot, fixtureName);
  const source = await readFile(fixturePath, "utf8");
  const sample = compileFiles(`fixture-${slug(fixtureName)}`, [fixturePath]);
  const importRoots = moduleSpecifiers(source);
  fixtures.push(Object.freeze({
    fixture: `tests/type-fixtures/${fixtureName}`,
    importRoots,
    publicBarrelImports: Object.freeze(importRoots.filter((root) =>
      root.endsWith("/public-api.ts")
    )),
    ...sample,
    incrementalTypesOverLibrary: sample.types - libraryBaseline.types,
    incrementalInstantiationsOverLibrary:
      sample.instantiations - libraryBaseline.instantiations
  }));
}

const directComparisons = await Promise.all([
  directComparison({
    fixture: "concept-manifest-inference.ts",
    barrelImport: "../../src/authoring/public-api.ts",
    directImport: "../../../src/authoring/concept-manifest.ts"
  }),
  directComparison({
    fixture: "concept-room-inference.ts",
    barrelImport: "../../src/authoring/public-api.ts",
    directImport: "../../../src/authoring/handles.ts"
  }),
  directComparison({
    fixture: "concept-room-state-inference.ts",
    barrelImport: "../../src/kernel/public-api.ts",
    directImport: "../../../src/kernel/concept-room-state.ts"
  }),
  directComparison({
    fixture: "concept-room-theme-inference.ts",
    barrelImport: "../../src/app-adapters/public-api.ts",
    directImport: "../../../src/app-adapters/concept-room-theme.ts"
  })
]);

const report = Object.freeze({
  schemaVersion: "kp.typescript-inference-attribution.v1" as const,
  measuredProject: "tsconfig.inference.json",
  fixtureCount: fixtures.length,
  libraryBaseline,
  overall,
  fixtures: Object.freeze([...fixtures].sort((left, right) =>
    right.incrementalTypesOverLibrary - left.incrementalTypesOverLibrary ||
    left.fixture.localeCompare(right.fixture)
  )),
  directComparisons: Object.freeze(directComparisons)
});

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: "tmp/codex/typescript-inference-attribution.json",
  fixtureCount: report.fixtureCount,
  overall: report.overall,
  largestFixtureClosures: report.fixtures.slice(0, 8).map((fixture) => ({
    fixture: fixture.fixture,
    types: fixture.types,
    incrementalTypesOverLibrary: fixture.incrementalTypesOverLibrary,
    instantiations: fixture.instantiations,
    publicBarrelImports: fixture.publicBarrelImports
  })),
  directComparisons: report.directComparisons
}, null, 2));

async function directComparison(input: {
  readonly fixture: string;
  readonly barrelImport: string;
  readonly directImport: string;
}) {
  const originalPath = join(fixtureRoot, input.fixture);
  const source = await readFile(originalPath, "utf8");
  if (!source.includes(input.barrelImport)) {
    throw new Error(
      `${input.fixture} no longer imports ${input.barrelImport}.`
    );
  }
  const directPath = join(scratchRoot, `direct-${input.fixture}`);
  await writeFile(
    directPath,
    source.replaceAll(input.barrelImport, input.directImport),
    "utf8"
  );
  const barrel = compileFiles(`barrel-${slug(input.fixture)}`, [originalPath]);
  const direct = compileFiles(`direct-${slug(input.fixture)}`, [directPath]);
  return Object.freeze({
    fixture: `tests/type-fixtures/${input.fixture}`,
    barrelImport: input.barrelImport,
    directImport: input.directImport,
    barrel,
    direct,
    delta: Object.freeze({
      types: barrel.types - direct.types,
      instantiations: barrel.instantiations - direct.instantiations,
      files: barrel.files - direct.files,
      linesOfTypeScript:
        barrel.linesOfTypeScript - direct.linesOfTypeScript
    })
  });
}

function compileProject(project: string): DiagnosticSample {
  return compile([
    "--project",
    join(projectRoot, project),
    "--extendedDiagnostics",
    "--pretty",
    "false"
  ]);
}

function compileFiles(id: string, files: readonly string[]): DiagnosticSample {
  const configPath = join(scratchRoot, `${id}.json`);
  const config = {
    extends: join(projectRoot, "tsconfig.base.json"),
    compilerOptions: {
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "NodeNext",
      moduleResolution: "NodeNext",
      types: [],
      noEmit: true
    },
    files
  };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return compile([
    "--project",
    configPath,
    "--extendedDiagnostics",
    "--pretty",
    "false"
  ]);
}

function compile(args: readonly string[]): DiagnosticSample {
  const result = spawnSync(process.execPath, [compilerPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8"
  });
  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) {
    throw new Error(`Inference attribution compilation failed:\n${output}`);
  }
  return Object.freeze({
    files: diagnosticInteger(output, "Files"),
    linesOfTypeScript: diagnosticInteger(output, "Lines of TypeScript"),
    identifiers: diagnosticInteger(output, "Identifiers"),
    symbols: diagnosticInteger(output, "Symbols"),
    types: diagnosticInteger(output, "Types"),
    instantiations: diagnosticInteger(output, "Instantiations"),
    memoryKilobytes: diagnosticInteger(output, "Memory used"),
    checkSeconds: diagnosticSeconds(output, "Check time"),
    totalSeconds: diagnosticSeconds(output, "Total time")
  });
}

function diagnosticInteger(output: string, label: string): number {
  const match = output.match(new RegExp(
    `^${escapeRegExp(label)}:\\s+([0-9]+)`,
    "m"
  ));
  if (match?.[1] === undefined) {
    throw new Error(`Missing TypeScript diagnostic ${label}.`);
  }
  return Number(match[1]);
}

function diagnosticSeconds(output: string, label: string): number {
  const match = output.match(new RegExp(
    `^${escapeRegExp(label)}:\\s+([0-9.]+)s`,
    "m"
  ));
  if (match?.[1] === undefined) {
    throw new Error(`Missing TypeScript diagnostic ${label}.`);
  }
  return Number(match[1]);
}

function moduleSpecifiers(source: string): readonly string[] {
  const imports = [...source.matchAll(
    /(?:from\s+|import\s*)["']([^"']+)["']/g
  )].flatMap((match) => match[1] === undefined ? [] : [match[1]]);
  return Object.freeze([...new Set(imports)].sort());
}

function slug(value: string): string {
  return basename(value).replace(/[^a-zA-Z0-9]+/g, "-");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
