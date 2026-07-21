import assert from "node:assert/strict";
import test from "node:test";

import {
  generateUnitFractionLinearProblem,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import { generateLinearProblemResponseSchema } from "../protocols/public-api.ts";
import {
  compileKpFractionalLinearStressCase
} from "../src/reader/compiler/public-api.ts";

test("unseen unit-fraction problems compile through all seven exact states", () => {
  const observedProblems = new Set<string>();
  const observedInitialStates = new Set<string>();

  for (let index = 0; index < 64; index += 1) {
    const problem = generateUnitFractionLinearProblem({
      seed: `hidden-fraction-${index}`,
      maximumDenominator: 12,
      maximumConstant: 12,
      maximumQuotient: 12
    });
    assert.equal(generateLinearProblemResponseSchema.safeParse({
      schemaVersion: "linear-problem.generate.response.v1",
      problem
    }).success, true);
    const compiled = compileKpFractionalLinearStressCase(problem);
    assert.equal(compiled.states.length, 7);
    assert.ok(compiled.states.every((state) => state.html.includes('class="katex"')));
    assert.match(compiled.states[0]!.latex, /^\\frac\{x\}\{\d+\} \+ \d+ = \d+$/);
    assert.match(compiled.states.at(-1)!.latex, /^x = \d+$/);

    const shifted = {
      left: {
        ...problem.equation.left,
        constant: { numerator: "0", denominator: "1" }
      },
      right: {
        ...problem.equation.right,
        constant: {
          numerator: compiled.states[3]!.latex.split(" = ")[1]!,
          denominator: "1"
        }
      }
    };
    const solved = {
      left: {
        ...shifted.left,
        coefficient: { numerator: "1", denominator: "1" }
      },
      right: {
        ...shifted.right,
        constant: problem.solution
      }
    };
    assert.equal(verifyLinearStep({
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem,
      previous: problem.equation,
      candidate: shifted
    }).valid, true);
    assert.equal(verifyLinearStep({
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem,
      previous: shifted,
      candidate: solved
    }).valid, true);
    observedProblems.add(problem.problemId);
    observedInitialStates.add(compiled.states[0]!.latex);
  }

  assert.equal(observedProblems.size, 64);
  assert.ok(observedInitialStates.size >= 32);
});

test("unit-fraction generator is deterministic and validates its bounds", () => {
  const input = { seed: "repeatable-fraction" } as const;
  assert.deepEqual(
    generateUnitFractionLinearProblem(input),
    generateUnitFractionLinearProblem(input)
  );
  assert.throws(() => generateUnitFractionLinearProblem({
    seed: "invalid",
    minimumDenominator: 0
  }), /positive safe integers/);
  assert.throws(() => generateUnitFractionLinearProblem({
    seed: "inverted",
    minimumQuotient: 4,
    maximumQuotient: 2
  }), /must not exceed/);
});
