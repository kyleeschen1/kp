import type { KpQuadraticSemanticFixture } from "./quadratic-branching-fixture.ts";
import { createKpQuadraticSolutionSetFromFixture } from "./quadratic-solution-set.ts";
import {
  createKpStructuredExpression,
  listKpStructuredExpressionSubtrees,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

export type KpCompletingSquareStateKind =
  | "standard-form"
  | "constant-balanced"
  | "square-completed"
  | "perfect-square";

export interface KpCompletingSquareEquationState {
  readonly id: string;
  readonly kind: KpCompletingSquareStateKind;
  readonly left: KpStructuredExpression;
  readonly right: KpStructuredExpression;
  readonly normalizedPolynomial: {
    readonly a: string;
    readonly b: string;
    readonly c: string;
  };
  readonly solutionSetId: string;
}

export interface KpCompletingSquareRewrite {
  readonly id: string;
  readonly operation:
    | "balance-constant"
    | "complete-square"
    | "recognize-perfect-square";
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly lawId: string;
  readonly inverseLawId: string;
  readonly relation: "same-solution-set";
  readonly roleBindings: readonly {
    readonly role: string;
    readonly sourceSubtreeIds: readonly string[];
    readonly targetSubtreeIds: readonly string[];
    readonly relation: "preserve" | "relocate" | "introduce" | "derive";
  }[];
}

export interface KpCompletingSquareAuthority {
  readonly schemaVersion: "kp.quadratic-completing-square-authority.v1";
  readonly id: "authority.quadratic.canonical.completing-square";
  readonly fixtureId: string;
  readonly solutionSetId: string;
  readonly states: readonly KpCompletingSquareEquationState[];
  readonly rewrites: readonly KpCompletingSquareRewrite[];
  readonly provenance: {
    readonly authority: "verified-structured-rewrite";
    readonly sourceRef: string;
  };
}

export interface KpCompletingSquareAuthorityDiagnostic {
  readonly code:
    | "rewrite-topology"
    | "role-binding"
    | "solution-set-drift"
    | "inverse-law";
  readonly path: string;
  readonly message: string;
}

const canonicalPolynomial = Object.freeze({ a: "1", b: "-5", c: "6" });

export function createCanonicalKpCompletingSquareAuthority(
  fixture: KpQuadraticSemanticFixture
): KpCompletingSquareAuthority {
  if (
    fixture.coefficients.a !== canonicalPolynomial.a ||
    fixture.coefficients.b !== canonicalPolynomial.b ||
    fixture.coefficients.c !== canonicalPolynomial.c
  ) {
    throw new Error("Canonical completing-square authority requires x² - 5x + 6 = 0.");
  }
  const solutionSetId = createKpQuadraticSolutionSetFromFixture(fixture).id;
  const states = Object.freeze([
    state("standard", "standard-form", standardLeft(), integer("standard.right.zero", 0), solutionSetId),
    state("balanced", "constant-balanced", balancedLeft(), integer("balanced.right.minus-six", -6), solutionSetId),
    state("completed", "square-completed", completedLeft(), fraction("completed.right.quarter", 1, 4), solutionSetId),
    state("perfect", "perfect-square", perfectSquareLeft(), fraction("perfect.right.quarter", 1, 4), solutionSetId)
  ]);
  const rewrites = Object.freeze([
    rewrite({
      id: "rewrite.quadratic.completing-square.balance-constant",
      operation: "balance-constant",
      sourceStateId: "state.quadratic.completing-square.standard",
      targetStateId: "state.quadratic.completing-square.balanced",
      lawId: "law.equation.subtract-both-sides",
      inverseLawId: "law.equation.add-both-sides",
      roleBindings: [
        binding("quadratic-term", ["standard.left.x-squared"], ["balanced.left.x-squared"], "preserve"),
        binding("linear-term", ["standard.left.minus-five-x"], ["balanced.left.minus-five-x"], "preserve"),
        binding("constant", ["standard.left.six"], ["balanced.right.minus-six"], "relocate")
      ]
    }),
    rewrite({
      id: "rewrite.quadratic.completing-square.add-square-term",
      operation: "complete-square",
      sourceStateId: "state.quadratic.completing-square.balanced",
      targetStateId: "state.quadratic.completing-square.completed",
      lawId: "law.equation.add-both-sides",
      inverseLawId: "law.equation.subtract-both-sides",
      roleBindings: [
        binding("quadratic-term", ["balanced.left.x-squared"], ["completed.left.x-squared"], "preserve"),
        binding("linear-term", ["balanced.left.minus-five-x"], ["completed.left.minus-five-x"], "preserve"),
        binding("completion-term", [], ["completed.left.twenty-five-fourths"], "introduce"),
        binding("balanced-result", ["balanced.right.minus-six"], ["completed.right.quarter"], "derive")
      ]
    }),
    rewrite({
      id: "rewrite.quadratic.completing-square.recognize-perfect-square",
      operation: "recognize-perfect-square",
      sourceStateId: "state.quadratic.completing-square.completed",
      targetStateId: "state.quadratic.completing-square.perfect",
      lawId: "law.algebra.perfect-square-trinomial",
      inverseLawId: "law.algebra.expand-binomial-square",
      roleBindings: [
        binding("completed-trinomial", ["completed.left.root"], ["perfect.left.root"], "derive"),
        binding("right-value", ["completed.right.quarter"], ["perfect.right.quarter"], "preserve")
      ]
    })
  ]);
  const authority = Object.freeze({
    schemaVersion: "kp.quadratic-completing-square-authority.v1" as const,
    id: "authority.quadratic.canonical.completing-square" as const,
    fixtureId: fixture.id,
    solutionSetId,
    states,
    rewrites,
    provenance: Object.freeze({
      authority: "verified-structured-rewrite" as const,
      sourceRef:
        "docs/project/reviews/2026-07-24-quadratic-semantic-branching-long-loop-proposal.md"
    })
  });
  const diagnostics = validateKpCompletingSquareAuthority(authority);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map((issue) => issue.message).join(" "));
  }
  return authority;
}

