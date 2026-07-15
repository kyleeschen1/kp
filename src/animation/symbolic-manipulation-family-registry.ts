import {
  createKpSymbolicManipulationFamily,
  type KpSymbolicManipulationDomain,
  type KpSymbolicManipulationFamily
} from "./symbolic-manipulation-family.ts";
import {
  createKpSemanticTransformationDefinition
} from "../semantic/asset-transformation.ts";

interface SymbolicManipulationFamilySeedSpec {
  readonly id: string;
  readonly title: string;
  readonly domain: KpSymbolicManipulationDomain;
  readonly tags: readonly string[];
  readonly summary: string;
  readonly searchSummary: string;
  readonly graphEquivalentKinds: readonly string[];
  readonly composition?: string | undefined;
}

const symbolicManipulationFamilySeedSpecs:
  readonly SymbolicManipulationFamilySeedSpec[] = [
    {
      id: "family.algebra.both-sides",
      title: "Both-sides equation operations",
      domain: "algebra",
      tags: ["equation", "inverse-operation", "generated-problem"],
      summary:
        "Seed symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
      searchSummary:
        "add, subtract, multiply, and divide both sides while preserving equality",
      graphEquivalentKinds: ["equation-graph"]
    },
    {
      id: "family.algebra.cancel-combine",
      title: "Cancellation and combine-like-terms",
      domain: "algebra",
      tags: ["cancelation", "simplification", "like-terms"],
      summary:
        "Seed symbolic manipulation family for cancellation and combining like terms.",
      searchSummary:
        "cancel additive inverses multiplicative inverses combine like terms simplify",
      graphEquivalentKinds: ["equation-graph"]
    },
    {
      id: "family.algebra.distribution-factoring",
      title: "Distribution and factoring",
      domain: "algebra",
      tags: ["distribution", "factoring", "inverse-operation"],
      summary:
        "Seed symbolic manipulation family for distributing products over sums and factoring common terms.",
      searchSummary:
        "distribute factor common term expand collect inverse operation",
      graphEquivalentKinds: ["equation-graph"]
    },
    {
      id: "family.algebra.fraction-simplification",
      title: "Fraction simplification",
      domain: "algebra",
      tags: ["fraction", "simplification", "common-denominator"],
      summary:
        "Seed symbolic manipulation family for splitting, merging, simplifying, and common-denominator fraction rewrites.",
      searchSummary:
        "fraction simplify split merge reciprocal common denominator numerator denominator",
      graphEquivalentKinds: ["equation-graph"]
    },
    {
      id: "family.algebra.exponent-log-laws",
      title: "Exponent and logarithm laws",
      domain: "algebra",
      tags: ["exponent", "logarithm", "inverse-operation"],
      summary:
        "Seed symbolic manipulation family for powers, roots, exponent laws, logarithm laws, and inverse rewrites.",
      searchSummary:
        "exponent logarithm power root radical inverse product quotient law",
      graphEquivalentKinds: ["equation-graph", "function-graph"]
    },
    {
      id: "family.algebra.inequality",
      title: "Inequality transformations",
      domain: "algebra",
      tags: ["inequality", "sign-flip", "validity"],
      summary:
        "Seed symbolic manipulation family for inequality-preserving operations and sign-flip cases.",
      searchSummary:
        "inequality preserve order sign flip multiply divide negative valid transform",
      graphEquivalentKinds: ["number-line", "region-graph"]
    },
    {
      id: "family.calculus.derivative-rules",
      title: "Derivative rules",
      domain: "calculus",
      tags: ["derivative", "chain-rule", "tangent"],
      summary:
        "Seed symbolic manipulation family for sum, constant multiple, power, product, quotient, and chain derivative rules.",
      searchSummary:
        "derivative sum power product quotient chain rule tangent slope",
      graphEquivalentKinds: ["tangent-line"]
    },
    {
      id: "family.calculus.integral-ftc",
      title: "Integral and FTC transformations",
      domain: "calculus",
      tags: ["integral", "ftc", "area"],
      summary:
        "Seed symbolic manipulation family for antiderivatives, definite integrals, bounds, and the Fundamental Theorem of Calculus.",
      searchSummary:
        "integral antiderivative definite bounds fundamental theorem calculus area",
      graphEquivalentKinds: ["area-accumulation"]
    },
    {
      id: "family.calculus.taylor-local-linearization",
      title: "Taylor and local linearization",
      domain: "calculus",
      tags: ["taylor", "linearization", "approximation"],
      summary:
        "Seed symbolic manipulation family for Taylor expansion, truncation, remainder annotation, and local linear approximation.",
      searchSummary:
        "taylor series local linearization approximation remainder tangent polynomial",
      graphEquivalentKinds: ["function-graph", "tangent-line"]
    },
    {
      id: "family.calculus.gradient-jacobian",
      title: "Gradient and Jacobian",
      domain: "calculus",
      tags: ["gradient", "jacobian", "local-linear-map"],
      summary:
        "Seed symbolic manipulation family for scalar gradients and vector-valued Jacobians with local-linear-map views.",
      searchSummary:
        "gradient jacobian partial derivatives matrix local linear map multivariable",
      graphEquivalentKinds: ["local-linear-map", "vector-field"]
    },
    {
      id: "family.calculus.hessian-optimization",
      title: "Hessian and optimization",
      domain: "calculus",
      tags: ["hessian", "optimization", "curvature"],
      summary:
        "Seed symbolic manipulation family for Hessians, quadratic forms, second-derivative tests, and optimization stationarity.",
      searchSummary:
        "hessian optimization curvature quadratic form second derivative stationarity critical point",
      graphEquivalentKinds: ["curvature", "quadratic-form"]
    },
    {
      id: "family.linear-algebra.vector-add-scale",
      title: "Vector add and scale",
      domain: "linear-algebra",
      tags: ["vector", "scale", "graph"],
      summary:
        "Seed symbolic manipulation family for vector addition, scalar multiplication, and component persistence.",
      searchSummary:
        "vector addition scalar multiplication scale components parallelogram",
      graphEquivalentKinds: ["vector-graph"]
    },
    {
      id: "family.linear-algebra.dot-projection",
      title: "Dot product and projection",
      domain: "linear-algebra",
      tags: ["dot-product", "projection", "orthogonality"],
      summary:
        "Seed symbolic manipulation family for dot products, projections, orthogonality, and angle/length interpretations.",
      searchSummary:
        "dot product projection orthogonal angle length scalar component",
      graphEquivalentKinds: ["vector-graph"]
    },
    {
      id: "family.linear-algebra.matrix-vector",
      title: "Matrix-vector multiplication",
      domain: "linear-algebra",
      tags: ["matrix", "vector", "linear-map"],
      summary:
        "Seed symbolic manipulation family for matrix-vector multiplication as row dot products and linear-map equivalents.",
      searchSummary:
        "matrix vector multiplication row dot products linear map transform",
      graphEquivalentKinds: ["linear-map"]
    },
    {
      id: "family.linear-algebra.matrix-matrix-composition",
      title: "Matrix-matrix composition",
      domain: "linear-algebra",
      tags: ["matrix", "composition", "dot-product"],
      summary:
        "Seed symbolic manipulation family for matrix multiplication as a composition of dot-product subanimations.",
      searchSummary:
        "matrix multiplication dot products composition columns rows higher order animation",
      graphEquivalentKinds: ["linear-map-composition"],
      composition: "matrix multiplication as composed dot products"
    },
    {
      id: "family.linear-algebra.row-operations",
      title: "Row operations",
      domain: "linear-algebra",
      tags: ["row-operation", "system", "determinant"],
      summary:
        "Seed symbolic manipulation family for row swap, row scale, and row replacement with system and determinant metadata.",
      searchSummary:
        "row operations swap scale replacement gaussian elimination determinant system equations",
      graphEquivalentKinds: ["solution-set"]
    },
    {
      id: "family.linear-algebra.determinant-inverse",
      title: "Determinant and inverse",
      domain: "linear-algebra",
      tags: ["determinant", "inverse", "area-volume"],
      summary:
        "Seed symbolic manipulation family for determinants as area/volume scaling and inverses as undoing linear maps.",
      searchSummary:
        "determinant inverse area volume scaling undo linear map",
      graphEquivalentKinds: ["linear-map", "area-volume-scaling"]
    },
    {
      id: "family.linear-algebra.basis-eigen",
      title: "Basis change and eigen examples",
      domain: "linear-algebra",
      tags: ["basis", "eigen", "diagonalization"],
      summary:
        "Seed symbolic manipulation family for basis changes, coordinate transforms, eigenvectors, eigenvalues, and diagonalization.",
      searchSummary:
        "basis change coordinates eigenvectors eigenvalues diagonalization invariant direction",
      graphEquivalentKinds: ["linear-map", "eigenvector-graph"]
    }
  ];

export function createSymbolicManipulationFamilyRegistry():
  readonly KpSymbolicManipulationFamily[] {
  return [
    createAlgebraBothSidesFamily(),
    createAlgebraCancelCombineFamily(),
    createAlgebraDistributionFactoringFamily(),
    createAlgebraFractionSimplificationFamily(),
    createAlgebraExponentLogFamily(),
    createAlgebraInequalityFamily(),
    createCalculusDerivativeRulesFamily(),
    createCalculusIntegralFtcFamily(),
    createCalculusTaylorLocalLinearizationFamily(),
    createCalculusGradientJacobianFamily(),
    createCalculusHessianOptimizationFamily(),
    createLinearAlgebraVectorAddScaleFamily(),
    createLinearAlgebraDotProjectionFamily(),
    createLinearAlgebraMatrixVectorFamily(),
    createLinearAlgebraMatrixMatrixCompositionFamily(),
    createLinearAlgebraRowOperationsFamily(),
    createLinearAlgebraDeterminantInverseFamily(),
    createLinearAlgebraBasisEigenFamily(),
    ...symbolicManipulationFamilySeedSpecs
      .filter(
        (spec) =>
          spec.id !== "family.algebra.both-sides" &&
          spec.id !== "family.algebra.cancel-combine" &&
          spec.id !== "family.algebra.distribution-factoring" &&
          spec.id !== "family.algebra.fraction-simplification" &&
          spec.id !== "family.algebra.exponent-log-laws" &&
          spec.id !== "family.algebra.inequality" &&
          spec.id !== "family.calculus.derivative-rules" &&
          spec.id !== "family.calculus.integral-ftc" &&
          spec.id !== "family.calculus.taylor-local-linearization" &&
          spec.id !== "family.calculus.gradient-jacobian" &&
          spec.id !== "family.calculus.hessian-optimization" &&
          spec.id !== "family.linear-algebra.vector-add-scale" &&
          spec.id !== "family.linear-algebra.dot-projection" &&
          spec.id !== "family.linear-algebra.matrix-vector" &&
          spec.id !== "family.linear-algebra.matrix-matrix-composition" &&
          spec.id !== "family.linear-algebra.row-operations" &&
          spec.id !== "family.linear-algebra.determinant-inverse" &&
          spec.id !== "family.linear-algebra.basis-eigen"
      )
      .map(createSeedFamily)
  ];
}

export function symbolicManipulationFamilyById(
  id: string
): KpSymbolicManipulationFamily | undefined {
  return createSymbolicManipulationFamilyRegistry().find(
    (family) => family.id === id
  );
}

function createSeedFamily(
  spec: SymbolicManipulationFamilySeedSpec
): KpSymbolicManipulationFamily {
  return (
    createKpSymbolicManipulationFamily({
      id: spec.id,
      title: spec.title,
      domain: spec.domain,
      status: "seed",
      dashboard: {
        rowId: symbolicManipulationFamilyRowId(spec.id),
        tags: spec.tags
      },
      metadata: {
        summary: spec.summary,
        searchSummary: spec.searchSummary,
        graphEquivalentKinds: spec.graphEquivalentKinds.join(","),
        ...(spec.composition === undefined ? {} : { composition: spec.composition })
      }
    })
  );
}

function createAlgebraBothSidesFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.add-both-sides",
    "definition.symbolic.algebra.subtract-both-sides",
    "definition.symbolic.algebra.multiply-both-sides",
    "definition.symbolic.algebra.divide-both-sides"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.both-sides",
    title: "Both-sides equation operations",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "equation.before",
        objectType: "equation",
        title: "Source equation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term" },
          { id: "equals", kind: "relation" },
          { id: "rhs.value", kind: "term" }
        ]
      },
      {
        id: "equation.after",
        objectType: "equation",
        title: "Equation after both-sides operation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term" },
          { id: "equals", kind: "relation" },
          { id: "rhs.value", kind: "term" },
          { id: "operation.artifact", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.add-both-sides",
        transformType: "addBothSides",
        title: "Add the same value to both sides",
        lawId: "law.equation.add-both-sides",
        assumption: "Adding equal quantities preserves equality."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.subtract-both-sides",
        transformType: "subtractBothSides",
        title: "Subtract the same value from both sides",
        lawId: "law.equation.subtract-both-sides",
        assumption: "Subtracting equal quantities preserves equality."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.multiply-both-sides",
        transformType: "multiplyBothSides",
        title: "Multiply both sides by the same value",
        lawId: "law.equation.multiply-both-sides",
        assumption:
          "Multiplying both sides preserves equality; equivalence requires a non-zero multiplier."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.divide-both-sides",
        transformType: "divideBothSides",
        title: "Divide both sides by the same non-zero value",
        lawId: "law.equation.divide-both-sides",
        assumption:
          "Dividing equal quantities by the same non-zero value preserves equality."
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.both-sides.append-after-shift",
        motifKind: "append-after-shift",
        transformationDefinitionIds: definitionIds,
        summary:
          "Persistent tokens shift first, then the operation artifact appears on both sides."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.solve-x.both-sides",
        animationId: "animation.linear-solve.solve-x",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.subtract-both-sides"
        ],
        summary: "Existing x + 3 = 7 animation exercises subtract-both-sides."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.both-sides.solution-set",
        title: "Equation solution set is preserved",
        representationKind: "equation-graph",
        exactness: "qualitative",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.solution-set-preservation",
            level: "qualitative"
          }
        ],
        sampleAssetIds: ["animation.linear-solve.solve-x"],
        summary:
          "Both-sides operations preserve the solution set even when the rendered equation changes."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-solve.both-sides",
        fixtureFamilyId: "generated.linear-solve",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated linear-solve traces can map add/subtract/multiply/divide both-sides steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.both-sides.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which operation isolates or preserves the equation next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.both-sides"),
      tags: ["equation", "inverse-operation", "generated-problem"]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
      searchSummary:
        "add, subtract, multiply, and divide both sides while preserving equality",
      graphEquivalentKinds: "equation-graph"
    }
  });
}

function createBothSidesDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["equation.before"],
    targetObjectRoles: ["equation.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "lhs.variable",
        targetObjectRole: "equation.after",
        targetSelectorRole: "lhs.variable",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "equals",
        targetObjectRole: "equation.after",
        targetSelectorRole: "equals",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "rhs.value",
        targetObjectRole: "equation.after",
        targetSelectorRole: "rhs.value",
        preserves: ["identity", "role"]
      }
    ]
  });
}

function createAlgebraCancelCombineFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.cancel-additive-inverses",
    "definition.symbolic.algebra.cancel-multiplicative-inverses",
    "definition.symbolic.algebra.combine-like-terms"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.cancel-combine",
    title: "Cancellation and combine-like-terms",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "expression.before",
        objectType: "expression",
        title: "Expression before simplification",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "inverse.left", kind: "term" },
          { id: "inverse.operator", kind: "operator" },
          { id: "inverse.right", kind: "term" },
          { id: "like.coefficient.left", kind: "coefficient" },
          { id: "like.factor.left", kind: "factor" },
          { id: "like.operator", kind: "operator" },
          { id: "like.coefficient.right", kind: "coefficient" },
          { id: "like.factor.right", kind: "factor" }
        ]
      },
      {
        id: "expression.after",
        objectType: "expression",
        title: "Expression after simplification",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "like.coefficient.combined", kind: "coefficient" },
          { id: "like.factor.combined", kind: "factor" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.cancel-additive-inverses",
        transformType: "cancelAdditiveInverses",
        title: "Cancel additive inverses",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value"],
        assumptions: [
          "Additive inverse terms are on the same expression side and sum to zero."
        ],
        lawRefs: [
          {
            id: "law.algebra.additive-inverse-cancellation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.cancel-multiplicative-inverses",
        transformType: "cancelMultiplicativeInverses",
        title: "Cancel multiplicative inverses",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value"],
        assumptions: [
          "Multiplicative inverse factors are non-zero and multiply to one."
        ],
        lawRefs: [
          {
            id: "law.algebra.multiplicative-inverse-cancellation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.combine-like-terms",
        transformType: "combineLikeTerms",
        title: "Combine like terms",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Like terms share the same symbolic factor and only their coefficients combine."
        ],
        lawRefs: [
          {
            id: "law.algebra.combine-like-terms",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.coefficient.left",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.coefficient.combined",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.factor.left",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.factor.combined",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.coefficient.right",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.coefficient.combined",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.factor.right",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.factor.combined",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.cancel-combine.midpoint-vanish",
        motifKind: "midpoint-vanish",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.cancel-additive-inverses",
          "definition.symbolic.algebra.cancel-multiplicative-inverses"
        ],
        summary:
          "Inverse tokens move to their midpoint, shrink together, then fade once overlapped.",
        metadata: {
          reversible: true,
          reverseMotifKind: "emerge-from-midpoint"
        }
      },
      {
        id: "motif.algebra.cancel-combine.coalesce-replacement",
        motifKind: "coalesce-replacement",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.combine-like-terms"
        ],
        summary:
          "Like terms converge to a shared point while the replacement term grows from that point on rewindable timing.",
        metadata: {
          reversible: true
        }
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.solve-x.cancel-additive-inverses",
        animationId: "animation.linear-solve.solve-x",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.cancel-additive-inverses"
        ],
        summary:
          "Existing x + 3 - 3 cancellation exercises additive inverse vanish."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.cancel-combine.expression-value",
        title: "Expression value is preserved",
        representationKind: "expression-evaluation",
        exactness: "exact",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.expression-value-preservation",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.linear-solve.solve-x"],
        summary:
          "Cancellation and combine-like-terms keep equivalent expressions or equation sides on the same value trace."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-simplify.cancel-combine",
        fixtureFamilyId: "generated.linear-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated simplification traces can map inverse-pair cancellation and like-term combination to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.cancel-combine.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which inverse pair vanishes or which like terms combine next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.cancel-combine"),
      tags: [
        "cancelation",
        "simplification",
        "like-terms",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for cancellation and combining like terms with reversible vanish/coalesce motifs.",
      searchSummary:
        "cancel additive inverses multiplicative inverses combine like terms simplify reversible midpoint vanish coalesce replacement",
      graphEquivalentKinds: "expression-evaluation"
    }
  });
}

function createAlgebraDistributionFactoringFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.distribute-product-over-sum",
    "definition.symbolic.algebra.factor-common-term"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.distribution-factoring",
    title: "Distribution and factoring",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "expression.factored",
        objectType: "expression",
        title: "Factored expression",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "factor.shared", kind: "factor" },
          { id: "product.operator", kind: "operator" },
          { id: "group.open", kind: "wrapper" },
          { id: "group.term.left", kind: "term" },
          { id: "group.operator", kind: "operator" },
          { id: "group.term.right", kind: "term" },
          { id: "group.close", kind: "wrapper" }
        ]
      },
      {
        id: "expression.distributed",
        objectType: "expression",
        title: "Distributed expression",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "factor.left.copy", kind: "factor" },
          { id: "product.operator.left", kind: "operator" },
          { id: "term.left", kind: "term" },
          { id: "distributed.operator", kind: "operator" },
          { id: "factor.right.copy", kind: "factor" },
          { id: "product.operator.right", kind: "operator" },
          { id: "term.right", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.distribute-product-over-sum",
        transformType: "distributeProductOverSum",
        title: "Distribute product over sum",
        sourceObjectRoles: ["expression.factored"],
        targetObjectRoles: ["expression.distributed"],
        preserves: ["value", "structure"],
        assumptions: [
          "The grouped terms form a sum or difference and the shared factor applies to the whole group."
        ],
        lawRefs: [
          {
            id: "law.algebra.distribution",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "factor.shared",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "factor.left.copy",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "factor.shared",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "factor.right.copy",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.term.left",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "term.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.operator",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "distributed.operator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.term.right",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "term.right",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.factor-common-term",
        transformType: "factorCommonTerm",
        title: "Factor a common term",
        sourceObjectRoles: ["expression.distributed"],
        targetObjectRoles: ["expression.factored"],
        preserves: ["value", "structure"],
        assumptions: [
          "Distributed terms share a common factor that can be reconciled into one factored role."
        ],
        lawRefs: [
          {
            id: "law.algebra.common-factor",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "factor.left.copy",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "factor.shared",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "factor.right.copy",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "factor.shared",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "term.left",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.term.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "distributed.operator",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.operator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "term.right",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.term.right",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.distribution-factoring.copy-sweep",
        motifKind: "copy-sweep",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.distribute-product-over-sum"
        ],
        summary:
          "The shared factor yields two value-preserving copies that sweep into each distributed product while grouping artifacts fade away.",
        metadata: {
          reversible: true,
          inverseMotifKind: "group-wrap"
        }
      },
      {
        id: "motif.algebra.distribution-factoring.group-wrap",
        motifKind: "group-wrap",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.factor-common-term"
        ],
        summary:
          "Matching factor copies reconcile into one shared factor, then grouping artifacts wrap the remaining sum.",
        metadata: {
          reversible: true,
          inverseMotifKind: "copy-sweep"
        }
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.distribution-factoring.basic",
        animationId: "animation.distribution-factoring.basic",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic a(b + c) and ab + ac sample exercises distribution and factoring as reversible views."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.distribution-factoring.area-model",
        title: "Area model preserves total area",
        representationKind: "area-model",
        exactness: "exact",
        preserves: ["value", "structure"],
        lawRefs: [
          {
            id: "law.graph.area-distribution",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.distribution-factoring.basic"],
        summary:
          "Distribution splits one rectangle into pieces while factoring regroups equal total area."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.algebra-expand-factor.distribution",
        fixtureFamilyId: "generated.algebra-expand-factor",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated expand/factor traces can map copied factors, grouped terms, and artifact wrappers to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.distribution-factoring.relationship",
        kind: "relationship",
        transformationDefinitionIds: definitionIds,
        summary:
          "Relationship cards can ask which distributed factors reconcile into a shared factor."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.algebra.distribution-factoring"
      ),
      tags: [
        "distribution",
        "factoring",
        "inverse-operation",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for distributing products over sums and factoring common terms.",
      searchSummary:
        "distribute factor common term expand collect inverse operation copied factor grouped artifacts area model",
      graphEquivalentKinds: "area-model"
    }
  });
}

function createAlgebraFractionSimplificationFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.split-fraction-sum",
    "definition.symbolic.algebra.merge-fractions",
    "definition.symbolic.algebra.cancel-common-factor",
    "definition.symbolic.algebra.create-common-denominator",
    "definition.symbolic.algebra.reciprocal-rewrite"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.fraction-simplification",
    title: "Fraction simplification",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "fraction.before",
        objectType: "fraction",
        title: "Fraction before rewrite",
        selectorRoles: [
          { id: "numerator", kind: "term" },
          { id: "fraction.bar", kind: "fraction-bar" },
          { id: "denominator", kind: "term" },
          { id: "common.factor.numerator", kind: "factor" },
          { id: "common.factor.denominator", kind: "factor" }
        ]
      },
      {
        id: "fraction.after",
        objectType: "fraction",
        title: "Fraction after rewrite",
        selectorRoles: [
          { id: "numerator", kind: "term" },
          { id: "fraction.bar", kind: "fraction-bar" },
          { id: "denominator", kind: "term" },
          { id: "operation.artifact", kind: "operator" },
          { id: "denominator.copy", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createFractionDefinition({
        id: "definition.symbolic.algebra.split-fraction-sum",
        transformType: "splitFractionSum",
        title: "Split a fraction over a numerator sum",
        lawId: "law.algebra.fraction-sum-split",
        preserves: ["value", "structure"],
        assumption:
          "The numerator is a sum or difference whose terms can each share the same denominator."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.merge-fractions",
        transformType: "mergeFractions",
        title: "Merge fractions over a common denominator",
        lawId: "law.algebra.fraction-sum-merge",
        sourceObjectRole: "fraction.after",
        targetObjectRole: "fraction.before",
        preserves: ["value", "structure"],
        assumption:
          "Fractions have a compatible denominator and can be merged into one numerator expression."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.cancel-common-factor",
        transformType: "cancelCommonFactor",
        title: "Cancel a common numerator and denominator factor",
        lawId: "law.algebra.fraction-common-factor",
        preserves: ["value"],
        assumption:
          "Common numerator and denominator factors are equal and non-zero."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.create-common-denominator",
        transformType: "createCommonDenominator",
        title: "Create a common denominator",
        lawId: "law.algebra.common-denominator",
        preserves: ["value", "structure"],
        assumption:
          "Multiplying numerator and denominator by the same non-zero expression preserves value."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.reciprocal-rewrite",
        transformType: "reciprocalRewrite",
        title: "Rewrite as a reciprocal fraction",
        sourceObjectRoles: ["fraction.before"],
        targetObjectRoles: ["fraction.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The denominator is non-zero and reciprocal notation swaps numerator and denominator roles."
        ],
        lawRefs: [
          {
            id: "law.algebra.reciprocal-rewrite",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "numerator",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "denominator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "denominator",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "numerator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "fraction.bar",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "fraction.bar",
            preserves: ["presentation", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.fraction.line-persist",
        motifKind: "fraction-line-persist",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.split-fraction-sum",
          "definition.symbolic.algebra.merge-fractions",
          "definition.symbolic.algebra.cancel-common-factor"
        ],
        summary:
          "Fraction bars act as persistent anchors while non-persistent operators and canceled factors fade."
      },
      {
        id: "motif.algebra.fraction.denominator-copy-align",
        motifKind: "denominator-copy-align",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.create-common-denominator"
        ],
        summary:
          "Denominator copies appear only after existing numerator and bar geometry shifts into place."
      },
      {
        id: "motif.algebra.fraction.reciprocal-swap",
        motifKind: "reciprocal-swap",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.reciprocal-rewrite"
        ],
        summary:
          "Numerator and denominator trade vertical roles while the fraction bar remains a stable visual reference."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.fraction-simplification.basic",
        animationId: "animation.generated.fraction-expression.two-fourths",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic rational-expression sample exercises split, merge, simplify, common-denominator, and reciprocal forms."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.fraction.rational-value",
        title: "Rational value is preserved",
        representationKind: "number-line",
        exactness: "exact",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.rational-value-preservation",
            level: "strict"
          }
        ],
        sampleAssetIds: [
          "animation.generated.fraction-expression.two-fourths"
        ],
        summary:
          "Fraction rewrites keep the represented rational value fixed even when numerator, denominator, and bars are rearranged."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.rational-simplify.fraction",
        fixtureFamilyId: "generated.rational-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated rational-expression traces can map fraction bar, denominator-copy, and reciprocal steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.fraction.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can hide the next fraction rewrite or ask which denominator copy appears."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.algebra.fraction-simplification"
      ),
      tags: [
        "fraction",
        "simplification",
        "common-denominator",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for splitting, merging, simplifying, common-denominator, and reciprocal fraction rewrites.",
      searchSummary:
        "fraction simplify split merge reciprocal common denominator numerator denominator fraction bar rational value",
      graphEquivalentKinds: "number-line"
    }
  });
}

function createFractionDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ["value"] | readonly ["value", "structure"];
  readonly assumption: string;
  readonly sourceObjectRole?: string | undefined;
  readonly targetObjectRole?: string | undefined;
}) {
  const sourceObjectRole = input.sourceObjectRole ?? "fraction.before";
  const targetObjectRole = input.targetObjectRole ?? "fraction.after";

  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: [sourceObjectRole],
    targetObjectRoles: [targetObjectRole],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole,
        sourceSelectorRole: "numerator",
        targetObjectRole,
        targetSelectorRole: "numerator",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole,
        sourceSelectorRole: "fraction.bar",
        targetObjectRole,
        targetSelectorRole: "fraction.bar",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole,
        sourceSelectorRole: "denominator",
        targetObjectRole,
        targetSelectorRole: "denominator",
        preserves: ["identity", "role"]
      }
    ]
  });
}

function createAlgebraExponentLogFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.multiply-same-base-powers",
    "definition.symbolic.algebra.divide-same-base-powers",
    "definition.symbolic.algebra.power-of-power",
    "definition.symbolic.algebra.power-to-root",
    "definition.symbolic.algebra.log-exp-inverse",
    "definition.symbolic.algebra.log-product"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.exponent-log-laws",
    title: "Exponent and logarithm laws",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "power.before",
        objectType: "expression",
        title: "Power or function expression before rewrite",
        selectorRoles: [
          { id: "base", kind: "term" },
          { id: "exponent.left", kind: "exponent" },
          { id: "operator", kind: "operator" },
          { id: "exponent.right", kind: "exponent" },
          { id: "function.name", kind: "function-name" },
          { id: "function.argument", kind: "argument" },
          { id: "function.open", kind: "wrapper" },
          { id: "function.close", kind: "wrapper" }
        ]
      },
      {
        id: "power.after",
        objectType: "expression",
        title: "Power or function expression after rewrite",
        selectorRoles: [
          { id: "base", kind: "term" },
          { id: "exponent", kind: "exponent" },
          { id: "operator", kind: "operator" },
          { id: "function.name", kind: "function-name" },
          { id: "function.argument", kind: "argument" },
          { id: "function.open", kind: "wrapper" },
          { id: "function.close", kind: "wrapper" },
          { id: "radical.index", kind: "radical-index" },
          { id: "radical.path", kind: "radical-path" },
          { id: "artifact.operator", kind: "operator" }
        ]
      }
    ],
    transformationDefinitions: [
      createPowerDefinition({
        id: "definition.symbolic.algebra.multiply-same-base-powers",
        transformType: "multiplySameBasePowers",
        title: "Multiply powers with the same base",
        lawId: "law.algebra.exponent-product",
        assumption:
          "Powers have the same base, so exponents combine by addition under the domain assumptions."
      }),
      createPowerDefinition({
        id: "definition.symbolic.algebra.divide-same-base-powers",
        transformType: "divideSameBasePowers",
        title: "Divide powers with the same base",
        lawId: "law.algebra.exponent-quotient",
        assumption:
          "Powers have the same non-zero base, so exponents combine by subtraction."
      }),
      createPowerDefinition({
        id: "definition.symbolic.algebra.power-of-power",
        transformType: "powerOfPower",
        title: "Rewrite a power of a power",
        lawId: "law.algebra.power-of-power",
        assumption:
          "Nested powers share one base and compose exponents under the domain assumptions."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.power-to-root",
        transformType: "powerToRoot",
        title: "Rewrite a rational power as a root",
        sourceObjectRoles: ["power.before"],
        targetObjectRoles: ["power.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The base and root index satisfy the domain assumptions for the chosen real or complex branch."
        ],
        lawRefs: [
          {
            id: "law.algebra.power-root",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "base",
            targetObjectRole: "power.after",
            targetSelectorRole: "base",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "exponent.left",
            targetObjectRole: "power.after",
            targetSelectorRole: "radical.index",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "exponent.right",
            targetObjectRole: "power.after",
            targetSelectorRole: "radical.path",
            preserves: ["presentation", "role"]
          }
        ]
      }),
      createFunctionWrapDefinition({
        id: "definition.symbolic.algebra.log-exp-inverse",
        transformType: "logExpInverse",
        title: "Cancel logarithm and exponential wrappers",
        lawId: "law.algebra.log-exp-inverse",
        assumption:
          "Logarithm and exponential wrappers are inverse functions on the represented domain."
      }),
      createFunctionWrapDefinition({
        id: "definition.symbolic.algebra.log-product",
        transformType: "logProduct",
        title: "Rewrite logarithm of a product",
        lawId: "law.algebra.log-product",
        assumption:
          "Log product rewrites require positive factors in the real-valued setting."
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.exponent-log.exponent-stack-align",
        motifKind: "exponent-stack-align",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.multiply-same-base-powers",
          "definition.symbolic.algebra.divide-same-base-powers",
          "definition.symbolic.algebra.power-of-power"
        ],
        summary:
          "Persistent bases stay fixed while exponent tokens align, combine, or separate in the superscript region."
      },
      {
        id: "motif.algebra.exponent-log.root-fold",
        motifKind: "root-fold",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.power-to-root"
        ],
        summary:
          "The base persists while exponent geometry folds into radical index and path geometry."
      },
      {
        id: "motif.algebra.exponent-log.function-wrap-settle",
        motifKind: "function-wrap-settle",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.log-exp-inverse",
          "definition.symbolic.algebra.log-product"
        ],
        summary:
          "Function names and parens wrap or unwrap around a persistent argument, then settle to final spacing."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.power-radical-fold.basic",
        animationId: "animation.power-radical-fold.basic",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.power-to-root",
          "definition.symbolic.algebra.log-exp-inverse"
        ],
        summary:
          "Basic exponent-to-root and log/exp inverse sample exercises persistent base and argument semantics."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.exponent-log.function-equivalence",
        title: "Function equivalence is preserved on its domain",
        representationKind: "function-graph",
        exactness: "sampled",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.exponent-log-equivalence",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.power-radical-fold.basic"],
        summary:
          "Exponent, root, and logarithm rewrites preserve function values where the domain assumptions hold."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.exponent-log-simplify",
        fixtureFamilyId: "generated.exponent-log-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated exponent/log traces can map base persistence, exponent combination, radical folds, and function wrappers to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.exponent-log.cloze",
        kind: "cloze",
        transformationDefinitionIds: definitionIds,
        summary:
          "Cloze cards can hide the resulting exponent, radical index, or unwrapped argument."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.exponent-log-laws"),
      tags: [
        "exponent",
        "logarithm",
        "inverse-operation",
        "radical",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for powers, roots, exponent laws, logarithm laws, and inverse rewrites.",
      searchSummary:
        "exponent logarithm power root radical inverse product quotient law base argument function wrapper",
      graphEquivalentKinds: "function-graph"
    }
  });
}

function createPowerDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["power.before"],
    targetObjectRoles: ["power.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "base",
        targetObjectRole: "power.after",
        targetSelectorRole: "base",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "exponent.left",
        targetObjectRole: "power.after",
        targetSelectorRole: "exponent",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "exponent.right",
        targetObjectRole: "power.after",
        targetSelectorRole: "exponent",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "operator",
        targetObjectRole: "power.after",
        targetSelectorRole: "artifact.operator",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

function createFunctionWrapDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["power.before"],
    targetObjectRoles: ["power.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.argument",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.argument",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.name",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.name",
        preserves: ["role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.open",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.open",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.close",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.close",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

function createAlgebraInequalityFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.inequality-add-both-sides",
    "definition.symbolic.algebra.inequality-multiply-positive",
    "definition.symbolic.algebra.inequality-multiply-negative",
    "definition.symbolic.algebra.inequality-divide-negative"
  ];
  const signFlipDefinitionIds = [
    "definition.symbolic.algebra.inequality-multiply-negative",
    "definition.symbolic.algebra.inequality-divide-negative"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.inequality",
    title: "Inequality transformations",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "inequality.before",
        objectType: "inequality",
        title: "Inequality before operation",
        selectorRoles: [
          { id: "lhs.term", kind: "term" },
          { id: "relation", kind: "relation" },
          { id: "rhs.term", kind: "term" },
          { id: "multiplier.sign", kind: "sign" }
        ]
      },
      {
        id: "inequality.after",
        objectType: "inequality",
        title: "Inequality after operation",
        selectorRoles: [
          { id: "lhs.term", kind: "term" },
          { id: "relation", kind: "relation" },
          { id: "relation.flip", kind: "relation" },
          { id: "rhs.term", kind: "term" },
          { id: "operation.artifact", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-add-both-sides",
        transformType: "addBothSidesInequality",
        title: "Add the same quantity to both sides of an inequality",
        lawId: "law.inequality.add-both-sides",
        assumption: "Adding the same quantity preserves inequality order.",
        targetRelationSelector: "relation"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-multiply-positive",
        transformType: "multiplyPositiveBothSidesInequality",
        title: "Multiply both sides of an inequality by a positive quantity",
        lawId: "law.inequality.multiply-positive",
        assumption: "Multiplication by a positive quantity preserves order.",
        targetRelationSelector: "relation"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-multiply-negative",
        transformType: "multiplyNegativeBothSidesInequality",
        title: "Multiply both sides of an inequality by a negative quantity",
        lawId: "law.inequality.multiply-negative-flip",
        assumption:
          "Multiplication by a negative quantity preserves the solution set only when the relation flips.",
        targetRelationSelector: "relation.flip"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-divide-negative",
        transformType: "divideNegativeBothSidesInequality",
        title: "Divide both sides of an inequality by a negative quantity",
        lawId: "law.inequality.divide-negative-flip",
        assumption:
          "Division by a negative quantity preserves the solution set only when the relation flips.",
        targetRelationSelector: "relation.flip"
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.inequality.append-preserve-relation",
        motifKind: "append-after-shift",
        transformationDefinitionIds: [
          "definition.symbolic.algebra.inequality-add-both-sides",
          "definition.symbolic.algebra.inequality-multiply-positive"
        ],
        summary:
          "Persistent inequality terms shift first, then same-side operation artifacts appear while the relation persists."
      },
      {
        id: "motif.algebra.inequality.relation-flip-pivot",
        motifKind: "relation-flip-pivot",
        transformationDefinitionIds: signFlipDefinitionIds,
        summary:
          "Negative scaling keeps both sides equivalent only when the relation glyph flips as a first-class semantic event."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.inequality.sign-flip.basic",
        animationId: "animation.inequality.sign-flip.basic",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.inequality-multiply-negative"
        ],
        summary:
          "Basic inequality sign-flip sample exercises relation.flip semantics for negative scaling."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.algebra.inequality.number-line-solution-set",
        title: "Number-line solution set is preserved",
        representationKind: "number-line",
        exactness: "exact",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.inequality-solution-set-preservation",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.inequality.sign-flip.basic"],
        summary:
          "Inequality operations preserve the number-line solution set when sign-flip rules are followed."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.inequality-solve.sign-flip",
        fixtureFamilyId: "generated.inequality-solve",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated inequality-solving traces can require a valid sign-flip transform before animating negative scaling."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.inequality.sign-flip",
        kind: "predict-next",
        transformationDefinitionIds: signFlipDefinitionIds,
        summary:
          "Predict-next cards can ask whether the inequality relation should flip."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.inequality"),
      tags: [
        "inequality",
        "sign-flip",
        "validity",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for inequality-preserving operations and sign-flip cases.",
      searchSummary:
        "inequality preserve order sign flip multiply divide negative valid transform number line solution set",
      graphEquivalentKinds: "number-line,region-graph"
    }
  });
}

function createInequalityDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
  readonly targetRelationSelector: "relation" | "relation.flip";
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["inequality.before"],
    targetObjectRoles: ["inequality.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "lhs.term",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "lhs.term",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "relation",
        targetObjectRole: "inequality.after",
        targetSelectorRole: input.targetRelationSelector,
        preserves:
          input.targetRelationSelector === "relation"
            ? ["presentation", "role"]
            : ["role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "rhs.term",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "rhs.term",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "multiplier.sign",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "operation.artifact",
        preserves: ["value", "role"]
      }
    ]
  });
}

function createCalculusDerivativeRulesFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.derivative-sum-rule",
    "definition.symbolic.calculus.derivative-constant-multiple",
    "definition.symbolic.calculus.derivative-power-rule",
    "definition.symbolic.calculus.derivative-product-rule",
    "definition.symbolic.calculus.derivative-quotient-rule",
    "definition.symbolic.calculus.derivative-chain-rule"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.derivative-rules",
    title: "Derivative rules",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "derivative.before",
        objectType: "derivative-expression",
        title: "Derivative expression before rule application",
        selectorRoles: [
          { id: "derivative.operator", kind: "operator" },
          { id: "outer.function", kind: "function" },
          { id: "inner.function", kind: "function" },
          { id: "variable", kind: "variable" },
          { id: "exponent", kind: "exponent" },
          { id: "factor.left", kind: "factor" },
          { id: "factor.right", kind: "factor" }
        ]
      },
      {
        id: "derivative.after",
        objectType: "derivative-expression",
        title: "Derivative expression after rule application",
        selectorRoles: [
          { id: "derivative.operator", kind: "operator" },
          { id: "outer.derivative", kind: "function" },
          { id: "inner.derivative", kind: "function" },
          { id: "variable", kind: "variable" },
          { id: "exponent.decremented", kind: "exponent" },
          { id: "coefficient", kind: "coefficient" },
          { id: "product.operator", kind: "operator" },
          { id: "quotient.bar", kind: "fraction-bar" }
        ]
      }
    ],
    transformationDefinitions: [
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-sum-rule",
        transformType: "derivativeSumRule",
        title: "Apply the derivative sum rule",
        lawId: "law.calculus.derivative-sum",
        assumption: "The derivative is linear over finite sums."
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-constant-multiple",
        transformType: "derivativeConstantMultipleRule",
        title: "Apply the derivative constant multiple rule",
        lawId: "law.calculus.derivative-constant-multiple",
        assumption: "The constant factor is independent of the differentiation variable."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.derivative-power-rule",
        transformType: "derivativePowerRule",
        title: "Apply the derivative power rule",
        sourceObjectRoles: ["derivative.before"],
        targetObjectRoles: ["derivative.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The power rule applies for the represented exponent and differentiation domain."
        ],
        lawRefs: [
          {
            id: "law.calculus.derivative-power",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "exponent",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "coefficient",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "exponent",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "exponent.decremented",
            preserves: ["value", "role"]
          }
        ]
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-product-rule",
        transformType: "derivativeProductRule",
        title: "Apply the derivative product rule",
        lawId: "law.calculus.derivative-product",
        assumption:
          "Both factors are differentiable and the product rule expands into two coordinated branches."
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-quotient-rule",
        transformType: "derivativeQuotientRule",
        title: "Apply the derivative quotient rule",
        lawId: "law.calculus.derivative-quotient",
        assumption:
          "The denominator is non-zero and both numerator and denominator are differentiable."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.derivative-chain-rule",
        transformType: "derivativeChainRule",
        title: "Apply the derivative chain rule",
        sourceObjectRoles: ["derivative.before"],
        targetObjectRoles: ["derivative.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The outer and inner functions are differentiable on the represented domain."
        ],
        lawRefs: [
          {
            id: "law.calculus.derivative-chain",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "outer.function",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "outer.derivative",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "inner.function",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "inner.derivative",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.calculus.derivative.distribute-operator",
        motifKind: "derivative-distribute",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-sum-rule",
          "definition.symbolic.calculus.derivative-constant-multiple"
        ],
        summary:
          "The derivative operator duplicates across additive terms while constants persist as coefficients."
      },
      {
        id: "motif.calculus.derivative.exponent-drop",
        motifKind: "exponent-drop",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-power-rule"
        ],
        summary:
          "The exponent drops into coefficient position while a decremented exponent remains in the superscript region."
      },
      {
        id: "motif.calculus.derivative.rule-branch",
        motifKind: "rule-branch",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-product-rule",
          "definition.symbolic.calculus.derivative-quotient-rule",
          "definition.symbolic.calculus.derivative-chain-rule"
        ],
        summary:
          "Composite rules branch into coordinated sub-derivatives that can be animated in parallel or sequence."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.derivative-rules.basic",
        animationId: "animation.derivative-rules.basic",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-power-rule",
          "definition.symbolic.calculus.derivative-chain-rule"
        ],
        summary:
          "Basic derivative sample exercises power-rule exponent drop and chain-rule nested persistence."
      },
      {
        id: "sample.animation.derivative-rules.tangent-graph",
        animationId: "animation.derivative-rules.tangent-graph",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-power-rule",
          "definition.symbolic.calculus.derivative-chain-rule"
        ],
        summary:
          "Graph sample projects derivative-rule steps onto tangent line and local-slope motion."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.calculus.derivative.tangent-line",
        title: "Derivative corresponds to tangent slope",
        representationKind: "tangent-line",
        exactness: "sampled",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.derivative-tangent-slope",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.derivative-rules.basic"],
        summary:
          "Derivative-rule rewrites preserve the symbolic derivative whose value drives tangent slope samples."
      },
      {
        id: "graph.calculus.derivative.local-slope-motion",
        title: "Derivative drives local-slope motion",
        representationKind: "local-slope-motion",
        exactness: "sampled",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.derivative-local-slope-motion",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.derivative-rules.tangent-graph"],
        summary:
          "A shared derivative value can drive a tangent handle, secant-to-tangent limit cue, or local-slope marker without changing the symbolic step."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-derivative-rules",
        fixtureFamilyId: "generated.calculus-derivative-rules",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated derivative traces can map each rule application to reusable derivative animations."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.derivative-rule.pick",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which derivative rule applies and what sub-derivative appears next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.calculus.derivative-rules"),
      tags: [
        "derivative",
        "chain-rule",
        "tangent",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for sum, constant multiple, power, product, quotient, and chain derivative rules.",
      searchSummary:
        "derivative sum power product quotient chain rule tangent slope exponent drop composite branch",
      graphEquivalentKinds: "tangent-line"
    }
  });
}

function createDerivativeDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["derivative.before"],
    targetObjectRoles: ["derivative.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "derivative.operator",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "derivative.operator",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "factor.left",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "outer.derivative",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "factor.right",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "inner.derivative",
        preserves: ["identity", "role"]
      }
    ]
  });
}

function createCalculusIntegralFtcFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.integral-sum-rule",
    "definition.symbolic.calculus.antiderivative-rule",
    "definition.symbolic.calculus.definite-integral-ftc",
    "definition.symbolic.calculus.accumulation-derivative-ftc"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.integral-ftc",
    title: "Integral and FTC transformations",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "integral.before",
        objectType: "integral-expression",
        title: "Integral expression before rewrite",
        selectorRoles: [
          { id: "integral.sign", kind: "operator" },
          { id: "lower.bound", kind: "bound" },
          { id: "upper.bound", kind: "bound" },
          { id: "integrand", kind: "function" },
          { id: "differential", kind: "operator" },
          { id: "variable", kind: "variable" }
        ]
      },
      {
        id: "integral.after",
        objectType: "integral-expression",
        title: "Integral expression after rewrite",
        selectorRoles: [
          { id: "antiderivative", kind: "function" },
          { id: "lower.bound", kind: "bound" },
          { id: "upper.bound", kind: "bound" },
          { id: "evaluation.bar", kind: "operator" },
          { id: "variable", kind: "variable" },
          { id: "area.region", kind: "graph-region" }
        ]
      }
    ],
    transformationDefinitions: [
      createIntegralDefinition({
        id: "definition.symbolic.calculus.integral-sum-rule",
        transformType: "integralSumRule",
        title: "Apply the integral sum rule",
        lawId: "law.calculus.integral-sum",
        assumption: "The integral is linear over finite sums."
      }),
      createIntegralDefinition({
        id: "definition.symbolic.calculus.antiderivative-rule",
        transformType: "antiderivativeRule",
        title: "Rewrite an indefinite integral as an antiderivative",
        lawId: "law.calculus.antiderivative",
        assumption:
          "The chosen antiderivative differentiates back to the integrand on the represented domain."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.definite-integral-ftc",
        transformType: "definiteIntegralFtc",
        title: "Evaluate a definite integral by the Fundamental Theorem of Calculus",
        sourceObjectRoles: ["integral.before"],
        targetObjectRoles: ["integral.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The integrand is continuous on the interval and has the represented antiderivative."
        ],
        lawRefs: [
          {
            id: "law.calculus.ftc-evaluation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "integrand",
            targetObjectRole: "integral.after",
            targetSelectorRole: "antiderivative",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "lower.bound",
            targetObjectRole: "integral.after",
            targetSelectorRole: "lower.bound",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "upper.bound",
            targetObjectRole: "integral.after",
            targetSelectorRole: "upper.bound",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "integral.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "integral.sign",
            targetObjectRole: "integral.after",
            targetSelectorRole: "evaluation.bar",
            preserves: ["presentation", "role"]
          }
        ]
      }),
      createIntegralDefinition({
        id: "definition.symbolic.calculus.accumulation-derivative-ftc",
        transformType: "accumulationDerivativeFtc",
        title: "Relate an accumulation function derivative to its integrand",
        lawId: "law.calculus.ftc-accumulation-derivative",
        assumption:
          "The upper bound varies and the integrand is continuous on the accumulated interval."
      })
    ],
    visualMotifs: [
      {
        id: "motif.calculus.integral.antiderivative-emerge",
        motifKind: "antiderivative-emerge",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.integral-sum-rule",
          "definition.symbolic.calculus.antiderivative-rule"
        ],
        summary:
          "The integrand persists into an antiderivative form while integral and differential artifacts fade."
      },
      {
        id: "motif.calculus.integral.bounds-evaluate",
        motifKind: "bounds-evaluate",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc"
        ],
        summary:
          "Bounds move from integral limits to evaluation positions around the antiderivative."
      },
      {
        id: "motif.calculus.integral.area-accumulation",
        motifKind: "area-accumulation",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "Changing upper bounds sweep an area region while preserving the integrand as the accumulated rate."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.integral-ftc.basic",
        animationId: "animation.integral-ftc.basic",
        renderTargetKinds: ["equation", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc",
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "Basic FTC sample links bound movement, antiderivative evaluation, and area accumulation."
      },
      {
        id: "sample.animation.integral-ftc.area-sweep",
        animationId: "animation.integral-ftc.area-sweep",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc",
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "Graph-only area sweep sample preserves bound provenance while showing sampled accumulation."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.calculus.integral.area-accumulation",
        title: "Definite integral corresponds to accumulated area",
        representationKind: "area-accumulation",
        exactness: "sampled",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.integral-area-accumulation",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.integral-ftc.basic"],
        summary:
          "Integral and FTC rewrites preserve the accumulated area represented between the lower and upper bounds."
      },
      {
        id: "graph.calculus.integral.area-sweep-provenance",
        title: "Area sweep preserves bound provenance",
        representationKind: "area-sweep-provenance",
        exactness: "sampled",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.integral-area-sweep-provenance",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.integral-ftc.area-sweep"],
        summary:
          "Area sweep samples are visually sampled but preserve symbolic bound provenance from the integral family."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-integral-ftc",
        fixtureFamilyId: "generated.calculus-integral-ftc",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated integral traces can map antiderivatives, definite bounds, and FTC evaluation to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.integral-ftc.bounds",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc",
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "Relationship cards can ask how bounds, antiderivatives, and area regions correspond."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.calculus.integral-ftc"),
      tags: [
        "integral",
        "ftc",
        "area",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for antiderivatives, definite integrals, bounds, and the Fundamental Theorem of Calculus.",
      searchSummary:
        "integral antiderivative definite bounds fundamental theorem calculus area accumulation lower upper",
      graphEquivalentKinds: "area-accumulation"
    }
  });
}

function createIntegralDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["integral.before"],
    targetObjectRoles: ["integral.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "integrand",
        targetObjectRole: "integral.after",
        targetSelectorRole: "antiderivative",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "variable",
        targetObjectRole: "integral.after",
        targetSelectorRole: "variable",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "integral.sign",
        targetObjectRole: "integral.after",
        targetSelectorRole: "evaluation.bar",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

function createCalculusTaylorLocalLinearizationFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.taylor-expansion",
    "definition.symbolic.calculus.taylor-truncation",
    "definition.symbolic.calculus.local-linearization",
    "definition.symbolic.calculus.remainder-annotation"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.taylor-local-linearization",
    title: "Taylor and local linearization",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "taylor.before",
        objectType: "approximation-expression",
        title: "Function expression before approximation",
        selectorRoles: [
          { id: "function", kind: "function" },
          { id: "center", kind: "point" },
          { id: "variable", kind: "variable" },
          { id: "derivative.order", kind: "order" },
          { id: "factorial", kind: "factorial" },
          { id: "remainder", kind: "annotation" }
        ]
      },
      {
        id: "taylor.after",
        objectType: "approximation-expression",
        title: "Approximation expression after rewrite",
        selectorRoles: [
          { id: "polynomial.term", kind: "term" },
          { id: "center", kind: "point" },
          { id: "variable", kind: "variable" },
          { id: "derivative.value", kind: "coefficient" },
          { id: "order.marker", kind: "order" },
          { id: "remainder.annotation", kind: "annotation" }
        ]
      }
    ],
    transformationDefinitions: [
      createTaylorDefinition({
        id: "definition.symbolic.calculus.taylor-expansion",
        transformType: "taylorExpansion",
        title: "Expand a function into a Taylor polynomial",
        lawId: "law.calculus.taylor-expansion",
        preserves: ["value", "structure"],
        assumption:
          "The function is sufficiently differentiable near the represented center."
      }),
      createTaylorDefinition({
        id: "definition.symbolic.calculus.taylor-truncation",
        transformType: "taylorTruncation",
        title: "Truncate a Taylor expansion",
        lawId: "law.calculus.taylor-truncation",
        preserves: ["structure"],
        assumption:
          "Truncation is an approximation step and requires explicit remainder or error metadata."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.local-linearization",
        transformType: "localLinearization",
        title: "Build a local linear approximation",
        sourceObjectRoles: ["taylor.before"],
        targetObjectRoles: ["taylor.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The first-order approximation is centered at the represented point."
        ],
        lawRefs: [
          {
            id: "law.calculus.local-linearization",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "function",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "polynomial.term",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "center",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "center",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "derivative.order",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "derivative.value",
            preserves: ["value", "role"]
          }
        ]
      }),
      createTaylorDefinition({
        id: "definition.symbolic.calculus.remainder-annotation",
        transformType: "remainderAnnotation",
        title: "Annotate a Taylor remainder",
        lawId: "law.calculus.taylor-remainder",
        preserves: ["structure"],
        assumption:
          "The omitted terms are represented by an explicit remainder or error annotation."
      })
    ],
    visualMotifs: [
      {
        id: "motif.calculus.taylor.polynomial-layer-build",
        motifKind: "polynomial-layer-build",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.taylor-expansion"
        ],
        summary:
          "Derivative-order terms layer into a polynomial approximation around a persistent center."
      },
      {
        id: "motif.calculus.taylor.truncate-remainder",
        motifKind: "truncate-remainder",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.taylor-truncation",
          "definition.symbolic.calculus.remainder-annotation"
        ],
        summary:
          "Higher-order terms collapse into an explicit remainder annotation instead of disappearing silently."
      },
      {
        id: "motif.calculus.taylor.local-tangent-settle",
        motifKind: "local-tangent-settle",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.local-linearization"
        ],
        summary:
          "The approximation settles into tangent-line geometry at the preserved center point."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.taylor-local-linearization.basic",
        animationId: "animation.taylor-local-linearization.basic",
        renderTargetKinds: ["equation", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.taylor-expansion",
          "definition.symbolic.calculus.local-linearization"
        ],
        summary:
          "Basic Taylor sample links symbolic approximation terms to tangent and polynomial graph overlays."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.calculus.taylor.local-polynomial",
        title: "Taylor polynomial approximates the function locally",
        representationKind: "function-graph",
        exactness: "sampled",
        preserves: ["structure"],
        lawRefs: [
          {
            id: "law.graph.taylor-local-approximation",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.taylor-local-linearization.basic"],
        summary:
          "Taylor and local-linearization rewrites project to tangent or local-polynomial overlays near the expansion center."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-taylor-linearization",
        fixtureFamilyId: "generated.calculus-taylor-linearization",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated approximation traces can map expansion, truncation, local linearization, and remainder steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.taylor.approximation",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.taylor-expansion",
          "definition.symbolic.calculus.local-linearization"
        ],
        summary:
          "Relationship cards can ask how a symbolic Taylor term maps to graph-local approximation behavior."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.taylor-local-linearization"
      ),
      tags: [
        "taylor",
        "linearization",
        "approximation",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for Taylor expansion, truncation, remainder annotation, and local linear approximation.",
      searchSummary:
        "taylor series local linearization approximation remainder tangent polynomial center",
      graphEquivalentKinds: "function-graph,tangent-line"
    }
  });
}

function createTaylorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["taylor.before"],
    targetObjectRoles: ["taylor.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "function",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "polynomial.term",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "center",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "center",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "remainder",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "remainder.annotation",
        preserves: ["role"]
      }
    ]
  });
}

function createCalculusGradientJacobianFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.scalar-gradient",
    "definition.symbolic.calculus.jacobian-matrix",
    "definition.symbolic.calculus.directional-derivative",
    "definition.symbolic.calculus.local-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.gradient-jacobian",
    title: "Gradient and Jacobian",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "multivar.before",
        objectType: "multivariable-function",
        title: "Multivariable function before differential view",
        selectorRoles: [
          { id: "function.output", kind: "component" },
          { id: "input.vector", kind: "vector" },
          { id: "variable.row", kind: "variable" },
          { id: "variable.column", kind: "variable" },
          { id: "partial.operator", kind: "operator" }
        ]
      },
      {
        id: "multivar.after",
        objectType: "multivariable-linearization",
        title: "Gradient or Jacobian differential view",
        selectorRoles: [
          { id: "gradient.vector", kind: "vector" },
          { id: "jacobian.matrix", kind: "matrix" },
          { id: "row.index", kind: "matrix-row" },
          { id: "column.index", kind: "matrix-column" },
          { id: "partial.derivative", kind: "partial-derivative" },
          { id: "local.linear.map", kind: "linear-map" }
        ]
      }
    ],
    transformationDefinitions: [
      createGradientDefinition({
        id: "definition.symbolic.calculus.scalar-gradient",
        transformType: "scalarGradient",
        title: "Build a scalar gradient vector",
        lawId: "law.calculus.scalar-gradient",
        assumption:
          "The scalar field is differentiable with respect to the represented input variables."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.jacobian-matrix",
        transformType: "jacobianMatrix",
        title: "Build a Jacobian matrix",
        sourceObjectRoles: ["multivar.before"],
        targetObjectRoles: ["multivar.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each output component is differentiable with respect to each input variable."
        ],
        lawRefs: [
          {
            id: "law.calculus.jacobian-matrix",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "function.output",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "row.index",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "variable.column",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "column.index",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "partial.operator",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "partial.derivative",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "input.vector",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "jacobian.matrix",
            preserves: ["structure", "role"]
          }
        ]
      }),
      createGradientDefinition({
        id: "definition.symbolic.calculus.directional-derivative",
        transformType: "directionalDerivative",
        title: "Build a directional derivative",
        lawId: "law.calculus.directional-derivative",
        assumption:
          "The direction vector and gradient are defined at the represented point."
      }),
      createGradientDefinition({
        id: "definition.symbolic.calculus.local-linear-map",
        transformType: "localLinearMap",
        title: "Project a Jacobian into a local linear map",
        lawId: "law.calculus.local-linear-map",
        assumption:
          "The Jacobian represents the first-order linear approximation near the point."
      })
    ],
    visualMotifs: [
      {
        id: "motif.calculus.gradient.gradient-vector-emerge",
        motifKind: "gradient-vector-emerge",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.scalar-gradient",
          "definition.symbolic.calculus.directional-derivative"
        ],
        summary:
          "Scalar partial derivatives align into a gradient vector while input-variable identity persists."
      },
      {
        id: "motif.calculus.gradient.jacobian-matrix-fill",
        motifKind: "jacobian-matrix-fill",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.jacobian-matrix"
        ],
        summary:
          "Output components and input variables fill Jacobian rows and columns with explicit provenance."
      },
      {
        id: "motif.calculus.gradient.local-linear-map",
        motifKind: "local-linear-map",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.local-linear-map"
        ],
        summary:
          "The Jacobian matrix projects into a local-linear-map graph view around the chosen point."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.gradient-jacobian.basic",
        animationId: "animation.gradient-jacobian.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.scalar-gradient",
          "definition.symbolic.calculus.jacobian-matrix",
          "definition.symbolic.calculus.local-linear-map"
        ],
        summary:
          "Basic multivariable sample links gradient vector, Jacobian matrix, and local-linear-map views."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.calculus.gradient-jacobian.local-linear-map",
        title: "Jacobian is the local linear map",
        representationKind: "local-linear-map",
        exactness: "sampled",
        preserves: ["value", "structure"],
        lawRefs: [
          {
            id: "law.graph.jacobian-local-linear-map",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.gradient-jacobian.basic"],
        summary:
          "Gradient and Jacobian symbolic views project to vector-field and local-linear-map graph equivalents."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-gradient-jacobian",
        fixtureFamilyId: "generated.calculus-gradient-jacobian",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated multivariable traces can map partial derivatives into gradient, Jacobian, and local-linear-map forms."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.gradient-jacobian.compare",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.scalar-gradient",
          "definition.symbolic.calculus.jacobian-matrix",
          "definition.symbolic.calculus.local-linear-map"
        ],
        summary:
          "Relationship cards can compare scalar gradients, Jacobian rows/columns, and local-linear-map effects."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.gradient-jacobian"
      ),
      tags: [
        "gradient",
        "jacobian",
        "local-linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for scalar gradients and vector-valued Jacobians with local-linear-map views.",
      searchSummary:
        "gradient jacobian partial derivatives matrix local linear map multivariable vector field",
      graphEquivalentKinds: "local-linear-map,vector-field"
    }
  });
}

function createGradientDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["multivar.before"],
    targetObjectRoles: ["multivar.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "input.vector",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "gradient.vector",
        preserves: ["structure", "role"]
      },
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "variable.column",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "column.index",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "partial.operator",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "partial.derivative",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

function createCalculusHessianOptimizationFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.hessian-matrix",
    "definition.symbolic.calculus.quadratic-form",
    "definition.symbolic.calculus.second-derivative-test",
    "definition.symbolic.calculus.stationarity-condition"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.hessian-optimization",
    title: "Hessian and optimization",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "hessian.before",
        objectType: "second-order-function",
        title: "Second-order function before optimization view",
        selectorRoles: [
          { id: "scalar.function", kind: "function" },
          { id: "gradient.vector", kind: "vector" },
          { id: "variable.row", kind: "variable" },
          { id: "variable.column", kind: "variable" },
          { id: "critical.point", kind: "point" }
        ]
      },
      {
        id: "hessian.after",
        objectType: "second-order-optimization-view",
        title: "Hessian or optimization view",
        selectorRoles: [
          { id: "hessian.matrix", kind: "matrix" },
          { id: "hessian.row", kind: "matrix-row" },
          { id: "hessian.column", kind: "matrix-column" },
          { id: "quadratic.form", kind: "quadratic-form" },
          { id: "eigenvalue.sign", kind: "sign" },
          { id: "curvature.classification", kind: "classification" },
          { id: "critical.point", kind: "point" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.hessian-matrix",
        transformType: "hessianMatrix",
        title: "Build a Hessian matrix",
        sourceObjectRoles: ["hessian.before"],
        targetObjectRoles: ["hessian.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The scalar function has second partial derivatives at the represented point."
        ],
        lawRefs: [
          {
            id: "law.calculus.hessian-matrix",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "scalar.function",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "variable.row",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.row",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "variable.column",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.column",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "critical.point",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "critical.point",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.quadratic-form",
        transformType: "quadraticForm",
        title: "Project a Hessian into a quadratic form",
        lawId: "law.calculus.quadratic-form",
        assumption:
          "The Hessian describes the second-order local quadratic form at the point."
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.second-derivative-test",
        transformType: "secondDerivativeTest",
        title: "Apply the second derivative test",
        lawId: "law.calculus.second-derivative-test",
        assumption:
          "The critical point is stationary and the Hessian eigenvalue signs determine the local classification when nondegenerate."
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.stationarity-condition",
        transformType: "stationarityCondition",
        title: "Apply the stationarity condition",
        lawId: "law.calculus.stationarity",
        assumption:
          "The gradient vanishes at the represented critical point."
      })
    ],
    visualMotifs: [
      {
        id: "motif.calculus.hessian.matrix-fill",
        motifKind: "hessian-matrix-fill",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.hessian-matrix"
        ],
        summary:
          "Second partial derivatives fill Hessian rows and columns while variable provenance persists."
      },
      {
        id: "motif.calculus.hessian.quadratic-form-surface",
        motifKind: "quadratic-form-surface",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.quadratic-form"
        ],
        summary:
          "The Hessian matrix projects into a quadratic-form surface around the critical point."
      },
      {
        id: "motif.calculus.hessian.curvature-classification",
        motifKind: "curvature-classification",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.second-derivative-test",
          "definition.symbolic.calculus.stationarity-condition"
        ],
        summary:
          "Eigenvalue signs and stationarity conditions produce a derived curvature classification."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.hessian-optimization.basic",
        animationId: "animation.hessian-optimization.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.hessian-matrix",
          "definition.symbolic.calculus.quadratic-form",
          "definition.symbolic.calculus.second-derivative-test"
        ],
        summary:
          "Basic Hessian sample links second partial matrix entries to quadratic-form and curvature graph views."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.calculus.hessian.quadratic-form",
        title: "Hessian determines local quadratic curvature",
        representationKind: "quadratic-form",
        exactness: "sampled",
        preserves: ["value", "structure"],
        lawRefs: [
          {
            id: "law.graph.hessian-quadratic-curvature",
            level: "sampled"
          }
        ],
        sampleAssetIds: ["animation.hessian-optimization.basic"],
        summary:
          "Hessian symbolic views project to local quadratic curvature and optimization classification graph views."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-hessian-optimization",
        fixtureFamilyId: "generated.calculus-hessian-optimization",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated optimization traces can map Hessian construction, quadratic forms, and second-derivative tests to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.hessian-optimization.compare",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.hessian-matrix",
          "definition.symbolic.calculus.quadratic-form",
          "definition.symbolic.calculus.second-derivative-test"
        ],
        summary:
          "Relationship cards can compare Hessian entries, quadratic-form geometry, and curvature classifications."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.hessian-optimization"
      ),
      tags: [
        "hessian",
        "optimization",
        "curvature",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for Hessians, quadratic forms, second-derivative tests, and optimization stationarity.",
      searchSummary:
        "hessian optimization curvature quadratic form second derivative stationarity critical point eigenvalue",
      graphEquivalentKinds: "curvature,quadratic-form"
    }
  });
}

function createHessianDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["hessian.before"],
    targetObjectRoles: ["hessian.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "scalar.function",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "quadratic.form",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "critical.point",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "critical.point",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "gradient.vector",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "curvature.classification",
        preserves: ["role"]
      }
    ]
  });
}

function createLinearAlgebraVectorAddScaleFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.vector-addition",
    "definition.symbolic.linear-algebra.scalar-multiplication",
    "definition.symbolic.linear-algebra.component-decomposition",
    "definition.symbolic.linear-algebra.graphical-vector-composition"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.vector-add-scale",
    title: "Vector add and scale",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "vector.before",
        objectType: "vector-expression",
        title: "Vector expression before operation",
        selectorRoles: [
          { id: "vector.left", kind: "vector" },
          { id: "vector.right", kind: "vector" },
          { id: "scalar", kind: "scalar" },
          { id: "component", kind: "component" },
          { id: "origin", kind: "point" },
          { id: "tip", kind: "point" }
        ]
      },
      {
        id: "vector.after",
        objectType: "vector-expression",
        title: "Vector expression after operation",
        selectorRoles: [
          { id: "vector.result", kind: "vector" },
          { id: "scaled.vector", kind: "vector" },
          { id: "component", kind: "component" },
          { id: "origin", kind: "point" },
          { id: "tip", kind: "point" },
          { id: "parallelogram.edge", kind: "graph-edge" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.vector-addition",
        transformType: "vectorAddition",
        title: "Add vectors",
        sourceObjectRoles: ["vector.before"],
        targetObjectRoles: ["vector.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Vectors share a coordinate space and can be added componentwise."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.vector-addition",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "vector.left",
            targetObjectRole: "vector.after",
            targetSelectorRole: "vector.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "vector.right",
            targetObjectRole: "vector.after",
            targetSelectorRole: "vector.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "origin",
            targetObjectRole: "vector.after",
            targetSelectorRole: "origin",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "tip",
            targetObjectRole: "vector.after",
            targetSelectorRole: "tip",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "component",
            targetObjectRole: "vector.after",
            targetSelectorRole: "component",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.scalar-multiplication",
        transformType: "scalarMultiplication",
        title: "Scale a vector",
        lawId: "law.linear-algebra.scalar-multiplication",
        preserves: ["value", "structure"],
        assumption:
          "Scalar multiplication scales each component in the represented vector space."
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.component-decomposition",
        transformType: "componentDecomposition",
        title: "Decompose a vector into components",
        lawId: "law.linear-algebra.component-decomposition",
        preserves: ["value", "structure"],
        assumption:
          "Component decomposition uses the represented coordinate basis."
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.graphical-vector-composition",
        transformType: "graphicalVectorComposition",
        title: "Compose vectors graphically",
        lawId: "law.graph.vector-composition",
        preserves: ["value", "presentation"],
        assumption:
          "Graphical composition uses equivalent translated arrows in the same vector space."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.vector.tip-to-tail",
        motifKind: "tip-to-tail",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-addition",
          "definition.symbolic.linear-algebra.graphical-vector-composition"
        ],
        summary:
          "Vector arrows move tip-to-tail while component identities remain tied to the symbolic result."
      },
      {
        id: "motif.linear-algebra.vector.scalar-stretch",
        motifKind: "scalar-stretch",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.scalar-multiplication"
        ],
        summary:
          "Scalar multiplication stretches or reverses the vector arrow while preserving origin/component provenance."
      },
      {
        id: "motif.linear-algebra.vector.component-lift",
        motifKind: "component-lift",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.component-decomposition"
        ],
        summary:
          "Component entries lift into coordinate-axis arrows and can fold back into vector notation."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.vector-add-scale.basic",
        animationId: "animation.vector-add-scale.basic",
        renderTargetKinds: ["equation", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-addition",
          "definition.symbolic.linear-algebra.scalar-multiplication",
          "definition.symbolic.linear-algebra.graphical-vector-composition"
        ],
        summary:
          "Basic vector sample links symbolic component operations to graph arrow composition."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.vector-add-scale.arrow-composition",
        title: "Vector operations correspond to arrow geometry",
        representationKind: "vector-graph",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.vector-arrow-composition",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.vector-add-scale.basic"],
        summary:
          "Vector addition and scaling preserve the represented vector while changing arrow placement or length."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-vector-add-scale",
        fixtureFamilyId: "generated.linear-algebra-vector-add-scale",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated vector traces can map component arithmetic, scaling, and graph arrow composition to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.vector-add-scale.predict",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-addition",
          "definition.symbolic.linear-algebra.scalar-multiplication"
        ],
        summary:
          "Predict-next cards can ask for the resulting vector or graphical arrow placement."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.vector-add-scale"
      ),
      tags: [
        "vector",
        "scale",
        "graph",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for vector addition, scalar multiplication, and component persistence.",
      searchSummary:
        "vector addition scalar multiplication scale components parallelogram graph arrows tip tail",
      graphEquivalentKinds: "vector-graph"
    }
  });
}

function createVectorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["vector.before"],
    targetObjectRoles: ["vector.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "component",
        targetObjectRole: "vector.after",
        targetSelectorRole: "component",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "origin",
        targetObjectRole: "vector.after",
        targetSelectorRole: "origin",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "tip",
        targetObjectRole: "vector.after",
        targetSelectorRole: "tip",
        preserves: ["identity", "role"]
      }
    ]
  });
}

function createLinearAlgebraDotProjectionFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.dot-product",
    "definition.symbolic.linear-algebra.vector-projection",
    "definition.symbolic.linear-algebra.orthogonality-test",
    "definition.symbolic.linear-algebra.angle-from-dot"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.dot-projection",
    title: "Dot product and projection",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "dot.before",
        objectType: "dot-product-expression",
        title: "Dot product expression before interpretation",
        selectorRoles: [
          { id: "vector.left", kind: "vector" },
          { id: "vector.right", kind: "vector" },
          { id: "component.left", kind: "component" },
          { id: "component.right", kind: "component" },
          { id: "angle", kind: "angle" },
          { id: "length.left", kind: "length" },
          { id: "length.right", kind: "length" }
        ]
      },
      {
        id: "dot.after",
        objectType: "dot-product-interpretation",
        title: "Dot product geometric interpretation",
        selectorRoles: [
          { id: "scalar.result", kind: "scalar" },
          { id: "projection.vector", kind: "vector" },
          { id: "orthogonal.component", kind: "vector" },
          { id: "angle", kind: "angle" },
          { id: "length.left", kind: "length" },
          { id: "length.right", kind: "length" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.dot-product",
        transformType: "dotProduct",
        title: "Compute a dot product",
        sourceObjectRoles: ["dot.before"],
        targetObjectRoles: ["dot.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Vectors are in the same inner-product space."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.dot-product",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "vector.left",
            targetObjectRole: "dot.after",
            targetSelectorRole: "scalar.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "vector.right",
            targetObjectRole: "dot.after",
            targetSelectorRole: "scalar.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "angle",
            targetObjectRole: "dot.after",
            targetSelectorRole: "angle",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "length.left",
            targetObjectRole: "dot.after",
            targetSelectorRole: "length.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "length.right",
            targetObjectRole: "dot.after",
            targetSelectorRole: "length.right",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.vector-projection",
        transformType: "vectorProjection",
        title: "Project one vector onto another",
        lawId: "law.linear-algebra.vector-projection",
        assumption:
          "The projection target vector is non-zero in the represented inner-product space."
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.orthogonality-test",
        transformType: "orthogonalityTest",
        title: "Test orthogonality by dot product",
        lawId: "law.linear-algebra.orthogonality",
        assumption:
          "Zero dot product indicates orthogonality under the represented inner product."
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.angle-from-dot",
        transformType: "angleFromDotProduct",
        title: "Recover angle information from a dot product",
        lawId: "law.linear-algebra.dot-angle",
        assumption:
          "Both vector lengths are non-zero when recovering an angle from the dot product."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.dot.component-pair-sum",
        motifKind: "component-pair-sum",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product"
        ],
        summary:
          "Component pairs align, multiply, and accumulate into a scalar dot-product result."
      },
      {
        id: "motif.linear-algebra.dot.projection-drop",
        motifKind: "projection-drop",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-projection",
          "definition.symbolic.linear-algebra.orthogonality-test"
        ],
        summary:
          "One vector drops perpendicularly onto another while the orthogonal component remains explicit."
      },
      {
        id: "motif.linear-algebra.dot.angle-sweep",
        motifKind: "angle-sweep",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.angle-from-dot"
        ],
        summary:
          "Angle and length tokens sweep into the geometric dot-product interpretation."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.dot-projection.basic",
        animationId: "animation.dot-projection.basic",
        renderTargetKinds: ["equation", "graph"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product",
          "definition.symbolic.linear-algebra.vector-projection",
          "definition.symbolic.linear-algebra.angle-from-dot"
        ],
        summary:
          "Basic dot/projection sample links scalar dot products to projection and angle graph views."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.dot-projection.geometry",
        title: "Dot product corresponds to projection geometry",
        representationKind: "vector-graph",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.dot-projection-geometry",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.dot-projection.basic"],
        summary:
          "Dot product, projection, orthogonality, and angle interpretations preserve the same vector relationship."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-dot-projection",
        fixtureFamilyId: "generated.linear-algebra-dot-projection",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated vector traces can map dot products, projections, orthogonality, and angle steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.dot-projection.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product",
          "definition.symbolic.linear-algebra.vector-projection",
          "definition.symbolic.linear-algebra.angle-from-dot"
        ],
        summary:
          "Relationship cards can ask how scalar dot products, projections, and angles encode the same relationship."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.dot-projection"
      ),
      tags: [
        "dot-product",
        "projection",
        "orthogonality",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for dot products, projections, orthogonality, and angle/length interpretations.",
      searchSummary:
        "dot product projection orthogonal angle length scalar component vector graph",
      graphEquivalentKinds: "vector-graph"
    }
  });
}

function createDotProjectionDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["dot.before"],
    targetObjectRoles: ["dot.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "vector.left",
        targetObjectRole: "dot.after",
        targetSelectorRole: "projection.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "vector.right",
        targetObjectRole: "dot.after",
        targetSelectorRole: "projection.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "angle",
        targetObjectRole: "dot.after",
        targetSelectorRole: "angle",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "length.left",
        targetObjectRole: "dot.after",
        targetSelectorRole: "length.left",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "length.right",
        targetObjectRole: "dot.after",
        targetSelectorRole: "length.right",
        preserves: ["identity", "role"]
      }
    ]
  });
}

function createLinearAlgebraMatrixVectorFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.matrix-vector-multiply",
    "definition.symbolic.linear-algebra.row-dot-products",
    "definition.symbolic.linear-algebra.apply-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.matrix-vector",
    title: "Matrix-vector multiplication",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "matrixVector.before",
        objectType: "matrix-vector-expression",
        title: "Matrix-vector expression before multiplication",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "matrix.row", kind: "matrix-row" },
          { id: "matrix.entry", kind: "matrix-entry" },
          { id: "vector", kind: "vector" },
          { id: "vector.entry", kind: "vector-entry" }
        ]
      },
      {
        id: "matrixVector.after",
        objectType: "matrix-vector-result",
        title: "Matrix-vector result",
        selectorRoles: [
          { id: "result.vector", kind: "vector" },
          { id: "result.entry", kind: "vector-entry" },
          { id: "row.dot.product", kind: "dot-product" },
          { id: "linear.map", kind: "linear-map" },
          { id: "transformed.vector", kind: "vector" }
        ]
      }
    ],
    transformationDefinitions: [
      createMatrixVectorDefinition({
        id: "definition.symbolic.linear-algebra.matrix-vector-multiply",
        transformType: "matrixVectorMultiply",
        title: "Multiply a matrix by a vector",
        lawId: "law.linear-algebra.matrix-vector",
        preserves: ["value", "structure"],
        assumption:
          "Matrix columns and vector dimension are compatible for multiplication."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.row-dot-products",
        transformType: "rowDotProducts",
        title: "Compute matrix-vector rows as dot products",
        sourceObjectRoles: ["matrixVector.before"],
        targetObjectRoles: ["matrixVector.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each result component is the dot product of one matrix row and the input vector."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.matrix-row-dot",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "matrix.row",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "matrix.entry",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "vector.entry",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "vector",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "result.vector",
            preserves: ["value", "role"]
          }
        ]
      }),
      createMatrixVectorDefinition({
        id: "definition.symbolic.linear-algebra.apply-linear-map",
        transformType: "applyLinearMap",
        title: "Apply the matrix as a linear map",
        lawId: "law.linear-algebra.linear-map-application",
        preserves: ["value", "presentation"],
        assumption:
          "The matrix represents a linear map from input vectors to transformed output vectors."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.matrix-vector.row-dot-sweep",
        motifKind: "row-dot-sweep",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-dot-products",
          "definition.symbolic.linear-algebra.matrix-vector-multiply"
        ],
        summary:
          "Each matrix row sweeps across vector entries to form one persistent result entry."
      },
      {
        id: "motif.linear-algebra.matrix-vector.linear-map-apply",
        motifKind: "linear-map-apply",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.apply-linear-map"
        ],
        summary:
          "The matrix expression projects into a graph transform of the input vector."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.matrix-vector.basic",
        animationId: "animation.matrix-vector.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic matrix-vector sample links row dot products to a linear-map graph transform."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.matrix-vector.linear-map",
        title: "Matrix-vector multiplication applies a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.matrix-vector-linear-map",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.matrix-vector.basic"],
        summary:
          "Matrix-vector multiplication preserves the linear-map relation between input and transformed output vectors."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-matrix-vector",
        fixtureFamilyId: "generated.linear-algebra-matrix-vector",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated matrix-vector traces can map row dot products and graph linear-map application to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.matrix-vector.row-dot",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-dot-products",
          "definition.symbolic.linear-algebra.matrix-vector-multiply"
        ],
        summary:
          "Predict-next cards can ask which row dot product creates each result entry."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.matrix-vector"
      ),
      tags: [
        "matrix",
        "vector",
        "linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for matrix-vector multiplication as row dot products and linear-map equivalents.",
      searchSummary:
        "matrix vector multiplication row dot products linear map transform graph",
      graphEquivalentKinds: "linear-map"
    }
  });
}

function createMatrixVectorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["matrixVector.before"],
    targetObjectRoles: ["matrixVector.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "vector",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "transformed.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "matrix.entry",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      }
    ]
  });
}

function createLinearAlgebraMatrixMatrixCompositionFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.matrix-matrix-multiply",
    "definition.symbolic.linear-algebra.cell-dot-products",
    "definition.symbolic.linear-algebra.compose-linear-maps"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.matrix-matrix-composition",
    title: "Matrix-matrix composition",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "matrixMatrix.before",
        objectType: "matrix-matrix-expression",
        title: "Matrix-matrix expression before multiplication",
        selectorRoles: [
          { id: "left.matrix", kind: "matrix" },
          { id: "left.row", kind: "matrix-row" },
          { id: "left.entry", kind: "matrix-entry" },
          { id: "right.matrix", kind: "matrix" },
          { id: "right.column", kind: "matrix-column" },
          { id: "right.entry", kind: "matrix-entry" }
        ]
      },
      {
        id: "matrixMatrix.after",
        objectType: "matrix-matrix-result",
        title: "Matrix-matrix result",
        selectorRoles: [
          { id: "result.matrix", kind: "matrix" },
          { id: "result.entry", kind: "matrix-entry" },
          { id: "cell.dot.product", kind: "dot-product" },
          { id: "left.linear.map", kind: "linear-map" },
          { id: "right.linear.map", kind: "linear-map" },
          { id: "composed.linear.map", kind: "linear-map-composition" }
        ]
      }
    ],
    transformationDefinitions: [
      createMatrixMatrixDefinition({
        id: "definition.symbolic.linear-algebra.matrix-matrix-multiply",
        transformType: "matrixMatrixMultiply",
        title: "Multiply two matrices",
        lawId: "law.linear-algebra.matrix-matrix",
        preserves: ["value", "structure"],
        assumption:
          "The left matrix column count equals the right matrix row count."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.cell-dot-products",
        transformType: "cellDotProducts",
        title: "Compute each result cell as a row-column dot product",
        sourceObjectRoles: ["matrixMatrix.before"],
        targetObjectRoles: ["matrixMatrix.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each result entry is the dot product of one left row and one right column."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.matrix-cell-dot",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.row",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.column",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.entry",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.entry",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.matrix",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "result.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.matrix",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "result.matrix",
            preserves: ["value", "role"]
          }
        ]
      }),
      createMatrixMatrixDefinition({
        id: "definition.symbolic.linear-algebra.compose-linear-maps",
        transformType: "composeLinearMaps",
        title: "Compose the two matrices as linear maps",
        lawId: "law.linear-algebra.linear-map-composition",
        preserves: ["value", "presentation"],
        assumption:
          "Matrix multiplication represents order-sensitive composition of the represented linear maps."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.matrix-matrix.cell-dot-grid",
        motifKind: "cell-dot-grid",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.cell-dot-products",
          "definition.symbolic.linear-algebra.matrix-matrix-multiply"
        ],
        summary:
          "Each output cell is staged as a row-column dot product in a reusable grid beat."
      },
      {
        id: "motif.linear-algebra.matrix-matrix.map-composition",
        motifKind: "linear-map-composition",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.compose-linear-maps"
        ],
        summary:
          "The right map applies first, then the left map, matching the composed matrix order."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.matrix-matrix.basic",
        animationId: "animation.matrix-matrix.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic matrix-matrix sample composes cell dot products with a graph linear-map composition."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.matrix-matrix.linear-map-composition",
        title: "Matrix multiplication composes linear maps",
        representationKind: "linear-map-composition",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.matrix-matrix-linear-map-composition",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.matrix-matrix.basic"],
        summary:
          "Matrix-matrix multiplication preserves the order-sensitive composition of the two linear maps."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-matrix-matrix",
        fixtureFamilyId: "generated.linear-algebra-matrix-matrix",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated matrix multiplication traces can map each result entry to row-column dot products and graph composition."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.matrix-matrix.cell",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.cell-dot-products",
          "definition.symbolic.linear-algebra.matrix-matrix-multiply"
        ],
        summary:
          "Predict-next cards can ask which row and column create a selected result cell."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.matrix-matrix-composition"
      ),
      tags: [
        "matrix",
        "composition",
        "dot-product",
        "linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for matrix multiplication as composed dot-product subanimations and linear-map composition.",
      searchSummary:
        "matrix multiplication dot products composition columns rows higher order animation linear map graph",
      graphEquivalentKinds: "linear-map-composition",
      composition: "matrix multiplication as composed dot products"
    }
  });
}

function createMatrixMatrixDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["matrixMatrix.before"],
    targetObjectRoles: ["matrixMatrix.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "left.matrix",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "left.linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "right.matrix",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "right.linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "left.entry",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "right.entry",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      }
    ]
  });
}

function createLinearAlgebraRowOperationsFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.row-swap",
    "definition.symbolic.linear-algebra.row-scale",
    "definition.symbolic.linear-algebra.row-replacement"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.row-operations",
    title: "Row operations",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "rowOperation.before",
        objectType: "augmented-matrix-or-system",
        title: "Augmented matrix or system before an elementary row operation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "row", kind: "matrix-row" },
          { id: "row.entry", kind: "matrix-entry" },
          { id: "equation.system", kind: "equation-system" },
          { id: "solution.set", kind: "solution-set" },
          { id: "determinant", kind: "determinant" }
        ]
      },
      {
        id: "rowOperation.after",
        objectType: "row-operation-result",
        title: "Result after an elementary row operation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "row", kind: "matrix-row" },
          { id: "row.entry", kind: "matrix-entry" },
          { id: "equivalent.system", kind: "equation-system" },
          { id: "solution.set", kind: "solution-set" },
          { id: "determinant.factor", kind: "determinant-factor" },
          { id: "operation.annotation", kind: "annotation" }
        ]
      }
    ],
    transformationDefinitions: [
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-swap",
        transformType: "rowSwap",
        title: "Swap two rows",
        lawId: "law.linear-algebra.row-swap",
        assumption:
          "Swapping two equations preserves the solution set and flips determinant sign."
      }),
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-scale",
        transformType: "rowScale",
        title: "Scale a row by a nonzero scalar",
        lawId: "law.linear-algebra.row-scale",
        assumption:
          "Scaling an equation by a nonzero scalar preserves the solution set and scales determinant value."
      }),
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-replacement",
        transformType: "rowReplacement",
        title: "Replace a row by itself plus a multiple of another row",
        lawId: "law.linear-algebra.row-replacement",
        assumption:
          "Adding a multiple of one equation to another preserves both the solution set and determinant."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.row-operation.swap-slide",
        motifKind: "row-swap-slide",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-swap"
        ],
        summary:
          "Selected rows exchange positions while row identities remain visible through the swap."
      },
      {
        id: "motif.linear-algebra.row-operation.scale-pulse",
        motifKind: "row-scale-pulse",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-scale"
        ],
        summary:
          "A nonzero scalar focus propagates across each entry in the selected row."
      },
      {
        id: "motif.linear-algebra.row-operation.replacement-compose",
        motifKind: "row-replacement-compose",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-replacement"
        ],
        summary:
          "A scaled source row is composed into a target row without changing the solution set."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.row-operations.basic",
        animationId: "animation.row-operations.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic row-operation sample links matrix row edits to equivalent systems and determinant annotations."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.row-operations.solution-set",
        title: "Elementary row operations preserve solution sets",
        representationKind: "solution-set",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.row-operations-solution-set",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.row-operations.basic"],
        summary:
          "Row operations can be shown as equivalent-system moves while the represented solution set persists."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-row-operations",
        fixtureFamilyId: "generated.linear-algebra-row-operations",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated elimination traces can map each elementary row operation to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.row-operations.effect",
        kind: "relationship",
        transformationDefinitionIds: definitionIds,
        summary:
          "Relationship cards can ask how each row operation affects solution sets and determinants."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.row-operations"
      ),
      tags: [
        "row-operation",
        "system",
        "determinant",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for row swap, row scale, and row replacement with solution-set provenance and determinant impact metadata.",
      searchSummary:
        "row operations swap scale replacement gaussian elimination determinant system equations solution set",
      graphEquivalentKinds: "solution-set",
      determinantImpact:
        "swap flips sign, scale multiplies determinant, replacement preserves determinant"
    }
  });
}

function createRowOperationDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["rowOperation.before"],
    targetObjectRoles: ["rowOperation.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "row",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "row",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "row.entry",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "row.entry",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "equation.system",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "equivalent.system",
        preserves: ["value", "structure"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "solution.set",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "solution.set",
        preserves: ["identity", "value"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "determinant",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "determinant.factor",
        preserves: ["value", "role"]
      }
    ]
  });
}

function createLinearAlgebraDeterminantInverseFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.determinant-compute",
    "definition.symbolic.linear-algebra.determinant-area-volume",
    "definition.symbolic.linear-algebra.matrix-inverse",
    "definition.symbolic.linear-algebra.inverse-undo-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.determinant-inverse",
    title: "Determinant and inverse",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "determinantInverse.before",
        objectType: "linear-map-or-matrix",
        title: "Matrix or linear map before determinant and inverse analysis",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "matrix.entry", kind: "matrix-entry" },
          { id: "determinant", kind: "determinant" },
          { id: "input.vector", kind: "vector" },
          { id: "unit.area", kind: "area" },
          { id: "unit.volume", kind: "volume" }
        ]
      },
      {
        id: "determinantInverse.after",
        objectType: "determinant-inverse-result",
        title: "Determinant scale and inverse result",
        selectorRoles: [
          { id: "determinant.value", kind: "scalar" },
          { id: "area.volume.scale", kind: "scale-factor" },
          { id: "inverse.matrix", kind: "matrix" },
          { id: "output.vector", kind: "vector" },
          { id: "identity.map", kind: "linear-map" },
          { id: "orientation", kind: "orientation" }
        ]
      }
    ],
    transformationDefinitions: [
      createDeterminantInverseDefinition({
        id: "definition.symbolic.linear-algebra.determinant-compute",
        transformType: "determinantCompute",
        title: "Compute the determinant",
        lawId: "law.linear-algebra.determinant",
        preserves: ["value", "structure"],
        assumption:
          "The determinant is computed from a square matrix and produces a scalar value."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.determinant-area-volume",
        transformType: "determinantAreaVolumeScale",
        title: "View determinant as area or volume scale",
        sourceObjectRoles: ["determinantInverse.before"],
        targetObjectRoles: ["determinantInverse.after"],
        preserves: ["value", "presentation"],
        assumptions: [
          "The determinant magnitude gives area or volume scale, and its sign records orientation."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.determinant-area-volume",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "determinant.value",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "unit.area",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "unit.volume",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "orientation",
            preserves: ["value", "role"]
          }
        ]
      }),
      createDeterminantInverseDefinition({
        id: "definition.symbolic.linear-algebra.matrix-inverse",
        transformType: "matrixInverse",
        title: "Construct the inverse matrix",
        lawId: "law.linear-algebra.matrix-inverse",
        preserves: ["value", "structure"],
        assumption:
          "The matrix has nonzero determinant, so an inverse matrix exists."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.inverse-undo-linear-map",
        transformType: "inverseUndoLinearMap",
        title: "Use the inverse to undo a linear map",
        sourceObjectRoles: ["determinantInverse.before"],
        targetObjectRoles: ["determinantInverse.after"],
        preserves: ["value", "presentation"],
        assumptions: [
          "Composing an invertible matrix with its inverse returns the identity map."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.inverse-linear-map",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "inverse.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "inverse.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "input.vector",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "output.vector",
            preserves: ["identity", "value"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "identity.map",
            preserves: ["structure", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.determinant.area-volume-scale",
        motifKind: "area-volume-scale",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume",
          "definition.symbolic.linear-algebra.determinant-compute"
        ],
        summary:
          "A unit area or volume deforms under the matrix while determinant magnitude is tracked as scale."
      },
      {
        id: "motif.linear-algebra.determinant.orientation-flip",
        motifKind: "orientation-flip",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume"
        ],
        summary:
          "Negative determinant cases surface orientation reversal as presentation, not token identity."
      },
      {
        id: "motif.linear-algebra.inverse.map-undo",
        motifKind: "linear-map-undo",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.matrix-inverse",
          "definition.symbolic.linear-algebra.inverse-undo-linear-map"
        ],
        summary:
          "The inverse map runs the transformed vector back through the identity reference frame."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.determinant-inverse.basic",
        animationId: "animation.determinant-inverse.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic determinant-inverse sample links determinant scale to inverse undoing on the graph."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.determinant.area-volume-scaling",
        title: "Determinant measures area or volume scaling",
        representationKind: "area-volume-scaling",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.determinant-area-volume",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.determinant-inverse.basic"],
        summary:
          "The determinant value is represented as signed area or volume scale under the linear map."
      },
      {
        id: "graph.linear-algebra.inverse.linear-map-undo",
        title: "An inverse matrix undoes a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.inverse-linear-map-undo",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.determinant-inverse.basic"],
        summary:
          "The inverse graph view composes a matrix with its inverse to return to the identity map."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-determinant-inverse",
        fixtureFamilyId: "generated.linear-algebra-determinant-inverse",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated determinant and inverse traces can expose scale, orientation, and nonzero determinant checks."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.determinant-inverse.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume",
          "definition.symbolic.linear-algebra.inverse-undo-linear-map"
        ],
        summary:
          "Relationship cards can ask how determinant scale predicts invertibility and inverse behavior."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.determinant-inverse"
      ),
      tags: [
        "determinant",
        "inverse",
        "area-volume",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for determinants as area/volume scaling and inverses as undoing linear maps.",
      searchSummary:
        "determinant inverse area volume scaling orientation undo linear map graph nonzero",
      graphEquivalentKinds: "linear-map area-volume-scaling",
      invertibilityCondition: "matrix inverse requires nonzero determinant"
    }
  });
}

function createDeterminantInverseDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["determinantInverse.before"],
    targetObjectRoles: ["determinantInverse.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "matrix.entry",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "determinant",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      }
    ]
  });
}

function createLinearAlgebraBasisEigenFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.change-basis",
    "definition.symbolic.linear-algebra.coordinate-transform",
    "definition.symbolic.linear-algebra.eigenvector-relation",
    "definition.symbolic.linear-algebra.diagonalization-starter"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.basis-eigen",
    title: "Basis change and eigen examples",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "basisEigen.before",
        objectType: "basis-or-linear-map",
        title: "Basis, coordinates, and linear map before transformation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "basis", kind: "basis" },
          { id: "basis.vector", kind: "vector" },
          { id: "coordinate.vector", kind: "coordinate-vector" },
          { id: "eigenvector", kind: "vector" },
          { id: "eigenvalue", kind: "scalar" }
        ]
      },
      {
        id: "basisEigen.after",
        objectType: "basis-eigen-result",
        title: "Basis and eigen result",
        selectorRoles: [
          { id: "changed.basis", kind: "basis" },
          { id: "coordinate.vector", kind: "coordinate-vector" },
          { id: "transformed.vector", kind: "vector" },
          { id: "eigenline", kind: "line" },
          { id: "scaled.eigenvector", kind: "vector" },
          { id: "diagonal.matrix", kind: "matrix" }
        ]
      }
    ],
    transformationDefinitions: [
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.change-basis",
        transformType: "changeBasis",
        title: "Change basis",
        lawId: "law.linear-algebra.change-basis",
        preserves: ["value", "structure"],
        assumption:
          "The new basis is invertible, so the represented vector or map is preserved under coordinate relabeling."
      }),
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.coordinate-transform",
        transformType: "coordinateTransform",
        title: "Transform coordinates between bases",
        lawId: "law.linear-algebra.coordinate-transform",
        preserves: ["value", "presentation"],
        assumption:
          "Coordinate entries change representation while the underlying vector value persists."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.eigenvector-relation",
        transformType: "eigenvectorRelation",
        title: "Relate eigenvectors and eigenvalues",
        sourceObjectRoles: ["basisEigen.before"],
        targetObjectRoles: ["basisEigen.after"],
        preserves: ["identity", "structure"],
        assumptions: [
          "An eigenvector is nonzero and remains on its span under the linear map."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.eigenvector",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "scaled.eigenvector",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvector",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "eigenline",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvalue",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "scaled.eigenvector",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvector",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "transformed.vector",
            preserves: ["identity", "value"]
          }
        ]
      }),
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.diagonalization-starter",
        transformType: "diagonalizationStarter",
        title: "Use eigenvectors to form a diagonalization starter",
        lawId: "law.linear-algebra.diagonalization",
        preserves: ["value", "structure"],
        assumption:
          "The example has enough independent eigenvectors to expose a diagonal matrix representation."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.basis.frame-morph",
        motifKind: "basis-frame-morph",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.change-basis"
        ],
        summary:
          "Basis vectors move as a frame while represented vectors keep their underlying identity."
      },
      {
        id: "motif.linear-algebra.basis.coordinate-relabel",
        motifKind: "coordinate-grid-relabel",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.coordinate-transform"
        ],
        summary:
          "Coordinate entries relabel against the new basis without implying a physical vector moved."
      },
      {
        id: "motif.linear-algebra.eigen.line-scale",
        motifKind: "eigenline-scale",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.eigenvector-relation",
          "definition.symbolic.linear-algebra.diagonalization-starter"
        ],
        summary:
          "Eigenvectors remain on their eigenline while the eigenvalue controls scaling."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.basis-eigen.basic",
        animationId: "animation.basis-eigen.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic basis-eigen sample links coordinate changes to eigenline scaling and a diagonalization starter."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.basis-change.linear-map",
        title: "Basis changes relabel a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.basis-change-linear-map",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.basis-eigen.basic"],
        summary:
          "Changing basis alters coordinates and grid presentation while preserving the underlying vector and linear map."
      },
      {
        id: "graph.linear-algebra.eigen.eigenline",
        title: "Eigenvectors persist as invariant directions",
        representationKind: "eigenvector-graph",
        exactness: "exact",
        preserves: ["identity", "presentation"],
        lawRefs: [
          {
            id: "law.graph.eigenvector-invariant-direction",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.basis-eigen.basic"],
        summary:
          "The eigen graph view keeps the eigenvector on the same line while the transform scales it."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-basis-eigen",
        fixtureFamilyId: "generated.linear-algebra-basis-eigen",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated basis and eigen examples can map coordinate changes, eigen relations, and starter diagonalization steps."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.basis-eigen.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.change-basis",
          "definition.symbolic.linear-algebra.eigenvector-relation"
        ],
        summary:
          "Relationship cards can ask which values change under coordinate relabeling and which directions remain invariant."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.basis-eigen"
      ),
      tags: [
        "basis",
        "eigen",
        "diagonalization",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for basis changes, coordinate transforms, eigenvectors, eigenvalues, and starter diagonalization examples.",
      searchSummary:
        "basis change coordinates eigenvectors eigenvalues diagonalization invariant direction linear map graph",
      graphEquivalentKinds: "linear-map eigenvector-graph",
      spectralScope: "starter diagonalization examples, not a full eigensolver"
    }
  });
}

function createBasisEigenDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly (
    | "identity"
    | "value"
    | "structure"
    | "presentation"
  )[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["basisEigen.before"],
    targetObjectRoles: ["basisEigen.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "basis",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "changed.basis",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "basis.vector",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "changed.basis",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "coordinate.vector",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "coordinate.vector",
        preserves: ["value", "presentation"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "diagonal.matrix",
        preserves: ["value", "structure"]
      }
    ]
  });
}

function symbolicManipulationFamilyRowId(familyId: string): string {
  return `symbolic-family-${familyId.replace(/^family\./, "").replaceAll(".", "-")}`;
}
