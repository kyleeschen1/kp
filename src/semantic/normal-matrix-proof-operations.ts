import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  validateKpAssetBundle,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  validateKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "./correspondence.ts";
import type { KpNormalMatrixProofClaimId } from
  "./normal-matrix-proof-fixture.ts";
import {
  kpNormalMatrixProofSemanticRegistry,
  type KpNormalMatrixProofObjectPath
} from "./normal-matrix-proof-semantics.ts";

export const kpNormalMatrixProofTransformationPaths = Object.freeze([
  "interpret-left-first-entry",
  "interpret-right-first-entry",
  "choose-eigenvector-first-basis",
  "compare-first-entries",
  "force-row-remainder-zero",
  "restrict-normality-to-lower-block"
] as const);

export type KpNormalMatrixProofTransformationPath =
  typeof kpNormalMatrixProofTransformationPaths[number];

export type KpNormalMatrixProofRelationKind =
  | "equates"
  | "produces"
  | "explains"
  | "forces"
  | "transmits";

export interface KpNormalMatrixProofRelation {
  readonly id: string;
  readonly kind: KpNormalMatrixProofRelationKind;
  readonly from: readonly KpNormalMatrixProofObjectPath[];
  readonly to: readonly KpNormalMatrixProofObjectPath[];
  readonly claimIds: readonly KpNormalMatrixProofClaimId[];
  readonly summary: string;
}

export interface KpNormalMatrixProofOperationSet {
  readonly id: "operations.linear-algebra.normal-matrix-proof";
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly relations: readonly KpNormalMatrixProofRelation[];
}

const sceneObjectId = "object.normal-proof.semantic-scene";

export function createKpNormalMatrixProofOperationSet():
  KpNormalMatrixProofOperationSet {
  const bundle = createKpAssetBundle({
    id: "asset.linear-algebra.normal-matrix-proof",
    title: "Why a normal matrix becomes block diagonal",
    objects: [createKpSemanticAssetObject({
      id: sceneObjectId,
      objectType: "normal-matrix-proof-semantic-scene",
      title: "Normal-matrix proof semantic scene",
      value: {
        fixtureId: "proof.linear-algebra.normal-matrix-unitary-diagonalization",
        semanticPaths: kpNormalMatrixProofSemanticRegistry.map(({ path }) => path)
      },
      selectors: kpNormalMatrixProofSemanticRegistry.map((semantic) => ({
        id: kpNormalMatrixProofSelectorId(semantic.path),
        kind: `normal-proof-${semantic.kind}`,
        label: semantic.label,
        summary: semantic.meaning,
        metadata: {
          semanticPath: semantic.path,
          continuityRole: semantic.continuityRole
        }
      })),
      provenance: {
        kind: "authored",
        sourceIds: ["proof.linear-algebra.normal-matrix-unitary-diagonalization"],
        summary: "The reviewed proof fixture and semantic registry own identity; rendered KaTeX does not."
      }
    })]
  });

  const transformations = Object.freeze([
    transformation(
      "interpret-left-first-entry",
      "interpretProductEntry",
      "Read the first row as the first entry of M M†",
      [
        record(
          "first-row-produces-left-entry",
          "fan-in",
          ["matrix/eigenvalue", "matrix/row-remainder"],
          ["product-left/first-entry"],
          "The first-row contributions produce |lambda|² + ||r||²."
        )
      ],
      ["structure", "value"]
    ),
    transformation(
      "interpret-right-first-entry",
      "interpretProductEntry",
      "Read the first column as the first entry of M† M",
      [
        record(
          "first-column-produces-right-entry",
          "fan-in",
          ["matrix/eigenvalue", "matrix/zero-column"],
          ["product-right/first-entry"],
          "The sparse first column produces |lambda|²."
        )
      ],
      ["structure", "value"]
    ),
    transformation(
      "choose-eigenvector-first-basis",
      "chooseOrthonormalBasis",
      "Choose an orthonormal basis beginning with the eigenvector",
      [
        record(
          "matrix-persists-through-basis-choice",
          "identity",
          ["matrix"],
          ["matrix"],
          "M persists while its coordinates change unitarily."
        ),
        record(
          "sparse-column-exposed",
          "introduction",
          [],
          ["matrix/zero-column"],
          "The eigenvector-first coordinates expose zeros below lambda."
        )
      ],
      ["identity", "value", "role"]
    ),
    transformation(
      "compare-first-entries",
      "compareProductEntries",
      "Compare the top-left entries under normality",
      [
        record(
          "product-entries-form-norm-equality",
          "fan-in",
          ["product-left/first-entry", "product-right/first-entry"],
          ["inference/norm-equality"],
          "Normality turns the two computed entries into one equality."
        )
      ],
      ["value", "structure"]
    ),
    transformation(
      "force-row-remainder-zero",
      "deriveZeroFromSquaredNorm",
      "Force the unmatched row remainder to vanish",
      [
        record(
          "zero-norm-forces-zero-row",
          "fan-in",
          ["inference/norm-equality", "matrix/row-remainder"],
          ["inference/remainder-zero"],
          "The unmatched nonnegative squared norm must be zero, hence r is zero."
        ),
        record(
          "matrix-settles-block-diagonal",
          "role-change",
          ["matrix"],
          ["matrix/block-diagonal"],
          "The same matrix settles as lambda direct-sum B."
        )
      ],
      ["identity", "structure", "value"]
    ),
    transformation(
      "restrict-normality-to-lower-block",
      "restrictBlockEquation",
      "Restrict normality to the lower-right block",
      [
        record(
          "normality-descends-to-lower-block",
          "fan-in",
          ["normality", "matrix/lower-block"],
          ["proof/recursive-subproblem"],
          "The lower-right blocks give B B† = B† B."
        )
      ],
      ["identity", "structure", "value"]
    )
  ]);

  const relations: readonly KpNormalMatrixProofRelation[] = Object.freeze([
    relation("normality-equates-products", "equates", ["normality"], ["product-left", "product-right"], ["unitary-basis-invariance"], "Normality equates M M† and M† M in the chosen orthonormal basis."),
    relation("first-row-produces-left-entry", "produces", ["matrix/eigenvalue", "matrix/row-remainder"], ["product-left/first-entry"], ["left-first-entry"], "The first row produces the left product's top-left entry."),
    relation("first-column-produces-right-entry", "produces", ["matrix/eigenvalue", "matrix/zero-column"], ["product-right/first-entry"], ["right-first-entry"], "The first column produces the right product's top-left entry."),
    relation("eigenbasis-explains-zero-column", "explains", ["eigenbasis"], ["matrix/zero-column"], ["eigenvector-first-basis"], "Mv = lambda v explains the sparse first column."),
    relation("first-entry-comparison-forces-zero", "forces", ["product-left/first-entry", "product-right/first-entry"], ["inference/remainder-zero"], ["row-remainder-zero"], "The equal entries force the unmatched squared norm and r to vanish."),
    relation("block-diagonal-transmits-normality", "transmits", ["normality", "matrix/block-diagonal"], ["proof/recursive-subproblem"], ["lower-block-normal"], "The block-diagonal form transmits normality to B.")
  ]);

  assertValid(bundle, transformations, relations);
  return Object.freeze({
    id: "operations.linear-algebra.normal-matrix-proof",
    bundle,
    transformations,
    relations
  });
}

