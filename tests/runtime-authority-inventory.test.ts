import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  kpRuntimeAuthorityInventory
} from "../src/architecture/runtime-authority-inventory.ts";
import {
  kpLegacyArchitectureExceptionBaseline
} from "../src/architecture/legacy-exception-baseline.ts";

test("runtime authorities are unique, live, and state an ownership invariant", () => {
  assert.equal(
    new Set(kpRuntimeAuthorityInventory.map(({ id }) => id)).size,
    kpRuntimeAuthorityInventory.length
  );
  for (const entry of kpRuntimeAuthorityInventory) {
    assert.equal(existsSync(entry.ownerPath), true, entry.id);
    assert.ok(entry.scope.length >= 20, entry.id);
    assert.ok(entry.invariant.length >= 70, entry.id);
    if (entry.status === "compatibility-managed") {
      assert.ok((entry.replacementCondition?.length ?? 0) >= 50, entry.id);
    }
  }
});

test("known singleton registries are classified instead of normalized", () => {
  const legacyRegistryPaths = kpLegacyArchitectureExceptionBaseline
    .filter(({ kind }) => kind === "module-singleton-registry")
    .map(({ sourceFile }) => sourceFile);
  const classifiedPaths = new Set(kpRuntimeAuthorityInventory
    .filter(({ status }) => status === "compatibility-managed")
    .map(({ ownerPath }) => ownerPath));
  for (const path of legacyRegistryPaths) {
    if (path === "src/project-dashboard/capability-preview.ts") {
      assert.equal(classifiedPaths.has(path), false, path);
      continue;
    }
    assert.equal(classifiedPaths.has(path as `src/${string}.ts`), true, path);
  }
});

test("capability loading and presentation caching do not register on import", () => {
  const capabilityHost = readFileSync(
    "src/editor/selected-surface-capability-host.ts",
    "utf8"
  );
  const presentationCache = readFileSync(
    "src/animation/operation-presentation-plan-types.ts",
    "utf8"
  );
  assert.doesNotMatch(capabilityHost, /^registerKpEditor\w+\(\);/m);
  assert.doesNotMatch(presentationCache, /^registerKpOperationPresentationPlan\(/m);
  assert.match(presentationCache, /new WeakMap/);
});

test("sampling, clock arbitration, and frame delivery remain distinct", () => {
  const entries = new Map(kpRuntimeAuthorityInventory.map((entry) => [
    entry.id,
    entry
  ]));
  assert.equal(entries.get("runtime.animation-sampler")?.kind, "semantic-sampler");
  assert.equal(entries.get("runtime.reader-clock-arbitration")?.kind, "playback-clock");
  assert.equal(entries.get("runtime.reader-frame-scheduler")?.kind, "frame-scheduler");
});
