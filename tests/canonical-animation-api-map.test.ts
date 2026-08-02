import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as animationAuthoring from "../src/animation/public-api.ts";
import * as equationMotifs from "../src/animation/motifs/public-api.ts";
import {
  kpCanonicalAnimationApiMap
} from "../src/architecture/canonical-animation-api-map.ts";
import * as conceptPublication from "../src/authoring/public-api.ts";
import * as providerIntegration from "../src/integrations/public-api.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const documentation = readFileSync(
  join(projectRoot, "docs/project/reviews/2026-08-02-canonical-animation-api-map.md"),
  "utf8"
);

test("documented public runtime exports exactly match executable modules", () => {
  const modules = new Map<string, Record<string, unknown>>([
    ["animation-authoring", animationAuthoring],
    ["concept-publication", conceptPublication],
    ["provider-integration", providerIntegration],
    ["equation-motif-vocabulary", equationMotifs]
  ]);

  for (const [id, module] of modules) {
    assert.deepEqual(
      [...entry(id).runtimeExports].sort(),
      Object.keys(module).sort(),
      id
    );
  }
});

test("API map names live boundaries and caller examples", () => {
  assert.equal(
    new Set(kpCanonicalAnimationApiMap.map(({ id }) => id)).size,
    kpCanonicalAnimationApiMap.length
  );
  for (const boundary of kpCanonicalAnimationApiMap) {
    assert.equal(existsSync(join(projectRoot, boundary.path)), true, boundary.id);
    assert.match(documentation, new RegExp(escape(boundary.id)));
    assert.match(documentation, new RegExp(escape(boundary.path)));
    for (const caller of boundary.callerExamples) {
      assert.equal(existsSync(join(projectRoot, caller)), true, caller);
    }
  }
});

test("one public asset-authoring path coexists with a bounded equation vocabulary", () => {
  assert.deepEqual(
    kpCanonicalAnimationApiMap
      .filter(({ kind }) => kind === "supported-public")
      .map(({ id }) => id),
    ["animation-authoring"]
  );
  const motifs = entry("equation-motif-vocabulary");
  assert.equal(motifs.callerExamples.length, 0);
  assert.ok(motifs.exclusions.includes("universal motif registry"));
  assert.ok(motifs.exclusions.includes("graph presentation"));
  assert.ok(motifs.exclusions.includes("programming presentation"));
  assert.equal(
    kpCanonicalAnimationApiMap.some(({ path }) =>
      path === ("src/editor/api-catalog/public-api.ts" as never)
    ),
    false
  );
});

test("reader public-api files remain subsystem boundaries, not a second authoring path", () => {
  const readers = kpCanonicalAnimationApiMap.filter(
    ({ kind }) => kind === "subsystem-internal"
  );
  assert.deepEqual(readers.map(({ id }) => id), [
    "reader-compiler",
    "reader-runtime",
    "reader-renderers"
  ]);
  assert.ok(readers.every(({ runtimeExports, callerExamples }) =>
    runtimeExports.length === 0 && callerExamples.length === 0
  ));
});

function entry(id: string) {
  const result = kpCanonicalAnimationApiMap.find((candidate) =>
    candidate.id === id
  );
  assert.ok(result, `missing API map entry ${id}`);
  return result;
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