export function validateKpCompletingSquareAuthority(
  authority: KpCompletingSquareAuthority
): readonly KpCompletingSquareAuthorityDiagnostic[] {
  const diagnostics: KpCompletingSquareAuthorityDiagnostic[] = [];
  const states = new Map(authority.states.map((candidate) => [candidate.id, candidate]));
  const expectedOperations = [
    "balance-constant",
    "complete-square",
    "recognize-perfect-square"
  ];
  authority.rewrites.forEach((candidate, index) => {
    const source = states.get(candidate.sourceStateId);
    const target = states.get(candidate.targetStateId);
    if (
      source === undefined ||
      target === undefined ||
      candidate.operation !== expectedOperations[index]
    ) {
      diagnostics.push(issue("rewrite-topology", `rewrites[${index}]`, `Rewrite ${candidate.id} is outside the registered completing-square chain.`));
      return;
    }
    if (candidate.inverseLawId.trim().length === 0) {
      diagnostics.push(issue("inverse-law", `rewrites[${index}].inverseLawId`, `Rewrite ${candidate.id} requires an explicit inverse law.`));
    }
    const sourceIds = subtreeIds(source);
    const targetIds = subtreeIds(target);
    candidate.roleBindings.forEach((binding, bindingIndex) => {
      const missingSource = binding.sourceSubtreeIds.find((id) => !sourceIds.has(id));
      const missingTarget = binding.targetSubtreeIds.find((id) => !targetIds.has(id));
      if (missingSource !== undefined || missingTarget !== undefined) {
        diagnostics.push(issue(
          "role-binding",
          `rewrites[${index}].roleBindings[${bindingIndex}]`,
          `Rewrite ${candidate.id} role ${binding.role} references a missing structured subtree.`
        ));
      }
    });
  });
  authority.states.forEach((candidate, index) => {
    const derivedPolynomial = deriveNormalizedPolynomial(candidate);
    if (
      candidate.solutionSetId !== authority.solutionSetId ||
      candidate.normalizedPolynomial.a !== canonicalPolynomial.a ||
      candidate.normalizedPolynomial.b !== canonicalPolynomial.b ||
      candidate.normalizedPolynomial.c !== canonicalPolynomial.c ||
      derivedPolynomial?.a !== canonicalPolynomial.a ||
      derivedPolynomial?.b !== canonicalPolynomial.b ||
      derivedPolynomial?.c !== canonicalPolynomial.c
    ) {
      diagnostics.push(issue(
        "solution-set-drift",
        `states[${index}]`,
        `State ${candidate.id} does not preserve the canonical normalized equation and solution set.`
      ));
    }
  });
  return Object.freeze(diagnostics);
}

