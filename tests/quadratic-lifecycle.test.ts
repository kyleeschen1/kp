import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../src/semantic/quadratic-completing-square-authority.ts";
import { createCanonicalKpQuadraticFormulaAuthority } from "../src/semantic/quadratic-formula-authority.ts";
import {
  createCanonicalKpQuadraticLifecycle,
  sampleKpQuadraticLifecycle,
  validateKpQuadraticLifecycle,
  type KpQuadraticLifecycleContract
} from "../src/semantic/quadratic-lifecycle.ts";
import { compileKpQuadraticMethodConvergence } from "../src/semantic/quadratic-method-convergence.ts";
import { createCanonicalKpQuadraticPlusMinusBranches } from "../src/semantic/quadratic-plus-minus-branches.ts";
import { createCanonicalKpQuadraticSolutionMethodGraph } from "../src/semantic/quadratic-solution-method-graph.ts";
import { createKpQuadraticSolutionSetFromFixture } from "../src/semantic/quadratic-solution-set.ts";

test("every visible entity has one lifecycle and semantic correspondence", () => {
  const contract = canonicalLifecycle();
  assert.deepEqual(validateKpQuadraticLifecycle(contract), []);
  assert.equal(
    new Set(contract.lifecycles.map(({ entityId }) => entityId)).size,
    contract.lifecycles.length
  );
  assert.ok(contract.lifecycles.every(({ authorityRef }) => authorityRef.length > 0));
});

test("both methods settle from the shared source through branches into shared roots", () => {
  const contract = canonicalLifecycle();
  for (const path of contract.paths) {
    assert.deepEqual(path.frames[0]?.visibleEntityIds.length, 1);
    assert.equal(
      path.frames.find(({ checkpointId }) => checkpointId.startsWith("split."))
        ?.visibleEntityIds.length,
      2
    );
    assert.deepEqual(path.frames.at(-1)?.visibleEntityIds.slice(0, 2), [
      "entity.root:2/1",
      "entity.root:3/1"
    ]);
  }
});

test("direct seek is stateless with exact endpoint settlement", () => {
  const contract = canonicalLifecycle();
  const methodId = "method.quadratic.completing-square";
  assert.deepEqual(
    sampleKpQuadraticLifecycle({ contract, methodId, progress: 0.63 }),
    sampleKpQuadraticLifecycle({ contract, methodId, progress: 0.63 })
  );
  assert.equal(
    sampleKpQuadraticLifecycle({ contract, methodId, progress: 0 }).checkpointId,
    "initial"
  );
  assert.match(
    sampleKpQuadraticLifecycle({ contract, methodId, progress: 1 }).checkpointId,
    /^reunion\./
  );
});

test("rewind mirrors the exact forward semantic frame", () => {
  const contract = canonicalLifecycle();
  for (const methodId of contract.paths.map(({ methodId }) => methodId)) {
    for (const progress of [0, 0.1, 0.37, 0.5, 0.82, 1]) {
      const forward = sampleKpQuadraticLifecycle({
        contract,
        methodId,
        progress
      });
      const rewind = sampleKpQuadraticLifecycle({
        contract,
        methodId,
        progress: 1 - progress,
        direction: "rewind"
      });
      assert.deepEqual(rewind, forward);
    }
  }
});

test("validator rejects unclassified visible entities and ambiguous reconstruction", () => {
  const contract = canonicalLifecycle();
  const firstPath = contract.paths[0]!;
  const broken = {
    ...contract,
    paths: [
      {
        ...firstPath,
        frames: [
          {
            ...firstPath.frames[0]!,
            visibleEntityIds: ["entity.unclassified"]
          },
          { ...firstPath.frames[0]! },
          ...firstPath.frames.slice(2)
        ]
      },
      contract.paths[1]!
    ]
  } as KpQuadraticLifecycleContract;
  const codes = validateKpQuadraticLifecycle(broken).map(({ code }) => code);
  assert.ok(codes.includes("missing-lifecycle"));
  assert.ok(codes.includes("reconstruction"));
});

test("lifecycle contract is deeply immutable and JSON-stable", () => {
  const contract = canonicalLifecycle();
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.lifecycles), true);
  assert.equal(Object.isFrozen(contract.paths), true);
  assert.equal(Object.isFrozen(contract.paths[0]?.frames), true);
  assert.deepEqual(JSON.parse(JSON.stringify(contract)), contract);
});

function canonicalLifecycle() {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const solutionSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const graph = createCanonicalKpQuadraticSolutionMethodGraph({
    completingSquare: createCanonicalKpCompletingSquareAuthority(fixture),
    formula: createCanonicalKpQuadraticFormulaAuthority(fixture)
  });
  const branchSets = createCanonicalKpQuadraticPlusMinusBranches({
    graph,
    solutionSet
  });
  const convergence = compileKpQuadraticMethodConvergence({
    fixture,
    solutionSet,
    branchSets
  });
  return createCanonicalKpQuadraticLifecycle({
    graph,
    branchSets,
    convergence
  });
}
