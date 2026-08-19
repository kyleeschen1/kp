import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { kpOperationEvaluationPresentationCoreEntries } from
  "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  kpOperationEvaluationAuthorityDescriptors,
  resolveKpOperationEvaluationAuthority
} from "../src/semantic/operation-evaluation-authority.ts";

test("semantic descriptors are the exact source for presentation entries", () => {
  assert.deepEqual(
    kpOperationEvaluationPresentationCoreEntries.map((entry) => ({
      presentationId: entry.id,
      transformationKind: entry.transformationKind,
      semanticOperationIds: entry.semanticOperationIds,
      ...(entry.definitionIds.length === 0
        ? {}
        : { definitionId: entry.definitionIds[0] })
    })),
    kpOperationEvaluationAuthorityDescriptors
  );
  assert.equal(
    resolveKpOperationEvaluationAuthority("simplifyConstantProduct")
      .semanticOperationIds[0],
    "kp.algebra.simplify-constant-product"
  );
});

test("equation authoring does not import executable presentation registry", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-operation-declarations.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /operation-evaluation-presentation-registry/u);

  const authority = readFileSync(new URL(
    "../src/semantic/operation-evaluation-authority.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(authority,
    /(?:src\/animation|src\/rendering|\.\.\/animation|\.\.\/rendering)/u);
});
