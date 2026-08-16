import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { collectKpTypescriptImportGraph } from "../scripts/typescript-import-extractor.ts";
import {
  kpDependencyDirectionExceptionKey,
  kpDependencyDirectionExceptions,
  resolveKpDependencyDirectionException
} from "../src/architecture/kp-dependency-direction-exceptions.ts";
import { evaluateKpDependencyDirection } from "../src/architecture/kp-dependency-direction-policy.ts";

test("every current direction violation has one exact retirement entry", () => {
  const graph = collectKpTypescriptImportGraph(
    fileURLToPath(new URL("..", import.meta.url))
  );
  const violations = graph.localEdges
    .map(evaluateKpDependencyDirection)
    .filter((value) => value !== undefined);

  assert.equal(violations.length, 18);
  assert.equal(kpDependencyDirectionExceptions.length, 18);
  assert.deepEqual(
    violations.map(kpDependencyDirectionExceptionKey).sort(),
    kpDependencyDirectionExceptions
      .map(kpDependencyDirectionExceptionKey)
      .sort()
  );
  assert.ok(
    violations.every(
      (violation) =>
        resolveKpDependencyDirectionException(violation) !== undefined
    )
  );
});

test("exception ledger is exact, unique, owned, and scheduled", () => {
  assert.equal(
    new Set(kpDependencyDirectionExceptions.map(({ id }) => id)).size,
    kpDependencyDirectionExceptions.length
  );
  assert.equal(
    new Set(
      kpDependencyDirectionExceptions.map(kpDependencyDirectionExceptionKey)
    ).size,
    kpDependencyDirectionExceptions.length
  );
  assert.ok(
    kpDependencyDirectionExceptions.every(
      ({ importer, target, retireWhen, plannedSlice }) =>
        importer.startsWith("src/") &&
        target.startsWith("src/") &&
        retireWhen.length > 20 &&
        /^s(?:12|15|18|20|22)$/.test(plannedSlice)
    )
  );
});

test("an unlisted inversion cannot borrow a wildcard exception", () => {
  assert.equal(
    resolveKpDependencyDirectionException({
      importer: "src/semantic/new-leak.ts",
      target: "src/tutorial/programming-execution-trace.ts",
      kind: "type-only"
    }),
    undefined
  );
});
