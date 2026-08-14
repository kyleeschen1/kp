export const kpNormalMatrixProofClaimIds = Object.freeze([
  "base-case",
  "complex-eigenpair",
  "unitary-basis-invariance",
  "eigenvector-first-basis",
  "left-first-entry",
  "right-first-entry",
  "row-remainder-zero",
  "lower-block-normal",
  "inductive-diagonalization",
  "unitary-diagonalization"
] as const);

export type KpNormalMatrixProofClaimId =
  typeof kpNormalMatrixProofClaimIds[number];

export interface KpNormalMatrixProofClaim {
  readonly id: KpNormalMatrixProofClaimId;
  readonly dependsOn: readonly KpNormalMatrixProofClaimId[];
  readonly statement: string;
}

export interface KpNormalMatrixProofFixture {
  readonly schemaVersion: "kp.normal-matrix-proof-fixture.v1";
  readonly id: "proof.linear-algebra.normal-matrix-unitary-diagonalization";
  readonly field: "complex";
  readonly theorem: {
    readonly assumption: "M M† = M† M";
    readonly conclusion: "M is unitarily diagonalizable";
  };
  readonly dimensions: {
    readonly matrix: "n × n";
    readonly eigenvalue: "1 × 1";
    readonly rowRemainder: "1 × (n − 1)";
    readonly zeroColumn: "(n − 1) × 1";
    readonly lowerBlock: "(n − 1) × (n − 1)";
  };
  readonly blockForm: {
    readonly latex: string;
    readonly firstRow: readonly ["lambda", "r"];
    readonly firstColumn: readonly ["lambda", "zero"];
  };
  readonly firstEntryComparison: {
    readonly leftProduct: "M M†";
    readonly leftEntry: "|lambda|² + ||r||²";
    readonly rightProduct: "M† M";
    readonly rightEntry: "|lambda|²";
    readonly unmatchedContribution: "||r||²";
    readonly conclusion: "r = 0";
  };
  readonly induction: {
    readonly baseDimension: 1;
    readonly recursiveDimension: "n − 1";
    readonly obligations: readonly [
      "B remains a complex square matrix",
      "B is normal",
      "n − 1 is smaller than n",
      "the eigenvector-first basis and the diagonalization of B compose unitarily"
    ];
  };
  readonly complexScalarDependency:
    "The characteristic polynomial has a root in the scalar field.";
  readonly claims: readonly KpNormalMatrixProofClaim[];
}

const claims: readonly KpNormalMatrixProofClaim[] = Object.freeze([
  claim("base-case", [], "Every one-by-one complex matrix is diagonal."),
  claim(
    "complex-eigenpair",
    [],
    "For n greater than one, the characteristic polynomial has a complex root and M has a unit eigenvector v."
  ),
  claim(
    "unitary-basis-invariance",
    [],
    "Unitary change of basis preserves M M† = M† M."
  ),
  claim(
    "eigenvector-first-basis",
    ["complex-eigenpair", "unitary-basis-invariance"],
    "Extending v to an orthonormal basis makes the first column of M equal to lambda followed by zeros."
  ),
  claim(
    "left-first-entry",
    ["eigenvector-first-basis"],
    "The top-left entry of M M† is the squared norm of the first row: |lambda|² + ||r||²."
  ),
  claim(
    "right-first-entry",
    ["eigenvector-first-basis"],
    "The top-left entry of M† M is the squared norm of the first column: |lambda|²."
  ),
  claim(
    "row-remainder-zero",
    ["left-first-entry", "right-first-entry"],
    "Normality equates the first entries, so ||r||² = 0 and therefore r = 0."
  ),
  claim(
    "lower-block-normal",
    ["row-remainder-zero"],
    "The lower-right block of the normality equation is B B† = B† B."
  ),
  claim(
    "inductive-diagonalization",
    ["base-case", "lower-block-normal"],
    "The induction hypothesis gives a unitary diagonalization of B."
  ),
  claim(
    "unitary-diagonalization",
    ["eigenvector-first-basis", "row-remainder-zero", "inductive-diagonalization"],
    "Composing the two unitary basis changes diagonalizes M."
  )
]);

