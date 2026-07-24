import type {
  KpQuadraticExactRational,
  KpQuadraticSemanticFixture
} from "./quadratic-branching-fixture.ts";
import {
  createKpQuadraticSolutionSet,
  createKpQuadraticSolutionSetFromFixture,
  sameKpQuadraticSolutionSet
} from "./quadratic-solution-set.ts";

export type KpQuadraticFormulaOperationId =
  | "operation.quadratic-formula.substitute-coefficients"
  | "operation.quadratic-formula.evaluate-discriminant"
  | "operation.quadratic-formula.simplify-exact-radical"
  | "operation.quadratic-formula.divide-candidate-numerators"
  | "operation.quadratic-formula.verify-results";

export interface KpQuadraticFormulaOperation {
  readonly id: KpQuadraticFormulaOperationId;
  readonly lawId: string;
  readonly inputRoles: readonly string[];
  readonly outputRoles: readonly string[];
}

export interface KpQuadraticFormulaExactEvaluation {
  readonly id: string;
  readonly lawId: string;
  readonly expression: string;
  readonly result: string;
  readonly dependsOn: readonly string[];
}

export interface KpQuadraticFormulaAuthority {
  readonly schemaVersion: "kp.quadratic-formula-authority.v1";
  readonly id: "authority.quadratic.canonical.formula";
  readonly fixtureId: string;
  readonly solutionSetId: string;
  readonly exactValues: {
    readonly coefficients: { readonly a: string; readonly b: string; readonly c: string };
    readonly negatedB: string;
    readonly discriminant: string;
    readonly exactSquareRoot: string;
    readonly denominator: string;
    readonly minusResult: KpQuadraticExactRational;
    readonly plusResult: KpQuadraticExactRational;
  };
  readonly operations: readonly KpQuadraticFormulaOperation[];
  readonly discriminantEvaluation:
    readonly KpQuadraticFormulaExactEvaluation[];
  readonly candidateEvaluation:
    readonly KpQuadraticFormulaExactEvaluation[];
  readonly executionBoundary: {
    readonly kind: "semantic-exact";
    readonly radicalProjectionReuse: "forbidden";
  };
  readonly provenance: {
    readonly authority: "verified-quadratic-formula";
    readonly sourceRef: string;
  };
}

export interface KpQuadraticFormulaDiagnostic {
  readonly code:
    | "operation-pin"
    | "coefficient-mismatch"
    | "discriminant-mismatch"
    | "non-exact-radical"
    | "zero-denominator"
    | "result-mismatch"
    | "evaluation-trace"
    | "radical-boundary";
  readonly path: string;
  readonly message: string;
}

const operationPins: readonly KpQuadraticFormulaOperation[] = Object.freeze([
  operation(
    "operation.quadratic-formula.substitute-coefficients",
    "law.algebra.quadratic-formula",
    ["coefficient-a", "coefficient-b", "coefficient-c"],
    ["negated-b", "discriminant-expression", "denominator-expression"]
  ),
  operation(
    "operation.quadratic-formula.evaluate-discriminant",
    "law.algebra.discriminant",
    ["coefficient-a", "coefficient-b", "coefficient-c"],
    ["discriminant-value"]
  ),
  operation(
    "operation.quadratic-formula.simplify-exact-radical",
    "law.arithmetic.principal-square-root",
    ["discriminant-value"],
    ["exact-square-root"]
  ),
  operation(
    "operation.quadratic-formula.divide-candidate-numerators",
    "law.arithmetic.divide-nonzero",
    ["negated-b", "exact-square-root", "denominator-value"],
    ["minus-result", "plus-result"]
  ),
  operation(
    "operation.quadratic-formula.verify-results",
    "law.equation.root-substitution",
    ["minus-result", "plus-result", "source-equation"],
    ["verified-solution-set"]
  )
]);

