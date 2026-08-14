import type { KpNormalMatrixProofClaimId } from
  "./normal-matrix-proof-fixture.ts";

export type KpNormalMatrixProofSemanticKind =
  | "entity"
  | "group"
  | "region"
  | "relation"
  | "representation";

export type KpNormalMatrixProofContinuityRole =
  | "persistent-identity"
  | "governing-assumption"
  | "chosen-context"
  | "persistent-term"
  | "decisive-target"
  | "derived-evidence"
  | "derived-conclusion"
  | "settled-endpoint"
  | "recursive-subproblem";

export interface KpNormalMatrixProofSemanticEntity {
  readonly path: KpNormalMatrixProofObjectPath;
  readonly address: `normal-proof/${KpNormalMatrixProofObjectPath}`;
  readonly kind: KpNormalMatrixProofSemanticKind;
  readonly label: string;
  readonly meaning: string;
  readonly continuityRole: KpNormalMatrixProofContinuityRole;
  readonly parentPath?: KpNormalMatrixProofObjectPath | undefined;
  readonly provenance: {
    readonly fixtureId:
      "proof.linear-algebra.normal-matrix-unitary-diagonalization";
    readonly claimIds: readonly KpNormalMatrixProofClaimId[];
  };
}

export const kpNormalMatrixProofObjectPaths = Object.freeze([
  "matrix",
  "normality",
  "eigenbasis",
  "matrix/eigenvalue",
  "matrix/row-remainder",
  "matrix/zero-column",
  "matrix/lower-block",
  "product-left",
  "product-left/first-entry",
  "product-right",
  "product-right/first-entry",
  "inference/norm-equality",
  "inference/remainder-zero",
  "matrix/block-diagonal",
  "proof/recursive-subproblem"
] as const);

export type KpNormalMatrixProofObjectPath =
  typeof kpNormalMatrixProofObjectPaths[number];

export const kpNormalMatrixProofSemanticRegistry:
  readonly KpNormalMatrixProofSemanticEntity[] = Object.freeze([
    entity(
      "matrix",
      "entity",
      "M",
      "The same complex normal matrix throughout the proof.",
      "persistent-identity",
      ["unitary-basis-invariance", "unitary-diagonalization"]
    ),
    entity(
      "normality",
      "relation",
      "normality",
      "The governing relation M M† = M† M.",
      "governing-assumption",
      ["unitary-basis-invariance", "row-remainder-zero"]
    ),
    entity(
      "eigenbasis",
      "region",
      "eigenvector-first basis",
      "An orthonormal basis whose first vector is the eigenvector v.",
      "chosen-context",
      ["complex-eigenpair", "eigenvector-first-basis"]
    ),
    child(
      "matrix/eigenvalue",
      "entity",
      "lambda",
      "The eigenvalue in the top-left block.",
      "persistent-term",
      "matrix",
      ["complex-eigenpair", "eigenvector-first-basis"]
    ),
    child(
      "matrix/row-remainder",
      "group",
      "r",
      "The one-by-(n-minus-one) row whose vanishing is the decisive inference.",
      "decisive-target",
      "matrix",
      ["eigenvector-first-basis", "row-remainder-zero"]
    ),
    child(
      "matrix/zero-column",
      "group",
      "zero column",
      "The zeros below lambda forced by Mv = lambda v.",
      "derived-evidence",
      "matrix",
      ["eigenvector-first-basis"]
    ),
    child(
      "matrix/lower-block",
      "region",
      "B",
      "The lower-right square block and recursive subproblem.",
      "persistent-identity",
      "matrix",
      ["eigenvector-first-basis", "lower-block-normal"]
    ),
    entity(
      "product-left",
      "group",
      "M M†",
      "The left product in the normality relation.",
      "derived-evidence",
      ["left-first-entry"]
    ),
    child(
      "product-left/first-entry",
      "entity",
      "first entry",
      "The squared norm of the first row: |lambda|² + ||r||².",
      "derived-evidence",
      "product-left",
      ["left-first-entry"]
    ),
    entity(
      "product-right",
      "group",
      "M† M",
      "The right product in the normality relation.",
      "derived-evidence",
      ["right-first-entry"]
    ),
    child(
      "product-right/first-entry",
      "entity",
      "first entry",
      "The squared norm of the first column: |lambda|².",
      "derived-evidence",
      "product-right",
      ["right-first-entry"]
    ),
    entity(
      "inference/norm-equality",
      "relation",
      "norm equality",
      "The equality |lambda|² + ||r||² = |lambda|².",
      "derived-evidence",
      ["left-first-entry", "right-first-entry", "row-remainder-zero"]
    ),
    entity(
      "inference/remainder-zero",
      "relation",
      "r = 0",
      "The zero-norm conclusion for the row remainder.",
      "derived-conclusion",
      ["row-remainder-zero"]
    ),
    child(
      "matrix/block-diagonal",
      "representation",
      "lambda direct-sum B",
      "The settled block-diagonal representation of the same matrix M.",
      "settled-endpoint",
      "matrix",
      ["row-remainder-zero"]
    ),
    entity(
      "proof/recursive-subproblem",
      "region",
      "normal lower block B",
      "The normal lower block to which the induction hypothesis applies.",
      "recursive-subproblem",
      ["lower-block-normal", "inductive-diagonalization"]
    )
  ]);