interface ExactFraction {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

type ExactPolynomial = readonly [ExactFraction, ExactFraction, ExactFraction];

function deriveNormalizedPolynomial(
  state: KpCompletingSquareEquationState
): { readonly a: string; readonly b: string; readonly c: string } | undefined {
  try {
    const left = polynomialFromNode(state.left.root);
    const right = polynomialFromNode(state.right.root);
    const normalized = subtractPolynomials(left, right);
    return {
      a: fractionText(normalized[2]),
      b: fractionText(normalized[1]),
      c: fractionText(normalized[0])
    };
  } catch {
    return undefined;
  }
}

function polynomialFromNode(node: KpStructuredExpressionNode): ExactPolynomial {
  switch (node.kind) {
    case "number":
      if (!Number.isSafeInteger(node.value)) throw new Error("Non-exact number.");
      return [exact(BigInt(node.value)), exact(0n), exact(0n)];
    case "symbol":
      if (node.name !== "x") throw new Error("Unexpected symbol.");
      return [exact(0n), exact(1n), exact(0n)];
    case "sum":
      return node.terms
        .map(polynomialFromNode)
        .reduce(addPolynomials, zeroPolynomial());
    case "product":
      return node.factors
        .map(polynomialFromNode)
        .reduce(multiplyPolynomials, onePolynomial());
    case "quotient": {
      const numerator = polynomialFromNode(node.numerator);
      const denominator = polynomialFromNode(node.denominator);
      if (!isConstant(denominator) || denominator[0].numerator === 0n) {
        throw new Error("Non-constant denominator.");
      }
      return scalePolynomial(numerator, divideFractions(exact(1n), denominator[0]));
    }
    case "power": {
      const exponent = polynomialFromNode(node.exponent);
      if (!isConstant(exponent) || fractionText(exponent[0]) !== "2") {
        throw new Error("Unsupported exponent.");
      }
      const base = polynomialFromNode(node.base);
      return multiplyPolynomials(base, base);
    }
    case "negate":
      return scalePolynomial(polynomialFromNode(node.value), exact(-1n));
  }
}

function addPolynomials(left: ExactPolynomial, right: ExactPolynomial): ExactPolynomial {
  return [
    addFractions(left[0], right[0]),
    addFractions(left[1], right[1]),
    addFractions(left[2], right[2])
  ];
}

function subtractPolynomials(left: ExactPolynomial, right: ExactPolynomial): ExactPolynomial {
  return addPolynomials(left, scalePolynomial(right, exact(-1n)));
}

function multiplyPolynomials(left: ExactPolynomial, right: ExactPolynomial): ExactPolynomial {
  const result = [exact(0n), exact(0n), exact(0n), exact(0n), exact(0n)];
  left.forEach((leftValue, leftDegree) => {
    right.forEach((rightValue, rightDegree) => {
      const degree = leftDegree + rightDegree;
      result[degree] = addFractions(
        result[degree]!,
        multiplyFractions(leftValue, rightValue)
      );
    });
  });
  if (result.slice(3).some((value) => value.numerator !== 0n)) {
    throw new Error("Polynomial exceeds quadratic degree.");
  }
  return [result[0]!, result[1]!, result[2]!];
}

function scalePolynomial(value: ExactPolynomial, factor: ExactFraction): ExactPolynomial {
  return value.map((coefficient) =>
    multiplyFractions(coefficient, factor)
  ) as unknown as ExactPolynomial;
}

function zeroPolynomial(): ExactPolynomial {
  return [exact(0n), exact(0n), exact(0n)];
}

function onePolynomial(): ExactPolynomial {
  return [exact(1n), exact(0n), exact(0n)];
}

function isConstant(value: ExactPolynomial): boolean {
  return value[1].numerator === 0n && value[2].numerator === 0n;
}

function exact(numerator: bigint, denominator = 1n): ExactFraction {
  if (denominator === 0n) throw new Error("Zero denominator.");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (sign * numerator) / divisor,
    denominator: (sign * denominator) / divisor
  };
}

