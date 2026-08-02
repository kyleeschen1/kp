export type KpVector2 = readonly [number, number];

export interface KpVectorDotProjectionComponentPair {
  readonly index: 0 | 1;
  readonly sourceComponent: number;
  readonly targetComponent: number;
  readonly product: number;
  readonly cumulativeDotProduct: number;
}

export interface KpVectorDotProjectionExemplarContractV1 {
  readonly schemaVersion: "kp.vector-dot-projection-exemplar.v1";
  readonly promotionId: "kp.promotion.vector-dot-projection";
  readonly animationId: "animation.dot-projection.basic";
  readonly familyId: "family.linear-algebra.dot-projection";
  readonly graphLanguageId: "kp.graph.dimensional-continuity.v1";
  readonly sourceVector: KpVector2;
  readonly targetVector: KpVector2;
  readonly componentPairs: readonly KpVectorDotProjectionComponentPair[];
  readonly sourceNormSquared: number;
  readonly targetNormSquared: number;
  readonly dotProduct: number;
  readonly projectionScale: {
    readonly numerator: number;
    readonly denominator: number;
    readonly value: number;
  };
  readonly projectionVector: KpVector2;
  readonly residualVector: KpVector2;
  readonly residualTargetDotProduct: 0;
  readonly exactLatex: {
    readonly source: string;
    readonly target: string;
    readonly componentDotProduct: string;
    readonly magnitudeRelation: string;
    readonly angleRelation: string;
    readonly projectionScale: string;
    readonly projection: string;
    readonly orthogonalDecomposition: string;
  };
  readonly beatIds: readonly string[];
  readonly lineageIds: readonly string[];
}

/**
 * A non-axis-aligned target keeps the geometry honest while the chosen integer
 * pair makes the projection and residual exact. This is semantic authority;
 * renderers may format it but may not recompute or replace the example.
 */
export const kpVectorDotProjectionExemplarContract = Object.freeze({
  schemaVersion: "kp.vector-dot-projection-exemplar.v1",
  promotionId: "kp.promotion.vector-dot-projection",
  animationId: "animation.dot-projection.basic",
  familyId: "family.linear-algebra.dot-projection",
  graphLanguageId: "kp.graph.dimensional-continuity.v1",
  sourceVector: Object.freeze([4, 2] as const),
  targetVector: Object.freeze([1, 1] as const),
  componentPairs: Object.freeze([
    Object.freeze({
      index: 0,
      sourceComponent: 4,
      targetComponent: 1,
      product: 4,
      cumulativeDotProduct: 4
    }),
    Object.freeze({
      index: 1,
      sourceComponent: 2,
      targetComponent: 1,
      product: 2,
      cumulativeDotProduct: 6
    })
  ]),
  sourceNormSquared: 20,
  targetNormSquared: 2,
  dotProduct: 6,
  projectionScale: Object.freeze({
    numerator: 6,
    denominator: 2,
    value: 3
  }),
  projectionVector: Object.freeze([3, 3] as const),
  residualVector: Object.freeze([1, -1] as const),
  residualTargetDotProduct: 0,
  exactLatex: Object.freeze({
    source: "\\mathbf a=(4,2)",
    target: "\\mathbf b=(1,1)",
    componentDotProduct: "\\mathbf a\\cdot\\mathbf b=4\\cdot1+2\\cdot1=6",
    magnitudeRelation:
      "\\lVert\\mathbf a\\rVert=2\\sqrt5,\\quad\\lVert\\mathbf b\\rVert=\\sqrt2",
    angleRelation: "\\cos\\theta=\\frac{3}{\\sqrt{10}}",
    projectionScale:
      "\\frac{\\mathbf a\\cdot\\mathbf b}{\\mathbf b\\cdot\\mathbf b}=\\frac62=3",
    projection:
      "\\operatorname{proj}_{\\mathbf b}(\\mathbf a)=3\\mathbf b=(3,3)",
    orthogonalDecomposition:
      "\\mathbf a=(3,3)+(1,-1),\\quad(1,-1)\\cdot\\mathbf b=0"
  }),
  beatIds: Object.freeze([
    "source-pose",
    "component-pair-x",
    "component-pair-y",
    "dot-settlement",
    "projection-scale",
    "projection-drop",
    "orthogonal-decomposition",
    "native-settlement"
  ]),
  lineageIds: Object.freeze([
    "lineage.component-pair.x-to-dot",
    "lineage.component-pair.y-to-dot",
    "lineage.dot-and-target-norm-to-scale",
    "lineage.scale-and-target-to-projection",
    "lineage.source-and-projection-to-residual",
    "lineage.residual-and-target-to-orthogonality"
  ])
} as const satisfies KpVectorDotProjectionExemplarContractV1);
