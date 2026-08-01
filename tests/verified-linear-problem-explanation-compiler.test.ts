import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canonicalLinearProblem,
  generateLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import type { LinearProblemDto } from "../protocols/public-api.ts";
import {
  inspectVerifiedLinearProblemAnimationTrace,
  mapLinearProblemToKpTrace
} from "../src/integrations/public-api.ts";
import {
  compileVerifiedLinearProblemAnimation
} from "../src/animation/verified-linear-problem-animation-compiler.ts";
import {
  compileVerifiedLinearProblemExplanation
} from "../src/tutorial/verified-linear-problem-explanation-compiler.ts";

test("compiler creates the deterministic claim authority, spine, and learner projection", () => {
  const session = compiledSession(canonicalLinearProblem());
  const result = compileVerifiedLinearProblemExplanation(session);
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const { claimAuthority, spine, projection } = result.compilation;

  assert.deepEqual(
    claimAuthority.claims.map(({ kind, sourceRefId }) => [kind, sourceRefId]),
    [
      ["equation-frame", "frame.initial"],
      ["equivalence-operation", "operation.step.1"],
      ["equation-frame", "frame.step.1"],
      ["equivalence-operation", "operation.step.2"],
      ["solution", "frame.step.2"]
    ]
  );
  assert.deepEqual(spine.sections.map(({ kind }) => kind), [
    "orientation",
    "subtract",
    "divide",
    "solution"
  ]);
  assert.equal(projection.sections.flatMap(({ cues }) => cues).length, 8);
  assert.equal(
    projection.sections.flatMap(({ cues }) => cues)
      .every(({ wordCount }) => wordCount <= 12),
    true
  );
  assert.equal(Object.isFrozen(projection.sections[0]?.cues[0]?.segments), true);
});

test("learner projection snapshot is concise, inline-math-ready, and exactly sourced", () => {
  const session = compiledSession(canonicalLinearProblem());
  const result = compileVerifiedLinearProblemExplanation(session);
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const cues = result.compilation.projection.sections.flatMap(
    ({ cues: sectionCues }) => sectionCues
  );
  assert.deepEqual(cues.map((cue) => ({
    template: cue.templateId,
    content: cue.segments.map((segment) => segment.kind === "text"
      ? segment.text
      : `$${segment.latex}$`).join(""),
    words: cue.wordCount
  })), [
    { template: "solve.goal.variable-alone", content: "Get $x$ by itself.", words: 4 },
    { template: "solve.invariant.same-change", content: "Make the same change on both sides to keep them equal.", words: 11 },
    { template: "solve.action.subtract-both-sides", content: "Subtract $3$ from both sides.", words: 5 },
    { template: "solve.mechanism.additive-cancellation", content: "$+3$ and $-3$ undo each other.", words: 6 },
    { template: "solve.checkpoint.subtraction", content: "The equation is now $2x=5$.", words: 6 },
    { template: "solve.action.divide-both-sides", content: "Divide both sides by $2$.", words: 6 },
    { template: "solve.mechanism.multiplicative-cancellation", content: "$\\frac{2x}{2}$ leaves $x$ on the left.", words: 6 },
    { template: "solve.payoff.verified-solution", content: "$x=\\frac{5}{2}$ is the verified solution.", words: 5 }
  ]);
  for (const cue of cues) {
    for (const segment of cue.segments) {
      if (segment.kind !== "math") continue;
      assert.equal(cue.claimRefs.includes(segment.claimRef), true);
      assert.ok(segment.sourceObjectId.includes(session.bridge.identity.semanticNamespace));
      assert.ok(segment.sourceSelectorIds.length > 0);
    }
  }
});

test("compiler is deterministic across repeated calls and bounded generated instances", () => {
  const problems = [canonicalLinearProblem(), ...positiveGeneratedProblems(8)];
  for (const problem of problems) {
    const session = compiledSession(problem);
    const first = compileVerifiedLinearProblemExplanation(session);
    const second = compileVerifiedLinearProblemExplanation(session);
    assert.equal(first.status, "compiled", problem.problemId);
    assert.equal(second.status, "compiled", problem.problemId);
    if (first.status !== "compiled" || second.status !== "compiled") continue;
    assert.equal(JSON.stringify(first), JSON.stringify(second));
    const cues = first.compilation.projection.sections.flatMap(({ cues }) => cues);
    assert.equal(cues.length, 8);
    assert.equal(cues.every(({ wordCount }) => wordCount <= 12), true);
    assert.equal(
      new Set(first.compilation.claimAuthority.claims.map(({ id }) => id)).size,
      5
    );
  }
});