function addFractions(left: ExactFraction, right: ExactFraction): ExactFraction {
  return exact(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

function multiplyFractions(left: ExactFraction, right: ExactFraction): ExactFraction {
  return exact(
    left.numerator * right.numerator,
    left.denominator * right.denominator
  );
}

function divideFractions(left: ExactFraction, right: ExactFraction): ExactFraction {
  return exact(
    left.numerator * right.denominator,
    left.denominator * right.numerator
  );
}

function fractionText(value: ExactFraction): string {
  return value.denominator === 1n
    ? String(value.numerator)
    : `${value.numerator}/${value.denominator}`;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function state(
  suffix: string,
  kind: KpCompletingSquareStateKind,
  leftRoot: KpStructuredExpressionNode,
  rightRoot: KpStructuredExpressionNode,
  solutionSetId: string
): KpCompletingSquareEquationState {
  return Object.freeze({
    id: `state.quadratic.completing-square.${suffix}`,
    kind,
    left: createKpStructuredExpression({ root: leftRoot }),
    right: createKpStructuredExpression({ root: rightRoot }),
    normalizedPolynomial: canonicalPolynomial,
    solutionSetId
  });
}

function standardLeft(): KpStructuredExpressionNode {
  return sum("standard.left.root", [
    power("standard.left.x-squared", symbol("standard.left.x", "x"), integer("standard.left.two", 2)),
    product("standard.left.minus-five-x", [integer("standard.left.minus-five", -5), symbol("standard.left.linear-x", "x")]),
    integer("standard.left.six", 6)
  ]);
}

function balancedLeft(): KpStructuredExpressionNode {
  return sum("balanced.left.root", [
    power("balanced.left.x-squared", symbol("balanced.left.x", "x"), integer("balanced.left.two", 2)),
    product("balanced.left.minus-five-x", [integer("balanced.left.minus-five", -5), symbol("balanced.left.linear-x", "x")])
  ]);
}

function completedLeft(): KpStructuredExpressionNode {
  return sum("completed.left.root", [
    power("completed.left.x-squared", symbol("completed.left.x", "x"), integer("completed.left.two", 2)),
    product("completed.left.minus-five-x", [integer("completed.left.minus-five", -5), symbol("completed.left.linear-x", "x")]),
    fraction("completed.left.twenty-five-fourths", 25, 4)
  ]);
}

function perfectSquareLeft(): KpStructuredExpressionNode {
  return power(
    "perfect.left.root",
    sum("perfect.left.binomial", [
      symbol("perfect.left.x", "x"),
      fraction("perfect.left.minus-five-halves", -5, 2)
    ]),
    integer("perfect.left.two", 2)
  );
}

function rewrite(input: Omit<KpCompletingSquareRewrite, "relation">): KpCompletingSquareRewrite {
  return Object.freeze({
    ...input,
    relation: "same-solution-set" as const,
    roleBindings: Object.freeze([...input.roleBindings])
  });
}

function binding(
  role: string,
  sourceSubtreeIds: readonly string[],
  targetSubtreeIds: readonly string[],
  relation: KpCompletingSquareRewrite["roleBindings"][number]["relation"]
) {
  return Object.freeze({
    role,
    sourceSubtreeIds: Object.freeze([...sourceSubtreeIds]),
    targetSubtreeIds: Object.freeze([...targetSubtreeIds]),
    relation
  });
}

function subtreeIds(state: KpCompletingSquareEquationState): Set<string> {
  return new Set([
    ...listKpStructuredExpressionSubtrees(state.left),
    ...listKpStructuredExpressionSubtrees(state.right)
  ].map((node) => node.id));
}

function issue(
  code: KpCompletingSquareAuthorityDiagnostic["code"],
  path: string,
  message: string
): KpCompletingSquareAuthorityDiagnostic {
  return Object.freeze({ code, path, message });
}

function integer(id: string, value: number): KpStructuredExpressionNode {
  return { id, kind: "number", value };
}

function symbol(id: string, name: string): KpStructuredExpressionNode {
  return { id, kind: "symbol", name };
}

function sum(id: string, terms: readonly KpStructuredExpressionNode[]): KpStructuredExpressionNode {
  return { id, kind: "sum", terms };
}

function product(id: string, factors: readonly KpStructuredExpressionNode[]): KpStructuredExpressionNode {
  return { id, kind: "product", factors };
}

function power(
  id: string,
  base: KpStructuredExpressionNode,
  exponent: KpStructuredExpressionNode
): KpStructuredExpressionNode {
  return { id, kind: "power", base, exponent };
}

function fraction(id: string, numerator: number, denominator: number): KpStructuredExpressionNode {
  return {
    id,
    kind: "quotient",
    numerator: integer(`${id}.numerator`, numerator),
    denominator: integer(`${id}.denominator`, denominator)
  };
}