export function createCanonicalKpQuadraticFormulaAuthority(
  fixture: KpQuadraticSemanticFixture
): KpQuadraticFormulaAuthority {
  const a = BigInt(fixture.coefficients.a);
  const b = BigInt(fixture.coefficients.b);
  const c = BigInt(fixture.coefficients.c);
  const discriminant = b * b - 4n * a * c;
  const exactSquareRoot = exactIntegerSquareRoot(discriminant);
  const denominator = 2n * a;
  if (denominator === 0n) {
    throw new Error("Quadratic formula denominator must be non-zero.");
  }
  if (exactSquareRoot === undefined) {
    throw new Error("Canonical quadratic formula authority requires an exact integer radical.");
  }
  const minusResult = rational(-b - exactSquareRoot, denominator);
  const plusResult = rational(-b + exactSquareRoot, denominator);
  const discriminantEvaluation = Object.freeze([
    evaluation(
      "operation.quadratic-formula.evaluate-b-square",
      "law.arithmetic.integer-power",
      `(${b})^2`,
      String(b * b),
      "operation.quadratic-formula.substitute-coefficients"
    ),
    evaluation(
      "operation.quadratic-formula.evaluate-four-a-c",
      "law.arithmetic.integer-product",
      `4(${a})(${c})`,
      String(4n * a * c),
      "operation.quadratic-formula.evaluate-b-square"
    ),
    evaluation(
      "operation.quadratic-formula.subtract-discriminant",
      "law.arithmetic.integer-subtraction",
      `${b * b}-${4n * a * c}`,
      String(discriminant),
      "operation.quadratic-formula.evaluate-four-a-c"
    ),
    evaluation(
      "operation.quadratic-formula.prepare-denominator",
      "law.arithmetic.integer-product",
      `2(${a})`,
      String(denominator),
      "operation.quadratic-formula.subtract-discriminant"
    )
  ]);
  const candidateEvaluation = Object.freeze([
    evaluation(
      "operation.quadratic-formula.evaluate-candidate-numerators",
      "law.arithmetic.signed-offset",
      "5±1",
      "4|6",
      "operation.quadratic-formula.simplify-exact-radical"
    ),
    evaluation(
      "operation.quadratic-formula.divide-candidates",
      "law.arithmetic.divide-nonzero",
      "4/2|6/2",
      "2|3",
      "operation.quadratic-formula.evaluate-candidate-numerators"
    )
  ]);
  const authority = Object.freeze({
    schemaVersion: "kp.quadratic-formula-authority.v1" as const,
    id: "authority.quadratic.canonical.formula" as const,
    fixtureId: fixture.id,
    solutionSetId: createKpQuadraticSolutionSetFromFixture(fixture).id,
    exactValues: Object.freeze({
      coefficients: Object.freeze({ ...fixture.coefficients }),
      negatedB: String(-b),
      discriminant: String(discriminant),
      exactSquareRoot: String(exactSquareRoot),
      denominator: String(denominator),
      minusResult: Object.freeze(minusResult),
      plusResult: Object.freeze(plusResult)
    }),
    operations: operationPins,
    discriminantEvaluation,
    candidateEvaluation,
    executionBoundary: Object.freeze({
      kind: "semantic-exact" as const,
      radicalProjectionReuse: "forbidden" as const
    }),
    provenance: Object.freeze({
      authority: "verified-quadratic-formula" as const,
      sourceRef:
        "docs/project/reviews/2026-07-24-quadratic-semantic-branching-long-loop-proposal.md"
    })
  });
  const diagnostics = validateKpQuadraticFormulaAuthority(authority, fixture);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map((issue) => issue.message).join(" "));
  }
  return authority;
}

