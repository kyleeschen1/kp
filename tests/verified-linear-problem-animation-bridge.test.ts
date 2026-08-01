import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canonicalLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import type {
  KpLinearEquationTrace
} from "../domains/public-api.ts";
import {
  inspectVerifiedLinearProblemAnimationTrace,
  kpVerifiedLinearProblemAnimationOperations,
  mapLinearProblemToKpTrace
} from "../src/integrations/public-api.ts";

test("bridge freezes exact provider, operation, provenance, and instance identity", () => {
  const trace = canonicalTrace();
  const result = inspectVerifiedLinearProblemAnimationTrace(trace);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;

  assert.deepEqual(kpVerifiedLinearProblemAnimationOperations, [
    "subtract-both-sides",
    "divide-both-sides"
  ]);
  assert.deepEqual(result.contract.identity, {
    instanceId:
      `instance.generated.linear-solve.${trace.provenance.problemId}`,
    semanticNamespace:
      `generated.linear-solve.${trace.provenance.problemId}`,
    animationId:
      `animation.generated.linear-solve.${trace.provenance.problemId}`,
    sourceTraceId: trace.id,
    sourceProblemId: trace.provenance.problemId
  });
  assert.deepEqual(
    result.contract.operationBindings.map((binding) => ({
      kind: binding.kind,
      source: binding.fromEquationSemanticId,
      target: binding.toEquationSemanticId
    })),
    [
      {
        kind: "subtract-both-sides",
        source: "equation.initial",
        target: "equation.after-subtract"
      },
      {
        kind: "divide-both-sides",
        source: "equation.after-subtract",
        target: "equation.solved"
      }
    ]
  );
  assert.deepEqual(result.contract.provenance, trace.provenance);
  assert.equal(Object.isFrozen(result.contract), true);
  assert.equal(Object.isFrozen(result.contract.trace.frames[0]?.equation.left), true);
});

test("bridge rejects lossy, unverified, diagnostic-bearing, or untrusted traces", () => {
  const trace = canonicalTrace();
  const rejected = inspectVerifiedLinearProblemAnimationTrace({
    ...trace,
    preservation: "lossy",
    solutionVerified: false,
    provenance: {
      ...trace.provenance,
      providerId: "unknown-provider",
      providerVersion: "2.0.0"
    },
    diagnostics: [{
      severity: "warning",
      code: "operation-unmapped",
      path: "steps[0]",
      message: "unsupported"
    }]
  });
  assert.equal(rejected.status, "rejected");
  if (rejected.status !== "rejected") return;
  assert.deepEqual(rejected.diagnostics.map(({ code }) => code), [
    "trace-not-strict",
    "solution-unverified",
    "trace-diagnostics-present",
    "unsupported-provider",
    "unsupported-provider-version"
  ]);
});

test("bridge rejects unsupported operations and every discontinuous authority", () => {
  const trace = canonicalTrace();
  const badOperation = {
    ...trace.operations[0]!,
    kind: "equivalent-rewrite" as const,
    sourceOperation: "provider-private-operation",
    classification: "compressed-equivalent" as const,
    fromFrameId: trace.frames[1]!.id
  };
  const rejected = inspectVerifiedLinearProblemAnimationTrace({
    ...trace,
    operations: [badOperation],
    frames: trace.frames,
    id: "trace.caller-authored",
    provenance: { ...trace.provenance, problemId: "caller authored id" }
  });
  assert.equal(rejected.status, "rejected");
  if (rejected.status !== "rejected") return;
  assert.deepEqual(new Set(rejected.diagnostics.map(({ code }) => code)), new Set([
    "invalid-problem-identity",
    "operation-count-mismatch",
    "trace-discontinuity",
    "unsupported-operation",
    "provider-operation-mismatch",
    "operation-classification-mismatch"
  ]));
});

test("bridge rejects missing and colliding semantic operation identity", () => {
  const trace = canonicalTrace();
  const missing = inspectVerifiedLinearProblemAnimationTrace({
    ...trace,
    frames: [trace.frames[0]!],
    operations: []
  });
  assert.equal(missing.status, "rejected");
  if (missing.status === "rejected") {
    assert.deepEqual(missing.diagnostics.map(({ code }) => code), [
      "missing-operation"
    ]);
  }

  const collision = inspectVerifiedLinearProblemAnimationTrace({
    ...trace,
    operations: trace.operations.map((operation) => ({
      ...operation,
      semanticId: trace.frames[0]!.semanticIds.equation
    }))
  });
  assert.equal(collision.status, "rejected");
  if (collision.status === "rejected") {
    assert.equal(
      collision.diagnostics.some(({ code }) =>
        code === "semantic-identity-conflict"
      ),
      true
    );
  }
});

test("bridge boundary cannot import or expose presentation ownership", () => {
  const source = readFileSync(new URL(
    "../src/integrations/verified-linear-problem-animation-bridge.ts",
    import.meta.url
  ), "utf8");
  assert.equal(source.includes('from "../animation/'), false);
  assert.equal(source.includes('from "../rendering/'), false);
  const result = inspectVerifiedLinearProblemAnimationTrace(canonicalTrace());
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const keys = JSON.stringify(result.contract);
  for (const forbidden of [
    "durationMs",
    "geometry",
    "layout",
    "prose",
    "renderer",
    "timeline"
  ]) {
    assert.equal(keys.includes(forbidden), false, forbidden);
  }
});

function canonicalTrace(): KpLinearEquationTrace {
  const problem = canonicalLinearProblem();
  const afterSubtract = equation(2, 0, 0, 5);
  const solved = equation(1, 0, 0, 5, 2);
  const subtractRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: problem.equation,
    candidate: afterSubtract
  };
  const divideRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: afterSubtract,
    candidate: solved
  };
  const solutionRequest = {
    schemaVersion: "linear-problem.verify-solution.request.v1" as const,
    problem,
    candidate: problem.solution
  };
  return mapLinearProblemToKpTrace({
    generation: {
      schemaVersion: "linear-problem.generate.response.v1",
      problem
    },
    steps: [
      {
        request: subtractRequest,
        response: verifyLinearStep(subtractRequest),
        semanticIds: {
          operation: "operation.subtract-three",
          equation: "equation.after-subtract"
        }
      },
      {
        request: divideRequest,
        response: verifyLinearStep(divideRequest),
        semanticIds: {
          operation: "operation.divide-two",
          equation: "equation.solved"
        }
      }
    ],
    solutionVerification: {
      request: solutionRequest,
      response: verifyLinearSolution(solutionRequest)
    },
    initialSemanticIds: {
      equation: "equation.initial",
      leftVariable: "term.two-x",
      leftConstant: "term.add-three",
      rightVariable: "term.zero-x",
      rightConstant: "term.eight"
    }
  });
}

function equation(
  leftCoefficient: number,
  leftConstant: number,
  rightCoefficient: number,
  rightNumerator: number,
  rightDenominator = 1
) {
  return {
    left: {
      variable: "x",
      coefficient: {
        numerator: String(leftCoefficient),
        denominator: "1"
      },
      constant: { numerator: String(leftConstant), denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: {
        numerator: String(rightCoefficient),
        denominator: "1"
      },
      constant: {
        numerator: String(rightNumerator),
        denominator: String(rightDenominator)
      }
    }
  };
}
