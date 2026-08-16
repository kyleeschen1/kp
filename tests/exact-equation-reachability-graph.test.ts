import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import generatedGraph from
  "../src/architecture/exact-equation-reachability-graph.generated.json" with {
    type: "json"
  };
import {
  compileKpExactEquationReachabilityGraph,
  kpExactEquationReachabilityRootDeclarations,
  kpExactEquationReachabilityGeneratedPath,
  KpExactEquationReachabilityGraphError
} from "../src/architecture/exact-equation-reachability-graph.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const files = ["src", "tests", "scripts", "server"].flatMap(sourceFiles)
  .filter(({ path }) => path !== kpExactEquationReachabilityGeneratedPath);

test("generated reachability graph owns the exact declared root set", () => {
  const graph = compileKpExactEquationReachabilityGraph({ files });
  assert.deepEqual(generatedGraph, graph);
  assert.deepEqual(
    graph.roots.map(({ id }) => id),
    kpExactEquationReachabilityRootDeclarations.map(({ id }) => id)
  );
  assert.deepEqual(new Set(graph.roots.map(({ concern }) => concern)), new Set([
    "compiler",
    "generic-fallback",
    "manifest",
    "capability-loader",
    "compatibility",
    "public-projection"
  ]));
});

test("every observed caller is a scanned module and every root is classified", () => {
  const graph = compileKpExactEquationReachabilityGraph({ files });
  const paths = new Set(files.map(({ path }) => path));
  for (const root of graph.roots) {
    assert.ok(paths.has(root.sourcePath), root.id);
    for (const caller of [
      ...root.sourceCallers,
      ...root.testCallers,
      ...root.scriptCallers,
      ...root.otherCallers
    ]) assert.ok(paths.has(caller), `${root.id} unknown caller ${caller}`);
    assert.equal(
      root.reachability,
      root.sourceCallers.length + root.testCallers.length +
        root.scriptCallers.length + root.otherCallers.length === 0
        ? "no-observed-caller"
        : "live-callers"
    );
  }
});

test("unknown and duplicate roots fail closed", () => {
  const first = kpExactEquationReachabilityRootDeclarations[0]!;
  assert.throws(
    () => compileKpExactEquationReachabilityGraph({
      files,
      roots: [
        first,
        first,
        { ...first, id: "reachability.unknown", sourcePath: "src/missing.ts" }
      ]
    }),
    (error: unknown) =>
      error instanceof KpExactEquationReachabilityGraphError &&
      error.diagnostics.some((message) => message.includes("Duplicate")) &&
      error.diagnostics.some((message) => message.includes("Unknown"))
  );
});

function sourceFiles(relativeDirectory: string) {
  const absoluteDirectory = join(projectRoot, relativeDirectory);
  return readdirSync(absoluteDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:ts|svelte|json)$/.test(entry.name))
    .map((entry) => {
      const path = join(
        relativeDirectory,
        entry.parentPath.slice(absoluteDirectory.length + 1),
        entry.name
      ).replaceAll("\\", "/");
      return { path, source: readFileSync(join(projectRoot, path), "utf8") };
    });
}