export function validateKpQuadraticFormulaAuthority(
  authority: KpQuadraticFormulaAuthority,
  fixture: KpQuadraticSemanticFixture
): readonly KpQuadraticFormulaDiagnostic[] {
  const diagnostics: KpQuadraticFormulaDiagnostic[] = [];
  const values = authority.exactValues;
  if (
    authority.operations.length !== operationPins.length ||
    authority.operations.some((candidate, index) => candidate.id !== operationPins[index]?.id)
  ) {
    diagnostics.push(issue("operation-pin", "operations", "Quadratic formula operations must retain their registered semantic order."));
  }
  if (
    values.coefficients.a !== fixture.coefficients.a ||
    values.coefficients.b !== fixture.coefficients.b ||
    values.coefficients.c !== fixture.coefficients.c
  ) {
    diagnostics.push(issue("coefficient-mismatch", "exactValues.coefficients", "Formula coefficients must come from the exact quadratic fixture."));
    return Object.freeze(diagnostics);
  }
  const a = BigInt(values.coefficients.a);
  const b = BigInt(values.coefficients.b);
  const c = BigInt(values.coefficients.c);
  const expectedDiscriminant = b * b - 4n * a * c;
  if (values.discriminant !== String(expectedDiscriminant)) {
    diagnostics.push(issue("discriminant-mismatch", "exactValues.discriminant", "Formula discriminant does not equal b squared minus four a c."));
  }
  const expectedSquareRoot = exactIntegerSquareRoot(expectedDiscriminant);
  if (
    expectedSquareRoot === undefined ||
    values.exactSquareRoot !== String(expectedSquareRoot)
  ) {
    diagnostics.push(issue("non-exact-radical", "exactValues.exactSquareRoot", "Formula radical must be independently verified as an exact integer square root."));
    return Object.freeze(diagnostics);
  }
  const denominator = 2n * a;
  if (denominator === 0n || values.denominator !== String(denominator)) {
    diagnostics.push(issue("zero-denominator", "exactValues.denominator", "Formula denominator must equal the non-zero exact value two a."));
    return Object.freeze(diagnostics);
  }
  const expectedEvaluation = [
    ["operation.quadratic-formula.evaluate-b-square", `(${values.coefficients.b})^2`, String(b ** 2n)],
    ["operation.quadratic-formula.evaluate-four-a-c", `4(${values.coefficients.a})(${values.coefficients.c})`, String(4n * a * c)],
    ["operation.quadratic-formula.subtract-discriminant", `${b ** 2n}-${4n * a * c}`, values.discriminant],
    ["operation.quadratic-formula.prepare-denominator", `2(${values.coefficients.a})`, values.denominator]
  ] as const;
  let evaluationDependency = "operation.quadratic-formula.substitute-coefficients";
  authority.discriminantEvaluation.forEach((candidate, index) => {
    const expected = expectedEvaluation[index];
    if (
      expected === undefined ||
      candidate.id !== expected[0] ||
      candidate.expression !== expected[1] ||
      candidate.result !== expected[2] ||
      candidate.lawId.trim().length === 0 ||
      candidate.dependsOn.length !== 1 ||
      candidate.dependsOn[0] !== evaluationDependency
    ) {
      diagnostics.push(issue(
        "evaluation-trace",
        `discriminantEvaluation[${index}]`,
        `Formula evaluation ${candidate.id} must retain exact dependency order and arithmetic.`
      ));
    }
    evaluationDependency = candidate.id;
  });
  if (authority.discriminantEvaluation.length !== expectedEvaluation.length) {
    diagnostics.push(issue(
      "evaluation-trace",
      "discriminantEvaluation",
      "Formula discriminant evaluation requires power, product, subtraction, and denominator preparation."
    ));
  }
  const expectedCandidates = [
    [
      "operation.quadratic-formula.evaluate-candidate-numerators",
      "5±1",
      "4|6",
      "operation.quadratic-formula.simplify-exact-radical"
    ],
    [
      "operation.quadratic-formula.divide-candidates",
      "4/2|6/2",
      "2|3",
      "operation.quadratic-formula.evaluate-candidate-numerators"
    ]
  ] as const;
  authority.candidateEvaluation.forEach((candidate, index) => {
    const expected = expectedCandidates[index];
    if (
      expected === undefined ||
      candidate.id !== expected[0] ||
      candidate.expression !== expected[1] ||
      candidate.result !== expected[2] ||
      candidate.lawId.trim().length === 0 ||
      candidate.dependsOn.length !== 1 ||
      candidate.dependsOn[0] !== expected[3]
    ) {
      diagnostics.push(issue(
        "evaluation-trace",
        `candidateEvaluation[${index}]`,
        `Formula candidate evaluation ${candidate.id} must retain exact numerator and division order.`
      ));
    }
  });
  if (authority.candidateEvaluation.length !== expectedCandidates.length) {
    diagnostics.push(issue(
      "evaluation-trace",
      "candidateEvaluation",
      "Formula candidate evaluation requires signed numerator work followed by exact division."
    ));
  }
  const computedSet = createKpQuadraticSolutionSet({
    id: authority.solutionSetId,
    variable: fixture.variable,
    discriminant: fixture.discriminant,
    roots: [
      rational(-b - expectedSquareRoot, denominator),
      rational(-b + expectedSquareRoot, denominator)
    ]
  });
  const authoredSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const recordedSet = createKpQuadraticSolutionSet({
    id: authority.solutionSetId,
    variable: fixture.variable,
    discriminant: fixture.discriminant,
    roots: [values.minusResult, values.plusResult]
  });
  if (
    !sameKpQuadraticSolutionSet(computedSet, authoredSet) ||
    !sameKpQuadraticSolutionSet(recordedSet, authoredSet)
  ) {
    diagnostics.push(issue("result-mismatch", "exactValues", "Formula results do not match the fixture's verified exact solution set."));
  }
  if (
    authority.executionBoundary.kind !== "semantic-exact" ||
    authority.executionBoundary.radicalProjectionReuse !== "forbidden"
  ) {
    diagnostics.push(issue("radical-boundary", "executionBoundary", "Formula semantics must remain independent of the radical presentation workaround."));
  }
  return Object.freeze(diagnostics);
}

function evaluation(
  id: string,
  lawId: string,
  expression: string,
  result: string,
  dependency: string
): KpQuadraticFormulaExactEvaluation {
  return Object.freeze({
    id,
    lawId,
    expression,
    result,
    dependsOn: Object.freeze([dependency])
  });
}

function exactIntegerSquareRoot(value: bigint): bigint | undefined {
  if (value < 0n) return undefined;
  let low = 0n;
  let high = value + 1n;
  while (low + 1n < high) {
    const midpoint = (low + high) / 2n;
    if (midpoint * midpoint <= value) low = midpoint;
    else high = midpoint;
  }
  return low * low === value ? low : undefined;
}

function rational(numerator: bigint, denominator: bigint): KpQuadraticExactRational {
  if (denominator === 0n) throw new Error("Exact result denominator must be non-zero.");
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

function operation(
  id: KpQuadraticFormulaOperationId,
  lawId: string,
  inputRoles: readonly string[],
  outputRoles: readonly string[]
): KpQuadraticFormulaOperation {
  return Object.freeze({
    id,
    lawId,
    inputRoles: Object.freeze([...inputRoles]),
    outputRoles: Object.freeze([...outputRoles])
  });
}

function issue(
  code: KpQuadraticFormulaDiagnostic["code"],
  path: string,
  message: string
): KpQuadraticFormulaDiagnostic {
  return Object.freeze({ code, path, message });
}