test("compiler fails closed on missing lineage, unsupported operations, and free-form recipes", () => {
  const session = compiledSession(canonicalLinearProblem());
  const missing = compileVerifiedLinearProblemExplanation({
    ...session,
    animationCompilation: {
      ...session.animationCompilation,
      operationLineage: session.animationCompilation.operationLineage.slice(1)
    }
  });
  assert.equal(missing.status, "rejected");
  if (missing.status === "rejected") {
    assert.equal(missing.diagnostics[0]?.code, "missing-claim-source");
  }

  const unsupported = compileVerifiedLinearProblemExplanation({
    ...session,
    bridge: {
      ...session.bridge,
      operationBindings: [session.bridge.operationBindings[0]!]
    }
  });
  assert.equal(unsupported.status, "rejected");
  if (unsupported.status === "rejected") {
    assert.equal(
      unsupported.diagnostics[0]?.code,
      "unsupported-operation-sequence"
    );
  }

  const canonical = compileVerifiedLinearProblemExplanation(session);
  assert.equal(canonical.status, "compiled");
  if (canonical.status !== "compiled") return;
  const recipe = compileVerifiedLinearProblemExplanation({
    ...session,
    spine: {
      ...canonical.compilation.spine,
      visualRecipe: "move-left-then-fade"
    } as typeof canonical.compilation.spine
  });
  assert.equal(recipe.status, "rejected");
  if (recipe.status === "rejected") {
    assert.equal(recipe.diagnostics[0]?.code, "spine-invalid");
    assert.match(recipe.diagnostics[0]?.message ?? "", /visualRecipe/);
  }
});

test("compiler has no network, model, DOM, renderer, or timer dependency", () => {
  const source = readFileSync(new URL(
    "../src/tutorial/verified-linear-problem-explanation-compiler.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of [
    "fetch(",
    "requestAnimationFrame",
    "setTimeout(",
    'from "../rendering/',
    "HTMLElement",
    "OpenAI",
    "llm"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

function compiledSession(problem: LinearProblemDto) {
  const trace = traceForProblem(problem);
  const bridgeResult = inspectVerifiedLinearProblemAnimationTrace(trace);
  assert.equal(bridgeResult.status, "accepted");
  if (bridgeResult.status !== "accepted") {
    throw new Error(`Expected accepted bridge for ${problem.problemId}.`);
  }
  const animationResult = compileVerifiedLinearProblemAnimation(
    bridgeResult.contract
  );
  assert.equal(animationResult.status, "compiled");
  if (animationResult.status !== "compiled") {
    throw new Error(`Expected compiled animation for ${problem.problemId}.`);
  }
  return {
    bridge: bridgeResult.contract,
    animationCompilation: animationResult.compilation
  };
}

function traceForProblem(problem: LinearProblemDto) {
  const coefficient = BigInt(problem.equation.left.coefficient.numerator);
  const addend = BigInt(problem.equation.left.constant.numerator);
  const right = BigInt(problem.equation.right.constant.numerator);
  const difference = right - addend;
  const afterSubtract = equation(
    coefficient,
    0n,
    0n,
    difference
  );
  const solved = {
    left: {
      variable: "x",
      coefficient: { numerator: "1", denominator: "1" },
      constant: { numerator: "0", denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: "0", denominator: "1" },
      constant: problem.solution
    }
  };
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
          operation: `operation.${problem.problemId}.subtract`,
          equation: `equation.${problem.problemId}.after-subtract`
        }
      },
      {
        request: divideRequest,
        response: verifyLinearStep(divideRequest),
        semanticIds: {
          operation: `operation.${problem.problemId}.divide`,
          equation: `equation.${problem.problemId}.solved`
        }
      }
    ],
    solutionVerification: {
      request: solutionRequest,
      response: verifyLinearSolution(solutionRequest)
    },
    initialSemanticIds: {
      equation: `equation.${problem.problemId}.initial`,
      leftVariable: `term.${problem.problemId}.left-variable`,
      leftConstant: `term.${problem.problemId}.left-constant`,
      rightVariable: `term.${problem.problemId}.right-variable`,
      rightConstant: `term.${problem.problemId}.right-constant`
    }
  });
}

function positiveGeneratedProblems(count: number): readonly LinearProblemDto[] {
  const problems: LinearProblemDto[] = [];
  for (let index = 0; problems.length < count && index < 200; index += 1) {
    const problem = generateLinearProblem({
      schemaVersion: "linear-problem.generate.request.v1",
      seed: `explanation-property-${index}`,
      constraints: {
        minimumCoefficient: 2,
        maximumCoefficient: 12,
        allowFractionalSolution: true
      }
    });
    const addend = BigInt(problem.equation.left.constant.numerator);
    const right = BigInt(problem.equation.right.constant.numerator);
    if (right > addend) problems.push(problem);
  }
  assert.equal(problems.length, count);
  return problems;
}

function equation(
  leftCoefficient: bigint,
  leftConstant: bigint,
  rightCoefficient: bigint,
  rightConstant: bigint
) {
  return {
    left: {
      variable: "x",
      coefficient: {
        numerator: String(leftCoefficient),
        denominator: "1"
      },
      constant: {
        numerator: String(leftConstant),
        denominator: "1"
      }
    },
    right: {
      variable: "x",
      coefficient: {
        numerator: String(rightCoefficient),
        denominator: "1"
      },
      constant: {
        numerator: String(rightConstant),
        denominator: "1"
      }
    }
  };
}