export function findKpNormalMatrixProofSemanticEntity(
  path: KpNormalMatrixProofObjectPath
): KpNormalMatrixProofSemanticEntity {
  const found = kpNormalMatrixProofSemanticRegistry.find(
    (candidate) => candidate.path === path
  );
  if (found === undefined) throw new Error(`Unknown normal-proof semantic path ${path}.`);
  return found;
}

export function checkKpNormalMatrixProofSemanticRegistry(
  registry: readonly KpNormalMatrixProofSemanticEntity[] =
    kpNormalMatrixProofSemanticRegistry
): readonly string[] {
  const issues: string[] = [];
  const paths = new Set<KpNormalMatrixProofObjectPath>();

  for (const candidate of registry) {
    if (paths.has(candidate.path)) {
      issues.push(`Duplicate normal-proof semantic path ${candidate.path}.`);
    }
    paths.add(candidate.path);
    if (candidate.address !== `normal-proof/${candidate.path}`) {
      issues.push(`Semantic path ${candidate.path} has a non-canonical address.`);
    }
    if (candidate.provenance.claimIds.length === 0) {
      issues.push(`Semantic path ${candidate.path} lacks proof-claim provenance.`);
    }
  }
  for (const expected of kpNormalMatrixProofObjectPaths) {
    if (!paths.has(expected)) issues.push(`Missing normal-proof semantic path ${expected}.`);
  }
  for (const candidate of registry) {
    if (candidate.parentPath !== undefined && !paths.has(candidate.parentPath)) {
      issues.push(`Semantic path ${candidate.path} has unknown parent ${candidate.parentPath}.`);
    }
  }
  return Object.freeze(issues);
}

function entity(
  path: KpNormalMatrixProofObjectPath,
  kind: KpNormalMatrixProofSemanticKind,
  label: string,
  meaning: string,
  continuityRole: KpNormalMatrixProofContinuityRole,
  claimIds: readonly KpNormalMatrixProofClaimId[]
): KpNormalMatrixProofSemanticEntity {
  return Object.freeze({
    path,
    address: `normal-proof/${path}`,
    kind,
    label,
    meaning,
    continuityRole,
    provenance: Object.freeze({
      fixtureId: "proof.linear-algebra.normal-matrix-unitary-diagonalization",
      claimIds: Object.freeze([...claimIds])
    })
  });
}

function child(
  path: KpNormalMatrixProofObjectPath,
  kind: KpNormalMatrixProofSemanticKind,
  label: string,
  meaning: string,
  continuityRole: KpNormalMatrixProofContinuityRole,
  parentPath: KpNormalMatrixProofObjectPath,
  claimIds: readonly KpNormalMatrixProofClaimId[]
): KpNormalMatrixProofSemanticEntity {
  return Object.freeze({
    ...entity(path, kind, label, meaning, continuityRole, claimIds),
    parentPath
  });
}
