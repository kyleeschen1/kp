import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpLegacyArchitectureExceptionBaseline,
  type KpLegacyArchitectureExceptionKind
} from "../src/architecture/legacy-exception-baseline.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("legacy architecture baseline is a unique closed characterization", () => {
  const expectedCounts: Readonly<Record<KpLegacyArchitectureExceptionKind, number>> = {
    "cross-layer-import": 1,
    "module-singleton-registry": 3,
    "central-route-branch": 1,
    "content-owned-style": 2
  };
  const ids = new Set<string>();
  const actualCounts: Record<KpLegacyArchitectureExceptionKind, number> = {
    "cross-layer-import": 0,
    "module-singleton-registry": 0,
    "central-route-branch": 0,
    "content-owned-style": 0
  };

  for (const exception of kpLegacyArchitectureExceptionBaseline) {
    assert.ok(!ids.has(exception.id), `duplicate legacy exception ${exception.id}`);
    ids.add(exception.id);
    actualCounts[exception.kind] += 1;
    assert.ok(exception.rationale.length >= 80, `${exception.id} needs boundary rationale`);
    assert.ok(exception.evidencePatterns.length > 0, `${exception.id} needs source evidence`);
  }

  assert.deepEqual(actualCounts, expectedCounts);
});

test("every legacy architecture exception resolves to current source evidence", () => {
  for (const exception of kpLegacyArchitectureExceptionBaseline) {
    const source = readFileSync(join(projectRoot, exception.sourceFile), "utf8");
    for (const pattern of exception.evidencePatterns) {
      assert.ok(
        source.includes(pattern),
        `${exception.id} is stale: ${exception.sourceFile} no longer contains ${pattern}`
      );
    }
  }
});