export function kpNormalMatrixProofSelectorId(
  path: KpNormalMatrixProofObjectPath
): string {
  return `selector.normal-proof.${path.replaceAll("/", ".")}`;
}

export function checkKpNormalMatrixProofOperationSet(
  operations: KpNormalMatrixProofOperationSet
): readonly string[] {
  const issues = [
    ...validateKpAssetBundle(operations.bundle).map(({ message }) => message),
    ...operations.transformations.flatMap((candidate) => [
      ...validateKpSemanticTransformation(candidate, operations.bundle).map(
        ({ message }) => message
      ),
      ...(candidate.correspondenceMap === undefined
        ? []
        : validateCorrespondenceMap(candidate.correspondenceMap).map(
            ({ message }) => message
          ))
    ])
  ];
  const knownPaths = new Set(
    kpNormalMatrixProofSemanticRegistry.map(({ path }) => path)
  );
  const transformationPaths = operations.transformations.map(({ id }) =>
    id.replace("transform.normal-proof.", "")
  );
  if (
    transformationPaths.length !== kpNormalMatrixProofTransformationPaths.length ||
    transformationPaths.some(
      (path, index) => path !== kpNormalMatrixProofTransformationPaths[index]
    )
  ) {
    issues.push("Normal-proof transformations must preserve the six authored semantic paths and order.");
  }
  for (const proofRelation of operations.relations) {
    for (const path of [...proofRelation.from, ...proofRelation.to]) {
      if (!knownPaths.has(path)) {
        issues.push(`Relation ${proofRelation.id} references unknown path ${path}.`);
      }
    }
    if (proofRelation.claimIds.length === 0) {
      issues.push(`Relation ${proofRelation.id} lacks mathematical provenance.`);
    }
  }
  return Object.freeze(issues);
}

function transformation(
  path: KpNormalMatrixProofTransformationPath,
  transformType: string,
  title: string,
  records: CorrespondenceMap["records"],
  preserves: KpSemanticTransformation["preserves"]
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: `transform.normal-proof.${path}`,
    definitionId: `definition.normal-proof.${path}`,
    transformType,
    title,
    sourceObjectIds: [sceneObjectId],
    targetObjectIds: [sceneObjectId],
    preserves,
    correspondenceMap: {
      id: `correspondence.normal-proof.${path}`,
      records
    },
    assumptions: ["M is a complex normal matrix"],
    lawRefs: [{
      id: "kp.normal-matrix.reviewed-proof-fixture",
      level: "strict",
      summary: "The reviewed fixture, not visual motion, owns each inference."
    }]
  });
}

function record(
  id: string,
  relationKind: SelectorCorrespondenceRelationId,
  sourcePaths: readonly KpNormalMatrixProofObjectPath[],
  targetPaths: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): CorrespondenceMap["records"][number] {
  return {
    id,
    relation: relationKind,
    sourceSelectorIds: sourcePaths.map(kpNormalMatrixProofSelectorId),
    targetSelectorIds: targetPaths.map(kpNormalMatrixProofSelectorId),
    summary
  };
}

function relation(
  id: string,
  kind: KpNormalMatrixProofRelationKind,
  from: readonly KpNormalMatrixProofObjectPath[],
  to: readonly KpNormalMatrixProofObjectPath[],
  claimIds: readonly KpNormalMatrixProofClaimId[],
  summary: string
): KpNormalMatrixProofRelation {
  return Object.freeze({
    id: `relation.normal-proof.${id}`,
    kind,
    from: Object.freeze([...from]),
    to: Object.freeze([...to]),
    claimIds: Object.freeze([...claimIds]),
    summary
  });
}

function assertValid(
  bundle: KpAssetBundle,
  transformations: readonly KpSemanticTransformation[],
  relations: readonly KpNormalMatrixProofRelation[]
): void {
  const candidate = {
    id: "operations.linear-algebra.normal-matrix-proof" as const,
    bundle,
    transformations,
    relations
  };
  const issues = checkKpNormalMatrixProofOperationSet(candidate);
  if (issues.length > 0) throw new Error(issues[0]);
}
