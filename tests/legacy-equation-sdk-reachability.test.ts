import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { collectKpTypescriptImportGraph } from
  "../scripts/typescript-import-extractor.ts";
import {
  kpLegacyEquationSdkPaths,
  kpLegacyEquationSdkReachabilityAudit as audit
} from "../src/architecture/legacy-equation-sdk-reachability.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("legacy equation SDK has no supported package or production entrypoint", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  ) as { readonly private?: boolean; readonly exports?: unknown };

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.exports, undefined);
  assert.equal(audit.packageExposure, "private-without-exports");
  assert.equal(audit.status, "retirement-authorized");
});

test("legacy equation SDK reachability is exact across source, tests, and scripts", () => {
  for (const sourceDirectory of ["src", "tests", "scripts"] as const) {
    const graph = collectKpTypescriptImportGraph(repositoryRoot, sourceDirectory);
    for (const target of kpLegacyEquationSdkPaths) {
      const importers = graph.localEdges
        .filter((edge) => edge.target === target)
        .map(({ importer }) => importer)
        .sort();
      const expected = sourceDirectory === "src"
        ? audit.productionImporters[target]
        : sourceDirectory === "tests"
          ? audit.testImporters[target]
          : audit.scriptImporters[target];
      assert.deepEqual(importers, expected, `${sourceDirectory} -> ${target}`);
    }
  }
});

test("legacy SDK behavior already has lower-layer replacement authorities", () => {
  for (const sourcePath of audit.replacementAuthorities) {
    assert.ok(
      readFileSync(new URL(`../${sourcePath}`, import.meta.url), "utf8").length > 0,
      sourcePath
    );
  }
});
