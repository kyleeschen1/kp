import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { test } from "node:test";

import {
  kpModuleOwnershipRules,
  kpModuleOwnershipZoneIds,
  kpModuleOwnershipZones,
  resolveKpModuleOwnershipRule,
  resolveKpModuleOwnershipZone
} from "../src/architecture/kp-module-ownership.ts";

test("module ownership declares every zone exactly once", () => {
  assert.deepEqual(Object.keys(kpModuleOwnershipZones), [
    ...kpModuleOwnershipZoneIds
  ]);
  assert.equal(
    new Set(kpModuleOwnershipRules.map(({ pathPrefix }) => pathPrefix)).size,
    kpModuleOwnershipRules.length
  );
  assert.ok(
    kpModuleOwnershipRules.every(
      ({ pathPrefix }) =>
        pathPrefix.startsWith("src/") && !pathPrefix.includes("\\")
    )
  );
});

test("specific reader seams override the broader product host", () => {
  assert.equal(
    resolveKpModuleOwnershipZone(
      "src/reader/compiler/place-value-addition-visual-reference.ts"
    )?.id,
    "neutral-core"
  );
  assert.equal(
    resolveKpModuleOwnershipZone(
      "src/reader/renderers/canonical-equation-renderer.ts"
    )?.id,
    "renderer"
  );
  assert.equal(
    resolveKpModuleOwnershipZone("src/reader/app/bootstrap.ts")?.id,
    "application"
  );
  assert.equal(
    resolveKpModuleOwnershipZone("src/reader/document/public-api.ts")?.id,
    "neutral-core"
  );
});

test("core, renderer, experience, public, and host examples resolve explicitly", () => {
  const examples = {
    "src/semantic/document.ts": "neutral-core",
    "src/animation/runtime-sampler.ts": "neutral-core",
    "src/rendering/graph-svg.ts": "renderer",
    "src/tutorial/card-runtime.ts": "experience",
    "src/public/kp-animation-sdk.ts": "public-api",
    "src/editor/editor.ts": "application",
    "src/architecture/runtime-authority-inventory.ts": "governance",
    "src/experiments/canonical-animation-review.ts": "experiment"
  } as const;

  for (const [path, expectedZone] of Object.entries(examples)) {
    assert.equal(resolveKpModuleOwnershipZone(path)?.id, expectedZone, path);
  }
});

test("ownership matching is repository-relative and longest-prefix wins", () => {
  assert.equal(
    resolveKpModuleOwnershipRule(
      ".\\src\\reader\\compiler\\portable-fixture.ts"
    )?.pathPrefix,
    "src/reader/compiler/"
  );
  assert.equal(resolveKpModuleOwnershipZone("tests/example.test.ts"), undefined);
});

test("every current production code module has an explicit owner", () => {
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const sourceRoot = join(repositoryRoot, "src");
  const sourcePaths = collectCodeModules(sourceRoot).map((path) =>
    relative(repositoryRoot, path).replaceAll("\\", "/")
  );
  const unowned = sourcePaths.filter(
    (path) => resolveKpModuleOwnershipZone(path) === undefined
  );

  assert.ok(sourcePaths.length > 1_500);
  assert.deepEqual(unowned, []);
});

function collectCodeModules(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectCodeModules(path);
      return /\.(?:ts|svelte)$/.test(entry.name) ? [path] : [];
    })
    .sort();
}
