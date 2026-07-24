import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationPresentationProfileV1,
  kpPresentationProfileSchemaVersion,
  validateKpEquationPresentationProfileV1
} from "../src/animation/equation-presentation-profile.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";

const solveXPayload = {
  kind: "equation-presentation" as const,
  motion: "continuity-v1" as const,
  nativeHandoff: "atomic-v1" as const,
  cancellation: "counter-orbit-v1" as const,
  zeroWitness: "none" as const,
  successor: "counter-convergence-v1" as const,
  depth: "semantic-depth-v1" as const,
  continuants: "transit-then-reflow-v1" as const,
  branchStrategy: "together" as const
};

test("constructs a frozen, versioned equation presentation profile", () => {
  const profile = createKpEquationPresentationProfileV1({
    payload: solveXPayload
  });

  assert.deepEqual(profile, {
    schemaVersion: kpPresentationProfileSchemaVersion,
    domain: "equation",
    payload: solveXPayload,
    extensions: []
  });
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.payload), true);
  assert.equal(Object.isFrozen(profile.extensions), true);
  assert.deepEqual(validateKpEquationPresentationProfileV1(profile), []);
});

test("validates schema, domain, payload recipes, and branch strategy", () => {
  const issues = validateKpEquationPresentationProfileV1({
    schemaVersion: "kp.presentation-profile.v9",
    domain: "graph",
    payload: {
      ...solveXPayload,
      kind: "semantic-equation",
      successor: "teleport-v9",
      branchStrategy: "random"
    },
    extensions: []
  });

  assert.deepEqual(
    issues.map((candidate) => [candidate.path, candidate.code]),
    [
      ["$.schemaVersion", "profile.schema"],
      ["$.domain", "profile.domain"],
      ["$.payload.kind", "profile.domain"],
      ["$.payload.successor", "profile.recipe"],
      ["$.payload.branchStrategy", "profile.recipe"]
    ]
  );
});

test("v1 rejects untyped extension bags", () => {
  const issues = validateKpEquationPresentationProfileV1({
    schemaVersion: kpPresentationProfileSchemaVersion,
    domain: "equation",
    payload: solveXPayload,
    extensions: [{
      kind: "arbitrary",
      semanticTruth: "x = 4"
    }]
  });

  assert.deepEqual(issues, [{
    path: "$.extensions",
    code: "profile.extension",
    message: "Presentation profile v1 has no registered typed extensions."
  }]);
});

test("presentation-profile substitution cannot mutate semantic truth", () => {
  const animation = createLinearSolveAnimationAsset();
  const semanticBefore = structuredClone({
    bundle: animation.bundle,
    transformations: animation.transformations,
    transformationTree: animation.transformationTree
  });
  const standard = createKpEquationPresentationProfileV1({
    payload: {
      ...solveXPayload,
      motion: "semantic-material-v2",
      nativeHandoff: "crossfade-v1",
      branchStrategy: "staggered"
    }
  });
  const continuity = createKpEquationPresentationProfileV1({
    payload: solveXPayload
  });

  assert.notDeepEqual(standard.payload, continuity.payload);
  assert.deepEqual({
    bundle: animation.bundle,
    transformations: animation.transformations,
    transformationTree: animation.transformationTree
  }, semanticBefore);
  assert.equal("transformations" in continuity.payload, false);
  assert.equal("correspondence" in continuity.payload, false);
  assert.equal("renderer" in continuity.payload, false);
});
