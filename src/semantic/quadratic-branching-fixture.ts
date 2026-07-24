import {
  createKpStructuredExpression,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

export interface KpQuadraticExactRational {
  readonly numerator: string;
  readonly denominator: string;
}

export interface KpQuadraticSemanticFixture {
  readonly schemaVersion: "kp.quadratic-semantic-fixture.v1";
  readonly id: string;
  readonly animationId: "animation.algebra.quadratic.solution-branching";
  readonly variable: string;
  readonly equation: {
    readonly left: KpStructuredExpression;
    readonly right: KpStructuredExpression;
  };
  readonly coefficients: {
    readonly a: string;
    readonly b: string;
    readonly c: string;
  };
  readonly discriminant: KpQuadraticExactRational;
  readonly verifiedRoots: readonly [
    KpQuadraticExactRational,
    KpQuadraticExactRational
  ];
  readonly provenance: {
    readonly authority: "authored-exact";
    readonly sourceRef: string;
  };
}

export function createCanonicalKpQuadraticSemanticFixture():
  KpQuadraticSemanticFixture {
  return createKpQuadraticSemanticFixture({
    id: "quadratic.solution-branching.x2-minus-5x-plus-6",
    variable: "x",
    coefficients: { a: 1n, b: -5n, c: 6n },
    verifiedRoots: [rational(2n), rational(3n)],
    provenance: {
      authority: "authored-exact",
      sourceRef:
        "docs/project/reviews/2026-07-24-quadratic-semantic-branching-long-loop-proposal.md"
    }
  });
}

export function createKpQuadraticSemanticFixture(input: {
  readonly id: string;
  readonly variable: string;
  readonly coefficients: {
    readonly a: bigint;
    readonly b: bigint;
    readonly c: bigint;
  };
  readonly verifiedRoots: readonly [
    KpQuadraticExactRational,
    KpQuadraticExactRational
  ];
  readonly provenance: {
    readonly authority: "authored-exact";
    readonly sourceRef: string;
  };
}): KpQuadraticSemanticFixture {
  requireText(input.id, "Quadratic fixture id");
  requireText(input.variable, "Quadratic variable");
  requireText(input.provenance.sourceRef, "Quadratic provenance source");
  if (input.coefficients.a === 0n) {
    throw new Error("Quadratic leading coefficient must be non-zero.");
  }
  const roots = input.verifiedRoots.map(normalizeRational) as [
    KpQuadraticExactRational,
    KpQuadraticExactRational
  ];
  for (const root of roots) {
    if (!isExactRoot(input.coefficients, root)) {
      throw new Error(
        `Verified quadratic root ${root.numerator}/${root.denominator} does not satisfy the authored equation.`
      );
    }
  }
  const discriminant =
    input.coefficients.b * input.coefficients.b -
    4n * input.coefficients.a * input.coefficients.c;
  const prefix = input.id;
  const x: KpStructuredExpressionNode = {
    id: `${prefix}.variable`,
    kind: "symbol",
    name: input.variable
  };
  const left = createKpStructuredExpression({
    root: {
      id: `${prefix}.polynomial`,
      kind: "sum",
      terms: [
        {
          id: `${prefix}.quadratic-term`,
          kind: "product",
          factors: [
            integerNode(`${prefix}.coefficient-a`, input.coefficients.a),
            {
              id: `${prefix}.variable-squared`,
              kind: "power",
              base: x,
              exponent: {
                id: `${prefix}.exponent-two`,
                kind: "number",
                value: 2
              }
            }
          ]
        },
        {
          id: `${prefix}.linear-term`,
          kind: "product",
          factors: [
            integerNode(`${prefix}.coefficient-b`, input.coefficients.b),
            {
              id: `${prefix}.linear-variable`,
              kind: "symbol",
              name: input.variable
            }
          ]
        },
        integerNode(`${prefix}.constant-c`, input.coefficients.c)
      ]
    }
  });
  const right = createKpStructuredExpression({
    root: integerNode(`${prefix}.right-zero`, 0n)
  });

  return Object.freeze({
    schemaVersion: "kp.quadratic-semantic-fixture.v1" as const,
    id: input.id,
    animationId:
      "animation.algebra.quadratic.solution-branching" as const,
    variable: input.variable,
    equation: Object.freeze({ left, right }),
    coefficients: Object.freeze({
      a: String(input.coefficients.a),
      b: String(input.coefficients.b),
      c: String(input.coefficients.c)
    }),
    discriminant: Object.freeze(rational(discriminant)),
    verifiedRoots: Object.freeze(
      roots.map((root) => Object.freeze(root))
    ) as unknown as readonly [
      KpQuadraticExactRational,
      KpQuadraticExactRational
    ],
    provenance: Object.freeze({ ...input.provenance })
  });
}

function isExactRoot(
  coefficients: { readonly a: bigint; readonly b: bigint; readonly c: bigint },
  root: KpQuadraticExactRational
): boolean {
  const numerator = BigInt(root.numerator);
  const denominator = BigInt(root.denominator);
  return (
    coefficients.a * numerator * numerator +
      coefficients.b * numerator * denominator +
      coefficients.c * denominator * denominator ===
    0n
  );
}

function integerNode(id: string, value: bigint): KpStructuredExpressionNode {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`Structured quadratic coefficient ${value} is not safe.`);
  }
  return { id, kind: "number", value: number };
}

function rational(
  numerator: bigint,
  denominator = 1n
): KpQuadraticExactRational {
  return normalizeRational({
    numerator: String(numerator),
    denominator: String(denominator)
  });
}

function normalizeRational(
  value: KpQuadraticExactRational
): KpQuadraticExactRational {
  let numerator = BigInt(value.numerator);
  let denominator = BigInt(value.denominator);
  if (denominator === 0n) {
    throw new Error("Exact quadratic rational denominator must be non-zero.");
  }
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return {
    numerator: String(numerator / divisor),
    denominator: String(denominator / divisor)
  };
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
