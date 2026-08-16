import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { collectKpTypescriptImportGraph } from
  "../scripts/typescript-import-extractor.ts";
import {
  kpLegacyEquationSdkPaths,
  kpLegacyEquationSdkReachabilityAudit as audit
} from "../src/architecture/legacy-equation-sdk-reachability.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("legacy equation SDK is retired from the private package", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  ) as { readonly private?: boolean; readonly exports?: unknown };

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.exports, undefined);
  assert.equal(audit.packageExposure, "private-without-exports");
  assert.equal(audit.status, "retired");
  for (const sourcePath of kpLegacyEquationSdkPaths) {
    assert.equal(existsSync(new URL(`../${sourcePath}`, import.meta.url)), false);
  }
});

test("no source, test, or script imports a retired SDK path", () => {
  for (const sourceDirectory of ["src", "tests", "scripts"] as const) {
    const graph = collectKpTypescriptImportGraph(repositoryRoot, sourceDirectory);
    for (const target of kpLegacyEquationSdkPaths) {
      const basename = target.slice(target.lastIndexOf("/") + 1).replace(/\.ts$/, "");
      assert.deepEqual(
        graph.references.filter(({ specifier }) => specifier.includes(basename)),
        [],
        `${sourceDirectory} -> ${target}`
      );
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
