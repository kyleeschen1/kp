import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import {
  inspectVerifiedLinearProblemAnimationTrace,
  mapLinearProblemToKpTrace
} from "../src/integrations/public-api.ts";
import {
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  compileVerifiedLinearProblemAnimation
} from "../src/animation/verified-linear-problem-animation-compiler.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation
} from "../src/semantic/generated-algebra-transformation-authority.ts";
import {
  selectKpAnimationStaticStepCheckpoints
} from "../src/tutorial/static-step-checkpoints.ts";

test("compiler expands one verified generated solve into the canonical asset", () => {
  const contract = acceptedContract();
  const result = compileVerifiedLinearProblemAnimation(contract);
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const { animation } = result.compilation;
  const namespace = contract.identity.semanticNamespace;

  assert.equal(animation.id, contract.identity.animationId);
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.deepEqual(
    animation.bundle.objects.map(({ id }) => id),
    [
      `equation.${namespace}.initial`,
      `equation.${namespace}.subtract-introduced`,
      `equation.${namespace}.additive-cancelled`,
      `equation.${namespace}.after-subtract`,
      `equation.${namespace}.divide-introduced`,
      `equation.${namespace}.solved`
    ]
  );
  assert.deepEqual(
    animation.transformations.map(({ transformType }) => transformType),
    [
      "subtractBothSides",
      "cancelAdditiveInverses",
      "simplifyConstantDifference",
      "divideBothSides",
      "cancelMultiplicativeInverses"
    ]
  );
  assert.equal(
    animation.transformations.every(
      isKpCompilerGeneratedAlgebraTransformation
    ),
    true
  );
  assert.deepEqual(animation.metadata, {
    generatedProblemImport: true,
    generatedProblemInstanceId: contract.identity.instanceId,
    sourceTraceId: contract.identity.sourceTraceId,
    sourceProblemId: contract.identity.sourceProblemId,
    providerId: "linear-problems.exact-rational",
    providerVersion: "1.0.0",
    protocolVersion: "linear-problem.v1",
    providerSeed: "canonical-2x-plus-3"
  });
  assert.equal(animation.presentationProfile?.payload.kind, "equation-presentation");
});

test("compiler preserves instance selectors, provider frames, operations, and rich lineage", () => {
  const contract = acceptedContract();
  const result = compileVerifiedLinearProblemAnimation(contract);
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const { animation, frameLineage, operationLineage } = result.compilation;
  const namespace = contract.identity.semanticNamespace;

  const selectorIds = animation.bundle.objects.flatMap((object) =>
    object.selectors.map(({ id }) => id)
  );
  assert.equal(
    selectorIds.every((id) => id.startsWith(`equation.${namespace}.`)),
    true
  );
  assert.equal(new Set(selectorIds).size, selectorIds.length);
  assert.deepEqual(
    frameLineage.map(({ sourceFrameId }) => sourceFrameId),
    ["frame.initial", "frame.step.1", "frame.step.2"]
  );
  assert.deepEqual(
    operationLineage.map(({ sourceOperationSemanticId, transformationIds }) => [
      sourceOperationSemanticId,
      transformationIds.length
    ]),
    [
      ["operation.subtract-three", 3],
      ["operation.divide-two", 2]
    ]
  );
  assert.equal(
    animation.transformations.every(
      ({ correspondenceMap }) => (correspondenceMap?.records.length ?? 0) > 0
    ),
    true
  );
  assert.equal(
    animation.bundle.objects[3]?.provenance?.sourceIds.includes(
      "frame.step.1"
    ),
    true
  );
  assert.equal(
    animation.bundle.objects[5]?.provenance?.sourceIds.includes(
      "operation.step.2"
    ),
    true
  );
});

test("generated asset is deterministic, checkpointed, direct-seekable, and exactly rewindable", () => {
  const contract = acceptedContract();
  const first = compileVerifiedLinearProblemAnimation(contract);
  const second = compileVerifiedLinearProblemAnimation(contract);
  assert.equal(first.status, "compiled");
  assert.equal(second.status, "compiled");
  if (first.status !== "compiled" || second.status !== "compiled") return;
  const animation = first.compilation.animation;
  assert.equal(
    JSON.stringify(first.compilation),
    JSON.stringify(second.compilation)
  );
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  const checkpoints = selectKpAnimationStaticStepCheckpoints(animation);
  assert.equal(checkpoints.length, 6);
  assert.equal(
    checkpoints.some(({ markers }) =>
      markers?.some(({ id }) => id.includes("provider-after-subtract"))
    ),
    true
  );
  assert.equal(
    checkpoints.some(({ markers }) =>
      markers?.some(({ id }) => id.includes("provider-solved"))
    ),
    true
  );

  for (const progress of [0, 0.07, 0.2, 0.5, 0.8, 0.93, 1]) {
    const forward = sampleKpAnimationRuntimeFrame({
      animation,
      progress,
      direction: "forward"
    });
    const rewind = sampleKpAnimationRuntimeFrame({
      animation,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.deepEqual(
      forward.activeTransformationIds,
      rewind.activeTransformationIds
    );
    assert.deepEqual(forward.phase.nodeIds, rewind.phase.nodeIds);
    assert.deepEqual(
      forward.selectorFrames.map(({ id }) => id),
      rewind.selectorFrames.map(({ id }) => id)
    );
  }
});

test("compiler fails closed on forged identity, unsupported sequence, or equation shape", () => {
  const contract = acceptedContract();
  const forged = compileVerifiedLinearProblemAnimation({
    ...contract,
    identity: { ...contract.identity, animationId: "animation.forged" }
  });
  assert.equal(forged.status, "rejected");
  if (forged.status === "rejected") {
    assert.equal(forged.diagnostics[0]?.code, "bridge-contract-invalid");
  }

  const sequence = compileVerifiedLinearProblemAnimation({
    ...contract,
    operationBindings: [contract.operationBindings[1]!]
  });
  assert.equal(sequence.status, "rejected");
  if (sequence.status === "rejected") {
    assert.equal(
      sequence.diagnostics[0]?.code,
      "unsupported-operation-sequence"
    );
  }

  const malformedTrace = {
    ...contract.trace,
    frames: contract.trace.frames.map((frame, index) =>
      index === 0
        ? {
            ...frame,
            equation: {
              ...frame.equation,
              left: {
                ...frame.equation.left,
                coefficient: { numerator: "1", denominator: "2" }
              }
            }
          }
        : frame
    )
  };
  const shape = compileVerifiedLinearProblemAnimation({
    ...contract,
    trace: malformedTrace
  });
  assert.equal(shape.status, "rejected");
  if (shape.status === "rejected") {
    assert.equal(shape.diagnostics[0]?.code, "unsupported-equation-shape");
  }
});

function acceptedContract() {
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
  const trace = mapLinearProblemToKpTrace({
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
  const result = inspectVerifiedLinearProblemAnimationTrace(trace);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") {
    throw new Error("Expected accepted canonical bridge contract.");
  }
  return result.contract;
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
