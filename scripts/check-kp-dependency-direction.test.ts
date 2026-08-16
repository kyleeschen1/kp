import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { kpDependencyDirectionExceptions } from "../src/architecture/kp-dependency-direction-exceptions.ts";
import { auditKpDependencyDirectionGraph } from "./check-kp-dependency-direction.ts";
import { collectKpTypescriptImportGraph } from "./typescript-import-extractor.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const productionGraph = collectKpTypescriptImportGraph(repositoryRoot);

test("global dependency audit accepts only the exact retiring baseline", () => {
  const audit = auditKpDependencyDirectionGraph(productionGraph);

  assert.ok(audit.sourceModuleCount > 1_500);
  assert.ok(audit.localEdgeCount > 3_000);
  assert.equal(audit.exactExceptionCount, 0);
  assert.deepEqual(audit.issues, []);
});

test("global dependency audit rejects a new inversion", () => {
  const audit = auditKpDependencyDirectionGraph({
    ...productionGraph,
    localEdges: [
      ...productionGraph.localEdges,
      {
        importer: "src/semantic/new-leak.ts",
        specifier: "../tutorial/card-runtime.ts",
        target: "src/tutorial/card-runtime.ts",
        kind: "runtime",
        syntax: "import",
        line: 4,
        column: 8
      }
    ]
  });

  assert.ok(
    audit.issues.some((issue) =>
      issue.includes("new dependency inversion: src/semantic/new-leak.ts:4:8")
    )
  );
});

test("global dependency audit demands retirement of stale exceptions", () => {
  const audit = auditKpDependencyDirectionGraph(productionGraph, [
    ...kpDependencyDirectionExceptions,
    {
      id: "stale.synthetic",
      importer: "src/semantic/retired.ts",
      target: "src/tutorial/retired.ts",
      kind: "runtime",
      owner: "program-trace-neutralization",
      retireWhen: "The synthetic edge is absent and must not remain grandfathered.",
      plannedSlice: "s12"
    }
  ]);

  assert.ok(
    audit.issues.includes(
      "stale dependency exception: stale.synthetic should retire with " +
        "program-trace-neutralization (s12)"
    )
  );
});