export const kpNormalMatrixProofFixture: KpNormalMatrixProofFixture =
  Object.freeze({
    schemaVersion: "kp.normal-matrix-proof-fixture.v1",
    id: "proof.linear-algebra.normal-matrix-unitary-diagonalization",
    field: "complex",
    theorem: Object.freeze({
      assumption: "M M† = M† M",
      conclusion: "M is unitarily diagonalizable"
    }),
    dimensions: Object.freeze({
      matrix: "n × n",
      eigenvalue: "1 × 1",
      rowRemainder: "1 × (n − 1)",
      zeroColumn: "(n − 1) × 1",
      lowerBlock: "(n − 1) × (n − 1)"
    }),
    blockForm: Object.freeze({
      latex: String.raw`M=\begin{bmatrix}\lambda&r\\0&B\end{bmatrix}`,
      firstRow: Object.freeze(["lambda", "r"] as const),
      firstColumn: Object.freeze(["lambda", "zero"] as const)
    }),
    firstEntryComparison: Object.freeze({
      leftProduct: "M M†",
      leftEntry: "|lambda|² + ||r||²",
      rightProduct: "M† M",
      rightEntry: "|lambda|²",
      unmatchedContribution: "||r||²",
      conclusion: "r = 0"
    }),
    induction: Object.freeze({
      baseDimension: 1,
      recursiveDimension: "n − 1",
      obligations: Object.freeze([
        "B remains a complex square matrix",
        "B is normal",
        "n − 1 is smaller than n",
        "the eigenvector-first basis and the diagonalization of B compose unitarily"
      ] as const)
    }),
    complexScalarDependency:
      "The characteristic polynomial has a root in the scalar field.",
    claims
  });

export function checkKpNormalMatrixProofFixture(
  fixture: KpNormalMatrixProofFixture
): readonly string[] {
  const issues: string[] = [];
  const ids = new Set(fixture.claims.map(({ id }) => id));

  if (ids.size !== kpNormalMatrixProofClaimIds.length) {
    issues.push("Proof claims must have unique stable identities.");
  }
  for (const requiredId of kpNormalMatrixProofClaimIds) {
    if (!ids.has(requiredId)) issues.push(`Missing proof claim ${requiredId}.`);
  }
  for (const proofClaim of fixture.claims) {
    for (const dependencyId of proofClaim.dependsOn) {
      if (!ids.has(dependencyId)) {
        issues.push(`Claim ${proofClaim.id} has unknown dependency ${dependencyId}.`);
      }
    }
  }
  if (
    fixture.blockForm.firstRow[1] !== "r" ||
    fixture.blockForm.firstColumn[1] !== "zero"
  ) {
    issues.push("The eigenvector-first block form must distinguish the unknown row from the forced zero column.");
  }
  if (
    fixture.firstEntryComparison.leftEntry !== "|lambda|² + ||r||²" ||
    fixture.firstEntryComparison.rightEntry !== "|lambda|²" ||
    fixture.firstEntryComparison.unmatchedContribution !== "||r||²"
  ) {
    issues.push("The top-left product entries must preserve the row/column norm comparison.");
  }
  if (
    fixture.induction.baseDimension !== 1 ||
    fixture.induction.recursiveDimension !== "n − 1" ||
    !fixture.induction.obligations.includes("B is normal")
  ) {
    issues.push("The induction contract must expose its base, decreasing dimension, and normal lower block.");
  }
  return Object.freeze(issues);
}

function claim(
  id: KpNormalMatrixProofClaimId,
  dependsOn: readonly KpNormalMatrixProofClaimId[],
  statement: string
): KpNormalMatrixProofClaim {
  return Object.freeze({ id, dependsOn: Object.freeze([...dependsOn]), statement });
}
