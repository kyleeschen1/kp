import {
  createKpFractionDistributedSumComposition,
  type KpFractionDistributedSumComposition,
  type KpVerifiedFractionDistributedSumComposition
} from "./fraction-distributed-sum-composition.ts";
import {
  createKpVerifiedFractionFactoringFixture,
  type KpVerifiedFractionFactoringRewrite
} from "./fraction-reverse-factoring.ts";
import {
  createKpStructuredExpression,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

const verifiedFractionSolveTraceAuthority = Symbol("kp.verified-fraction-solve-trace");

export interface KpVerifiedFractionSolveTrace {
  readonly schemaVersion: "kp.verified-fraction-solve-trace.v1";
  readonly compositionProof: KpVerifiedFractionDistributedSumComposition;
  readonly reverseFactoringProof: KpVerifiedFractionFactoringRewrite;
  readonly stateCount: 14;
  readonly stepCount: 13;
  readonly stateIds: readonly string[];
  readonly stepIds: readonly string[];
  readonly adjacency: readonly {
    readonly stepId: string;
    readonly sourceStateId: string;
    readonly targetStateId: string;
    readonly authorityIds: readonly string[];
  }[];
  readonly solution: { readonly numerator: "9"; readonly denominator: "1" };
  // Product construction consumes this proof instead of re-solving rendered equations.
  readonly [verifiedFractionSolveTraceAuthority]: true;
}

export interface KpFractionSolveEquationState {
  readonly id: string;
  readonly left: KpStructuredExpression;
  readonly right: KpStructuredExpression;
  readonly verifiedSolution: { readonly numerator: string; readonly denominator: string };
}

export interface KpFractionSolveMacroStep {
  readonly id: string;
  readonly transformType: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly authorityIds: readonly string[];
}

export interface KpLawfulFractionSolveMacro {
  readonly schemaVersion: "kp.lawful-fraction-solve-macro.v1";
  readonly id: "macro.fraction.two-thirds-x-plus-six-equals-ten";
  readonly composition: KpFractionDistributedSumComposition;
  readonly reverseFactoring: KpVerifiedFractionFactoringRewrite;
  readonly states: readonly KpFractionSolveEquationState[];
  readonly steps: readonly KpFractionSolveMacroStep[];
  readonly solution: { readonly numerator: "9"; readonly denominator: "1" };
  readonly verification: KpVerifiedFractionSolveTrace;
}

export function createKpLawfulFractionSolveMacro(input: {
  readonly finalValue?: number | undefined;
} = {}): KpLawfulFractionSolveMacro {
  const composition = createKpFractionDistributedSumComposition();
  const reverseFactoring = createKpVerifiedFractionFactoringFixture().verification;
  const fanOut = composition.normalization.fanOut;
  const states = [
    state("factored", fanOut.source, numberExpression("factored.right", 10)),
    state("distributed", fanOut.target, numberExpression("distributed.right", 10)),
    state("normalized", composition.expression, numberExpression("normalized.right", 10)),
    state("constant-product", expression(sum("constant-product.left", [
      twoXOverThree("constant-product.left.variable"),
      quotient("constant-product.left.constant", number("constant-product.left.12", 12), 3)
    ])), numberExpression("constant-product.right", 10)),
    state("constant-quotient", expression(sum("constant-quotient.left", [
      twoXOverThree("constant-quotient.left.variable"),
      number("constant-quotient.left.4", 4)
    ])), numberExpression("constant-quotient.right", 10)),
    state("balanced-subtraction", expression(sum("balanced-subtraction.left", [
      sum("balanced-subtraction.left.source", [
        twoXOverThree("balanced-subtraction.left.variable"),
        number("balanced-subtraction.left.4", 4)
      ]),
      negate("balanced-subtraction.left.minus4", 4)
    ])), expression(sum("balanced-subtraction.right", [
      number("balanced-subtraction.right.10", 10),
      negate("balanced-subtraction.right.minus4", 4)
    ]))),
    state("additive-cancelled", expression(twoXOverThree("additive-cancelled.left")),
      expression(sum("additive-cancelled.right", [
        number("additive-cancelled.right.10", 10),
        negate("additive-cancelled.right.minus4", 4)
      ]))),
    state("difference-simplified", expression(twoXOverThree("difference-simplified.left")),
      numberExpression("difference-simplified.right", 6)),
    state("balanced-multiplication", expression(product("balanced-multiplication.left", [
      number("balanced-multiplication.left.3", 3),
      twoXOverThree("balanced-multiplication.left.fraction")
    ])), expression(product("balanced-multiplication.right", [
      number("balanced-multiplication.right.3", 3),
      number("balanced-multiplication.right.6", 6)
    ]))),
    state("denominator-cancelled", expression(twoX("denominator-cancelled.left")),
      expression(product("denominator-cancelled.right", [
        number("denominator-cancelled.right.3", 3),
        number("denominator-cancelled.right.6", 6)
      ]))),
    state("right-product-simplified", expression(twoX("right-product-simplified.left")),
      numberExpression("right-product-simplified.right", 18)),
    state("balanced-division", expression(quotient(
      "balanced-division.left",
      twoX("balanced-division.left.numerator"),
      2
    )), expression(quotient(
      "balanced-division.right",
      number("balanced-division.right.18", 18),
      2
    ))),
    state("coefficient-cancelled", expression(symbol("coefficient-cancelled.left.x")),
      expression(quotient(
        "coefficient-cancelled.right",
        number("coefficient-cancelled.right.18", 18),
        2
      ))),
    state("solved", expression(symbol("solved.left.x")),
      numberExpression("solved.right", input.finalValue ?? 9))
  ];
  const steps = [
    step("distribute", "distributeMultiplication", states, 0, [
      fanOut.normalFormPlan.rewriteLawId,
      fanOut.normalFormPlan.intentId
    ]),
    step("normalize", "normalizeFractionNumerators", states, 1, [
      composition.normalization.id,
      composition.id
    ]),
    step("constant-product", "simplifyConstantProduct", states, 2, [
      "law.arithmetic.constant-product"
    ]),
    step("constant-quotient", "simplifyConstantQuotient", states, 3, [
      "law.arithmetic.constant-quotient"
    ]),
    step("subtract-four", "subtractBothSides", states, 4, [
      "law.equation.subtract-both-sides"
    ]),
    step("cancel-additive-inverses", "cancelAdditiveInverses", states, 5, [
      "kp.core.eliminate"
    ]),
    step("simplify-difference", "simplifyConstantDifference", states, 6, [
      "law.arithmetic.constant-difference"
    ]),
    step("multiply-by-three", "multiplyBothSides", states, 7, [
      "law.equation.multiply-both-sides"
    ]),
    step("cancel-denominator", "cancelMultiplicativeInverses", states, 8, [
      "kp.core.eliminate"
    ]),
    step("simplify-right-product", "simplifyConstantProduct", states, 9, [
      "law.arithmetic.constant-product"
    ]),
    step("divide-by-two", "divideBothSides", states, 10, [
      "law.equation.divide-both-sides"
    ]),
    step("cancel-coefficient", "cancelMultiplicativeInverses", states, 11, [
      "kp.core.eliminate"
    ]),
    step("simplify-solution", "simplifyConstantQuotient", states, 12, [
      "law.arithmetic.constant-quotient"
    ])
  ];
  const verification = verifyMacro({
    composition,
    reverseFactoring,
    states,
    steps
  });

  return Object.freeze({
    schemaVersion: "kp.lawful-fraction-solve-macro.v1" as const,
    id: "macro.fraction.two-thirds-x-plus-six-equals-ten" as const,
    composition,
    reverseFactoring,
    states: Object.freeze(states),
    steps: Object.freeze(steps),
    solution: Object.freeze({ numerator: "9" as const, denominator: "1" as const }),
    verification
  });
}

function state(
  suffix: string,
  left: KpStructuredExpression,
  right: KpStructuredExpression
): KpFractionSolveEquationState {
  const solution = solveEquation(left.root, right.root);
  return Object.freeze({
    id: `fraction-solve.state.${suffix}`,
    left,
    right,
    verifiedSolution: Object.freeze({
      numerator: solution.numerator.toString(),
      denominator: solution.denominator.toString()
    })
  });
}

function step(
  suffix: string,
  transformType: string,
  states: readonly KpFractionSolveEquationState[],
  sourceIndex: number,
  authorityIds: readonly string[]
): KpFractionSolveMacroStep {
  return Object.freeze({
    id: `fraction-solve.step.${suffix}`,
    transformType,
    sourceStateId: states[sourceIndex]!.id,
    targetStateId: states[sourceIndex + 1]!.id,
    authorityIds: Object.freeze([...authorityIds])
  });
}

function verifyMacro(input: {
  readonly composition: KpFractionDistributedSumComposition;
  readonly reverseFactoring: KpVerifiedFractionFactoringRewrite;
  readonly states: readonly KpFractionSolveEquationState[];
  readonly steps: readonly KpFractionSolveMacroStep[];
}): KpVerifiedFractionSolveTrace {
  const { states, steps } = input;
  if (steps.length !== states.length - 1) {
    throw new Error("Fraction solve macro must connect every adjacent equation state exactly once.");
  }
  steps.forEach((candidate, index) => {
    if (
      candidate.sourceStateId !== states[index]?.id ||
      candidate.targetStateId !== states[index + 1]?.id
    ) {
      throw new Error(`Fraction solve macro is discontinuous at step ${candidate.id}.`);
    }
    if (candidate.authorityIds.length === 0) {
      throw new Error(`Fraction solve macro step ${candidate.id} lacks semantic authority.`);
    }
  });
  states.forEach((candidate) => {
    if (
      candidate.verifiedSolution.numerator !== "9" ||
      candidate.verifiedSolution.denominator !== "1"
    ) {
      throw new Error(
        `Fraction solve macro state ${candidate.id} changes the solution to ` +
        `${candidate.verifiedSolution.numerator}/${candidate.verifiedSolution.denominator}.`
      );
    }
  });
  if (states.length !== 14 || steps.length !== 13) {
    throw new Error("Canonical fraction solve proof requires exactly 14 states and 13 steps.");
  }
  return Object.freeze({
    schemaVersion: "kp.verified-fraction-solve-trace.v1" as const,
    compositionProof: input.composition.verification,
    reverseFactoringProof: input.reverseFactoring,
    stateCount: 14 as const,
    stepCount: 13 as const,
    stateIds: Object.freeze(states.map(({ id }) => id)),
    stepIds: Object.freeze(steps.map(({ id }) => id)),
    adjacency: Object.freeze(steps.map((candidate) => Object.freeze({
      stepId: candidate.id,
      sourceStateId: candidate.sourceStateId,
      targetStateId: candidate.targetStateId,
      authorityIds: Object.freeze([...candidate.authorityIds])
    }))),
    solution: Object.freeze({ numerator: "9" as const, denominator: "1" as const }),
    [verifiedFractionSolveTraceAuthority]: true as const
  });
}

interface Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

interface Affine {
  readonly coefficient: Rational;
  readonly constant: Rational;
}

function solveEquation(
  left: KpStructuredExpressionNode,
  right: KpStructuredExpressionNode
): Rational {
  const difference = subtractAffine(toAffine(left), toAffine(right));
  if (difference.coefficient.numerator === 0n) {
    throw new Error("Fraction solve macro equation must have one finite linear solution.");
  }
  return divide(negateRational(difference.constant), difference.coefficient);
}

function toAffine(node: KpStructuredExpressionNode): Affine {
  switch (node.kind) {
    case "number":
      if (!Number.isInteger(node.value)) {
        throw new Error(`Fraction solve macro requires exact integer number ${node.id}.`);
      }
      return affine(rational(0n), rational(BigInt(node.value)));
    case "symbol":
      if (node.name !== "x") throw new Error(`Fraction solve macro only supports symbol x, not ${node.name}.`);
      return affine(rational(1n), rational(0n));
    case "sum":
      return node.terms.map(toAffine).reduce(addAffine);
    case "product":
      return node.factors.map(toAffine).reduce(multiplyAffine);
    case "quotient": {
      const numerator = toAffine(node.numerator);
      const denominator = toAffine(node.denominator);
      if (denominator.coefficient.numerator !== 0n || denominator.constant.numerator === 0n) {
        throw new Error(`Fraction solve macro denominator ${node.denominator.id} must be nonzero and constant.`);
      }
      return affine(
        divide(numerator.coefficient, denominator.constant),
        divide(numerator.constant, denominator.constant)
      );
    }
    case "negate": {
      const value = toAffine(node.value);
      return affine(negateRational(value.coefficient), negateRational(value.constant));
    }
    case "power":
      throw new Error(`Fraction solve macro does not admit nonlinear power ${node.id}.`);
  }
}

function addAffine(left: Affine, right: Affine): Affine {
  return affine(add(left.coefficient, right.coefficient), add(left.constant, right.constant));
}

function subtractAffine(left: Affine, right: Affine): Affine {
  return affine(add(left.coefficient, negateRational(right.coefficient)),
    add(left.constant, negateRational(right.constant)));
}

function multiplyAffine(left: Affine, right: Affine): Affine {
  if (left.coefficient.numerator !== 0n && right.coefficient.numerator !== 0n) {
    throw new Error("Fraction solve macro does not admit nonlinear products.");
  }
  return affine(
    add(multiply(left.coefficient, right.constant), multiply(right.coefficient, left.constant)),
    multiply(left.constant, right.constant)
  );
}

function affine(coefficient: Rational, constant: Rational): Affine {
  return { coefficient, constant };
}

function rational(numerator: bigint, denominator = 1n): Rational {
  if (denominator === 0n) throw new Error("Exact rational denominator must not be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: sign * numerator / divisor,
    denominator: sign * denominator / divisor
  };
}

function add(left: Rational, right: Rational): Rational {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

function multiply(left: Rational, right: Rational): Rational {
  return rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divide(left: Rational, right: Rational): Rational {
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

function negateRational(value: Rational): Rational {
  return { numerator: -value.numerator, denominator: value.denominator };
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function expression(root: KpStructuredExpressionNode): KpStructuredExpression {
  return createKpStructuredExpression({ root });
}

function numberExpression(id: string, value: number): KpStructuredExpression {
  return expression(number(id, value));
}

function number(id: string, value: number): KpStructuredExpressionNode {
  return { id, kind: "number", value };
}

function symbol(id: string): KpStructuredExpressionNode {
  return { id, kind: "symbol", name: "x" };
}

function sum(id: string, terms: readonly KpStructuredExpressionNode[]): KpStructuredExpressionNode {
  return { id, kind: "sum", terms };
}

function product(id: string, factors: readonly KpStructuredExpressionNode[]): KpStructuredExpressionNode {
  return { id, kind: "product", factors };
}

function quotient(
  id: string,
  numerator: KpStructuredExpressionNode,
  denominator: number
): KpStructuredExpressionNode {
  return {
    id,
    kind: "quotient",
    numerator,
    denominator: number(`${id}.denominator`, denominator)
  };
}

function negate(id: string, value: number): KpStructuredExpressionNode {
  return { id, kind: "negate", value: number(`${id}.value`, value) };
}

function twoX(id: string): KpStructuredExpressionNode {
  return product(id, [number(`${id}.2`, 2), symbol(`${id}.x`)]);
}

function twoXOverThree(id: string): KpStructuredExpressionNode {
  return quotient(id, twoX(`${id}.numerator`), 3);
}
