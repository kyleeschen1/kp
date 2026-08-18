import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { kpCanonicalEquationRendererConvergence } from
  "../src/architecture/canonical-equation-renderer-convergence.ts";

interface KpMeasuredSourceFile {
  readonly path: string;
  readonly bytes: number;
}

const projectRoot = process.cwd();
const policy = kpCanonicalEquationRendererConvergence;

const coreFiles = await measureFiles(policy.productionSourceFiles);
const dependencyFiles = await measureFiles(
  policy.productionDirectDependencySourceFiles
);
const scenePlanBoundaryFiles = await measureFiles(
  policy.productionScenePlanBoundarySourceFiles
);
const rendererSupportFiles = await measureFiles(
  policy.productionRendererSupportSourceFiles
);
const aggregateFiles = await measureFiles(Object.freeze([
  ...new Set([
    ...policy.productionSourceFiles,
    ...policy.productionScenePlanBoundarySourceFiles,
    ...policy.productionRendererSupportSourceFiles
  ])
]));
const discoveredDependencies = await collectDirectDependencies(
  policy.productionSourceFiles
);
const callerGraph = await collectDirectCallers(policy.productionSourceFiles);

const report = Object.freeze({
  schemaVersion: "kp.canonical-compositor-ownership-measurement.v1",
  core: summarizeMeasuredClosure({
    files: coreFiles,
    moduleCeiling: policy.maximumProductionModules,
    byteCeiling: policy.maximumProductionSourceBytes
  }),
  directDependencies: {
    ...summarizeMeasuredClosure({
      files: dependencyFiles,
      moduleCeiling: policy.maximumProductionDirectDependencyModules,
      byteCeiling: policy.maximumProductionDirectDependencySourceBytes
    }),
    discoveredFiles: discoveredDependencies,
    inventoryMatchesImports:
      JSON.stringify(discoveredDependencies) ===
      JSON.stringify([...policy.productionDirectDependencySourceFiles])
  },
  scenePlanBoundary: summarizeMeasuredClosure({
    files: scenePlanBoundaryFiles,
    moduleCeiling: policy.maximumProductionScenePlanBoundaryModules,
    byteCeiling: policy.maximumProductionScenePlanBoundarySourceBytes
  }),
  rendererSupport: summarizeMeasuredClosure({
    files: rendererSupportFiles,
    moduleCeiling: policy.maximumProductionRendererSupportModules,
    byteCeiling: policy.maximumProductionRendererSupportSourceBytes
  }),
  aggregate: summarizeMeasuredClosure({
    files: aggregateFiles,
    moduleCeiling: policy.maximumProductionAggregateModules,
    byteCeiling: policy.maximumProductionAggregateSourceBytes
  }),
  directCallers: Object.freeze(callerGraph)
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

async function measureFiles(
  paths: readonly string[]
): Promise<readonly KpMeasuredSourceFile[]> {
  return Object.freeze(await Promise.all(paths.map(async (path) => {
    const source = await readFile(resolve(projectRoot, path), "utf8");
    return Object.freeze({ path, bytes: Buffer.byteLength(source) });
  })));
}

function summarizeMeasuredClosure(input: {
  readonly files: readonly KpMeasuredSourceFile[];
  readonly moduleCeiling: number;
  readonly byteCeiling: number;
}) {
  const bytes = input.files.reduce((total, file) => total + file.bytes, 0);
  return Object.freeze({
    files: input.files,
    modules: input.files.length,
    moduleCeiling: input.moduleCeiling,
    bytes,
    byteCeiling: input.byteCeiling,
    bytesOverCeiling: Math.max(0, bytes - input.byteCeiling)
  });
}

async function collectDirectDependencies(
  sourcePaths: readonly string[]
): Promise<readonly string[]> {
  const sourceSet = new Set(sourcePaths);
  const dependencies = new Set<string>();
  for (const sourcePath of sourcePaths) {
    for (const dependency of await readLocalTypeScriptImports(sourcePath)) {
      if (dependency.startsWith("src/") && !sourceSet.has(dependency)) {
        dependencies.add(dependency);
      }
    }
  }
  return Object.freeze([...dependencies].sort());
}

async function collectDirectCallers(
  targetPaths: readonly string[]
): Promise<Readonly<Record<string, readonly string[]>>> {
  const targets = new Set(targetPaths);
  const callers = new Map(targetPaths.map((path) => [path, new Set<string>()]));
  for (const sourcePath of await listTypeScriptFiles("src")) {
    for (const dependency of await readLocalTypeScriptImports(sourcePath)) {
      if (targets.has(dependency)) callers.get(dependency)!.add(sourcePath);
    }
  }
  return Object.freeze(Object.fromEntries(targetPaths.map((path) => [
    path,
    Object.freeze([...callers.get(path)!].sort())
  ])));
}

async function readLocalTypeScriptImports(
  sourcePath: string
): Promise<readonly string[]> {
  const source = await readFile(resolve(projectRoot, sourcePath), "utf8");
  const imports = new Set<string>();
  for (const match of source.matchAll(
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g
  )) {
    const dependency = relative(
      projectRoot,
      resolve(projectRoot, dirname(sourcePath), match[1]!)
    ).replaceAll("\\", "/");
    if (dependency.endsWith(".ts")) imports.add(dependency);
  }
  return Object.freeze([...imports].sort());
}

async function listTypeScriptFiles(root: string): Promise<readonly string[]> {
  const absoluteRoot = resolve(projectRoot, root);
  const entries = await readdir(absoluteRoot);
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = resolve(absoluteRoot, entry);
    const metadata = await stat(absolutePath);
    if (metadata.isDirectory()) {
      files.push(...await listTypeScriptFiles(relative(projectRoot, absolutePath)));
    } else if (entry.endsWith(".ts")) {
      files.push(relative(projectRoot, absolutePath).replaceAll("\\", "/"));
    }
  }
  return Object.freeze(files.sort());
}
