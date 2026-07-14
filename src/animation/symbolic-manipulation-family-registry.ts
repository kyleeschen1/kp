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
    ...symbolicManipulationFamilySeedSpecs
      .filter(
        (spec) =>
          spec.id !== "family.algebra.both-sides" &&
          spec.id !== "family.algebra.cancel-combine"
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
        animationId: "animation.solve-x",
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
        sampleAssetIds: ["animation.solve-x"],
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
        animationId: "animation.solve-x",
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
        sampleAssetIds: ["animation.solve-x"],
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

function symbolicManipulationFamilyRowId(familyId: string): string {
  return `symbolic-family-${familyId.replace(/^family\./, "").replaceAll(".", "-")}`;
}
